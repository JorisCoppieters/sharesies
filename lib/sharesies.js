'use strict'; // JS: ES6

// ******************************
// Requires:
// ******************************

const Promise = require('bluebird');
const cprint = require('color-print');

require('./array');
const dict = require('./dictionary');
const request = require('./request');
const dateExt = require('./date');

// ******************************
// Functions:
// ******************************

function getInfo() {
    return new Promise(resolve =>
        request.get(
            'identity/check',
            {}
        )
            .then(data => {
                return resolve({
                    'user': data.user,
                    'funds': data.portfolio,
                    'orders': data.orders,
                    'value': data.portfolio_value
                });
            })
    );
}

// ******************************

function getStats() {
    return new Promise(resolve =>
        request.get(
            'accounting/stats-v2',
            {}
        )
            .then(data => {
                resolve(data.stats);
            })
    );
}

// ******************************

function getTransactions() {
    return new Promise(resolve =>
        request.get(
            'accounting/transaction-history',
            {
                'limit': 100
            }
        )
            .then(data => {
                resolve(data.transactions);
            })
    );
}

// ******************************

function clearCart() {
    return new Promise(resolve =>
        request.post(
            'cart/get',
            {}
        )
            .then(data =>
            {
                let resolveAll = [];
                data.items.forEach(item => {
                    resolveAll.push(request.post(
                        'cart/set-item',
                        {
                            'fund_id': item.fund.id,
                            'amount': 0,
                            'read_pds': true
                        }
                    ));
                });
                Promise.all(resolveAll).then(resolve);
            }
            )
    );
}

// ******************************

function buyFund(fund, investAmount) {
    return new Promise(resolve =>
        request.post(
            'cart/add-item',
            {
                'fund_id': fund.id,
                'amount': investAmount,
                'read_pds': true
            }
        )
            .then(data =>
                resolve(data)
            )
    );
}

// ******************************

function sellFund(fund, sharesAmount) {
    return new Promise(resolve =>
        request.post(
            'fund/sell',
            {
                'fund_id': fund.id,
                'shares': sharesAmount
            }
        )
            .then(data =>
                resolve(data)
            )
    );
}

// ******************************

function getFunds() {
    return new Promise(resolve =>
        request.get(
            'fund/list',
            {}
        )
            .then(data => {
                let funds = data['funds']
                    .filter(fund => ['NZB','450002', '450007'].indexOf(fund.code) < 0);
                // .filter(fund => ['EUF'].indexOf(fund.code) >= 0);

                funds
                    .forEachThen(fund => ['2016', '2017', '2018']
                        .forEachThen(year => request.get(
                            'fund/day-prices',
                            {
                                'fund_id': fund['id'],
                                'year': year
                            }
                        )
                            .then(data =>
                            {
                                fund['day_prices'] = Object.assign(fund['day_prices'], data['day_prices']);
                                return Promise.resolve();
                            }
                            )
                        )
                    )
                    .then(() => resolve(funds));
            })
    );
}

// ******************************

function getFundsFromStore() {
    const fs = require('fs');
    const path = require('path');
    const storeFile = path.resolve('./', 'store');

    if (fs.existsSync(storeFile)) {
        return new Promise(resolve => {
            fs.readFile(storeFile, (err, data) => {
                resolve(JSON.parse(data));
            });
        });
    } else {
        return getFunds().then(funds => {
            fs.writeFileSync(storeFile, JSON.stringify(funds));
            return Promise.resolve(funds);
        });
    }
}

// ******************************

function getFundsCleaned() {
    return getFundsFromStore().then(funds => {
        let dateKeys = dateExt.getDateStampRange(500).reverse();

        return funds.forEachThen(fund => {
            let consistentDayPrices = [];
            let dayPrices = fund['day_prices'];
            let firstPrice = dict.getOrderedValues(dayPrices, parseFloat)[0];

            let prevDateKey = null;
            dateKeys.forEach(dateKey => {
                if (!dayPrices[dateKey] && consistentDayPrices[prevDateKey]) {
                    consistentDayPrices[dateKey] = consistentDayPrices[prevDateKey];
                } else if (dayPrices[dateKey]) {
                    consistentDayPrices[dateKey] = dayPrices[dateKey];
                } else if (!consistentDayPrices.length) {
                    consistentDayPrices[dateKey] = firstPrice;
                }
                prevDateKey = dateKey;
            });

            fund['day_prices'] = consistentDayPrices;
        }).then(() => Promise.resolve(funds));
    });
}

// ******************************

function getMarketPricesAverage(in_funds) {
    return in_funds
        .reduce((marketPricesSum, fund) => {
            let fundPrices = dict.getOrderedValues(fund['day_prices'], parseFloat);
            return marketPricesSum ? marketPricesSum.map((val, idx) => val + fundPrices[idx]) : fundPrices;
        }, false)
        .map(val => val  / in_funds.length);
}

// ******************************

function getNormalizedValues(in_values) {
    let minValue = Math.min.apply(null, in_values);
    let maxValue = Math.max.apply(null, in_values);
    let valueRange = maxValue - minValue;
    return in_values.map(value => (value - minValue) / valueRange);
}

// ******************************

