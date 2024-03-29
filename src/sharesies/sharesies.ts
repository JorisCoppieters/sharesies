import Promise from 'bluebird';
import * as cache from '../_common/ts/cache/cache';
import { cached, clearAll } from '../_common/ts/cache/cache';
import * as request from '../_common/ts/network/request';
import { forEachThen } from '../_common/ts/system/array';
import { curDateStamp, getDateStampRange } from '../_common/ts/system/date';
import { getOrderedValues } from '../_common/ts/system/dict';
import { leftPad, rightPad } from '../_common/ts/system/string';
import { CartItem } from './models/cart-item';
import { Fund } from './models/fund';
import { FundHistory } from './models/fund-history';
import { FundInfo } from './models/fund-info';
import { User } from './models/user';

const cprint = require('color-print');

// ******************************
// Constants:
// ******************************

const MARKET_FEE_THRESHOLD = 3000;
const REQUESTS_PAUSE = 50;

// ******************************
// Declarations:
// ******************************

export function clearCache() {
    return clearAll();
}

// ******************************

export function getInfo() {
    let fn = 'getInfo';
    return cached(
        () =>
            new Promise((resolve, reject) =>
                request.get('identity/check', {}).then(
                    (data) =>
                        _handleErrors(fn, data, reject) ||
                        resolve({
                            user: data.user,
                            funds: data.portfolio,
                            orders: data.orders,
                            value: data.portfolio_value,
                        }),
                    (err) => reject(err)
                )
            ),
        'SHARESIES_INFO_2',
        cache.H * 1
    );
}

// ******************************

export function getStats(user: User) {
    let fn = 'getStats';

    return cache.cached(
        () =>
            new Promise((resolve, reject) =>
                request
                    .get('accounting/stats-v3', {
                        acting_as_id: user.id,
                    })
                    .then(
                        (data) => _handleErrors(fn, data, reject) || resolve(data.stats),
                        (err) => reject(err)
                    )
            ),
        'SHARESIES_STATS',
        cache.H * 1
    );
}

// ******************************

export function getTransactions(user: User) {
    let fn = 'getTransactions';
    let limit = 100;

    return cache.cached(
        () =>
            new Promise((resolve, reject) =>
                request
                    .get('accounting/transaction-history', {
                        acting_as_id: user.id,
                        limit: limit,
                    })
                    .then(
                        (data) => _handleErrors(fn, data, reject) || resolve(data.transactions),
                        (err) => reject(err)
                    )
            ),
        `SHARESIES_TRANSACTIONS_${limit}`,
        cache.H * 1
    );
}

// ******************************

export function clearCart(user: User) {
    let fn = 'clearCart';

    return new Promise((resolve, reject) =>
        _getCartItems(user).then((data) => {
            let resolveAll: Promise<any>[] = [];
            if (_handleErrors(fn, data, reject)) {
                return;
            }
            data.items.forEach((item) => {
                resolveAll.push(
                    request.post('cart/delete-item-v2', {
                        acting_as_id: user.id,
                        cart_item_id: item.cart_item_id,
                    })
                );
            });
            return Promise.all(resolveAll).then(() => resolve());
        })
    );
}

// ******************************

export function addCartItem(user: User, fund: Fund, investAmount: number) {
    let fn = 'addCartItem';

    return new Promise((resolve, reject) =>
        request
            .post('cart/add-item', {
                acting_as_id: user.id,
                fund_id: fund.id,
                amount: investAmount,
            })
            .then(
                (data) => _handleErrors(fn, data, reject) || resolve(data),
                (err) => reject(err)
            )
    );
}

// ******************************

export function sellFund(user: User, fund: Fund, sharesAmount: number) {
    let fn = 'sellFund';

    return new Promise((resolve, reject) =>
        request
            .post('fund/sell', {
                acting_as_id: user.id,
                fund_id: fund.id,
                shares: sharesAmount,
            })
            .then(
                (data) => _handleErrors(fn, data, reject) || resolve(data),
                (err) => reject(err)
            )
    );
}

// ******************************

export function confirmCart(user: User, password: string) {
    let fn = 'confirmCart';

    return new Promise((resolve, reject) =>
        _reauthenticate(user, password)
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
                    .then(
                        (data) => _handleErrors(fn, data, reject) || resolve(data),
                        (err) => reject(err)
                    );
            })
    );
}

// ******************************

