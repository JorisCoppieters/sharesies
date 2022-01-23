#!/usr/bin/env node

import { Fund } from './src/sharesies/models/fund';
import { FundExtended } from './src/sharesies/models/fund-extended';
import { FundShare } from './src/sharesies/models/fund-share';
import { Info } from './src/sharesies/models/info';
import { Order } from './src/sharesies/models/order';
import { User } from './src/sharesies/models/user';
import { getFundInvestmentInfo, getFundsCleaned, getInfo, getMarketPricesAverage, getNormalizedValues, getStats, login, printFundInvestmentInfo } from './src/sharesies/sharesies';
import * as print from './src/_common/ts/env/server/print';
import { getCredentials, saveCredentials, setCredentials } from './src/_common/ts/security/credentials';
import { readHiddenLineSync, readLineSync } from './src/_common/ts/system/readline';

const cprint = require('color-print');

// ******************************
// Constants:
// ******************************

const BUY_SCORE_THRESHOLD = 3.0;
const SELL_SCORE_THRESHOLD = 2.5;
const MIN_FUND_ALLOCATION = 5;
const DISTRIBUTION_MAGNITUDE = 2;
const EXPLORATORY_RATIO = 0.5;
const MAX_FUNDS_FOR_BUY = 20;
const MAX_FUNDS_FOR_SCORES = 20;

// ******************************

async function main() {
    _printTitleHeader('SHARESIES');

    cprint.cyan('Loading...');

    if (!getCredentials('username')) {
        setCredentials('username', readLineSync('Please enter your username').trim());
    }
    if (!getCredentials('password')) {
        setCredentials('password', readHiddenLineSync('Please enter your password').trim());
    }

    let loginData = (await login(getCredentials('username'), getCredentials('password'))) as any;

    saveCredentials();

    let user = loginData.user;
    let sharesiesInfo = await getInfo();
    let sharesiesStats = await getStats(user);

    let funds = (await getFundsCleaned()) as Fund[];
    let marketPricesAverage = getMarketPricesAverage(funds);
    let marketPricesNormalized = getNormalizedValues(marketPricesAverage);

    let sortedFunds = funds
        .map((fund: Fund) => {
            return {
                id: fund.id,
                code: fund.code,
                fund,
                info: getFundInvestmentInfo(fund, marketPricesNormalized),
            } as FundExtended;
        })
        .sort((a: FundExtended, b: FundExtended) => a.info.score - b.info.score);

    let sortedFundsToBuy = sortedFunds.filter((fundExtended: FundExtended) => fundExtended.info.score >= BUY_SCORE_THRESHOLD).reverse();
    if (sortedFundsToBuy.length) {
        _printSectionHeader('Buy Scores');
        sortedFundsToBuy.filter((_, idx) => idx < MAX_FUNDS_FOR_SCORES).forEach((fundInfo) => printFundInvestmentInfo(fundInfo.fund, marketPricesNormalized));
    }

    let sortedFundsToSell = sortedFunds.filter((fundExtended: FundExtended) => fundExtended.info.score < BUY_SCORE_THRESHOLD).reverse();
    if (sortedFundsToSell.length) {
        _printSectionHeader('Sell Scores');
        sortedFundsToSell.filter((_, idx) => idx < MAX_FUNDS_FOR_SCORES).forEach((fundInfo) => printFundInvestmentInfo(fundInfo.fund, marketPricesNormalized));
    }

    let walletBalance = 0;

    if (sharesiesInfo.user['wallet_balances']) {
        walletBalance = parseFloat(sharesiesInfo.user['wallet_balances'].nzd);
    } else if (sharesiesInfo.user['wallet_balance']) {
        walletBalance = parseFloat(sharesiesInfo.user['wallet_balance']);
    }

    let portfolioBalance = parseFloat(sharesiesStats.total_portfolio);

    let purchaseSharesValue = sharesiesInfo.orders
        .filter((order: Order) => order.type === 'buy')
        .map((order: Order) => order.requested_nzd_amount)
        .reduce((total: number, amount: number) => total + parseFloat(`${amount}`), 0);

    let investmentBalance = walletBalance + portfolioBalance + purchaseSharesValue;
    let exploratoryInvestmentBalance = investmentBalance * EXPLORATORY_RATIO;

    let exploratoryInvestmentScore = sortedFundsToBuy.length
        ? sortedFundsToBuy
              .map((fundExtended: FundExtended) => {
                  return Math.pow(fundExtended.info.score * 0.6, DISTRIBUTION_MAGNITUDE);
              })
              .reduce((scoreSum: number, score: number) => scoreSum + score, 0) / sortedFundsToBuy.length
        : 0;

    let diversificationInvestmentBalance = investmentBalance - exploratoryInvestmentBalance;
    exploratoryInvestmentBalance = exploratoryInvestmentBalance * Math.min(1, exploratoryInvestmentScore);

    let remainingBalance = investmentBalance - diversificationInvestmentBalance - exploratoryInvestmentBalance;
    if (remainingBalance < 0) {
        console.error('Remaining balance cannot be negative');
        return;
    }

    if (exploratoryInvestmentBalance > 0) {
        _printActionsHeader('Actions for buying');
    }

    let fundsAllocated = await autoBuyShares(sharesiesInfo, exploratoryInvestmentBalance, walletBalance, sortedFundsToBuy);
    if (fundsAllocated.boughtNew) {
        console.log('CONFIRM CART!');
        // await confirmCart(user, getCredentials('password')).then((data) => {
        //     print.errors(data);
        //     return Promise.resolve(true);
        // });
    }

    await autoSellShares(user, sharesiesInfo, sortedFundsToSell).catch((e) => {
        console.error(e);
        return;
    });
}
main();

