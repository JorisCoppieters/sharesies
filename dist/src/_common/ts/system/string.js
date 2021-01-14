"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fromPercentageString = exports.toPercentageString = exports.fromPriceString = exports.toPriceString = exports.trimObject = exports.centerPad = exports.rightPad = exports.leftPad = void 0;
const dollar_round_1 = __importDefault(require("../calculators/dollar-round"));
function leftPad(in_value, in_pad, in_padAmount) {
    let str = in_value;
    let pad = in_pad || ' ';
    let padAmount = in_padAmount || str.length;
    return (pad.repeat(padAmount) + str).substr(-padAmount);
}
exports.leftPad = leftPad;
function rightPad(in_value, in_pad, in_padAmount) {
    let str = in_value;
    let pad = in_pad || ' ';
    let padAmount = in_padAmount || str.length;
    return (str + pad.repeat(padAmount)).substr(0, padAmount);
}
exports.rightPad = rightPad;
function centerPad(in_value, in_pad, in_padAmount) {
    let str = in_value;
    let pad = in_pad || ' ';
    let padAmount = in_padAmount || str.length;
    while (str.length < padAmount) {
        let leftOrRight = str.length % 2 === 1;
        str = (leftOrRight ? pad : '') + str + (leftOrRight ? '' : pad);
    }
    return str;
}
exports.centerPad = centerPad;
function trimObject(in_data) {
    let data = in_data;
    let dataType = typeof data;
    if (data !== null && dataType === 'object') {
        if (Array.isArray(data)) {
            let arrayCutOff = 10;
            if (data.length > arrayCutOff) {
                data = data.slice(0, arrayCutOff).concat([`(${data.length - arrayCutOff} more...)`]);
            }
            data = data.map((val) => trimObject(val));
        }
        else if (data instanceof Date) {
            return data.toString();
        }
        else {
            data = Object.keys(data).reduce((dict, key) => {
                dict[key] = trimObject(data[key]);
                return dict;
            }, {});
        }
    }
    else if (dataType === 'string') {
        if (data.length > 1000) {
            data = data.slice(0, 1000) + '...';
        }
    }
    return data;
}
exports.trimObject = trimObject;
function toPriceString(in_value) {
    const negative = in_value < 0;
    const absVal = Math.abs(in_value);
    const fullValue = dollar_round_1.default(absVal);
    const decimalValue = dollar_round_1.default((absVal - fullValue) * 100);
    const stringValue = `$${Number(fullValue).toLocaleString()}.${('00' + decimalValue).slice(-2)}`;
    return negative ? `(${stringValue})` : `${stringValue}`;
}
exports.toPriceString = toPriceString;
function fromPriceString(in_value) {
    let parsedValue = in_value.replace(/[,]/g, '').replace(/[$]/, '');
    const negative = parsedValue.match(/^\(.*\)$/);
    if (negative) {
        parsedValue = parsedValue.replace(/^\((.*)\)$/, '$1');
    }
    if (isNaN(parseFloat(parsedValue))) {
        return 0;
    }
    else {
        return (negative ? -1 : 1) * parseFloat(parsedValue);
    }
}
exports.fromPriceString = fromPriceString;
function toPercentageString(in_value) {
    const negative = in_value < 0;
    const fullValue = Math.floor(Math.abs(in_value));
    const decimalValue = Math.floor(Math.abs(in_value) * 100) - fullValue * 100;
    const stringValue = `${Number(fullValue).toLocaleString()}.${('00' + decimalValue).slice(-2)}%`;
    return negative ? `(${stringValue})` : `${stringValue}`;
}
exports.toPercentageString = toPercentageString;
function fromPercentageString(in_value) {
    let parsedValue = in_value.replace(/[,]/g, '').replace(/[%]/, '');
    const negative = parsedValue.match(/^\(.*\)$/);
    if (negative) {
        parsedValue = parsedValue.replace(/^\((.*)\)$/, '$1');
    }
    if (isNaN(parseFloat(parsedValue))) {
        return 0;
    }
    else {
        return (negative ? -1 : 1) * parseFloat(parsedValue);
    }
}
exports.fromPercentageString = fromPercentageString;