export function getFundsCleaned() {
    return getFundsWithDailyPrices().then((funds: Fund[]) => {
        let dateKeys = getDateStampRange(730).reverse();

        return forEachThen(funds, (fund: Fund) => {
            let consistentDayPrices: { [key: string]: any } = {};
            if (!fund.day_prices) {
                throw new Error(`Day prices isn't set on fund ${fund.code}`);
            }
            let dayPrices = fund.day_prices;
            let firstPrice = getOrderedValues(dayPrices, parseFloat)[0];

            let prevDateKey: string = '';
            dateKeys.forEach((dateKey: string) => {
                if (!dayPrices[dateKey] && consistentDayPrices[prevDateKey]) {
                    consistentDayPrices[dateKey] = consistentDayPrices[prevDateKey];
                } else if (dayPrices[dateKey]) {
                    consistentDayPrices[dateKey] = dayPrices[dateKey];
                } else if (!consistentDayPrices.length) {
                    consistentDayPrices[dateKey] = firstPrice;
                }
                prevDateKey = dateKey;
            });

            fund.day_prices = consistentDayPrices;
        }).then(() => Promise.resolve(funds));
    });
}

// ******************************

export function getFundsWithDailyPrices(): Promise<Fund[]> {
    return getFunds().then((funds: Fund[]) => forEachThen(funds, (fund: Fund) => getHistoryForFund(fund)).then((_) => funds));
}

// ******************************

export function getFunds(): Promise<Fund[]> {
    return cache.cached(
        () =>
            new Promise((resolve, reject) =>
                request.get('fund/list', {}).then(
                    (data) => resolve(data['funds'].filter((fund: Fund) => ['NZB', '450002', '450007'].indexOf(fund.code) < 0)),
                    (err) => reject(err)
                )
            ),
        `SHARESIES_FUNDS`,
        cache.HOUR * 2
    );
}

// ******************************

export function getHistoryForFund(in_fund: Fund): Promise<Fund> {
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth() + 1;
    const curDate = curDateStamp();
    const results: Array<FundHistory> = [];
    let requestObjects: Array<{
        fund: Fund;
        year: number;
        month: number;
    }> = [];

    const monthsAgo = 13;
    [...Array(monthsAgo)]
        .map((_, idx) => idx)
        .reverse()
        .forEach((minusMonth) => {
            let year = curYear;
            let month = curMonth - minusMonth;
            while (month <= 0) {
                year--;
                month += 12;
            }
            requestObjects.push({
                fund: in_fund,
                year: year,
                month: month,
            });
        });

    return forEachThen(requestObjects, (requestObject: { fund: Fund; year: number; month: number }) => {
        if (requestObject.year === curYear && requestObject.month === curMonth) {
            return getHistoryForFundOnCurrentMonth(requestObject.fund, requestObject.year, requestObject.month).then((result) => results.push(result));
        }
        return getHistoryForFundOnMonth(requestObject.fund, requestObject.year, requestObject.month).then((result) => results.push(result));
    }).then(() => {
        const allDayPrices = results.reduce((allDayPrices: { [key: string]: string }, fund: FundHistory) => Object.assign(allDayPrices, fund.day_prices || {}), {});
        allDayPrices[curDate] = `${in_fund.market_price}`;
        in_fund.day_prices = allDayPrices;
        return in_fund;
    });
}

// ******************************

export function getHistoryForFundOnMonth(in_fund: Fund, in_year: number, in_month: number): Promise<FundHistory> {
    let firstDateStamp = `${in_year}-${leftPad(`${in_month}`, '0', 2)}-01`;

    let nextYear = in_year;
    let nextMonth = in_month + 1;
    if (nextMonth === 13) {
        nextMonth = 1;
        nextYear = in_year + 1;
    }
    let lastDateStamp = `${nextYear}-${leftPad(`${nextMonth}`, '0', 2)}-01`;

    return cache.cached(
        () =>
            new Promise((resolve) => {
                console.log(`Requesting fund history for ${in_fund.name} at ${in_month}/${in_year}...`);
                setTimeout(() => {
                    return request
                        .get('fund/price-history', {
                            fund_id: in_fund.id,
                            first: firstDateStamp,
                            last: lastDateStamp,
                        })
                        .then((result) => resolve(result));
                }, REQUESTS_PAUSE);
            }),
        `SHARESIES_FUND_HISTORY_${in_fund.id}_${firstDateStamp}_${lastDateStamp}`,
        -1
    );
}

// ******************************

