// ******************************
// Imports:
// ******************************

import { toPriceString, fromPriceString, toPercentageString, fromPercentageString } from './string';

// ******************************
// Tests:
// ******************************

describe('string', () => {
    test(`toPriceString`, () => expect(toPriceString(0)).toEqual("$0.00"));
    test(`toPriceString`, () => expect(toPriceString(100)).toEqual("$100.00"));
    test(`toPriceString`, () => expect(toPriceString(12.34)).toEqual("$12.34"));
    test(`toPriceString`, () => expect(toPriceString(45.678)).toEqual("$45.67"));
    test(`toPriceString`, () => expect(toPriceString(-12.34)).toEqual("($12.34)"));
    test(`toPriceString`, () => expect(toPriceString(-45.678)).toEqual("($45.67)"));
    test(`toPriceString`, () => expect(toPriceString(12345678)).toEqual("$12,345,678.00"));
    test(`toPriceString`, () => expect(toPriceString(45678)).toEqual("$45,678.00"));
    test(`toPriceString`, () => expect(toPriceString(522.54)).toEqual("$522.54"));

    test(`fromPriceString`, () => expect(fromPriceString("$0.00")).toEqual(0));
    test(`fromPriceString`, () => expect(fromPriceString("$100.00")).toEqual(100));
    test(`fromPriceString`, () => expect(fromPriceString("$12.34")).toEqual(12.34));
    test(`fromPriceString`, () => expect(fromPriceString("$45.67")).toEqual(45.67));
    test(`fromPriceString`, () => expect(fromPriceString("($12.34)")).toEqual(-12.34));
    test(`fromPriceString`, () => expect(fromPriceString("($45.67)")).toEqual(-45.67));
    test(`fromPriceString`, () => expect(fromPriceString("-$12.34")).toEqual(-12.34));
    test(`fromPriceString`, () => expect(fromPriceString("-$45.67")).toEqual(-45.67));
    test(`fromPriceString`, () => expect(fromPriceString("$12,345,678.00")).toEqual(12345678));
    test(`fromPriceString`, () => expect(fromPriceString("$45,678")).toEqual(45678));
    test(`fromPriceString`, () => expect(fromPriceString("$12345678")).toEqual(12345678));
    test(`fromPriceString`, () => expect(fromPriceString("45678")).toEqual(45678));
    test(`fromPriceString`, () => expect(fromPriceString("$522.54")).toEqual(522.54));

    test(`toPercentageString`, () => expect(toPercentageString(0)).toEqual("0.00%"));
    test(`toPercentageString`, () => expect(toPercentageString(100)).toEqual("100.00%"));
    test(`toPercentageString`, () => expect(toPercentageString(12.34)).toEqual("12.34%"));
    test(`toPercentageString`, () => expect(toPercentageString(45.678)).toEqual("45.67%"));
    test(`toPercentageString`, () => expect(toPercentageString(-12.34)).toEqual("(12.34%)"));
    test(`toPercentageString`, () => expect(toPercentageString(-45.678)).toEqual("(45.67%)"));
    test(`toPercentageString`, () => expect(toPercentageString(12345678)).toEqual("12,345,678.00%"));
    test(`toPercentageString`, () => expect(toPercentageString(45678)).toEqual("45,678.00%"));
    test(`toPercentageString`, () => expect(toPercentageString(522.54)).toEqual("522.54%"));

    test(`fromPercentageString`, () => expect(fromPercentageString("0%")).toEqual(0));
    test(`fromPercentageString`, () => expect(fromPercentageString("100%")).toEqual(100));
    test(`fromPercentageString`, () => expect(fromPercentageString("12.34%")).toEqual(12.34));
    test(`fromPercentageString`, () => expect(fromPercentageString("45.67%")).toEqual(45.67));
    test(`fromPercentageString`, () => expect(fromPercentageString("-12.34%")).toEqual(-12.34));
    test(`fromPercentageString`, () => expect(fromPercentageString("-45.67%")).toEqual(-45.67));
    test(`fromPercentageString`, () => expect(fromPercentageString("(12.34%)")).toEqual(-12.34));
    test(`fromPercentageString`, () => expect(fromPercentageString("(45.67%)")).toEqual(-45.67));
    test(`fromPercentageString`, () => expect(fromPercentageString("12,345,678.00%")).toEqual(12345678));
    test(`fromPercentageString`, () => expect(fromPercentageString("45,678%")).toEqual(45678));
    test(`fromPercentageString`, () => expect(fromPercentageString("12345678%")).toEqual(12345678));
    test(`fromPercentageString`, () => expect(fromPercentageString("45678%")).toEqual(45678));
    test(`fromPercentageString`, () => expect(fromPercentageString("522.54%")).toEqual(522.54));
});

// ******************************
