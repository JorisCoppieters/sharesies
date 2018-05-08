#!/usr/bin/env node

'use strict'; // JS: ES6

// ******************************
// Requires:
// ******************************

const fs = require('fs');
const vega = require('vega');

require('./lib/date');
const config = require('./lib/config');
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

    let sortedFundsBySell = sortedFunds
        .filter(fundInfo => fundInfo.info.score < BUY_SCORE_THRESHOLD);

    drawSellingChart(sortedFundsBySell, marketPricesNormalized);
});

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