// ******************************

function autoBuyShares(sharesiesInfo: Info, exploratoryBuyAllocation: number, walletBalance: number, sortedFunds: FundExtended[]) {
    let availableFundAllocation = walletBalance;

    let totalScore = sortedFunds.reduce((scoreSum, fundExtended) => scoreSum + fundExtended.info.score, 0);
    let adjustedFundsDistribution = sortedFunds
        .filter((_, idx) => idx <= MAX_FUNDS_FOR_BUY)
        .map((fundExtended: FundExtended) => fundExtended.info.score / totalScore)
        .map((score) => Math.pow(score, DISTRIBUTION_MAGNITUDE));

    let adjustedFundsDistributionSum = adjustedFundsDistribution.reduce((total, score) => total + score, 0);
    let fundsDistribution = adjustedFundsDistribution.map((score) => score / adjustedFundsDistributionSum);

    let sharesAmountByFundId = sharesiesInfo.funds.reduce((dict: { [key: string]: any }, fund: FundShare) => {
        dict[fund.fund_id] = fund.shares;
        return dict;
    }, {});

    let fundsAllocated = {
        totalValue: 0,
        boughtNew: false,
    };

    return Promise.resolve() //clearCart(user)
        .then(() => {
            if (!sortedFunds.length) {
                return Promise.resolve(true);
            }
            return sortedFunds
                .filter((_, idx) => idx <= MAX_FUNDS_FOR_BUY)
                .reduce((resolve: Promise<boolean>, fundExtended: FundExtended, idx: number) => {
                    return resolve.then(() => {
                        let desiredFundAllocation = fundsDistribution[idx] * exploratoryBuyAllocation;

                        let sharePrice = fundExtended.info.currentPrice;

                        let currentSharesAmount = parseInt(sharesAmountByFundId[fundExtended.fund.id] || 0);
                        let buyingSharesAmount = sharesiesInfo.orders
                            .filter((order: Order) => order.type === 'buy' && order.fund_id === fundExtended.fund.id)
                            .map((order: Order) => parseInt(`${order.requested_nzd_amount / sharePrice}`))
                            .reduce((total: number, amount: number) => total + Math.ceil(amount), 0);

                        currentSharesAmount += buyingSharesAmount;

                        let currentSharesValue = currentSharesAmount * sharePrice;
                        let desiredSharesAmount = desiredFundAllocation / sharePrice;

                        if (desiredSharesAmount <= currentSharesAmount) {
                            fundsAllocated.totalValue += desiredFundAllocation;
                            print.info(
                                `Already have ${_numberRound(desiredSharesAmount)} shares ($${desiredFundAllocation.toFixed(2)}) for ${fundExtended.fund.code} (${
                                    fundExtended.fund.name
                                }), no more desired`
                            );
                            return true;
                        }

                        if (currentSharesAmount) {
                            print.info(
                                `Already have ${_numberRound(currentSharesAmount)} shares ($${currentSharesValue.toFixed(2)}) for ${fundExtended.fund.code} (${
                                    fundExtended.fund.name
                                }) but investing more...`
                            );
                        }

                        fundsAllocated.totalValue += currentSharesValue;

                        if (isNaN(availableFundAllocation) || availableFundAllocation <= 0.01) {
                            print.warning(`Cannot invest into ${fundExtended.fund.code} (${fundExtended.fund.name}) since wallet balance is 0`);
                            return true;
                        }

                        let fundAllocation = Math.min(availableFundAllocation, (desiredSharesAmount - currentSharesAmount) * sharePrice);
                        if (isNaN(fundAllocation) || fundAllocation < MIN_FUND_ALLOCATION) {
                            print.warning(
                                `Cannot invest $${fundAllocation.toFixed(2)} into ${fundExtended.fund.code} (${
                                    fundExtended.fund.name
                                }) since it will be below the minimum fund allocation $${MIN_FUND_ALLOCATION}`
                            );
                            return true;
                        }

                        let sharesAmountToBuy = Math.floor(fundAllocation / sharePrice);
                        fundAllocation = Math.round(sharesAmountToBuy * sharePrice * 100) / 100;

                        fundsAllocated.totalValue += fundAllocation;

                        print.action(`=> Auto investing ${_numberRound(sharesAmountToBuy)} shares ($${fundAllocation.toFixed(2)}) into ${fundExtended.fund.code} (${fundExtended.fund.name})`);
                        availableFundAllocation -= fundAllocation;

                        fundsAllocated.boughtNew = true;

                        return true;
                        // return addCartItem(user, fundExtended.fund, fundAllocation).then((data) => {
                        //     print.errors(data);
                        //     return true;
                        // });
                    });
                }, Promise.resolve(true));
        })
        .then(() => {
            return fundsAllocated;
        });
}

