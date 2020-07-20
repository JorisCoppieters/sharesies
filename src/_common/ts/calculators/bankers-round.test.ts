// ******************************
// Imports:
// ******************************

import bankersRound from './bankers-round';

// ******************************
// Tests:
// ******************************

describe('Bankers Round', () => {
    test(`0`, () => expect(bankersRound(0)).toEqual(0));
    test(`0.01`, () => expect(bankersRound(0.01)).toEqual(0.01));
    test(`0.001`, () => expect(bankersRound(0.001)).toEqual(0));
    test(`0.009`, () => expect(bankersRound(0.009)).toEqual(0.01));
    test(`1000.123`, () => expect(bankersRound(1000.123)).toEqual(1000.12));
    test(`-40.40`, () => expect(bankersRound(-40.40)).toEqual(-40.40));
    test(`-23.401`, () => expect(bankersRound(-23.401)).toEqual(-23.40));
    test(`-23.409`, () => expect(bankersRound(-23.409)).toEqual(-23.41));
    test(`1.525`, () => expect(bankersRound(1.525)).toEqual(1.52));
    test(`1.535`, () => expect(bankersRound(1.535)).toEqual(1.54));
    test(`12.245`, () => expect(bankersRound(12.245)).toEqual(12.24));
    test(`12.255`, () => expect(bankersRound(12.255)).toEqual(12.26));
});

// ******************************
