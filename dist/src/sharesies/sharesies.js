"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports._handleErrors = exports._getCartItems = exports._reauthenticate = exports._amountOfMarketBuyFee = exports.login = exports.printFundInvestmentInfo = exports.getFundInvestmentInfo = exports.getNormalizedValues = exports.getMarketPricesAverage = exports.getHistoryForFundOnCurrentMonth = exports.getHistoryForFundOnMonth = exports.getHistoryForFund = exports.getFunds = exports.getFundsWithDailyPrices = exports.getFundsCleaned = exports.confirmCart = exports.sellFund = exports.addCartItem = exports.clearCart = exports.getTransactions = exports.getStats = exports.getInfo = exports.clearCache = void 0;
const cache_1 = require("../_common/ts/cache/cache");
const date_1 = require("../_common/ts/system/date");
const array_1 = require("../_common/ts/system/array");
const dict_1 = require("../_common/ts/system/dict");
const string_1 = require("../_common/ts/system/string");
const cache = __importStar(require("../_common/ts/cache/cache"));
const request = __importStar(require("../_common/ts/network/request"));
const bluebird_1 = __importDefault(require("bluebird"));
const cprint = require('color-print');
const MARKET_FEE_THRESHOLD = 3000;
function clearCache() {
    return cache_1.clearAll();
}
exports.clearCache = clearCache;
function getInfo() {
    let fn = 'getInfo';
    return cache_1.cached(() => new bluebird_1.default((resolve, reject) => request.get('identity/check', {}).then((data) => _handleErrors(fn, data, reject) ||
        resolve({
            user: data.user,
            funds: data.portfolio,
            orders: data.orders,
            value: data.portfolio_value,
        }), (err) => reject(err))), 'SHARESIES_INFO_2', cache.H * 1);
}
exports.getInfo = getInfo;
function getStats(user) {
    let fn = 'getStats';
    return cache.cached(() => new bluebird_1.default((resolve, reject) => request
        .get('accounting/stats-v3', {
        acting_as_id: user.id,
    })
        .then((data) => _handleErrors(fn, data, reject) || resolve(data.stats), (err) => reject(err))), 'SHARESIES_STATS', cache.H * 1);
}
exports.getStats = getStats;
function getTransactions(user) {
    let fn = 'getTransactions';
    let limit = 100;
    return cache.cached(() => new bluebird_1.default((resolve, reject) => request
        .get('accounting/transaction-history', {
        acting_as_id: user.id,
        limit: limit,
    })
        .then((data) => _handleErrors(fn, data, reject) || resolve(data.transactions), (err) => reject(err))), `SHARESIES_TRANSACTIONS_${limit}`, cache.H * 1);
}
exports.getTransactions = getTransactions;
function clearCart(user) {
    let fn = 'clearCart';
    return new bluebird_1.default((resolve, reject) => _getCartItems(user).then((data) => {
        let resolveAll = [];
        if (_handleErrors(fn, data, reject)) {
            return;
        }
        data.items.forEach((item) => {
            resolveAll.push(request.post('cart/delete-item-v2', {
                acting_as_id: user.id,
                cart_item_id: item.cart_item_id,
            }));
        });
        return bluebird_1.default.all(resolveAll).then(() => resolve());
    }));
}
exports.clearCart = clearCart;
function addCartItem(user, fund, investAmount) {
    let fn = 'addCartItem';
    return new bluebird_1.default((resolve, reject) => request
        .post('cart/add-item', {
        acting_as_id: user.id,
        fund_id: fund.id,
        amount: investAmount,
    })
        .then((data) => _handleErrors(fn, data, reject) || resolve(data), (err) => reject(err)));
}
exports.addCartItem = addCartItem;
function sellFund(user, fund, sharesAmount) {
    let fn = 'sellFund';
    return new bluebird_1.default((resolve, reject) => request
        .post('fund/sell', {
        acting_as_id: user.id,
        fund_id: fund.id,
        shares: sharesAmount,
    })
        .then((data) => _handleErrors(fn, data, reject) || resolve(data), (err) => reject(err)));
}
exports.sellFund = sellFund;
function confirmCart(user, password) {
    let fn = 'confirmCart';
    return new bluebird_1.default((resolve, reject) => _reauthenticate(user, password)
        .then(() => _getCartItems(user))
        .then((data) => {
        let orders = data.items.map((item) => {
            return {
                amount: item.amount,
                fund_id: item.fund.id,
            };
        });
        let expected_fee = data.items.reduce((sum, item) => sum + _amountOfMarketBuyFee(`${item.amount}`, item.fund.fund_type), 0);
        console.log({
            acting_as_id: user.id,
            order: orders,
            action: 'cost',
            expected_fee: Math.round(expected_fee * Math.pow(10, 8)) / Math.pow(10, 8),
        });
        return;
        return request
            .post('cart/buy-v2', {
            acting_as_id: user.id,
            order: orders,
            action: 'cost',
            expected_fee: expected_fee,
        })
            .then((data) => _handleErrors(fn, data, reject) || resolve(data), (err) => reject(err));
    }));
}
exports.confirmCart = confirmCart;
function getFundsCleaned() {
    return getFundsWithDailyPrices().then((funds) => {
        let dateKeys = date_1.getDateStampRange(730).reverse();
        return array_1.forEachThen(funds, (fund) => {
            let consistentDayPrices = {};
            let dayPrices = fund.day_prices;
            let firstPrice = dict_1.getOrderedValues(dayPrices, parseFloat)[0];
            let prevDateKey = '';
            dateKeys.forEach((dateKey) => {
                if (!dayPrices[dateKey] && consistentDayPrices[prevDateKey]) {
                    consistentDayPrices[dateKey] = consistentDayPrices[prevDateKey];
                }
                else if (dayPrices[dateKey]) {
                    consistentDayPrices[dateKey] = dayPrices[dateKey];
                }
                else if (!consistentDayPrices.length) {
                    consistentDayPrices[dateKey] = firstPrice;
                }
                prevDateKey = dateKey;
            });
            fund.day_prices = consistentDayPrices;
        }).then(() => bluebird_1.default.resolve(funds));
    });
}
exports.getFundsCleaned = getFundsCleaned;
function getFundsWithDailyPrices() {
    return getFunds().then((funds) => array_1.forEachThen(funds, (fund) => getHistoryForFund(fund)).then((_) => funds));
}
exports.getFundsWithDailyPrices = getFundsWithDailyPrices;
function getFunds() {
    return cache.cached(() => new bluebird_1.default((resolve, reject) => request.get('fund/list', {}).then((data) => resolve(data['funds'].filter((fund) => ['NZB', '450002', '450007'].indexOf(fund.code) < 0)), (err) => reject(err))), `SHARESIES_FUNDS`, cache.HOUR * 2);
}
exports.getFunds = getFunds;
function getHistoryForFund(in_fund) {
    const promises = [];
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth() + 1;
    const curDate = date_1.curDateStamp();
    const yearsAgo = 2;
    [...Array(yearsAgo)]
        .map((_, idx) => curYear - (idx + 1))
        .reverse()
        .forEach((year) => {
        [...Array(12)]
            .map((_, idx) => idx + 1)
            .forEach((month) => {
            promises.push(getHistoryForFundOnMonth(in_fund, year, month));
        });
    });
    if (curMonth > 1) {
        [...Array(curMonth - 1)]
            .map((_, idx) => idx + 1)
            .forEach((month) => {
            promises.push(getHistoryForFundOnMonth(in_fund, curYear, month));
        });
    }
    promises.push(getHistoryForFundOnCurrentMonth(in_fund, curYear, curMonth));
    return bluebird_1.default.all(promises).then((results) => {
        const allDayPrices = results.reduce((allDayPrices, fund) => {
            return Object.assign(allDayPrices, fund.day_prices);
        }, {});
        allDayPrices[curDate] = `${in_fund.market_price}`;
        in_fund.day_prices = allDayPrices;
        return in_fund;
    });
}
exports.getHistoryForFund = getHistoryForFund;
function getHistoryForFundOnMonth(in_fund, in_year, in_month) {
    let firstDateStamp = `${in_year}-${string_1.leftPad(`${in_month}`, '0', 2)}-01`;
    let nextYear = in_year;
    let nextMonth = in_month + 1;
    if (nextMonth === 13) {
        nextMonth = 1;
        nextYear = in_year + 1;
    }
    let lastDateStamp = `${nextYear}-${string_1.leftPad(`${nextMonth}`, '0', 2)}-01`;
    return cache.cached(() => request.get('fund/price-history', {
        fund_id: in_fund.id,
        first: firstDateStamp,
        last: lastDateStamp,
    }), `SHARESIES_FUND_HISTORY_${in_fund.id}_${firstDateStamp}_${lastDateStamp}`, -1);
}
exports.getHistoryForFundOnMonth = getHistoryForFundOnMonth;
function getHistoryForFundOnCurrentMonth(in_fund, in_year, in_month) {
    let firstDateStamp = `${in_year}-${string_1.leftPad(`${in_month}`, '0', 2)}-01`;
    let nextMonth = in_month + 1;
    if (nextMonth === 13) {
        nextMonth = 1;
    }
    return cache.cached(() => request.get('fund/price-history', {
        fund_id: in_fund.id,
        first: firstDateStamp,
    }), `SHARESIES_FUND_HISTORY_${in_fund.id}_${firstDateStamp}`, cache.H * 2);
}
exports.getHistoryForFundOnCurrentMonth = getHistoryForFundOnCurrentMonth;
function getMarketPricesAverage(in_funds) {
    return in_funds
        .reduce((marketPricesSum, fund) => {
        let fundPrices = dict_1.getOrderedValues(fund.day_prices, parseFloat);
        return marketPricesSum.length ? marketPricesSum.map((val, idx) => val + fundPrices[idx]) : fundPrices;
    }, [])
        .map((val) => val / in_funds.length);
}
exports.getMarketPricesAverage = getMarketPricesAverage;
function getNormalizedValues(in_values) {
    let minValue = Math.min.apply(null, in_values);
    let maxValue = Math.max.apply(null, in_values);
    let valueRange = maxValue - minValue;
    if (valueRange === 0) {
        return in_values.map((_) => 0);
    }
    return in_values.map((value) => (value - minValue) / valueRange);
}
exports.getNormalizedValues = getNormalizedValues;
function getFundInvestmentInfo(fund, marketPricesNormalized) {
    let code = fund.code;
    let fundPrices = dict_1.getOrderedValues(fund.day_prices, parseFloat);
    let fundPricesNormalized = getNormalizedValues(fundPrices);
    let minPrice = Math.min.apply(null, fundPrices);
    let maxPrice = Math.max.apply(null, fundPrices);
    let priceRange = maxPrice - minPrice;
    let priceSum = fundPrices.reduce((sum, val) => sum + val, 0);
    let priceCount = fundPrices.length;
    let avgPrice = priceSum / priceCount;
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
    let marketVariability = fundPricesNormalized.map((price, idx) => Math.abs(price - marketPricesNormalized[idx])).reduce((sum, price) => sum + price, 0) /
        fundPricesNormalized.length;
    let priceGainPotential = currentNormalizedMarketPrice - currentNormalizedPrice;
    let score = 1;
    score += priceGainPotential * 4.5;
    score -= marketVariability * 6;
    score += growth * 2;
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
        priceGainPotential,
        growth,
        score,
    };
}
exports.getFundInvestmentInfo = getFundInvestmentInfo;
function printFundInvestmentInfo(fund, marketPricesNormalized) {
    let code = string_1.rightPad(fund.code, ' ', 3);
    let info = getFundInvestmentInfo(fund, marketPricesNormalized);
    let rangePositionColorFn = cprint.toRed;
    if (info.currentNormalizedPrice < 0.5) {
        rangePositionColorFn = cprint.toGreen;
    }
    else if (info.currentNormalizedPrice < 0.75) {
        rangePositionColorFn = cprint.toYellow;
    }
    let isWin = process.platform === 'win32';
    let lightGreyFn = (str) => cprint.toLightGrey(str);
    if (!isWin) {
        lightGreyFn = (str) => cprint.toWhite(str);
    }
    let rangePercentageStr = string_1.leftPad((info.currentNormalizedPrice * 100).toFixed(2), ' ', 6) + '%';
    let infoRange = `${cprint.toCyan(string_1.leftPad('$' + info.minPrice.toFixed(2), ' ', 5))} ${lightGreyFn('<==')} ${rangePositionColorFn(string_1.leftPad('$' + info.currentPrice.toFixed(2), ' ', 5) + ' [' + rangePercentageStr + ']')} ${lightGreyFn('==>')} ${cprint.toCyan(string_1.leftPad('$' + info.maxPrice.toFixed(2), ' ', 5))}`;
    let priceRange = info.priceRange;
    let priceDiff = (100 * info.maxPrice) / info.minPrice - 100;
    if (info.minPrice === 0) {
        priceDiff = 100;
    }
    let priceDiffStr = string_1.leftPad(priceDiff.toFixed(2), ' ', 6);
    let diffColorFn = cprint.toRed;
    if (priceDiff > 50) {
        diffColorFn = cprint.toGreen;
    }
    else if (priceDiff > 20) {
        diffColorFn = cprint.toYellow;
    }
    let differenceStr = string_1.leftPad('$' + priceRange.toFixed(2), ' ', 6) + ' (' + priceDiffStr + '%)';
    let infoDifference = `${cprint.toWhite('diff:')} ${diffColorFn(differenceStr)}`;
    let growthColorFn = cprint.toRed;
    if (info.growth > 0.3) {
        growthColorFn = cprint.toGreen;
    }
    else if (info.growth > 0.0) {
        growthColorFn = cprint.toYellow;
    }
    let growthStr = string_1.leftPad(info.growth.toFixed(2), ' ', 5);
    let infoGrowth = `${cprint.toWhite('growth:')} ${growthColorFn(growthStr)}`;
    let priceGainPotentialColorFn = cprint.toRed;
    if (info.priceGainPotential > 0.1) {
        priceGainPotentialColorFn = cprint.toGreen;
    }
    else if (info.priceGainPotential > 0.0) {
        priceGainPotentialColorFn = cprint.toYellow;
    }
    let priceGainPotentialStr = string_1.leftPad(info.priceGainPotential.toFixed(2), ' ', 5);
    let infoPriceGainPotential = `${cprint.toWhite('pot:')} ${priceGainPotentialColorFn(priceGainPotentialStr)}`;
    let marketVariabilityColorFn = cprint.toGreen;
    if (info.marketVariability > 0.4) {
        marketVariabilityColorFn = cprint.toRed;
    }
    else if (info.marketVariability > 0.2) {
        marketVariabilityColorFn = cprint.toYellow;
    }
    let marketVariabilityStr = string_1.leftPad(info.marketVariability.toFixed(2), ' ', 5);
    let infoMarketVariability = `${cprint.toWhite('var:')} ${marketVariabilityColorFn(marketVariabilityStr)}`;
    let scoreColorFn = cprint.toRed;
    if (info.score > 0.8) {
        scoreColorFn = cprint.toGreen;
    }
    else if (info.score > 0.2) {
        scoreColorFn = cprint.toYellow;
    }
    let scoreStr = string_1.leftPad(info.score.toFixed(2), ' ', 5);
    let infoScore = `${cprint.toWhite('score:')} ${scoreColorFn(scoreStr)}`;
    let parts = [cprint.toGreen(code), infoRange, infoMarketVariability, infoPriceGainPotential, infoGrowth, infoDifference, infoScore];
    process.stdout.write(parts.join('   ') + '\n');
}
exports.printFundInvestmentInfo = printFundInvestmentInfo;
function login(username, password) {
    let fn = 'login';
    return new bluebird_1.default((resolve, reject) => request
        .post('identity/login', {
        email: username,
        password: password,
        remember: true,
    })
        .then((data) => _handleErrors(fn, data, reject) || resolve(data), (err) => reject(err)));
}
exports.login = login;
function _amountOfMarketBuyFee(amount, fundType) {
    if (fundType !== 'company') {
        return 0;
    }
    if (parseFloat(amount) < MARKET_FEE_THRESHOLD) {
        return parseFloat(amount) * 0.005;
    }
    return MARKET_FEE_THRESHOLD * 0.005 + (parseFloat(amount) - MARKET_FEE_THRESHOLD) * 0.001;
}
exports._amountOfMarketBuyFee = _amountOfMarketBuyFee;
function _reauthenticate(user, password) {
    let fn = '_reauthenticate';
    return new bluebird_1.default((resolve, reject) => request
        .post('identity/reauthenticate', {
        acting_as_id: user.id,
        password: password,
    })
        .then((data) => _handleErrors(fn, data, reject) || resolve(data), (err) => reject(err)));
}
exports._reauthenticate = _reauthenticate;
function _getCartItems(user) {
    let fn = '_getCartItems';
    return new bluebird_1.default((resolve, reject) => request
        .post('cart/get', {
        acting_as_id: user.id,
    })
        .then((data) => _handleErrors(fn, data, reject) || resolve(data), (err) => reject(err)));
}
exports._getCartItems = _getCartItems;
function _handleErrors(fn, data, reject) {
    if (data.errors) {
        let errorsString = Object.keys(data.errors).reduce((str, key) => str + (str ? ', ' : '') + `(${key}: ${data.errors[key].join(', ')})`, '');
        reject(`[${fn}] ${data.type}: ${errorsString}`);
        return true;
    }
    return false;
}
exports._handleErrors = _handleErrors;
