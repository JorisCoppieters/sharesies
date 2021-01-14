"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bankers_round_1 = __importDefault(require("./bankers-round"));
function default_1(in_principal, in_interestRate, in_timesInterestApplied, in_periods, in_finalValue) {
    const timesInterestApplied = in_timesInterestApplied && in_timesInterestApplied > 0 ? in_timesInterestApplied : 1;
    const periods = in_periods && in_periods > 0 ? in_periods : 1;
    const contribution = _calc(in_principal, in_interestRate / timesInterestApplied, periods * timesInterestApplied, in_finalValue);
    return bankers_round_1.default(Math.max(0, contribution * in_timesInterestApplied));
}
exports.default = default_1;
function _calc(in_principal, in_interestRate, in_periods, in_finalValue) {
    if (in_interestRate <= 0) {
        return (in_finalValue - in_principal) / in_periods;
    }
    return ((in_finalValue - in_principal * Math.pow(1 + in_interestRate, in_periods)) /
        ((Math.pow(1 + in_interestRate, in_periods + 1) - 1) / in_interestRate - 1));
}
