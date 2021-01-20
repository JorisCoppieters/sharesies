#!/usr/bin/env node
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const sharesies_1 = require("./src/sharesies/sharesies");
const print = __importStar(require("./src/_common/ts/env/server/print"));
const credentials_1 = require("./src/_common/ts/security/credentials");
const readline_1 = require("./src/_common/ts/system/readline");
const cprint = require('color-print');
const BUY_SCORE_THRESHOLD = 3.0;
const SELL_SCORE_THRESHOLD = 2.5;
const MIN_FUND_ALLOCATION = 5;
const DISTRIBUTION_MAGNITUDE = 2;
const EXPLORATORY_RATIO = 0.5;
const MAX_FUNDS_FOR_BUY = 20;
const MAX_FUNDS_FOR_SCORES = 20;
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        _printTitleHeader('SHARESIES');
        cprint.cyan('Loading...');
        if (!credentials_1.getCredentials('username')) {
            credentials_1.setCredentials('username', readline_1.readLineSync('Please enter your username').trim());
        }
        if (!credentials_1.getCredentials('password')) {
            credentials_1.setCredentials('password', readline_1.readHiddenLineSync('Please enter your password').trim());
        }
        let loginData = (yield sharesies_1.login(credentials_1.getCredentials('username'), credentials_1.getCredentials('password')));
        credentials_1.saveCredentials();
        let user = loginData.user;
        let sharesiesInfo = yield sharesies_1.getInfo();
        let sharesiesStats = yield sharesies_1.getStats(user);
        let funds = (yield sharesies_1.getFundsCleaned());
        let marketPricesAverage = sharesies_1.getMarketPricesAverage(funds);
        let marketPricesNormalized = sharesies_1.getNormalizedValues(marketPricesAverage);
        let sortedFunds = funds
            .map((fund) => {
            return {
                id: fund.id,
                code: fund.code,
                fund,
                info: sharesies_1.getFundInvestmentInfo(fund, marketPricesNormalized),
            };
        })
            .sort((a, b) => a.info.score - b.info.score);
        let sortedFundsToBuy = sortedFunds.filter((fundExtended) => fundExtended.info.score >= BUY_SCORE_THRESHOLD).reverse();
        if (sortedFundsToBuy.length) {
            _printSectionHeader('Buy Scores');
            sortedFundsToBuy.filter((_, idx) => idx < MAX_FUNDS_FOR_SCORES).forEach((fundInfo) => sharesies_1.printFundInvestmentInfo(fundInfo.fund, marketPricesNormalized));
        }
        let sortedFundsToSell = sortedFunds.filter((fundExtended) => fundExtended.info.score < BUY_SCORE_THRESHOLD).reverse();
        if (sortedFundsToSell.length) {
            _printSectionHeader('Sell Scores');
            sortedFundsToSell.filter((_, idx) => idx < MAX_FUNDS_FOR_SCORES).forEach((fundInfo) => sharesies_1.printFundInvestmentInfo(fundInfo.fund, marketPricesNormalized));
        }
        let walletBalance = 0;
        if (sharesiesInfo.user['wallet_balances']) {
            walletBalance = parseFloat(sharesiesInfo.user['wallet_balances'].nzd);
        }
        else if (sharesiesInfo.user['wallet_balance']) {
            walletBalance = parseFloat(sharesiesInfo.user['wallet_balance']);
        }
        let portfolioBalance = parseFloat(sharesiesStats.total_portfolio);
        let purchaseSharesValue = sharesiesInfo.orders
            .filter((order) => order.type === 'buy')
            .map((order) => order.requested_nzd_amount)
            .reduce((total, amount) => total + parseFloat(`${amount}`), 0);
        let investmentBalance = walletBalance + portfolioBalance + purchaseSharesValue;
        let exploratoryInvestmentBalance = investmentBalance * EXPLORATORY_RATIO;
        let exploratoryInvestmentScore = sortedFundsToBuy.length
            ? sortedFundsToBuy
                .map((fundExtended) => {
                return Math.pow(fundExtended.info.score * 0.6, DISTRIBUTION_MAGNITUDE);
            })
                .reduce((scoreSum, score) => scoreSum + score, 0) / sortedFundsToBuy.length
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
        let fundsAllocated = yield autoBuyShares(sharesiesInfo, exploratoryInvestmentBalance, walletBalance, sortedFundsToBuy);
        if (fundsAllocated.boughtNew) {
            console.log('CONFIRM CART!');
        }
        yield autoSellShares(user, sharesiesInfo, sortedFundsToSell);
    });
}
main();
function autoBuyShares(sharesiesInfo, exploratoryBuyAllocation, walletBalance, sortedFunds) {
    let availableFundAllocation = walletBalance;
    let totalScore = sortedFunds.reduce((scoreSum, fundExtended) => scoreSum + fundExtended.info.score, 0);
    let adjustedFundsDistribution = sortedFunds
        .filter((_, idx) => idx <= MAX_FUNDS_FOR_BUY)
        .map((fundExtended) => fundExtended.info.score / totalScore)
        .map((score) => Math.pow(score, DISTRIBUTION_MAGNITUDE));
    let adjustedFundsDistributionSum = adjustedFundsDistribution.reduce((total, score) => total + score, 0);
    let fundsDistribution = adjustedFundsDistribution.map((score) => score / adjustedFundsDistributionSum);
    let sharesAmountByFundId = sharesiesInfo.funds.reduce((dict, fund) => {
        dict[fund.fund_id] = fund.shares;
        return dict;
    }, {});
    let fundsAllocated = {
        totalValue: 0,
        boughtNew: false,
    };
    return Promise.resolve()
        .then(() => {
        if (!sortedFunds.length) {
            return Promise.resolve(true);
        }
        return sortedFunds
            .filter((_, idx) => idx <= MAX_FUNDS_FOR_BUY)
            .reduce((resolve, fundExtended, idx) => {
            return resolve.then(() => {
                let desiredFundAllocation = fundsDistribution[idx] * exploratoryBuyAllocation;
                let sharePrice = fundExtended.info.currentPrice;
                let currentSharesAmount = parseInt(sharesAmountByFundId[fundExtended.fund.id] || 0);
                let buyingSharesAmount = sharesiesInfo.orders
                    .filter((order) => order.type === 'buy' && order.fund_id === fundExtended.fund.id)
                    .map((order) => parseInt(`${order.requested_nzd_amount / sharePrice}`))
                    .reduce((total, amount) => total + Math.ceil(amount), 0);
                currentSharesAmount += buyingSharesAmount;
                let currentSharesValue = currentSharesAmount * sharePrice;
                let desiredSharesAmount = desiredFundAllocation / sharePrice;
                if (desiredSharesAmount <= currentSharesAmount) {
                    fundsAllocated.totalValue += desiredFundAllocation;
                    print.info(`Already have ${_numberRound(desiredSharesAmount)} shares ($${desiredFundAllocation.toFixed(2)}) for ${fundExtended.fund.code} (${fundExtended.fund.name}), no more desired`);
                    return true;
                }
                if (currentSharesAmount) {
                    print.info(`Already have ${_numberRound(currentSharesAmount)} shares ($${currentSharesValue.toFixed(2)}) for ${fundExtended.fund.code} (${fundExtended.fund.name}) but investing more...`);
                }
                fundsAllocated.totalValue += currentSharesValue;
                if (isNaN(availableFundAllocation) || availableFundAllocation <= 0.01) {
                    print.warning(`Cannot invest into ${fundExtended.fund.code} (${fundExtended.fund.name}) since wallet balance is 0`);
                    return true;
                }
                let fundAllocation = Math.min(availableFundAllocation, (desiredSharesAmount - currentSharesAmount) * sharePrice);
                if (isNaN(fundAllocation) || fundAllocation < MIN_FUND_ALLOCATION) {
                    print.warning(`Cannot invest $${fundAllocation.toFixed(2)} into ${fundExtended.fund.code} (${fundExtended.fund.name}) since it will be below the minimum fund allocation $${MIN_FUND_ALLOCATION}`);
                    return true;
                }
                let sharesAmountToBuy = Math.floor(fundAllocation / sharePrice);
                fundAllocation = Math.round(sharesAmountToBuy * sharePrice * 100) / 100;
                fundsAllocated.totalValue += fundAllocation;
                print.action(`=> Auto investing ${_numberRound(sharesAmountToBuy)} shares ($${fundAllocation.toFixed(2)}) into ${fundExtended.fund.code} (${fundExtended.fund.name})`);
                availableFundAllocation -= fundAllocation;
                fundsAllocated.boughtNew = true;
                return true;
            });
        }, Promise.resolve(true));
    })
        .then(() => {
        return fundsAllocated;
    });
}
function autoSellShares(_user, sharesiesInfo, sortedFunds) {
    let portfolioFundIds = sharesiesInfo.funds.map((fund) => fund.fund_id);
    let sharesAmountByFundId = sharesiesInfo.funds.reduce((dict, fund) => {
        dict[fund.fund_id] = fund.shares;
        return dict;
    }, {});
    let returnByFundId = sharesiesInfo.funds.reduce((dict, fund) => {
        dict[fund.fund_id] = fund.return_percent;
        return dict;
    }, {});
    let totalSoldValue = 0;
    let sortedFundsInPortfolio = sortedFunds.filter((fundInfo) => portfolioFundIds.indexOf(fundInfo.fund.id) >= 0);
    return sortedFundsInPortfolio
        .sort((a, b) => a.info.score - b.info.score)
        .filter((fundExtended) => [
        'EUF',
        'NPF',
        'OZY',
        'EMF',
        'MDZ',
        'USF',
        'FNZ',
        '450005',
        'JLG',
        'HGH',
    ].indexOf(fundExtended.code) < 0)
        .reduce((resolve, fundExtended) => {
        return resolve.then(() => {
            if (fundExtended.info.score > SELL_SCORE_THRESHOLD) {
                return true;
            }
            let sellingShares = sharesiesInfo.orders.filter((order) => order.fund_id === fundExtended.id).reduce((sum, order) => sum + order.shares, 0);
            if (sellingShares > 0) {
                return true;
            }
            let sharesReturn = returnByFundId[fundExtended.fund.id];
            if (sharesReturn <= 0) {
                return true;
            }
            let sharesAmount = parseInt(sharesAmountByFundId[fundExtended.fund.id] || 0);
            let sharePrice = fundExtended.info.currentPrice;
            let sharesValue = sharesAmount * sharePrice;
            sharesAmount = Math.max(1, sharesValue / sharePrice);
            sharesValue = sharesAmount * sharePrice;
            print.action(`=> Consider selling ${_numberRound(sharesAmount)} shares ($${sharesValue.toFixed(2)}) for ${fundExtended.fund.code} (${fundExtended.fund.name})`);
            totalSoldValue += sharesValue;
            return true;
        });
    }, Promise.resolve(true))
        .then(() => totalSoldValue);
}
function _numberRound(in_number) {
    return Math.round(in_number);
}
function _printHeader(in_title, in_indent, in_backgroundFn, in_foregroundFn) {
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
function _printTitleHeader(in_title, in_indent = '') {
    _printHeader(in_title, in_indent, cprint.backgroundMagenta, cprint.toWhite);
}
function _printSectionHeader(in_title, in_indent = '') {
    _printHeader(in_title, in_indent, cprint.backgroundCyan, cprint.toWhite);
}
function _printActionsHeader(in_title, in_indent = '') {
    let lightGreenBackgroundFn = cprint.backgroundLightGreen;
    let isWin = process.platform === 'win32';
    if (!isWin) {
        lightGreenBackgroundFn = cprint.backgroundGreen;
    }
    _printHeader(in_title, in_indent, lightGreenBackgroundFn, cprint.toBlack);
}
