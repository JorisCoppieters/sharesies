#!/usr/bin/env node

'use strict'; // JS: ES6

// ******************************
// Requires:
// ******************************

const Promise = require('bluebird');
const cprint = require('color-print');

require('./lib/date');
const config = require('./lib/config');
const print = require('./lib/print');
const readline = require('./lib/readline');
const sharesies = require('./lib/sharesies');
const sync = require('./lib/sync');

// ******************************
// Constants:
// ******************************

const DRY_RUN = false;
const INVESTMENT_AMOUNT = 1000;
const BUY_SCORE_THRESHOLD = 0.6;
const AUTO_SELL_SCORE_THRESHOLD = 0.55;
const AUTO_BUY_SCORE_THRESHOLD = 0.65;
const MIN_FUND_ALOCATION = 5;
const DISTRIBUTION_MAGNITUDE = 3;
const EXPLORATORY_RATIO = 0.5;

// ******************************

sync.runGenerator(function*() {
    print.heading('sharesies');
    cprint.cyan('Loading...');

    if (!config.get('username')) {
        config.set('username', readline.sync('Please enter your username: '));
    }
    if (!config.get('password')) {
        config.set('password', readline.sync('Please enter your password: '));
    }

    let loginData = yield sharesies.login(
        config.get('username'),
        config.get('password')
    );

    let user = loginData.user;

    let funds = yield sharesies.getFundsCleaned();

    let marketPricesAverage = sharesies.getMarketPricesAverage(funds);
    let marketPricesNormalized = sharesies.getNormalizedValues(marketPricesAverage);

    let sortedFunds = funds
        .map(fund => {
            return {
                fund,
                info: sharesies.getFundInvestmentInfo(fund, marketPricesNormalized)
            };
        })
        .sort((a, b) => a.info.score - b.info.score);

    let sortedFundsByBuy = sortedFunds
        .filter(fundInfo => fundInfo.info.score >= BUY_SCORE_THRESHOLD)
        .reverse();

    let sortedFundsBySell = sortedFunds
        .filter(fundInfo => fundInfo.info.score < BUY_SCORE_THRESHOLD);

    print.line();
    print.heading('sell scores');

    sortedFundsBySell
        .forEach(fundInfo => sharesies.printFundInvestmentInfo(fundInfo.fund, marketPricesNormalized, INVESTMENT_AMOUNT));

    print.line();
    print.heading('buy scores');

    sortedFundsByBuy
        .forEach(fundInfo => sharesies.printFundInvestmentInfo(fundInfo.fund, marketPricesNormalized, INVESTMENT_AMOUNT));

    let sharesiesInfo = yield sharesies.getInfo();
    let sharesiesStats = yield sharesies.getStats(user);
    let sharesiesTransactions = yield sharesies.getTransactions(user);

    let walletBalance = parseFloat(sharesiesInfo.user['wallet_balance']);
    let portfolioBalance = parseFloat(sharesiesStats.total_portfolio);

    let sellingSharesValue = priceRound(sharesiesInfo.orders
        .filter(order => order.type === 'sell')
        .map(order => {
            let fund = funds
                .find(fund => fund.id === order['fund_id']);

            return order['shares'] * fund.market_price;
        })
        .reduce((total, amount) => total + parseFloat(amount), 0));

    let purchaseSharesValue = priceRound(sharesiesInfo.orders
        .filter(order => order.type === 'buy')
        .map(order => order['requested_nzd_amount'])
        .reduce((total, amount) => total + parseFloat(amount), 0));

    let investmentBalance = walletBalance + portfolioBalance + purchaseSharesValue;
    let exploratoryInvestmentBalance = priceRound(investmentBalance * EXPLORATORY_RATIO);
    let diversificationInvestmentBalance = priceRound(investmentBalance - exploratoryInvestmentBalance);

    print.line();
    print.heading('Investment Split');
    print.info(`Using $${exploratoryInvestmentBalance} for exploratory investment`);
    print.info(`Keeping $${diversificationInvestmentBalance} for diversification investment`);

    print.line();
    print.heading('actions for buying');

    let fundsAllocated = yield buyShares(user, sharesiesInfo, exploratoryInvestmentBalance, walletBalance, sortedFundsByBuy);
    if (fundsAllocated.boughtNew) {
        yield sharesies.confirmCart(user, config.get('password')).then(data => {
            print.errors(data);
            return Promise.resolve(true);
        });
    }

    print.line();
    print.heading('actions for selling');

    let fundsSaleAllocation = Math.max(0, priceRound(exploratoryInvestmentBalance - fundsAllocated.totalValue));

    if (fundsSaleAllocation > 0) {
        print.info(`Found only $${fundsAllocated.totalValue} for exploratory investment, so need to sell $${fundsSaleAllocation} for further exploratory investment`);
        yield sellShares(user, sharesiesInfo, sortedFundsBySell, Math.max(0, exploratoryInvestmentBalance - fundsAllocated.totalValue));
        sharesiesInfo = yield sharesies.getInfo();
    } else {
        print.info(`Found all $${fundsAllocated.totalValue} for exploratory investment, no need to sell`);
    }

    let daysAgo = 14;

    let maxInvestmentStrategy = getMaxInvestmentStrategy(sharesiesTransactions, sortedFunds, daysAgo);
    let maxInvestmentReturn = maxInvestmentStrategy.totalReturn;
    let maxInvestmentFundCodes = maxInvestmentStrategy.funds
        .filter(fund => fund.code !== 'NONE')
        .filter((_, idx) => idx < 3)
        .map(fund => fund.code + 'x' + fund.count).join(', ');

    let investmentStrategy = getInvestmentStrategy(sharesiesTransactions, sortedFunds, daysAgo);
    let investmentReturn = investmentStrategy.totalReturn;
    let investmentFundCodes = investmentStrategy.funds
        .filter(fund => fund.code !== 'NONE')
        .filter((_, idx) => idx < 3)
        .map(fund => fund.code + 'x' + fund.count).join(', ');

    let totalReturnsPerDay = parseFloat(investmentReturn) / daysAgo;

    let isWin = process.platform === 'win32';
    let lightGreenFn = cprint.toLightGreen;
    if (!isWin) {
        lightGreenFn = cprint.toGreen;
    }

    let lightBlueFn = cprint.toLightBlue;
    if (!isWin) {
        lightBlueFn = cprint.toGreen;
    }

    let totalReturn = parseFloat(sharesiesStats.total_portfolio) + parseFloat(sharesiesStats.total_withdrawals) - parseFloat(sharesiesStats.total_deposits);

    print.line();
    print.heading('summary');
    print.info(`Wallet Balance: ${cprint.toGreen('$' + walletBalance.toFixed(2))}`);
    print.info(`Buying Shares: ${cprint.toGreen('$' + purchaseSharesValue.toFixed(2))}`);
    print.info(`Selling Shares: ${cprint.toRed('$' + sellingSharesValue.toFixed(2))}`);
    print.line();
    print.info(`Total Deposits: ${cprint.toGreen('$' + parseFloat(sharesiesStats.total_deposits).toFixed(2))}`);
    print.info(`Total Withdrawals: ${cprint.toRed('$' + parseFloat(sharesiesStats.total_withdrawals).toFixed(2))}`);
    print.info(`Total Value: ${cprint.toCyan('$' + parseFloat(sharesiesStats.total_portfolio).toFixed(2))}`);
    print.info(`Total Return: ${lightGreenFn('$' + parseFloat(totalReturn).toFixed(2))}`);
    print.line();
    print.heading('investment strategy (last 2 weeks)');
    print.info(`Max Return: ${lightGreenFn('$' + maxInvestmentReturn.toFixed(2))} ${lightBlueFn('=> ' + maxInvestmentFundCodes)}`);
    print.info(`Return: ${lightGreenFn('$' + investmentReturn.toFixed(2))} ${lightBlueFn('=> ' + investmentFundCodes)}`);
    print.info(`Return per Day: ${lightGreenFn('$' + parseFloat(totalReturnsPerDay).toFixed(2))}`);
});

