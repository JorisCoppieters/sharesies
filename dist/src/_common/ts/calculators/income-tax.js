"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dollar_round_1 = __importDefault(require("./dollar-round"));
function default_1(in_income) {
    const tax = _calc(in_income);
    return Math.floor(tax * 100) / 100;
}
exports.default = default_1;
function _calc(in_income) {
    const income = dollar_round_1.default(in_income);
    if (income < 1) {
        return 0;
    }
    if (income <= 14000) {
        return (income * 10.5) / 100;
    }
    if (income <= 48000) {
        return ((income - 14000) * 17.5) / 100 + 1470;
    }
    if (income <= 70000) {
        return ((income - 48000) * 30) / 100 + 7420;
    }
    return ((income - 70000) * 33) / 100 + 14020;
}
