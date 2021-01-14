import bankersRound from './bankers-round';

// ******************************
// Declarations:
// ******************************

export default function (
    in_principal: number,
    in_interestRate: number,
    in_timesInterestApplied: number,
    in_periods: number,
    in_finalValue: number
): number {
    const timesInterestApplied = in_timesInterestApplied && in_timesInterestApplied > 0 ? in_timesInterestApplied : 1;
    const periods = in_periods && in_periods > 0 ? in_periods : 1;
    const contribution = _calc(in_principal, in_interestRate / timesInterestApplied, periods * timesInterestApplied, in_finalValue);

    return bankersRound(Math.max(0, contribution * in_timesInterestApplied));
}

// ******************************

function _calc(in_principal: number, in_interestRate: number, in_periods: number, in_finalValue: number) {
    if (in_interestRate <= 0) {
        return (in_finalValue - in_principal) / in_periods;
    }

    return (
        (in_finalValue - in_principal * Math.pow(1 + in_interestRate, in_periods)) /
        ((Math.pow(1 + in_interestRate, in_periods + 1) - 1) / in_interestRate - 1)
    );
}

// ******************************
