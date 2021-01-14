"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bankers_round_1 = __importDefault(require("./bankers-round"));
function default_1(in_principal, in_interestRate, in_timesInterestApplied, in_periods, in_contribution) {
    const timesInterestApplied = in_timesInterestApplied && in_timesInterestApplied > 0 ? in_timesInterestApplied : 1;
    const contribution = in_contribution && in_contribution > 0 ? in_contribution : 0;
    const final = _calc(in_principal, in_interestRate / timesInterestApplied, in_periods * timesInterestApplied, contribution / timesInterestApplied);
    return bankers_round_1.default(final);
}
exports.default = default_1;
function _calc(in_principal, in_interestRate, in_periods, in_contribution) {
    return (in_principal * Math.pow(1 + in_interestRate, in_periods) +
        (in_interestRate > 0
            ? in_contribution * ((Math.pow(1 + in_interestRate, in_periods + 1) - 1) / in_interestRate - 1)
            : in_contribution * in_periods));
}