// ******************************

function buyShares(user, sharesiesInfo, exploratoryBuyAllocation, walletBalance, sortedFundsByBuy) {
    let availableFundAllocation = walletBalance;

    let totalScore = sortedFundsByBuy.reduce((scoreSum, fundInfo) => scoreSum + fundInfo.info.score, 0);
    let adjustedFundsDistribution = sortedFundsByBuy
        .map(fundInfo => fundInfo.info.score / totalScore)
        .map(score => Math.pow(score, DISTRIBUTION_MAGNITUDE));

    let adjustedFundsDistributionSum = adjustedFundsDistribution.reduce((total, score) => total + score, 0);
    let fundsDistribution = adjustedFundsDistribution
        .map(score => score / adjustedFundsDistributionSum);

    let sharesAmountByFundId = sharesiesInfo.funds.reduce((dict, fund) => {
        dict[fund.fund_id] = fund.shares;
        return dict;
    }, {});

    let fundsAllocated = {
        totalValue: 0,
        boughtNew: false
    };

    return sharesies.clearCart(user)
        .then(sortedFundsByBuy
            .sort((a, b) => b.info.score - a.info.score)
            .forEachThen((fundInfo, idx) => {
                if (fundInfo.info.score >= AUTO_BUY_SCORE_THRESHOLD) {
                    let desiredFundAllocation = priceRound(fundsDistribution[idx] * exploratoryBuyAllocation);

                    let sharePrice = fundInfo.info.currentPrice;

                    let currentSharesAmount = parseFloat(sharesAmountByFundId[fundInfo.fund.id] || 0);
                    let buyingSharesAmount = sharesiesInfo.orders
                        .filter(order => order.type === 'buy' && order.fund_id === fundInfo.fund.id)
                        .map(order => parseInt(order['requested_nzd_amount'] / sharePrice))
                        .reduce((total, amount) => total + parseFloat(amount), 0);

                    currentSharesAmount += buyingSharesAmount;

                    let currentSharesValue = priceRound(currentSharesAmount * sharePrice);

                    let desiredSharesAmount = numberRound(desiredFundAllocation / sharePrice);

                    if (desiredSharesAmount <= currentSharesAmount) {
                        fundsAllocated.totalValue += currentSharesValue;
                        print.info(`Already have ${desiredSharesAmount} shares ($${desiredFundAllocation}) for ${fundInfo.fund.code}, no more desired`);
                        return;
                    }

                    let currentSharesValueInvested = priceRound(currentSharesAmount * sharePrice);
                    if (currentSharesAmount) {
                        print.info(`Already have ${currentSharesAmount} shares ($${currentSharesValueInvested}) for ${fundInfo.fund.code} but investing more...`);
                    }

                    fundsAllocated.totalValue += currentSharesValueInvested;

                    if (availableFundAllocation <= 0.01) {
                        return;
                    }

                    if (availableFundAllocation < MIN_FUND_ALOCATION) {
                        print.warning(`Cannot invest $${availableFundAllocation} into ${fundInfo.fund.code} since it will be below the minimum fund allocation $${MIN_FUND_ALOCATION}`);
                        return;
                    }

                    let fundAllocation = priceRound(Math.min(availableFundAllocation, (desiredSharesAmount - currentSharesAmount) * sharePrice));
                    let sharesAmountToBuy = numberRound(fundAllocation / sharePrice);

                    fundsAllocated.totalValue += fundAllocation;

                    print.action(`=> Auto investing ${sharesAmountToBuy} shares ($${fundAllocation}) into ${fundInfo.fund.code}`);
                    availableFundAllocation -= fundAllocation;
                    fundsAllocated.boughtNew = true;

                    if (DRY_RUN) {
                        return Promise.resolve();
                    } else {
                        return sharesies.addCartItem(user, fundInfo.fund, fundAllocation).then(data => {
                            print.errors(data);
                            return Promise.resolve(true);
                        });
                    }

                } else {
                    print.warning(`You might want to buy shares for ${fundInfo.fund.code}`);
                    return Promise.resolve();
                }
            })
        )
        .then(() => {
            fundsAllocated.totalValue = priceRound(fundsAllocated.totalValue);
            return fundsAllocated;
        });
}

