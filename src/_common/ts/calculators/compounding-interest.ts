import bankersRound from './bankers-round';

// ******************************
// Declarations:
// ******************************

export default function (
    in_principal: number,
    in_interestRate: number,
    in_timesInterestApplied: number,
    in_periods: number,
    in_contribution?: number
): number {
    const timesInterestApplied = in_timesInterestApplied && in_timesInterestApplied > 0 ? in_timesInterestApplied : 1;
    const contribution = in_contribution && in_contribution > 0 ? in_contribution : 0;
    const final = _calc(
        in_principal,
        in_interestRate / timesInterestApplied,
        in_periods * timesInterestApplied,
        contribution / timesInterestApplied
    );

    return bankersRound(final);
}

// ******************************

function _calc(in_principal: number, in_interestRate: number, in_periods: number, in_contribution: number) {
    return (
        in_principal * Math.pow(1 + in_interestRate, in_periods) +
        (in_interestRate > 0
            ? in_contribution * ((Math.pow(1 + in_interestRate, in_periods + 1) - 1) / in_interestRate - 1)
            : in_contribution * in_periods)
    );
}

// ******************************
