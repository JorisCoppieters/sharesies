#!/usr/bin/env node

'use strict'; // JS: ES6

// ******************************
//
// SHARESIES v1.2.1
//
// ******************************

// ******************************
// Requires:
// ******************************

const Promise = require('bluebird');
const cprint = require('color-print');
const minimist = require('minimist');

require('./lib/date');
const config = require('./lib/config');
const credentials = require('./lib/credentials');
const help = require('./lib/help');
const print = require('./lib/print');
const readline = require('./lib/readline');
const sharesies = require('./lib/sharesies');
const sync = require('./lib/sync');

// ******************************
// Constants:
// ******************************

const g_ARGV = minimist(process.argv.slice(2));

const DEBUG = g_ARGV['d'];
const EXECUTE = g_ARGV['e'];
const CLEAR_CACHE = g_ARGV['c'];
const HELP = g_ARGV['h'];
const VERSION = g_ARGV['v'];
const INVESTMENT_AMOUNT = 1000;
const BUY_SCORE_THRESHOLD = 0.6;
const MIN_FUND_ALOCATION = 5;
const DISTRIBUTION_MAGNITUDE = 2;
const EXPLORATORY_RATIO = 0.5;

// ******************************

sync.runGenerator(function*() {
    _printTitleHeader('SHARESIES');

    if (HELP) {
        help.printHelp();
        return;
    }

    if (VERSION) {
        help.printVersion();
        return;
    }

    if (!EXECUTE) {
        cprint.white('Dry Run! (Use the -e option to execute the buying and selling suggestions)');
    }

    if (DEBUG) {
        config.api.debugRequestUrl = true;
        config.api.debugRequestData = true;
        config.api.debugResponseData = true;
        config.api.debugResult = true;
    }

    cprint.cyan('Loading...');

    if (!credentials.get('username')) {
        credentials.set('username', readline.sync('Please enter your username: '));
    }
    if (!credentials.get('password')) {
        credentials.set('password', readline.sync('Please enter your password: '));
    }

    let loginData = yield sharesies.login(
        credentials.get('username'),
        credentials.get('password')
    );

    credentials.save();

    let user = loginData.user;

    if (CLEAR_CACHE) {
        sharesies.clearCache();
    }

    let sharesiesInfo;
    try {
        sharesiesInfo = yield sharesies.getInfo();
    } catch (e) {
        cprint.red("Failed to get sharesies info:");
        cprint.red(e);
        return;
    }

    let sharesiesStats;
    try {
        sharesiesStats = yield sharesies.getStats(user);
    } catch (e) {
        cprint.red("Failed to get sharesies stats:");
        cprint.red(e);
        return;
    }

    let sharesiesTransactions;
    try {
        sharesiesTransactions = yield sharesies.getTransactions(user);
    } catch (e) {
        cprint.red("Failed to get sharesies transactions:");
        cprint.red(e);
        return;
    }

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

    if (sortedFundsByBuy.length) {
        print.line();
        _printSectionHeader('Buy Scores');

        sortedFundsByBuy
            .forEach(fundInfo => sharesies.printFundInvestmentInfo(fundInfo.fund, marketPricesNormalized, INVESTMENT_AMOUNT));
    }

    let sortedFundsBySell = sortedFunds
        .filter(fundInfo => fundInfo.info.score < BUY_SCORE_THRESHOLD);

    if (sortedFundsBySell.length) {
        _printSectionHeader('Sell Scores');

        sortedFundsBySell
            .forEach(fundInfo => sharesies.printFundInvestmentInfo(fundInfo.fund, marketPricesNormalized, INVESTMENT_AMOUNT));
    }

    let walletBalance = parseFloat(sharesiesInfo.user['wallet_balance']);
    let portfolioBalance = parseFloat(sharesiesStats.total_portfolio);

    let sellingSharesValue = sharesiesInfo.orders
        .filter(order => order.type === 'sell')
        .map(order => {
            let fund = funds
                .find(fund => fund.id === order['fund_id']);
            if (!fund) {
                return 0; // Selling a filtered out fund
            }
            return order['shares'] * fund.market_price;
        })
        .reduce((total, amount) => total + parseFloat(amount), 0);

    let purchaseSharesValue = sharesiesInfo.orders
        .filter(order => order.type === 'buy')
        .map(order => order['requested_nzd_amount'])
        .reduce((total, amount) => total + parseFloat(amount), 0);

    let investmentBalance = walletBalance + portfolioBalance + purchaseSharesValue;
    let exploratoryInvestmentBalance = investmentBalance * EXPLORATORY_RATIO;
    let exploratoryInvestmentScore = sortedFundsByBuy.length ? sortedFundsByBuy
        .map(fundInfo => {
            return Math.pow(fundInfo.info.score * 0.6, DISTRIBUTION_MAGNITUDE);
        })
        .reduce((scoreSum, score) => scoreSum + score, 0) / sortedFundsByBuy.length : 0;

    let diversificationInvestmentBalance = investmentBalance - exploratoryInvestmentBalance;
    exploratoryInvestmentBalance = exploratoryInvestmentBalance * Math.min(1, exploratoryInvestmentScore);

    let remainingBalance = investmentBalance - diversificationInvestmentBalance - exploratoryInvestmentBalance;

    _debug(`Investment Balance: ${investmentBalance}`);
    _debug(`Wallet Balance: ${walletBalance}`);
    _debug(`Portfolio Balance: ${portfolioBalance}`);
    _debug(`Purchase Shares Balance: ${purchaseSharesValue}`);
    _debug(`Exploratory Investment Balance: ${exploratoryInvestmentBalance}`);
    _debug(`Exploratory Investment Score: ${exploratoryInvestmentScore}`);
    _debug(`Diversification Investment Balance: ${diversificationInvestmentBalance}`);
    _debug(`Remaining Balance: ${remainingBalance}`);

    if (remainingBalance < 0) {
        throw new Error('Remaining balance cannot be negative');
    }

    _printSectionHeader('Investment Split');
    let exploratoryBallanceStr = cprint.toYellow('$' + exploratoryInvestmentBalance.toFixed(2));
    let diversificationBallanceStr = cprint.toGreen('$' + diversificationInvestmentBalance.toFixed(2));
    let remainingBalanceStr = cprint.toCyan('<--') + ' ' + cprint.toWhite('$' + remainingBalance.toFixed(2)) + ' ' + cprint.toCyan('-->');
    print.info(`${cprint.toYellow('Exploratory')} ${exploratoryBallanceStr} ${remainingBalanceStr} ${diversificationBallanceStr} ${cprint.toGreen('Diversification')}`);

    if (exploratoryInvestmentBalance > 0) {
        _printActionsHeader('Actions for buying');
    }
    let fundsAllocated = yield buyShares(user, sharesiesInfo, exploratoryInvestmentBalance, walletBalance, sortedFundsByBuy);
    if (fundsAllocated.boughtNew) {
        yield sharesies.confirmCart(user, credentials.get('password')).then(data => {
            print.errors(data);
            return Promise.resolve(true);
        });
    }

    let fundsFound = fundsAllocated.totalValue + sellingSharesValue;
    let fundsSaleAllocation = Math.max(0, exploratoryInvestmentBalance - fundsFound);

    if (exploratoryInvestmentBalance > 0) {
        _printActionsHeader('Actions for selling');

        if (fundsSaleAllocation > 0) {
            if (fundsSaleAllocation < 100) {
                print.info(`Allocated $${fundsFound.toFixed(2)} for exploratory investment, so that is close enough, no need to sell anything`);
                yield sellShares(user, sharesiesInfo, sortedFunds, 0);
                sharesiesInfo = yield sharesies.getInfo();
            } else {
                print.info(`Allocated only $${fundsFound.toFixed(2)} for exploratory investment, so need to sell $${fundsSaleAllocation.toFixed(2)} for further exploratory investment`);
                yield sellShares(user, sharesiesInfo, sortedFunds, fundsSaleAllocation);
                sharesiesInfo = yield sharesies.getInfo();
            }
        } else if (sellingSharesValue) {
            print.info(`Allocated more than enough $${fundsFound.toFixed(2)} for exploratory investment (including selling $${sellingSharesValue.toFixed(2)}), no need to sell more`);
        } else {
            print.info(`Allocated more than enough $${fundsFound.toFixed(2)} for exploratory investment, no need to sell`);
        }
    }

    let daysAgo = 7;

    let maxInvestmentStrategy = getMaxInvestmentStrategy(sortedFunds, daysAgo);
    let maxInvestmentFundCodes = maxInvestmentStrategy.bestValueIncreases
        .filter(fund => fund.fundCode !== 'NONE')
        .filter((_, idx) => idx < 3)
        .map(fund => fund.fundCode + ` (x${parseInt(fund.fundMultiplierAtIdx * 1000) / 1000})`)
        .join(', ');

    let investmentStrategy = getInvestmentStrategy(sharesiesTransactions, sharesiesInfo, sortedFunds, daysAgo);
    let investmentReturn = parseFloat(investmentStrategy.totalReturn);
    let investmentFundGainCodes = investmentStrategy.bestValueIncreases
        .filter(fund => fund.fundCode !== 'NONE')
        .filter((_, idx) => idx < 3)
        .map(fund => fund.fundCode + ` (x${parseInt(fund.fundMultiplierAtIdx * 1000) / 1000})`)
        .join(', ');

    let investmentFundLossCodes = investmentStrategy.worstValueIncreases
        .filter(fund => fund.fundCode !== 'NONE')
        .filter((_, idx) => idx < 3)
        .filter(fund => fund.fundMultiplierAtIdx < 1)
        .map(fund => fund.fundCode + ` (x${parseInt(fund.fundMultiplierAtIdx * 1000) / 1000})`)
        .join(', ');

    let totalReturnsPerDay = investmentReturn / daysAgo;

    let isWin = process.platform === 'win32';
    let lightGreenFn = cprint.toLightGreen;
    if (!isWin) {
        lightGreenFn = cprint.toGreen;
    }

    let lightBlueFn = cprint.toLightBlue;
    if (!isWin) {
        lightBlueFn = cprint.toGreen;
    }

    let lightYellowFn = cprint.toLightYellow;
    if (!isWin) {
        lightYellowFn = cprint.toYellow;
    }

    let totalReturn = parseFloat(sharesiesStats.total_portfolio) - parseFloat(sharesiesStats.total_deposits) + parseFloat(sharesiesStats.total_withdrawals);
    let totalInvested = parseFloat(sharesiesStats.total_portfolio);

    _printSectionHeader('Summary');
    print.info(`Wallet Balance: ${cprint.toGreen('$' + walletBalance.toFixed(2))}`);
    print.info(`Buying Shares: ${cprint.toGreen('$' + purchaseSharesValue.toFixed(2))}`);
    print.info(`Selling Shares: ${cprint.toRed('$' + sellingSharesValue.toFixed(2))}`);
    print.line();
    print.info(`Total Deposits: ${cprint.toGreen('$' + parseFloat(sharesiesStats.total_deposits).toFixed(2))}`);
    print.info(`Total Withdrawals: ${cprint.toRed('$' + parseFloat(sharesiesStats.total_withdrawals).toFixed(2))}`);
    print.info(`Total Invested: ${cprint.toCyan('$' + totalInvested.toFixed(2))}`);
    print.info(`Total Return: ${lightGreenFn('$' + totalReturn.toFixed(2))}`);

    _printSectionHeader('Investment strategy (last 2 weeks)');
    print.info(`Invested value increases: ${lightBlueFn('=> ' + investmentFundGainCodes)}`);
    print.info(`Invested value decreases: ${lightYellowFn('=> ' + investmentFundLossCodes)}`);
    print.info(`Best value increases:     ${lightBlueFn('=> ' + maxInvestmentFundCodes)}`);
    print.info(`Return: ${lightGreenFn('$' + investmentReturn.toFixed(2))}`);
    print.info(`Return per Day: ${lightGreenFn('$' + totalReturnsPerDay.toFixed(2))}`);
});