// ******************************

function sellShares(user, sharesiesInfo, sortedFundsBySell, exploratorySellAllocation) {
    let portfolioFundIds = sharesiesInfo.funds.map(fund => fund.fund_id);
    let sharesAmountByFundId = sharesiesInfo.funds.reduce((dict, fund) => {
        dict[fund.fund_id] = fund.shares;
        return dict;
    }, {});

    let totalSoldValue = 0;

    let sortedFundsBySellInPortfolio = sortedFundsBySell.filter(fundInfo => portfolioFundIds.indexOf(fundInfo.fund.id) >= 0);
    return sortedFundsBySellInPortfolio
        .sort((a, b) => a.info.score - b.info.score)
        .forEachThen(fundInfo => {
            if (totalSoldValue >= exploratorySellAllocation) {
                return;
            }
            if (fundInfo.info.score <= AUTO_SELL_SCORE_THRESHOLD) {
                let sharesAmount = parseFloat(sharesAmountByFundId[fundInfo.fund.id] || 0);
                let sharePrice = fundInfo.info.currentPrice;

                let sellingSharesAmount = sharesiesInfo.orders
                    .filter(order => order.type === 'sell' && order.fund_id === fundInfo.fund.id)
                    .map(order => order['shares'] * sharePrice)
                    .reduce((_, amount) => parseFloat(amount), 0);

                sharesAmount -= sellingSharesAmount;

                let sharesValue = priceRound(sharesAmount * sharePrice);

                let maxSaleValue = Math.min(exploratorySellAllocation - totalSoldValue, sharesValue - 200);
                if (maxSaleValue <= 0) {
                    return;
                }

                if (sharesValue > maxSaleValue) {
                    sharesAmount = Math.max(1, numberRound(maxSaleValue / sharePrice));
                    sharesValue = priceRound(sharesAmount * sharePrice);
                }

                print.action(`=> Auto selling ${sharesAmount} shares ($${sharesValue}) for ${fundInfo.fund.code}`);
                totalSoldValue += sharesValue;

                if (DRY_RUN) {
                    return Promise.resolve();
                } else {
                    return sharesies.sellFund(user, fundInfo.fund, sharesAmount).then(data => {
                        print.errors(data);
                        return Promise.resolve(true);
                    });
                }

            } else {
                print.warning(`You might want to sell shares for ${fundInfo.fund.code}`);
                return Promise.resolve();
            }
        })
        .then(() => totalSoldValue);
}

