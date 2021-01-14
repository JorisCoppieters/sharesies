"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const contribution_for_investment_target_1 = __importDefault(require("./contribution-for-investment-target"));
describe('Contribution for Investment Target', () => {
    test(`All 0`, () => expect(contribution_for_investment_target_1.default(0, 0, 0, 0, 0)).toEqual(0));
    test(`Principal == Final Value`, () => expect(contribution_for_investment_target_1.default(1000, 0, 0, 0, 1000)).toEqual(0));
    test(`5% Annual increase`, () => expect(contribution_for_investment_target_1.default(2000, 0.05, 1, 10, 3000)).toEqual(0));
    test(`5% Annual increase`, () => expect(contribution_for_investment_target_1.default(2000, 0.05, 1, 10, 4000)).toEqual(56.20));
    test(`2% Monthly increase`, () => expect(contribution_for_investment_target_1.default(2000, 0.02, 12, 5, 8000)).toEqual(1100.17));
    test(`5% Annual increase with $0 contribution`, () => expect(contribution_for_investment_target_1.default(2000, 0.05, 1, 10, 3257.79)).toEqual(0));
    test(`5% Annual increase with $100 contribution`, () => expect(contribution_for_investment_target_1.default(2000, 0.05, 1, 10, 4578.47)).toEqual(100));
});
