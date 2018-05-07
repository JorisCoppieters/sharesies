'use strict'; // JS: ES6

// ******************************
// Requires:
// ******************************

const Promise = require('bluebird');
const cprint = require('color-print');
const fs = require('fs');
const vega = require('vega');

require('./lib/date');
const config = require('./lib/config');
const print = require('./lib/print');
const readline = require('./lib/readline');
const sharesies = require('./lib/sharesies');
const sync = require('./lib/sync');

// ******************************
// Constants:
// ******************************

const DAYS_AGO = 120;
const INVESTMENT_AMOUNT = 1000;
const BUY_SCORE_THRESHOLD = 0.5;
const AUTO_SELL_SCORE_THRESHOLD = -0.1;
const MIN_FUND_ALOCATION = 5;
const DISTRIBUTION_MAGNITUDE = 3;

// ******************************

sync.runGenerator(function*() {
    if (!config.get('username')) {
        config.set('username', readline.sync('Please enter your username: '));
    }
    if (!config.get('password')) {
        config.set('password', readline.sync('Please enter your password: '));
    }

    yield sharesies.login(
        config.get('username'),
        config.get('password')
    );

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

    print.heading('sell');
    sortedFundsBySell
        .forEach(fundInfo => sharesies.printFundInvestmentInfo(fundInfo.fund, marketPricesNormalized, INVESTMENT_AMOUNT));

    print.line();
    print.heading('buy');
    sortedFundsByBuy
        .forEach(fundInfo => sharesies.printFundInvestmentInfo(fundInfo.fund, marketPricesNormalized, INVESTMENT_AMOUNT));

    drawSellingChart(sortedFundsBySell, marketPricesNormalized);
    drawBuyingChart(sortedFundsByBuy, marketPricesNormalized);

    let sharesiesInfo = yield sharesies.getInfo();
    let walletBalance = parseFloat(sharesiesInfo.user['wallet_balance']);

    print.line();
    print.heading('buying strategy');

    let totalScore = sortedFundsByBuy.reduce((scoreSum, fundInfo) => scoreSum + fundInfo.info.score, 0);
    let adjustedFundsDistribution = sortedFundsByBuy
        .map(fundInfo => fundInfo.info.score / totalScore)
        .map(score => Math.pow(score, DISTRIBUTION_MAGNITUDE));

    let adjustedFundsDistributionSum = adjustedFundsDistribution.reduce((total, score) => total + score, 0);
    let fundsDistribution = adjustedFundsDistribution
        .map(score => score / adjustedFundsDistributionSum);

    yield sharesies.clearCart();

    yield sortedFundsByBuy
        .forEachThen((fundInfo, idx) => {
            let fundAllocation = parseInt(fundsDistribution[idx] * walletBalance * 100) / 100;
            if (fundAllocation < MIN_FUND_ALOCATION) {
                return;
            }
            print.action(`=> Auto investing $${fundAllocation} into ${fundInfo.fund.code}`);
            return sharesies.buyFund(fundInfo.fund, fundAllocation).then(data => {
                print.errors(data);
                return Promise.resolve(true);
            });
        });

    print.line();
    print.heading('selling strategy');

    let portfolioFundIds = sharesiesInfo.funds.map(fund => fund.fund_id);
    let sharesAmountByFundId = sharesiesInfo.funds.reduce((dict, fund) => {
        dict[fund.fund_id] = fund.shares;
        return dict;
    }, {});

    let sortedFundsBySellInPortfolio = sortedFundsBySell.filter(fundInfo => portfolioFundIds.indexOf(fundInfo.fund.id) >= 0);

    yield sortedFundsBySellInPortfolio
        .forEachThen(fundInfo => {
            if (fundInfo.info.score <= AUTO_SELL_SCORE_THRESHOLD) {
                let sharesAmount = sharesAmountByFundId[fundInfo.fund.id];
                print.action(`=> Auto selling ${sharesAmount} shares for ${fundInfo.fund.code}`);
                return sharesies.sellFund(fundInfo.fund, sharesAmount).then(data => {
                    print.errors(data) || print.info(data);
                });
            } else {
                print.info(`You might want to sell shares for ${fundInfo.fund.code}`);
                return Promise.resolve();
            }
        });

    let sellingAmount = parseInt(sharesiesInfo.orders
        .filter(order => order.type === 'sell')
        .map(order => order['shares'])
        .reduce((total, amount) => total + amount, 0));

    let purchaseAmount = parseFloat(sharesiesInfo.orders
        .filter(order => order.type === 'buy')
        .map(order => order['requested_nzd_amount'])
        .reduce((total, amount) => total + amount, 0));

    let sharesiesStats = yield sharesies.getStats();
    let sharesiesTransactions = yield sharesies.getTransactions();

    let startDate = new Date('2018-02-18');
    let now = new Date();
    let daysSinceStart = parseInt((now - startDate) / (24 * 3600 * 1000));
    let totalReturnsPerDay = parseFloat(sharesiesStats.total_returns_dollars) / daysSinceStart;

    let maxInvestmentStrategy = getMaxInvestmentStrategy(sharesiesTransactions, sortedFunds);
    let maxInvestmentTotal = maxInvestmentStrategy.totalValue;
    let maxInvestmentFundCodes = maxInvestmentStrategy.bestFunds
        .filter(fund => fund.code !== 'NONE')
        .filter((fund, idx) => idx < 3)
        .map(fund => fund.code + 'x' + fund.count).join(', ');

    let investmentHistory = getInvestmentHistory(sharesiesTransactions, sortedFunds);
    let investmentFundCodesTally = investmentHistory
        .map(entry => entry.fund.info.code)
        .reduce((tally, entry) => {
            tally[entry] = (tally[entry] || 0) + 1;
            return tally;
        }, {});

    let investmentFundCodes = Object.keys(investmentFundCodesTally)
        .map(fundCode => {
            return {
                code: fundCode,
                count: investmentFundCodesTally[fundCode]
            };
        })
        .sort((a,b) => b.count - a.count)
        .map(fund => fund.code + 'x' + fund.count).join(', ');

    print.line();
    print.heading('summary');
    print.info(`Wallet Balance: ${cprint.toGreen('$' + walletBalance.toFixed(2))}`);
    print.info(`Buying Shares: ${cprint.toGreen('$' + purchaseAmount.toFixed(2))}`);
    print.info(`Selling Shares: ${cprint.toRed('#' + sellingAmount)}`);
    print.line();
    print.info(`Total Deposits: ${cprint.toGreen('$' + parseFloat(sharesiesStats.total_deposits).toFixed(2))}`);
    print.info(`Total Withdrawals: ${cprint.toRed('$' + parseFloat(sharesiesStats.total_withdrawals).toFixed(2))}`);
    print.line();
    print.info(`Max Total Value: ${cprint.toGreen('$' + maxInvestmentTotal.toFixed(2))} ${cprint.toLightBlue('=> ' + maxInvestmentFundCodes)}`);
    print.line();
    print.info(`Total Value: ${cprint.toLightGreen('$' + parseFloat(sharesiesStats.total_portfolio).toFixed(2))} ${cprint.toLightBlue('=> ' + investmentFundCodes)}`);
    print.line();
    print.info(`Total Return: ${cprint.toLightGreen('$' + parseFloat(sharesiesStats.total_returns_dollars).toFixed(2))} ${cprint.toLightBlue('($' + parseFloat(totalReturnsPerDay).toFixed(2) + ' per day)')}`);
});