// ******************************

function buyShares(user, sharesiesInfo, exploratoryBuyAllocation, walletBalance, sortedFunds) {
    let availableFundAllocation = walletBalance;

    let totalScore = sortedFunds.reduce((scoreSum, fundInfo) => scoreSum + fundInfo.info.score, 0);
    let adjustedFundsDistribution = sortedFunds
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

    _debug(`Exploratory Buy Allocation: ${exploratoryBuyAllocation}`);

    return sharesies.clearCart(user)
        .then(sortedFunds
            .sort((a, b) => b.info.score - a.info.score)
            .forEachThen((fundInfo, idx) => {
                let desiredFundAllocation = fundsDistribution[idx] * exploratoryBuyAllocation;

                let sharePrice = fundInfo.info.currentPrice;

                let currentSharesAmount = parseInt(sharesAmountByFundId[fundInfo.fund.id] || 0);
                let buyingSharesAmount = sharesiesInfo.orders
                    .filter(order => order.type === 'buy' && order.fund_id === fundInfo.fund.id)
                    .map(order => parseInt(order['requested_nzd_amount'] / sharePrice))
                    .reduce((total, amount) => total + Math.ceil(amount), 0);

                currentSharesAmount += buyingSharesAmount;

                let currentSharesValue = currentSharesAmount * sharePrice;
                let desiredSharesAmount = desiredFundAllocation / sharePrice;

                _debug(`Fund: ${fundInfo.fund.code}`);
                _debug(`Fund Distribution Score: ${fundsDistribution[idx]}`);
                _debug(`Desired Allocation: ${desiredFundAllocation}`);
                _debug(`Share Price: ${sharePrice}`);
                _debug(`Current Shares: ${currentSharesAmount}`);
                _debug(`Current Shares Value: ${currentSharesValue}`);
                _debug(`Desired Shares: ${desiredSharesAmount}`);

                if (desiredSharesAmount <= currentSharesAmount) {
                    fundsAllocated.totalValue += desiredFundAllocation;
                    print.info(`Already have ${_numberRound(desiredSharesAmount)} shares ($${desiredFundAllocation.toFixed(2)}) for ${fundInfo.fund.code}, no more desired`);
                    return;
                }

                if (currentSharesAmount) {
                    print.info(`Already have ${_numberRound(currentSharesAmount)} shares ($${currentSharesValue.toFixed(2)}) for ${fundInfo.fund.code} but investing more...`);
                }

                fundsAllocated.totalValue += currentSharesValue;

                if (availableFundAllocation <= 0.01) {
                    print.warning(`Cannot invest into ${fundInfo.fund.code} since wallet balance is 0`);
                    return;
                }

                let fundAllocation = Math.min(availableFundAllocation, (desiredSharesAmount - currentSharesAmount) * sharePrice);
                if (fundAllocation < MIN_FUND_ALOCATION) {
                    print.warning(`Cannot invest $${fundAllocation.toFixed(2)} into ${fundInfo.fund.code} since it will be below the minimum fund allocation $${MIN_FUND_ALOCATION}`);
                    return;
                }

                let sharesAmountToBuy = Math.floor(fundAllocation / sharePrice);
                fundAllocation = Math.round(sharesAmountToBuy * sharePrice * 100) / 100;

                fundsAllocated.totalValue += fundAllocation;

                print.action(`=> Auto investing ${_numberRound(sharesAmountToBuy)} shares ($${fundAllocation.toFixed(2)}) into ${fundInfo.fund.code}`);
                availableFundAllocation -= fundAllocation;

                if (!EXECUTE) {
                    return Promise.resolve();
                } else {
                    fundsAllocated.boughtNew = true;
                    return sharesies.addCartItem(user, fundInfo.fund, fundAllocation).then(data => {
                        print.errors(data);
                        sharesies.clearCache();
                        return Promise.resolve(true);
                    });
                }
            })
        )
        .then(() => {
            return fundsAllocated;
        });
}

