"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const compounding_interest_1 = __importDefault(require("./compounding-interest"));
describe('Compounding Interest', () => {
    test(`All 0`, () => expect(compounding_interest_1.default(0, 0, 0, 0)).toEqual(0));
    test(`Principal + rest 0`, () => expect(compounding_interest_1.default(1000, 0, 0, 0)).toEqual(1000));
    test(`Principal, IR + rest 0`, () => expect(compounding_interest_1.default(2000, 0.05, 0, 0)).toEqual(2000));
    test(`Simple`, () => expect(compounding_interest_1.default(2000, 0.05, 1, 1)).toEqual(2100));
    test(`Multiple Applied`, () => expect(compounding_interest_1.default(3000, 0.05, 5, 1)).toEqual(3153.03));
    test(`Multiple Periods`, () => expect(compounding_interest_1.default(4000, 0.05, 1, 5)).toEqual(5105.13));
    test(`Multiple Applied With Contribution`, () => expect(compounding_interest_1.default(3000, 0.05, 5, 1, 2)).toEqual(3155.09));
    test(`Multiple Periods With Contribution`, () => expect(compounding_interest_1.default(4000, 0.05, 1, 5, 2)).toEqual(5116.73));
    test(`5% Annual increase`, () => expect(compounding_interest_1.default(2000, 0.05, 1, 10, 0)).toEqual(3257.79));
    test(`5% Annual increase + Contribution`, () => expect(compounding_interest_1.default(2000, 0.05, 1, 10, 100)).toEqual(4578.47));
});