// ******************************

function getInvestmentStrategy(sharesiesTransactions, sortedFunds, daysAgo) {
    let startDate = new Date('2018-01-01');
    let now = new Date();
    let daysSinceBeginning = parseInt((now - startDate) / (24 * 3600 * 1000));

    let fundHistoryDays = sortedFunds[0].info.fundPrices.length;

    let fundAmount = {};
    let fundsUsed = {};
    let totalReturn = 0;

    for (let dayIdx = 0; dayIdx <= daysSinceBeginning; dayIdx++) {
        let dateAtIdx = new Date(startDate.getTime() + (dayIdx * 24 * 3600 * 1000));
        let dateStampAtIdx = dateAtIdx.toDateStamp();

        sharesiesTransactions
            .filter(transaction => transaction.buy_order)
            .map(transaction => {
                return {
                    'amount': parseFloat(transaction.amount),
                    'fundCode': sortedFunds
                        .filter(sortedFund => sortedFund.fund.id === transaction.buy_order.fund_id)
                        .map(sortedFund => sortedFund.fund.code)[0] || transaction.buy_order.fund_id,
                    'dateStamp': new Date(transaction.timestamp.$quantum).toDateStamp()
                };
            })
            .filter(transaction => transaction.dateStamp === dateStampAtIdx)
            .forEach(transaction => {
                fundAmount[transaction.fundCode] = fundAmount[transaction.fundCode] || 0;
                fundAmount[transaction.fundCode] += -transaction.amount;
            });

        sharesiesTransactions
            .filter(transaction => transaction.sell_order)
            .map(transaction => {
                return {
                    'amount': parseFloat(transaction.amount),
                    'fundCode': sortedFunds
                        .filter(sortedFund => sortedFund.fund.id === transaction.sell_order.fund_id)
                        .map(sortedFund => sortedFund.fund.code)[0] || transaction.sell_order.fund_id,
                    'dateStamp': new Date(transaction.timestamp.$quantum).toDateStamp()
                };
            })
            .filter(transaction => transaction.dateStamp === dateStampAtIdx)
            .forEach(transaction => {
                fundAmount[transaction.fundCode] = fundAmount[transaction.fundCode] || 0;
                fundAmount[transaction.fundCode] += -transaction.amount;
            });

        let fundDayIdx = dayIdx + (fundHistoryDays - daysSinceBeginning - 1);

        let maxReturn = 0;
        let maxFundCode = 'NONE';

        sortedFunds
            .forEach(sortedFund => {
                fundAmount[sortedFund.fund.code] = fundAmount[sortedFund.fund.code] || 0;
                let fundMultiplierAtIdx = (sortedFund.info.fundPrices[fundDayIdx + 1] / sortedFund.info.fundPrices[fundDayIdx]) || 1;
                let before = fundAmount[sortedFund.fund.code];
                let after = before * fundMultiplierAtIdx;
                let fundReturn = (after - before);

                fundAmount[sortedFund.fund.code] = after;

                if (dayIdx >= daysSinceBeginning - daysAgo) {
                    totalReturn += fundReturn;
                    if (fundReturn > maxReturn) {
                        maxReturn = fundMultiplierAtIdx;
                        maxFundCode = sortedFund.fund.code;
                    }
                }
            });

        if (dayIdx >= daysSinceBeginning - daysAgo) {
            fundsUsed[maxFundCode] = (fundsUsed[maxFundCode] || 0) + 1;
        }
    }

    return {
        funds: Object.keys(fundsUsed)
            .map(bestFundCode => {
                return {
                    code: bestFundCode,
                    count: fundsUsed[bestFundCode]
                };
            })
            .sort((a,b) => b.count - a.count),
        totalValue: 0,
        totalReturn: totalReturn
    };
}