// ******************************

function sellShares(user, sharesiesInfo, sortedFunds, exploratorySellAllocation) {
    let portfolioFundIds = sharesiesInfo.funds.map(fund => fund.fund_id);
    let sharesAmountByFundId = sharesiesInfo.funds.reduce((dict, fund) => {
        dict[fund.fund_id] = fund.shares;
        return dict;
    }, {});

    let totalSoldValue = 0;

    let sortedFundsInPortfolio = sortedFunds.filter(fundInfo => portfolioFundIds.indexOf(fundInfo.fund.id) >= 0);
    return sortedFundsInPortfolio
        .sort((a, b) => a.info.score - b.info.score)
        .forEachThen(fundInfo => {
            let sharesAmount = parseInt(sharesAmountByFundId[fundInfo.fund.id] || 0);
            let sharePrice = fundInfo.info.currentPrice;
            let sharesValue = sharesAmount * sharePrice;

            if (totalSoldValue >= exploratorySellAllocation) {
                return;
            }

            if (fundInfo.info.score < BUY_SCORE_THRESHOLD) {
                if (sharesValue <= 200) {
                    return;
                }

                sharesAmount = Math.max(1, (sharesValue - 200) / sharePrice);
                sharesValue = sharesAmount * sharePrice;
            } else {
                let maxSaleValue = Math.min(exploratorySellAllocation - totalSoldValue, sharesValue - 200);
                if (maxSaleValue <= 0) {
                    return;
                }

                if (sharesValue > maxSaleValue) {
                    sharesAmount = Math.max(1, maxSaleValue / sharePrice);
                    sharesValue = sharesAmount * sharePrice;
                }
            }

            print.action(`=> Auto selling ${_numberRound(sharesAmount)} shares ($${sharesValue.toFixed(2)}) for ${fundInfo.fund.code}`);
            totalSoldValue += sharesValue;

            if (!EXECUTE) {
                return Promise.resolve();
            } else {
                return sharesies.sellFund(user, fundInfo.fund, _numberRound(sharesAmount)).then(data => {
                    print.errors(data);
                    sharesies.clearCache();
                    return Promise.resolve(true);
                });
            }
        })
        .then(() => totalSoldValue);
}