// ******************************

function getInvestmentHistory(sharesiesTransactions, sortedFunds) {
    return sharesiesTransactions
        .filter(transaction => transaction.description === 'Fund purchase')
        .map(transaction => {
            return {
                'amount': transaction.buy_order.requested_nzd_amount,
                'fund': sortedFunds.find(sortedFund => sortedFund.fund.id === transaction.buy_order.fund_id)
            };
        })
        .filter(entry => entry.fund);
}

// ******************************

function getMaxInvestmentStrategy(sharesiesTransactions, sortedFunds) {
    let startDate = new Date('2018-01-01');
    let now = new Date();
    let daysSinceStart = parseInt((now - startDate) / (24 * 3600 * 1000));

    let numDaysAgo = sortedFunds[0].info.fundPrices.length;
    let amount = 0;
    let investmentPeriod = 5;

    let bestFunds = [];

    let deposits = sharesiesTransactions
        .filter(transaction => transaction.description === 'Deposit' || transaction.description === 'Welcome gift')
        .map(transaction => {
            return {
                'amount': parseFloat(transaction.amount),
                'dateStamp': new Date(transaction.timestamp.$quantum).toDateStamp()
            };
        });

    for (let dayIdx = 0; dayIdx <= daysSinceStart; dayIdx++) {

        let dateAtIdx = new Date(startDate.getTime() + (dayIdx * 24 * 3600 * 1000));
        let dateStampAtIdx = dateAtIdx.toDateStamp();

        let deposit = deposits
            .filter(deposit => deposit.dateStamp == dateStampAtIdx)
            .reduce((total, transaction) => total + transaction.amount, 0);

        amount += deposit;

        if (dayIdx % investmentPeriod !== 0) {
            continue;
        }

        let fundDayIdx = dayIdx + (numDaysAgo - daysSinceStart);
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

        amount *= maxFund.fundMultiplierAtIdx;
        bestFunds[maxFund.fundCode] = (bestFunds[maxFund.fundCode] || 0) + 1;
    }

    return {
        bestFunds: Object.keys(bestFunds)
            .map(bestFundCode => {
                return {
                    code: bestFundCode,
                    count: bestFunds[bestFundCode]
                };
            })
            .sort((a,b) => b.count - a.count),
        totalValue: amount
    };
}

