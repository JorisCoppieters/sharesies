"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const income_tax_1 = __importDefault(require("./income-tax"));
describe('Income Tax', () => {
    test(`0`, () => expect(income_tax_1.default(0)).toEqual(0));
    test(`1`, () => expect(income_tax_1.default(1)).toEqual(0.1));
    test(`100`, () => expect(income_tax_1.default(100)).toEqual(10.5));
    test(`30000`, () => expect(income_tax_1.default(30000)).toEqual(4270));
    test(`60000`, () => expect(income_tax_1.default(60000)).toEqual(11020));
    test(`70000`, () => expect(income_tax_1.default(70000)).toEqual(14020));
    test(`80000`, () => expect(income_tax_1.default(80000)).toEqual(17320));
    test(`100000`, () => expect(income_tax_1.default(100000)).toEqual(23920));
    test(`-3425`, () => expect(income_tax_1.default(-3425)).toEqual(0));
    test(`1234.5`, () => expect(income_tax_1.default(1234.5)).toEqual(129.57));
    test(`1234.99`, () => expect(income_tax_1.default(1234.99)).toEqual(129.57));
    test(`1234.01`, () => expect(income_tax_1.default(1234.01)).toEqual(129.57));
    test(`1234.999`, () => expect(income_tax_1.default(1234.999)).toEqual(129.67));
    test(`1235`, () => expect(income_tax_1.default(1235)).toEqual(129.67));
    test(`1233.5`, () => expect(income_tax_1.default(1233.5)).toEqual(129.46));
    test(`1233.99`, () => expect(income_tax_1.default(1233.99)).toEqual(129.46));
    test(`1233.01`, () => expect(income_tax_1.default(1233.01)).toEqual(129.46));
    test(`1233.999`, () => expect(income_tax_1.default(1233.999)).toEqual(129.57));
    test(`1234`, () => expect(income_tax_1.default(1234)).toEqual(129.57));
});
