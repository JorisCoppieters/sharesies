// ******************************
// Imports:
// ******************************

import {
    addCartItem,
    clearCart,
    getFundInvestmentInfo,
    getFundsCleaned,
    getInfo,
    getMarketPricesAverage,
    getNormalizedValues,
    getStats,
    login,
    sellFund,
    clearCache,
} from './src/sharesies/sharesies';
import { Fund } from './src/sharesies/models/fund';
import { FundInfo } from './src/sharesies/models/fund-info';
import { FundShare } from './src/sharesies/models/fund-share';
import { getCredentials, setCredentials, saveCredentials } from './src/_common/ts/security/credentials';
import { Info } from './src/sharesies/models/info';
import { Order } from './src/sharesies/models/order';
import { readLineSync, readHiddenLineSync } from './src/_common/ts/system/readline';
import { runGenerator } from './src/_common/ts/system/sync';
import { User } from './src/sharesies/models/user';
import * as print from './src/_common/ts/env/server/print';

import Promise from 'bluebird';

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

// ******************************

runGenerator(function* () {
    try {
        _printTitleHeader('SHARESIES');

        cprint.cyan('Loading...');

        if (!getCredentials('username')) {
            setCredentials('username', readLineSync('Please enter your username').trim());
        }
        if (!getCredentials('password')) {
            setCredentials('password', readHiddenLineSync('Please enter your password').trim());
        }

        let loginData = yield login(getCredentials('username'), getCredentials('password'));

        saveCredentials();

        let user = loginData.user;
        let sharesiesInfo = yield getInfo();
        let sharesiesStats = yield getStats(user);

        let funds = yield getFundsCleaned();
        let marketPricesAverage = getMarketPricesAverage(funds);
        let marketPricesNormalized = getNormalizedValues(marketPricesAverage);

        let sortedFunds = funds
            .map((fund: Fund) => {
                return {
                    fund,
                    info: getFundInvestmentInfo(fund, marketPricesNormalized),
                };
            })
            .sort((a: FundInfo, b: FundInfo) => a.info.score - b.info.score);

        let sortedFundsToBuy = sortedFunds.filter((fundInfo: FundInfo) => fundInfo.info.score >= BUY_SCORE_THRESHOLD).reverse();
        let sortedFundsToSell = sortedFunds.filter((fundInfo: FundInfo) => fundInfo.info.score < BUY_SCORE_THRESHOLD).reverse();

        let walletBalance = parseFloat(sharesiesInfo.user['wallet_balance']);
        let portfolioBalance = parseFloat(sharesiesStats.total_portfolio);

        let purchaseSharesValue = sharesiesInfo.orders
            .filter((order: Order) => order.type === 'buy')
            .map((order: Order) => order.requested_nzd_amount)
            .reduce((total: number, amount: number) => total + parseFloat(`${amount}`), 0);

        let investmentBalance = walletBalance + portfolioBalance + purchaseSharesValue;
        let exploratoryInvestmentBalance = investmentBalance * EXPLORATORY_RATIO;
        let exploratoryInvestmentScore = sortedFundsToBuy.length
            ? sortedFundsToBuy
                  .map((fundInfo: FundInfo) => {
                      return Math.pow(fundInfo.info.score * 0.6, DISTRIBUTION_MAGNITUDE);
                  })
                  .reduce((scoreSum: number, score: number) => scoreSum + score, 0) / sortedFundsToBuy.length
            : 0;

        let diversificationInvestmentBalance = investmentBalance - exploratoryInvestmentBalance;
        exploratoryInvestmentBalance = exploratoryInvestmentBalance * Math.min(1, exploratoryInvestmentScore);

        let remainingBalance = investmentBalance - diversificationInvestmentBalance - exploratoryInvestmentBalance;
        if (remainingBalance < 0) {
            throw new Error('Remaining balance cannot be negative');
        }

        if (exploratoryInvestmentBalance > 0) {
            _printActionsHeader('Actions for buying');
        }
        let fundsAllocated = yield autoBuyShares(user, sharesiesInfo, exploratoryInvestmentBalance, walletBalance, sortedFundsToBuy);
        if (fundsAllocated.boughtNew) {
            console.log('CONFIRM CART!');
            // yield confirmCart(user, getCredentials('password')).then((data) => {
            //     print.errors(data);
            //     return Promise.resolve(true);
            // });
        }

        if (sortedFundsToSell.length) {
            yield autoSellShares(user, sharesiesInfo, sortedFunds);
        }
    } catch (e) {
        cprint.red('Ended with errors:');
        console.error(e.stack || e);
        if (!e.stack) {
            console.trace('Trace:');
        }
        return;
    }
});

// ******************************