// ******************************

function drawBuyingChart(sortedFundsByBuy, marketPricesNormalized) {
    let chartData = [{
        'name': 'table',
        'values': []
            .concat([{
                'name': 'market',
                'values': marketPricesNormalized
            }])
            .concat(sortedFundsByBuy
                .map(fundInfo => {
                    return {
                        'name': fundInfo.fund.code,
                        'values': fundInfo.info.fundPricesNormalized
                    };
                })
            )
            .map((fundData) => {
                return fundData.values
                    .reverse()
                    .filter((price, priceIdx) => priceIdx < DAYS_AGO)
                    .reverse()
                    .map((price, priceIdx) => {
                        return {
                            x: priceIdx,
                            y: price,
                            c: fundData.name
                        };
                    });
            })
            .reduce((chartDataValuesArray, chartDataValueGroup) => {
                chartDataValuesArray = chartDataValuesArray.concat(chartDataValueGroup);
                return chartDataValuesArray;
            }, [])
    }];

    drawLineChart(chartData, 'line-chart-buy');
}

// ******************************

function drawSellingChart(sortedFundsBySell, marketPricesNormalized) {
    let chartData = [{
        'name': 'table',
        'values': []
            .concat([{
                'name': 'market',
                'values': marketPricesNormalized
            }])
            .concat(sortedFundsBySell
                .map(fundInfo => {
                    return {
                        'name': fundInfo.fund.code,
                        'values': fundInfo.info.fundPricesNormalized
                    };
                })
            )
            .map((fundData) => {
                return fundData.values
                    .reverse()
                    .filter((price, priceIdx) => priceIdx < DAYS_AGO)
                    .reverse()
                    .map((price, priceIdx) => {
                        return {
                            x: priceIdx,
                            y: price,
                            c: fundData.name
                        };
                    });
            })
            .reduce((chartDataValuesArray, chartDataValueGroup) => {
                chartDataValuesArray = chartDataValuesArray.concat(chartDataValueGroup);
                return chartDataValuesArray;
            }, [])
    }];

    drawLineChart(chartData, 'line-chart-sell');
}

// ******************************

function drawLineChart(chartData, chartName) {
    let lineChart = require('./line-chart.json');
    lineChart.data = chartData;

    let view = new vega.View(vega.parse(lineChart))
        .logLevel(vega.warn)
        .renderer('none')
        .initialize();

    view
        .toCanvas()
        .then(canvas => {
            fs.writeFileSync(chartName + '.png', canvas.toBuffer());
        })
        .catch(err => {
            process.stderr.write(err + '\n');
        });

    view.finalize();
    view = null;
}

// ******************************