export function getHistoryForFundOnCurrentMonth(in_fund: Fund, in_year: number, in_month: number): Promise<FundHistory> {
    let firstDateStamp = `${in_year}-${leftPad(`${in_month}`, '0', 2)}-01`;

    let nextMonth = in_month + 1;
    if (nextMonth === 13) {
        nextMonth = 1;
    }

    return cache.cached(
        () =>
            new Promise((resolve) => {
                console.log(`Requesting fund history for ${in_fund.name} at current month...`);
                setTimeout(() => {
                    return request
                        .get('fund/price-history', {
                            fund_id: in_fund.id,
                            first: firstDateStamp,
                        })
                        .then((result) => resolve(result));
                }, REQUESTS_PAUSE);
            }),
        `SHARESIES_FUND_HISTORY_${in_fund.id}_${firstDateStamp}`,
        cache.H * 2
    );
}

// ******************************

export function getMarketPricesAverage(in_funds: Fund[]): number[] {
    return in_funds
        .reduce((marketPricesSum: number[], fund: Fund) => {
            let fundPrices = getOrderedValues(fund.day_prices, parseFloat);
            return marketPricesSum.length ? marketPricesSum.map((val, idx) => val + fundPrices[idx]) : fundPrices;
        }, [])
        .map((val) => val / in_funds.length);
}

// ******************************

export function getNormalizedValues(in_values: number[]): number[] {
    let minValue = Math.min.apply(null, in_values);
    let maxValue = Math.max.apply(null, in_values);
    let valueRange = maxValue - minValue;

    if (valueRange === 0) {
        return in_values.map((_) => 0);
    }
    return in_values.map((value) => (value - minValue) / valueRange);
}

// ******************************

export function getFundInvestmentInfo(fund: Fund, marketPricesNormalized: number[]): FundInfo {
    let code = fund.code;

    let fundPrices = getOrderedValues(fund.day_prices, parseFloat) as number[];
    let fundPricesNormalized = getNormalizedValues(fundPrices);

    let minPrice = Math.min.apply(null, fundPrices);
    let maxPrice = Math.max.apply(null, fundPrices);
    let priceRange = maxPrice - minPrice;
    let priceSum = fundPrices.reduce((sum, val) => sum + val, 0);
    let priceCount = fundPrices.length;
    let avgPrice = priceSum / priceCount;

    // let priceDiff = minPrice === 0 ? 1 : maxPrice / minPrice - 1;

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

    let marketVariability = fundPricesNormalized.map((price, idx) => Math.abs(price - marketPricesNormalized[idx])).reduce((sum, price) => sum + price, 0) / fundPricesNormalized.length;

    let priceGainPotential = currentNormalizedMarketPrice - currentNormalizedPrice;

    let score = 1;
    score += priceGainPotential * 5; // Weight towards how much below the market line current price is
    score -= marketVariability * 8; // Weight away how different line is to market line
    // score += growth * 2; // Weight towards positive growth over the last 20 price points
    // score += (priceDiff / 100); // Weight towards big price differences

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
    } as FundInfo;
}

// ******************************