function getFundInvestmentInfo(fund, marketPricesNormalized) {
    let code = fund['code'];

    // let startDate = new Date('2018-02-18');
    // let now = new Date();
    // let daysSinceStart = parseInt((now - startDate) / (24 * 3600 * 1000));

    let fundPrices = dict.getOrderedValues(fund['day_prices'], parseFloat);
    let fundPricesNormalized = getNormalizedValues(fundPrices);

    let minPrice = Math.min.apply(null, fundPrices);
    let maxPrice = Math.max.apply(null, fundPrices);
    let priceRange = maxPrice - minPrice;
    let priceSum = fundPrices.reduce((sum, val) => sum + val, 0);
    let priceCount = fundPrices.length;
    let avgPrice = priceSum / priceCount;

    let currentPrice = fundPrices[fundPrices.length - 1];
    let currentNormalizedPrice = fundPricesNormalized[fundPricesNormalized.length - 1];
    let currentNormalizedMarketPrice = marketPricesNormalized[marketPricesNormalized.length - 1];
    let currentPotentialPrice = currentNormalizedMarketPrice * priceRange + minPrice;

    let marketVariability = fundPricesNormalized
        .map((price, idx) => Math.abs(price - marketPricesNormalized[idx]))
        .reduce((sum, price) => sum + price, 0) / fundPricesNormalized.length;

    // let fundReturn = fundPrices[fundPrices.length - 1] / fundPrices[fundPrices.length - daysSinceStart - 1];

    let score = 0;
    score += (currentPotentialPrice - currentPrice) * 1; // Weight towards potential price
    score += (maxPrice - currentPrice) * 0.1; // Weight towards max price
    score += priceRange * 0.05; // Weight towards large price ranges
    score += (1 - currentNormalizedPrice) * 1; // Weight towards how much below the fund maximum the current price is
    score += (currentNormalizedMarketPrice - currentNormalizedPrice) * 1; // Weight towards how much below the market line current price is
    score -= marketVariability * 1; // Weight away how different line is to market line
    // score += (fundReturn - 1) * 10;

    return {
        code,
        fundPrices,
        fundPricesNormalized,
        minPrice,
        maxPrice,
        priceRange,
        priceSum,
        priceCount,
        avgPrice,
        currentPrice,
        currentNormalizedPrice,
        currentNormalizedMarketPrice,
        currentPotentialPrice,
        marketVariability,
        score
    };
}

// ******************************

function printFundInvestmentInfo(fund, marketPricesNormalized, investmentAmount) {
    let code = fund['code'];
    let info = getFundInvestmentInfo(fund, marketPricesNormalized);

    let potentialInvestmentAmount = investmentAmount / info.currentPrice * info.currentPotentialPrice;
    let maxInvestmentAmount = investmentAmount / info.currentPrice * info.maxPrice;

    let rangePositionColorFn = cprint.toRed;
    if (info.currentNormalizedPrice < 0.5) {
        rangePositionColorFn = cprint.toGreen;
    } else if (info.currentNormalizedPrice < 0.75) {
        rangePositionColorFn = cprint.toYellow;
    }

    let isWin = process.platform === 'win32';
    let lightGreyFn = cprint.toLightGrey;
    if (!isWin) {
        lightGreyFn = cprint.toWhite;
    }

    let range = `${cprint.toCyan('$' + info.minPrice.toFixed(2))} ${lightGreyFn('<==')} ${rangePositionColorFn('$' + info.currentPrice.toFixed(2) + ' [' + (info.currentNormalizedPrice * 100).toFixed(2) + '%' + ']')} ${lightGreyFn('==>')} ${cprint.toCyan('$' + info.maxPrice.toFixed(2))}`;

    let potentialReturn = potentialInvestmentAmount - investmentAmount;
    let maxReturn = maxInvestmentAmount - investmentAmount;

    let returnColorFn = cprint.toRed;
    if (potentialReturn > 45) {
        returnColorFn = cprint.toGreen;
    } else if (potentialReturn > 25) {
        returnColorFn = cprint.toYellow;
    }

    let invest = '';
    if (potentialReturn > 0) {
        invest = `${cprint.toWhite(', invest:')} ${cprint.toCyan('$' + investmentAmount.toFixed(2))} ${lightGreyFn('for approx. return')} ${returnColorFn('$' + potentialReturn.toFixed(2) + ' - $' + maxReturn.toFixed(2))}`;
    }

    let scoreColorFn = cprint.toRed;
    if (info.score > 0.8) {
        scoreColorFn = cprint.toGreen;
    } else if (info.score > 0.2) {
        scoreColorFn = cprint.toYellow;
    }

    let score = `${cprint.toWhite(', score:')} ${scoreColorFn(info.score.toFixed(2))}`;

    process.stdout.write(`${cprint.toGreen(code)} ${range}${score}${invest}\n`);
}

// ******************************

function login (username, password) {
    return new Promise(resolve =>
        request.post(
            'identity/login',
            {
                'email': username,
                'password': password,
                'remember': true
            }
        )
            .then(data => {
                resolve(data);
            })
    );
}

// ******************************
// Exports:
// ******************************

module.exports['buyFund'] = buyFund;
module.exports['clearCart'] = clearCart;
module.exports['getFundInvestmentInfo'] = getFundInvestmentInfo;
module.exports['getMarketPricesAverage'] = getMarketPricesAverage;
module.exports['getNormalizedValues'] = getNormalizedValues;
module.exports['getFunds'] = getFunds;
module.exports['getFundsCleaned'] = getFundsCleaned;
module.exports['getFundsFromStore'] = getFundsFromStore;
module.exports['getInfo'] = getInfo;
module.exports['getStats'] = getStats;
module.exports['getTransactions'] = getTransactions;
module.exports['login'] = login;
module.exports['printFundInvestmentInfo'] = printFundInvestmentInfo;
module.exports['sellFund'] = sellFund;

// ******************************