// ******************************

function getInvestmentStrategy(sharesiesTransactions, sharesiesInfo, sortedFunds, daysAgo) {
    let now = new Date();

    let fundPriceHistoryDays = sortedFunds[0].info.fundPrices.length - 1;

    let totalReturn = 0;
    let bestValueIncreases = [];
    let worstValueIncreases = [];

    let fundAmount = sharesiesInfo.funds
        .reduce((dict, fund) => {
            let fundCode = sortedFunds
                .filter(sortedFund => sortedFund.fund.id === fund.fund_id)
                .map(sortedFund => sortedFund.fund.code)[0] || fund.fund_id;

            let fundValue = parseFloat(fund.value);
            dict[fundCode] = fundValue;
            return dict;
        }, {});

    for (let dayAgoIdx = 0; dayAgoIdx < daysAgo; ++dayAgoIdx) {
        let dateAtIdx = new Date(now.getTime() - (dayAgoIdx * 24 * 3600 * 1000));
        let dateStampAtIdx = dateAtIdx.toDateStamp();
        let fundPriceHistoryIdx = fundPriceHistoryDays - dayAgoIdx;

        sharesiesTransactions
            .filter(transaction => transaction.buy_order && transaction.buy_order.state !== 'cancelled')
            .map(transaction => {
                return {
                    'amount': -parseFloat(transaction.amount),
                    'fundCode': sortedFunds
                        .filter(sortedFund => sortedFund.fund.id === transaction.buy_order.fund_id)
                        .map(sortedFund => sortedFund.fund.code)[0] || transaction.buy_order.fund_id,
                    'dateStamp': new Date(transaction.timestamp.$quantum).toDateStamp()
                };
            })
            .filter(transaction => transaction.dateStamp === dateStampAtIdx)
            .forEach(transaction => {
                fundAmount[transaction.fundCode] = (fundAmount[transaction.fundCode] || 0) - transaction.amount;
            });

        sharesiesTransactions
            .filter(transaction => transaction.sell_order && transaction.sell_order.state !== 'cancelled')
            .map(transaction => {
                return {
                    'amount': -parseFloat(transaction.amount),
                    'fundCode': sortedFunds
                        .filter(sortedFund => sortedFund.fund.id === transaction.sell_order.fund_id)
                        .map(sortedFund => sortedFund.fund.code)[0] || transaction.sell_order.fund_id,
                    'dateStamp': new Date(transaction.timestamp.$quantum).toDateStamp()
                };
            })
            .filter(transaction => transaction.dateStamp === dateStampAtIdx)
            .forEach(transaction => {
                fundAmount[transaction.fundCode] = (fundAmount[transaction.fundCode] || 0) - transaction.amount;
            });

        let maxFund = null;
        let maxReturn = 0;
        let maxFundMultiplierAtIdx = 1;

        let minFund = null;
        let minReturn = 0;
        let minFundMultiplierAtIdx = 1;

        sortedFunds
            .forEach(sortedFund => {
                let fundMultiplierAtIdx = (sortedFund.info.fundPrices[fundPriceHistoryIdx] / sortedFund.info.fundPrices[fundPriceHistoryIdx - 1]) || 1;
                let after = fundAmount[sortedFund.fund.code] || 0;
                let before = after / fundMultiplierAtIdx;
                let fundReturn = (after - before);

                fundAmount[sortedFund.fund.code] = before;

                totalReturn += fundReturn;
                if (fundReturn > maxReturn) {
                    maxFund = sortedFund;
                    maxReturn = fundReturn;
                    maxFundMultiplierAtIdx = fundMultiplierAtIdx;
                }

                if (fundReturn < minReturn) {
                    minFund = sortedFund;
                    minReturn = fundReturn;
                    minFundMultiplierAtIdx = fundMultiplierAtIdx;
                }
            });

        bestValueIncreases.push({
            date: dateStampAtIdx,
            priceBefore: maxFund ? maxFund.info.fundPrices[fundPriceHistoryIdx - 1] : 0,
            priceAfter: maxFund ? maxFund.info.fundPrices[fundPriceHistoryIdx] : 0,
            fundCode: maxFund ? maxFund.fund.code : 'NONE',
            fundReturn: maxReturn,
            fundMultiplierAtIdx: maxFundMultiplierAtIdx
        });

        worstValueIncreases.push({
            date: dateStampAtIdx,
            priceBefore: minFund ? minFund.info.fundPrices[fundPriceHistoryIdx - 1] : 0,
            priceAfter: minFund ? minFund.info.fundPrices[fundPriceHistoryIdx] : 0,
            fundCode: minFund ? minFund.fund.code : 'NONE',
            fundReturn: minReturn,
            fundMultiplierAtIdx: minFundMultiplierAtIdx
        });
    }

    return {
        bestValueIncreases: bestValueIncreases
            .sort((a,b) => b.fundReturn - a.fundReturn),
        worstValueIncreases: worstValueIncreases
            .sort((a,b) => a.fundReturn - b.fundReturn),
        totalReturn: totalReturn
    };
}

