// ******************************
// Imports:
// ******************************

import compoundingInterest from './compounding-interest';

// ******************************
// Tests:
// ******************************

describe('Compounding Interest', () => {
    test(`All 0`, () => expect(compoundingInterest(0, 0, 0, 0)).toEqual(0));
    test(`Principal + rest 0`, () => expect(compoundingInterest(1000, 0, 0, 0)).toEqual(1000));
    test(`Principal, IR + rest 0`, () => expect(compoundingInterest(2000, 0.05, 0, 0)).toEqual(2000));
    test(`Simple`, () => expect(compoundingInterest(2000, 0.05, 1, 1)).toEqual(2100));
    test(`Multiple Applied`, () => expect(compoundingInterest(3000, 0.05, 5, 1)).toEqual(3153.03));
    test(`Multiple Periods`, () => expect(compoundingInterest(4000, 0.05, 1, 5)).toEqual(5105.13));
    test(`Multiple Applied With Contribution`, () => expect(compoundingInterest(3000, 0.05, 5, 1, 2)).toEqual(3155.09));
    test(`Multiple Periods With Contribution`, () => expect(compoundingInterest(4000, 0.05, 1, 5, 2)).toEqual(5116.73));
    test(`5% Annual increase`, () => expect(compoundingInterest(2000, 0.05, 1, 10, 0)).toEqual(3257.79));
    test(`5% Annual increase + Contribution`, () => expect(compoundingInterest(2000, 0.05, 1, 10, 100)).toEqual(4578.47));
});

// ******************************
