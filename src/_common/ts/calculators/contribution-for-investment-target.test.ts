import contributionForInvestmentTarget from './contribution-for-investment-target';

// ******************************
// Tests:
// ******************************

describe('Contribution for Investment Target', () => {
    test(`All 0`, () => expect(contributionForInvestmentTarget(0, 0, 0, 0, 0)).toEqual(0));
    test(`Principal == Final Value`, () => expect(contributionForInvestmentTarget(1000, 0, 0, 0, 1000)).toEqual(0));
    test(`5% Annual increase`, () => expect(contributionForInvestmentTarget(2000, 0.05, 1, 10, 3000)).toEqual(0));
    test(`5% Annual increase`, () => expect(contributionForInvestmentTarget(2000, 0.05, 1, 10, 4000)).toEqual(56.20));
    test(`2% Monthly increase`, () => expect(contributionForInvestmentTarget(2000, 0.02, 12, 5, 8000)).toEqual(1100.17));
    test(`5% Annual increase with $0 contribution`, () => expect(contributionForInvestmentTarget(2000, 0.05, 1, 10, 3257.79)).toEqual(0));
    test(`5% Annual increase with $100 contribution`, () => expect(contributionForInvestmentTarget(2000, 0.05, 1, 10, 4578.47)).toEqual(100));
});

// ******************************
