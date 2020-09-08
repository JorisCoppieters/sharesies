import dollarRound from './dollar-round';

// ******************************
// Tests:
// ******************************

describe('Dollar Round', () => {
    test(`0`, () => expect(dollarRound(0)).toEqual(0));
    test(`0.01`, () => expect(dollarRound(0.01)).toEqual(0));
    test(`0.994`, () => expect(dollarRound(0.994)).toEqual(0));
    test(`0.995`, () => expect(dollarRound(0.995)).toEqual(1));
    test(`0.999`, () => expect(dollarRound(0.999)).toEqual(1));
    test(`-0.994`, () => expect(dollarRound(-0.994)).toEqual(0));
    test(`-0.995`, () => expect(dollarRound(-0.995)).toEqual(-1));
    test(`-0.999`, () => expect(dollarRound(-0.999)).toEqual(-1));
    test(`1000.123`, () => expect(dollarRound(1000.123)).toEqual(1000));
    test(`-40.40`, () => expect(dollarRound(-40.4)).toEqual(-40));
    test(`1.525`, () => expect(dollarRound(1.525)).toEqual(1));
    test(`12.245`, () => expect(dollarRound(12.245)).toEqual(12));
    test(`12.999`, () => expect(dollarRound(12.999)).toEqual(13));
});

// ******************************
