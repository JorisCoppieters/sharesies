'use strict'; // JS: ES6

// ******************************
// Requires:
// ******************************

const Promise = require('bluebird');
const cprint = require('color-print');

require('./string');
require('./array');
const cache = require('./cache');
const dict = require('./dictionary');
const request = require('./request');
const dateExt = require('./date');

// ******************************
// Functions:
// ******************************

function getInfo() {
    let fn = 'getInfo';
    return cache.cached(() => new Promise((resolve, reject) =>
        request.get(
            'identity/check',
            {}
        )
            .then(
                data => {
                    if (_handleErrors(fn, data, reject)) {
                        return;
                    }
                    return resolve({
                        'user': data.user,
                        'funds': data.portfolio,
                        'orders': data.orders,
                        'value': data.portfolio_value
                    });
                },
                err => reject(err)
            )
    ), 'SHARESIES_INFO', cache.M * 10);
}

// ******************************

function getStats(user) {
    let fn = 'getStats';

    return cache.cached(() => new Promise((resolve, reject) =>
        request.get(
            'accounting/stats-v2',
            {
                'acting_as_id': user.id
            }
        )
            .then(
                data => {
                    if (_handleErrors(fn, data, reject)) {
                        return;
                    }
                    resolve(data.stats);
                },
                err => reject(err)
            )
    ), 'SHARESIES_STATS', cache.M * 10);
}

// ******************************

function getTransactions(user) {
    let fn = 'getTransactions';

    return cache.cached(() => new Promise((resolve, reject) =>
        request.get(
            'accounting/transaction-history',
            {
                'acting_as_id': user.id,
                'limit': 100
            }
        )
            .then(
                data => {
                    if (_handleErrors(fn, data, reject)) {
                        return;
                    }
                    resolve(data.transactions);
                },
                err => reject(err)
            )
    ), 'SHARESIES_TRANSACTIONS', cache.M * 10);
}

// ******************************

function clearCart(user) {
    let fn = 'clearCart';

    return new Promise((resolve, reject) => _getCartItems(user)
        .then(data => {
            let resolveAll = [];
            if (_handleErrors(fn, data, reject)) {
                return;
            }
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

        })
    );
}

// ******************************

function addCartItem(user, fund, investAmount) {
    let fn = 'addCartItem';

    return new Promise((resolve, reject) =>
        request.post(
            'cart/add-item',
            {
                'acting_as_id': user.id,
                'fund_id': fund.id,
                'amount': investAmount,
                'read_pds': true
            }
        )
            .then(
                data => _handleErrors(fn, data, reject) || resolve(data),
                err => reject(err)
            )
    );
}

// ******************************

function sellFund(user, fund, sharesAmount) {
    let fn = 'sellFund';

    return new Promise((resolve, reject) =>
        request.post(
            'fund/sell',
            {
                'acting_as_id': user.id,
                'fund_id': fund.id,
                'shares': sharesAmount
            }
        )
            .then(
                data => _handleErrors(fn, data, reject) || resolve(data),
                err => reject(err)
            )
    );
}

// ******************************

function confirmCart(user, password) {
    let fn = 'confirmCart';

    return new Promise((resolve, reject) => _reauthenticate(user, password)
        .then(() => _getCartItems(user))
        .then(data => {
            let orders = data.items
                .map(item => {
                    return {
                        'amount': item.amount,
                        'fund_id': item.fund.id
                    };
                });

            return request.post(
                'cart/buy',
                {
                    'acting_as_id': user.id,
                    'order': orders
                }
            )
                .then(
                    data => _handleErrors(fn, data, reject) || resolve(data),
                    err => reject(err)
                );
        })
    );
}

// ******************************

