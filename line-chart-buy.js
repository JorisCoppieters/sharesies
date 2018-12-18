#!/usr/bin/env node

'use strict'; // JS: ES6

// ******************************
// Requires:
// ******************************

const fs = require('fs');
const path = require('path');
const vega = require('vega');

require('./lib/date');
const credentials = require('./lib/credentials');
const exec = require('./lib/exec');
const readline = require('./lib/readline');
const sharesies = require('./lib/sharesies');
const sync = require('./lib/sync');

// ******************************
// Constants:
// ******************************

const DAYS_AGO = 120;
const BUY_SCORE_THRESHOLD = 0.5;

// ******************************

sync.runGenerator(function*() {
    if (!credentials.get('username')) {
        credentials.set('username', readline.sync('Please enter your username: '));
    }
    if (!credentials.get('password')) {
        credentials.set('password', readline.sync('Please enter your password: '));
    }

    yield sharesies.login(
        credentials.get('username'),
        credentials.get('password')
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

    drawBuyingChart(sortedFundsByBuy, marketPricesNormalized);
});

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

    viewLineChart(chartData, 'line-chart-buy');
}

// ******************************

function viewLineChart(chartData, chartName) {
    let lineChart = require('./line-chart.json');
    lineChart.data = chartData;

    let lineChartImg = path.resolve(getTemp(), chartName + '.png');

    let view = new vega.View(vega.parse(lineChart))
        .logLevel(vega.warn)
        .renderer('none')
        .initialize();

    view
        .toCanvas()
        .then(canvas => {
            fs.writeFile(lineChartImg, canvas.toBuffer(), () => {
                exec.cmd('explorer', [
                    lineChartImg
                ], {
                    hide: true
                });
            });
        })
        .catch(err => {
            process.stderr.write(err + '\n');
        });

    view.finalize();
}

// ******************************

function getTemp() {
    return process.env['TEMP'] || process.env['TMP'] || '/tmp';
}

// ******************************