// ******************************

function autoSellShares(_user: User, sharesiesInfo: Info, sortedFunds: FundExtended[]) {
    let portfolioFundIds = sharesiesInfo.funds.map((fund) => fund.fund_id);
    let sortedFundsInPortfolio = sortedFunds.filter((fundInfo) => portfolioFundIds.indexOf(fundInfo.fund.id) >= 0);

    let sharesAmountByFundId: { [key: string]: any } = {};
    // let returnByFundId: { [key: string]: any } = {};

    try {
        sharesAmountByFundId = sharesiesInfo.funds.reduce((dict: { [key: string]: any }, fundShare: FundShare) => {
            const fund = sortedFundsInPortfolio.find((fund) => fund.id === fundShare.fund_id);
            if (!fund) {
                return dict;
            }

            if (!fundShare.shares) {
                throw new Error(`Shares not set on fund: ${fund.code}`);
            }
            dict[fund.id] = fundShare.shares;
            return dict;
        }, {});

        // returnByFundId = sharesiesInfo.funds.reduce((dict: { [key: string]: any }, fundShare: FundShare) => {
        //     const fund = sortedFundsInPortfolio.find((fund) => fund.id === fundShare.fund_id);
        //     if (!fund) {
        //         return dict;
        //     }

        //     if (!fundShare.return_percent) {
        //         throw new Error(`Return percent not set on fund: ${fund.code}`);
        //     }
        //     dict[fund.id] = fundShare.return_percent;
        //     return dict;
        // }, {});
    } catch (e) {
        return Promise.reject(e);
    }

    let totalSoldValue = 0;

    return sortedFundsInPortfolio
        .sort((a, b) => a.info.score - b.info.score)
        .filter(
            (fundExtended: FundExtended) =>
                [
                    // Index Funds
                    'EUF',
                    'NPF',
                    'OZY',
                    'EMF',
                    'MDZ',
                    'USF',
                    'FNZ',
                    '450005',
                    // High Dividend Funds
                    'JLG',
                    'HGH',
                ].indexOf(fundExtended.code) < 0
        )
        .reduce((resolve: Promise<boolean>, fundExtended: FundExtended) => {
            return resolve.then(() => {
                if (fundExtended.info.score > SELL_SCORE_THRESHOLD) {
                    return true;
                }

                let sellingShares = sharesiesInfo.orders.filter((order: Order) => order.fund_id === fundExtended.id).reduce((sum, order) => sum + order.shares, 0);
                if (sellingShares > 0) {
                    return true;
                }

                // let sharesReturn = returnByFundId[fundExtended.fund.id];
                // if (sharesReturn <= 0) {
                //     return true;
                // }

                let sharesAmount = parseInt(sharesAmountByFundId[fundExtended.fund.id] || 0);
                let sharePrice = fundExtended.info.currentPrice;
                let sharesValue = sharesAmount * sharePrice;

                sharesAmount = Math.max(1, sharesValue / sharePrice);
                sharesValue = sharesAmount * sharePrice;

                print.action(`=> Consider selling ${_numberRound(sharesAmount)} shares ($${sharesValue.toFixed(2)}) for ${fundExtended.fund.code} (${fundExtended.fund.name})`);
                totalSoldValue += sharesValue;
                return true;

                // return sellFund(user, fundExtended.fund, _numberRound(sharesAmount)).then((data) => {
                //     print.errors(data);
                //     return true;
                // });
            });
        }, Promise.resolve(true))
        .then(() => totalSoldValue);
}