function getFunds() {
    return cache.cached(() => new Promise((resolve, reject) =>
        request.get(
            'fund/list',
            {}
        )
            .then(
                data => {
                    let curDate = (new Date()).toDateStamp();
                    let funds = data['funds']
                        .filter(fund => ['NZB','450002', '450007'].indexOf(fund.code) < 0);
                        // .filter(fund => ['EUF'].indexOf(fund.code) >= 0);

                    funds
                        .forEachThen(fund => ['2017', '2018']
                            .forEachThen(year => request.get(
                                'fund/day-prices',
                                {
                                    'fund_id': fund['id'],
                                    'year': year
                                }
                            )
                                .then(
                                    data => {
                                        fund['day_prices'] = Object.assign(
                                            {},
                                            (() => {
                                                let dict = {};
                                                dict[curDate] = fund['market_price'];
                                                return dict;
                                            })(),
                                            fund['day_prices'],
                                            data['day_prices']
                                        );
                                        return Promise.resolve();
                                    },
                                    err => reject(err)
                                )
                            )
                        )
                        .then(() => resolve(funds));
                },
                err => reject(err)
            )
    ), 'SHARESIES_FUNDS', cache.M * 10);
}

// ******************************

function getFundsCleaned() {
    return getFunds().then(funds => {
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

    let fundPrices = dict.getOrderedValues(fund['day_prices'], parseFloat);
    let fundPricesNormalized = getNormalizedValues(fundPrices);

    let minPrice = Math.min.apply(null, fundPrices);
    let maxPrice = Math.max.apply(null, fundPrices);
    let priceRange = maxPrice - minPrice;
    let priceSum = fundPrices.reduce((sum, val) => sum + val, 0);
    let priceCount = fundPrices.length;
    let avgPrice = priceSum / priceCount;

    let priceDiff = maxPrice / minPrice - 1;

    let latestFundPricesNormalized = getNormalizedValues(fundPrices.slice(-20));
    let growth = latestFundPricesNormalized.reduce((sum, _, idx) => {
        let endIdx = latestFundPricesNormalized.length - 1;
        idx = endIdx - idx;

        let reduce = 0.8;
        if (idx === 0) {
            return sum;
        }
        return sum + (latestFundPricesNormalized[idx] - latestFundPricesNormalized[idx - 1]) * Math.pow(reduce, endIdx - idx);
    }, 0);

    let currentPrice = fundPrices[fundPrices.length - 1];
    let currentNormalizedPrice = fundPricesNormalized[fundPricesNormalized.length - 1];
    let currentNormalizedMarketPrice = marketPricesNormalized[marketPricesNormalized.length - 1];
    let currentPotentialPrice = currentNormalizedMarketPrice * priceRange + minPrice;

    let marketVariability = fundPricesNormalized
        .map((price, idx) => Math.abs(price - marketPricesNormalized[idx]))
        .reduce((sum, price) => sum + price, 0) / fundPricesNormalized.length;

    let score = 0;
    score += (currentNormalizedMarketPrice - currentNormalizedPrice) * 3.5; // Weight towards how much below the market line current price is
    score -= marketVariability * 4; // Weight away how different line is to market line
    score += growth * 3; // Weight towards positive growth over the last 20 price points
    score += priceDiff * 1; // Weight towards big price differences

    score *= 1.0;

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
        growth,
        score
    };
}

// ******************************

function printFundInvestmentInfo(fund, marketPricesNormalized) {
    let code = fund['code'].rightPad(' ', 3);
    let info = getFundInvestmentInfo(fund, marketPricesNormalized);

    let rangePositionColorFn = cprint.toRed;
    if (info.currentNormalizedPrice < 0.5) {
        rangePositionColorFn = cprint.toGreen;
    } else if (info.currentNormalizedPrice < 0.75) {
        rangePositionColorFn = cprint.toYellow;
    }

    let isWin = process.platform === 'win32';
    let lightGreyFn = str => cprint.toLightGrey(str);
    if (!isWin) {
        lightGreyFn = str => cprint.toWhite(str);
    }

    let rangePercentageStr = (info.currentNormalizedPrice * 100).toFixed(2).leftPad(' ', 6) + '%';
    let range = `${cprint.toCyan('$' + info.minPrice.toFixed(2))} ${lightGreyFn('<==')} ${rangePositionColorFn('$' + info.currentPrice.toFixed(2) + ' [' + rangePercentageStr + ']')} ${lightGreyFn('==>')} ${cprint.toCyan('$' + info.maxPrice.toFixed(2))}`;

    let scoreColorFn = cprint.toRed;
    if (info.score > 0.8) {
        scoreColorFn = cprint.toGreen;
    } else if (info.score > 0.2) {
        scoreColorFn = cprint.toYellow;
    }

    let priceRange = info.priceRange;
    let priceDiff = (100 * info.maxPrice / info.minPrice - 100).toFixed(2).leftPad(' ', 6);

    let diffColorFn = cprint.toRed;
    if (priceDiff > 50) {
        diffColorFn = cprint.toGreen;
    } else if (priceDiff > 20) {
        diffColorFn = cprint.toYellow;
    }

    let differenceStr = '$' + priceRange.toFixed(2) + ' (' + priceDiff + '%)';
    let difference = `${cprint.toWhite('diff:')} ${diffColorFn(differenceStr)}`;

    let scoreStr = info.score.toFixed(2).leftPad(' ', 5);
    let score = `${cprint.toWhite('score:')} ${scoreColorFn(scoreStr)}`;

    let growthColorFn = cprint.toRed;
    if (info.growth > 0.3) {
        growthColorFn = cprint.toGreen;
    } else if (info.growth > 0.0) {
        growthColorFn = cprint.toYellow;
    }

    let growthStr = info.growth.toFixed(2).leftPad(' ', 5);
    let growth = `${cprint.toWhite('growth:')} ${growthColorFn(growthStr)}`;

    process.stdout.write(`${cprint.toGreen(code)}   ${range}   ${difference}   ${score}   ${growth}\n`);
}

// ******************************

function login (username, password) {
    let fn = 'login';

    return new Promise((resolve, reject) =>
        request.post(
            'identity/login',
            {
                'email': username,
                'password': password,
                'remember': true
            }
        )
            .then(
                data => _handleErrors(fn, data, reject) || resolve(data),
                err => reject(err)
            )
    );
}

// ******************************

function _reauthenticate(user, password) {
    let fn = '_reauthenticate';

    return new Promise((resolve, reject) =>
        request.post(
            'identity/reauthenticate',
            {
                'acting_as_id': user.id,
                'password': password
            }
        )
            .then(
                data => _handleErrors(fn, data, reject) || resolve(data),
                err => reject(err)
            )
    );
}

// ******************************

function _getCartItems(user) {
    let fn = '_getCartItems';

    return new Promise((resolve, reject) =>
        request.post(
            'cart/get',
            {
                'acting_as_id': user.id
            }
        )
            .then(
                data => _handleErrors(fn, data, reject) || resolve(data),
                err => reject(err)
            )
    );
}

// ******************************

function _handleErrors(fn, data, reject) {
    if (data.errors) {
        let errorsString = Object.keys(data.errors)
            .reduce((str, key) => str + (str ? ', ' : '') + `(${key}: ${data.errors[key].join(', ')})`, '');

        reject(`[${fn}] ${data.type}: ${errorsString}`);
        return true;
    }

    return false;
}

// // ******************************

// function _dd(data) {
//     cprint.white(JSON.stringify(data));
//     return data;
// }

// ******************************
// Exports:
// ******************************

module.exports['addCartItem'] = addCartItem;
module.exports['clearCart'] = clearCart;
module.exports['confirmCart'] = confirmCart;
module.exports['getFundInvestmentInfo'] = getFundInvestmentInfo;
module.exports['getFunds'] = getFunds;
module.exports['getFundsCleaned'] = getFundsCleaned;
module.exports['getInfo'] = getInfo;
module.exports['getMarketPricesAverage'] = getMarketPricesAverage;
module.exports['getNormalizedValues'] = getNormalizedValues;
module.exports['getStats'] = getStats;
module.exports['getTransactions'] = getTransactions;
module.exports['login'] = login;
module.exports['printFundInvestmentInfo'] = printFundInvestmentInfo;
module.exports['sellFund'] = sellFund;

// ******************************