// ******************************

function getMaxInvestmentStrategy(sharesiesTransactions, sortedFunds, daysAgo) {
    let startDate = new Date('2018-01-01');
    let now = new Date();
    let daysSinceBeginning = parseInt((now - startDate) / (24 * 3600 * 1000));

    let fundHistoryDays = sortedFunds[0].info.fundPrices.length;
    let investmentPeriod = 2;

    let totalReturn = 0;
    let totalValue = 0;

    let fundsUsed = [];

    let deposits = sharesiesTransactions
        .filter(transaction => transaction.description === 'Deposit' || transaction.description === 'Welcome gift')
        .map(transaction => {
            return {
                'amount': parseFloat(transaction.amount),
                'dateStamp': new Date(transaction.timestamp.$quantum).toDateStamp()
            };
        });

    let withdrawals = sharesiesTransactions
        .filter(transaction => transaction.description === 'Withdrawal')
        .map(transaction => {
            return {
                'amount': parseFloat(transaction.amount),
                'dateStamp': new Date(transaction.timestamp.$quantum).toDateStamp()
            };
        });

    for (let dayIdx = 0; dayIdx <= daysSinceBeginning; dayIdx++) {

        let dateAtIdx = new Date(startDate.getTime() + (dayIdx * 24 * 3600 * 1000));
        let dateStampAtIdx = dateAtIdx.toDateStamp();

        let deposit = deposits
            .filter(deposit => deposit.dateStamp == dateStampAtIdx)
            .reduce((total, transaction) => total + transaction.amount, 0);

        let withdrawal = withdrawals
            .filter(withdrawal => withdrawal.dateStamp == dateStampAtIdx)
            .reduce((total, transaction) => total + transaction.amount, 0);

        totalValue += (deposit - withdrawal);

        if (dayIdx % investmentPeriod !== 0) {
            continue;
        }

        let fundDayIdx = dayIdx + (fundHistoryDays - daysSinceBeginning);

        let maxFund = sortedFunds
            .map(sortedFund => {
                return {
                    date: dateStampAtIdx,
                    fundCode: sortedFund.fund.code,
                    fundMultiplierAtIdx: sortedFund.info.fundPrices[fundDayIdx + investmentPeriod] / sortedFund.info.fundPrices[fundDayIdx]
                };
            })
            .concat([{
                date: dateStampAtIdx,
                fundCode: 'NONE',
                fundMultiplierAtIdx: 1
            }])
            .reverse()
            .sort((a, b) => b.fundMultiplierAtIdx - a.fundMultiplierAtIdx)[0];

        let before = totalValue;
        let after = before * maxFund.fundMultiplierAtIdx;
        let maxFundReturn = after - before;

        if (dayIdx >= daysSinceBeginning - daysAgo) {
            totalReturn += maxFundReturn;
            fundsUsed[maxFund.fundCode] = (fundsUsed[maxFund.fundCode] || 0) + 1;
        }
        totalValue = after;
    }

    return {
        funds: Object.keys(fundsUsed)
            .map(bestFundCode => {
                return {
                    code: bestFundCode,
                    count: fundsUsed[bestFundCode]
                };
            })
            .sort((a,b) => b.count - a.count),
        totalReturn: totalReturn
    };
}

// ******************************

function numberRound(in_number) {
    return Math.round(in_number);
}

// ******************************

function priceRound(in_price) {
    return parseInt(in_price * 100) / 100;
}

// ******************************