function autoBuyShares(user: User, sharesiesInfo: Info, exploratoryBuyAllocation: number, walletBalance: number, sortedFunds: FundInfo[]) {
    let availableFundAllocation = walletBalance;

    let totalScore = sortedFunds.reduce((scoreSum, fundInfo) => scoreSum + fundInfo.info.score, 0);
    let adjustedFundsDistribution = sortedFunds
        .filter((_, idx) => idx <= MAX_FUNDS_FOR_BUY)
        .map((fundInfo: FundInfo) => fundInfo.info.score / totalScore)
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

    return clearCart(user)
        .then(() =>
            sortedFunds
                .filter((_, idx) => idx <= MAX_FUNDS_FOR_BUY)
                .reduce((resolve: Promise<boolean>, fundInfo: FundInfo, idx: number) => {
                    return resolve.then(() => {
                        let desiredFundAllocation = fundsDistribution[idx] * exploratoryBuyAllocation;

                        let sharePrice = fundInfo.info.currentPrice;

                        let currentSharesAmount = parseInt(sharesAmountByFundId[fundInfo.fund.id] || 0);
                        let buyingSharesAmount = sharesiesInfo.orders
                            .filter((order: Order) => order.type === 'buy' && order.fund_id === fundInfo.fund.id)
                            .map((order: Order) => parseInt(`${order.requested_nzd_amount / sharePrice}`))
                            .reduce((total: number, amount: number) => total + Math.ceil(amount), 0);

                        currentSharesAmount += buyingSharesAmount;

                        let currentSharesValue = currentSharesAmount * sharePrice;
                        let desiredSharesAmount = desiredFundAllocation / sharePrice;

                        if (desiredSharesAmount <= currentSharesAmount) {
                            fundsAllocated.totalValue += desiredFundAllocation;
                            print.info(
                                `Already have ${_numberRound(desiredSharesAmount)} shares ($${desiredFundAllocation.toFixed(2)}) for ${
                                    fundInfo.fund.code
                                } (${fundInfo.fund.name}), no more desired`
                            );
                            return true;
                        }

                        if (currentSharesAmount) {
                            print.info(
                                `Already have ${_numberRound(currentSharesAmount)} shares ($${currentSharesValue.toFixed(2)}) for ${
                                    fundInfo.fund.code
                                } (${fundInfo.fund.name}) but investing more...`
                            );
                        }

                        fundsAllocated.totalValue += currentSharesValue;

                        if (availableFundAllocation <= 0.01) {
                            print.warning(`Cannot invest into ${fundInfo.fund.code} (${fundInfo.fund.name}) since wallet balance is 0`);
                            return true;
                        }

                        let fundAllocation = Math.min(availableFundAllocation, (desiredSharesAmount - currentSharesAmount) * sharePrice);
                        if (fundAllocation < MIN_FUND_ALLOCATION) {
                            print.warning(
                                `Cannot invest $${fundAllocation.toFixed(2)} into ${fundInfo.fund.code} (${
                                    fundInfo.fund.name
                                }) since it will be below the minimum fund allocation $${MIN_FUND_ALLOCATION}`
                            );
                            return true;
                        }

                        let sharesAmountToBuy = Math.floor(fundAllocation / sharePrice);
                        fundAllocation = Math.round(sharesAmountToBuy * sharePrice * 100) / 100;

                        fundsAllocated.totalValue += fundAllocation;

                        print.action(
                            `=> Auto investing ${_numberRound(sharesAmountToBuy)} shares ($${fundAllocation.toFixed(2)}) into ${
                                fundInfo.fund.code
                            } (${fundInfo.fund.name})`
                        );
                        availableFundAllocation -= fundAllocation;

                        fundsAllocated.boughtNew = true;
                        return addCartItem(user, fundInfo.fund, fundAllocation).then((data) => {
                            print.errors(data);
                            clearCache();
                            return true;
                        });
                    });
                }, Promise.resolve(true))
        )
        .then(() => {
            return fundsAllocated;
        });
}

// ******************************

function autoSellShares(user: User, sharesiesInfo: Info, sortedFunds: FundInfo[]) {
    let portfolioFundIds = sharesiesInfo.funds.map((fund) => fund.fund_id);
    let sharesAmountByFundId = sharesiesInfo.funds.reduce((dict: { [key: string]: any }, fund: FundShare) => {
        dict[fund.fund_id] = fund.shares;
        return dict;
    }, {});
    let returnByFundId = sharesiesInfo.funds.reduce((dict: { [key: string]: any }, fund: FundShare) => {
        dict[fund.fund_id] = fund.return_percent;
        return dict;
    }, {});

    let totalSoldValue = 0;

    let sortedFundsInPortfolio = sortedFunds.filter((fundInfo) => portfolioFundIds.indexOf(fundInfo.fund.id) >= 0);
    return sortedFundsInPortfolio
        .sort((a, b) => a.info.score - b.info.score)
        .reduce((resolve: Promise<boolean>, fundInfo: FundInfo) => {
            return resolve.then(() => {
                let sharesAmount = parseInt(sharesAmountByFundId[fundInfo.fund.id] || 0);
                let sharesReturn = returnByFundId[fundInfo.fund.id];
                let sharePrice = fundInfo.info.currentPrice;
                let sharesValue = sharesAmount * sharePrice;

                if (fundInfo.info.score > SELL_SCORE_THRESHOLD) {
                    return true;
                }

                if (sharesReturn <= 0) {
                    return true;
                }

                sharesAmount = Math.max(1, (sharesValue - 200) / sharePrice);
                sharesValue = sharesAmount * sharePrice;

                print.action(
                    `=> Auto selling ${_numberRound(sharesAmount)} shares ($${sharesValue.toFixed(2)}) for ${fundInfo.fund.code} (${
                        fundInfo.fund.name
                    })`
                );
                totalSoldValue += sharesValue;

                return sellFund(user, fundInfo.fund, _numberRound(sharesAmount)).then((data) => {
                    print.errors(data);
                    clearCache();
                    return true;
                });
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


// ******************************
