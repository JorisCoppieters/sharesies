// ******************************
// Imports:
// ******************************

import incomeTax from './income-tax';

// ******************************
// Tests:
// ******************************

describe('Income Tax', () => {
    test(`0`, () => expect(incomeTax(0)).toEqual(0));
    test(`1`, () => expect(incomeTax(1)).toEqual(0.1));
    test(`100`, () => expect(incomeTax(100)).toEqual(10.5));
    test(`30000`, () => expect(incomeTax(30000)).toEqual(4270));
    test(`60000`, () => expect(incomeTax(60000)).toEqual(11020));
    test(`70000`, () => expect(incomeTax(70000)).toEqual(14020));
    test(`80000`, () => expect(incomeTax(80000)).toEqual(17320));
    test(`100000`, () => expect(incomeTax(100000)).toEqual(23920));
    test(`-3425`, () => expect(incomeTax(-3425)).toEqual(0));
    test(`1234.5`, () => expect(incomeTax(1234.5)).toEqual(129.57));
    test(`1234.99`, () => expect(incomeTax(1234.99)).toEqual(129.57));
    test(`1234.01`, () => expect(incomeTax(1234.01)).toEqual(129.57));
    test(`1234.999`, () => expect(incomeTax(1234.999)).toEqual(129.67));
    test(`1235`, () => expect(incomeTax(1235)).toEqual(129.67));
    test(`1233.5`, () => expect(incomeTax(1233.5)).toEqual(129.46));
    test(`1233.99`, () => expect(incomeTax(1233.99)).toEqual(129.46));
    test(`1233.01`, () => expect(incomeTax(1233.01)).toEqual(129.46));
    test(`1233.999`, () => expect(incomeTax(1233.999)).toEqual(129.57));
    test(`1234`, () => expect(incomeTax(1234)).toEqual(129.57));
});

// ******************************
