import dollarRound from './dollar-round';

// ******************************
// Declarations:
// ******************************

export default function (in_income: number): number {
    const tax = _calc(in_income);
    return Math.floor(tax * 100) / 100;
}

// ******************************

function _calc(in_income: number): number {
    const income = dollarRound(in_income);
    if (income < 1) {
        return 0;
    }
    if (income <= 14000) {
        return (income * 10.5) / 100;
    }
    if (income <= 48000) {
        return ((income - 14000) * 17.5) / 100 + 1470;
    }
    if (income <= 70000) {
        return ((income - 48000) * 30) / 100 + 7420;
    }

    return ((income - 70000) * 33) / 100 + 14020;
}

// ******************************