export function printFundInvestmentInfo(fund: Fund, marketPricesNormalized: number[]) {
    let code = rightPad(fund.code, ' ', 3);
    let info = getFundInvestmentInfo(fund, marketPricesNormalized);

    let rangePositionColorFn = cprint.toRed;
    if (info.currentNormalizedPrice < 0.5) {
        rangePositionColorFn = cprint.toGreen;
    } else if (info.currentNormalizedPrice < 0.75) {
        rangePositionColorFn = cprint.toYellow;
    }

    let isWin = process.platform === 'win32';
    let lightGreyFn = (str: string) => cprint.toLightGrey(str);
    if (!isWin) {
        lightGreyFn = (str: string) => cprint.toWhite(str);
    }

    let rangePercentageStr = leftPad((info.currentNormalizedPrice * 100).toFixed(2), ' ', 6) + '%';
    let infoRange = `${cprint.toCyan(leftPad('$' + info.minPrice.toFixed(2), ' ', 5))} ${lightGreyFn('<==')} ${rangePositionColorFn(
        leftPad('$' + info.currentPrice.toFixed(2), ' ', 5) + ' [' + rangePercentageStr + ']'
    )} ${lightGreyFn('==>')} ${cprint.toCyan(leftPad('$' + info.maxPrice.toFixed(2), ' ', 5))}`;

    let priceRange = info.priceRange;
    let priceDiff = (100 * info.maxPrice) / info.minPrice - 100;
    if (info.minPrice === 0) {
        priceDiff = 100;
    }

    let priceDiffStr = leftPad(priceDiff.toFixed(2), ' ', 6);

    let diffColorFn = cprint.toRed;
    if (priceDiff > 50) {
        diffColorFn = cprint.toGreen;
    } else if (priceDiff > 20) {
        diffColorFn = cprint.toYellow;
    }

    let differenceStr = leftPad('$' + priceRange.toFixed(2), ' ', 6) + ' (' + priceDiffStr + '%)';
    let infoDifference = `${cprint.toWhite('diff:')} ${diffColorFn(differenceStr)}`;

    let growthColorFn = cprint.toRed;
    if (info.growth > 0.3) {
        growthColorFn = cprint.toGreen;
    } else if (info.growth > 0.0) {
        growthColorFn = cprint.toYellow;
    }

    let growthStr = leftPad(info.growth.toFixed(2), ' ', 5);
    let infoGrowth = `${cprint.toWhite('growth:')} ${growthColorFn(growthStr)}`;

    let priceGainPotentialColorFn = cprint.toRed;
    if (info.priceGainPotential > 0.1) {
        priceGainPotentialColorFn = cprint.toGreen;
    } else if (info.priceGainPotential > 0.0) {
        priceGainPotentialColorFn = cprint.toYellow;
    }

    let priceGainPotentialStr = leftPad(info.priceGainPotential.toFixed(2), ' ', 5);
    let infoPriceGainPotential = `${cprint.toWhite('pot:')} ${priceGainPotentialColorFn(priceGainPotentialStr)}`;

    let marketVariabilityColorFn = cprint.toGreen;
    if (info.marketVariability > 0.4) {
        marketVariabilityColorFn = cprint.toRed;
    } else if (info.marketVariability > 0.2) {
        marketVariabilityColorFn = cprint.toYellow;
    }

    let marketVariabilityStr = leftPad(info.marketVariability.toFixed(2), ' ', 5);
    let infoMarketVariability = `${cprint.toWhite('var:')} ${marketVariabilityColorFn(marketVariabilityStr)}`;

    let scoreColorFn = cprint.toRed;
    if (info.score > 0.8) {
        scoreColorFn = cprint.toGreen;
    } else if (info.score > 0.2) {
        scoreColorFn = cprint.toYellow;
    }

    let scoreStr = leftPad(info.score.toFixed(2), ' ', 5);
    let infoScore = `${cprint.toWhite('score:')} ${scoreColorFn(scoreStr)}`;

    let parts = [cprint.toGreen(code), infoRange, infoMarketVariability, infoPriceGainPotential, infoGrowth, infoDifference, infoScore];

    process.stdout.write(parts.join('   ') + '\n');
}

// ******************************

export function login(username: string, password: string) {
    let fn = 'login';

    return new Promise((resolve, reject) =>
        request
            .post('identity/login', {
                email: username,
                password: password,
                remember: true,
            })
            .then(
                (data) => _handleErrors(fn, data, reject) || resolve(data),
                (err) => reject(err)
            )
    );
}

// ******************************
// Helper Functions:
// ******************************

export function _amountOfMarketBuyFee(amount: string, fundType: string) {
    if (fundType !== 'company') {
        return 0;
    }

    if (parseFloat(amount) < MARKET_FEE_THRESHOLD) {
        return parseFloat(amount) * 0.005;
    }

    return MARKET_FEE_THRESHOLD * 0.005 + (parseFloat(amount) - MARKET_FEE_THRESHOLD) * 0.001;
}

// ******************************

export function _reauthenticate(user: User, password: string) {
    let fn = '_reauthenticate';

    return new Promise((resolve, reject) =>
        request
            .post('identity/reauthenticate', {
                acting_as_id: user.id,
                password: password,
            })
            .then(
                (data) => _handleErrors(fn, data, reject) || resolve(data),
                (err) => reject(err)
            )
    );
}

// ******************************

export function _getCartItems(user: User): Promise<{ items: CartItem[] }> {
    let fn = '_getCartItems';

    return new Promise((resolve, reject) =>
        request
            .post('cart/get', {
                acting_as_id: user.id,
            })
            .then(
                (data) => _handleErrors(fn, data, reject) || resolve(data),
                (err) => reject(err)
            )
    );
}

// ******************************

export function _handleErrors(fn: string, data: any, reject: Function) {
    if (data.errors) {
        let errorsString = Object.keys(data.errors).reduce((str, key) => str + (str ? ', ' : '') + `(${key}: ${data.errors[key].join(', ')})`, '');

        reject(`[${fn}] ${data.type}: ${errorsString}`);
        return true;
    }

    return false;
}

// ******************************