// ******************************
// Helper Functions:
// ******************************

function _numberRound(in_number: number) {
    return Math.round(in_number);
}

// ******************************

function _printHeader(in_title: string, in_indent: string, in_backgroundFn: Function, in_foregroundFn: Function) {
    in_indent = in_indent || '';
    print.out('\n');
    print.out(in_indent);
    in_backgroundFn(in_foregroundFn(' '.repeat(in_title.length + 4), true));
    print.out(in_indent);
    in_backgroundFn(in_foregroundFn('  ' + in_title + '  ', true));
    print.out(in_indent);
    in_backgroundFn(in_foregroundFn(' '.repeat(in_title.length + 4), true));
    print.out('\n');
}

// ******************************

function _printTitleHeader(in_title: string, in_indent: string = '') {
    _printHeader(in_title, in_indent, cprint.backgroundMagenta, cprint.toWhite);
}

// ******************************

function _printSectionHeader(in_title: string, in_indent: string = '') {
    _printHeader(in_title, in_indent, cprint.backgroundCyan, cprint.toWhite);
}

// ******************************

function _printActionsHeader(in_title: string, in_indent: string = '') {
    let lightGreenBackgroundFn = cprint.backgroundLightGreen;
    let isWin = process.platform === 'win32';
    if (!isWin) {
        lightGreenBackgroundFn = cprint.backgroundGreen;
    }
    _printHeader(in_title, in_indent, lightGreenBackgroundFn, cprint.toBlack);
}

// ******************************