// ******************************

function getMaxInvestmentStrategy(sortedFunds, daysAgo) {
    let startDate = new Date('2018-01-01');
    let now = new Date();
    let daysSinceBeginning = parseInt((now - startDate) / (24 * 3600 * 1000));

    let fundHistoryDays = sortedFunds[0].info.fundPrices.length - 1;

    let bestValueIncreases = [];

    for (let dayIdx = 0; dayIdx <= daysSinceBeginning; dayIdx++) {
        let dateAtIdx = new Date(startDate.getTime() + (dayIdx * 24 * 3600 * 1000));
        let dateStampAtIdx = dateAtIdx.toDateStamp();
        let dateInRange = dayIdx >= daysSinceBeginning - daysAgo;

        let fundDayIdx = dayIdx + (fundHistoryDays - daysSinceBeginning);

        let maxFund = sortedFunds
            .map(sortedFund => {
                return {
                    date: dateStampAtIdx,
                    fundCode: sortedFund.fund.code,
                    priceBefore: sortedFund.info.fundPrices[fundDayIdx],
                    priceAfter: sortedFund.info.fundPrices[fundDayIdx + 1],
                    fundMultiplierAtIdx: sortedFund.info.fundPrices[fundDayIdx + 1] / sortedFund.info.fundPrices[fundDayIdx]
                };
            })
            .concat([{
                date: dateStampAtIdx,
                fundCode: 'NONE',
                priceBefore: 1,
                priceAfter: 1,
                fundMultiplierAtIdx: 1
            }])
            .reverse()
            .sort((a, b) => b.fundMultiplierAtIdx - a.fundMultiplierAtIdx)[0];

        if (dateInRange) {
            bestValueIncreases.push(maxFund);
        }
    }

    return {
        bestValueIncreases: bestValueIncreases
            .sort((a,b) => b.fundMultiplierAtIdx - a.fundMultiplierAtIdx)
    };
}

// ******************************
// Helper Functions:
// ******************************

function _numberRound(in_number) {
    return Math.round(in_number);
}

// ******************************

function _printHeader (in_title, in_indent, in_backgroundFn, in_foregroundFn) {
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

function _printTitleHeader (in_title, in_indent) {
    _printHeader(in_title, in_indent, cprint.backgroundMagenta, cprint.toWhite);
}

// ******************************

function _printSectionHeader (in_title, in_indent) {
    _printHeader(in_title, in_indent, cprint.backgroundCyan, cprint.toWhite);
}

// ******************************

function _printActionsHeader (in_title, in_indent) {
    let lightGreenBackgroundFn = cprint.backgroundLightGreen;
    let isWin = process.platform === 'win32';
    if (!isWin) {
        lightGreenBackgroundFn = cprint.backgroundGreen;
    }
    _printHeader(in_title, in_indent, lightGreenBackgroundFn, cprint.toBlack);
}

// ******************************

function _debug(in_message) {
    if (DEBUG) {
        process.stdout.write(cprint.toWhite(`*** DEBUG *** ${in_message}\n`));
    }
}

// ******************************
