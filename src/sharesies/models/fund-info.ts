// ******************************
// Imports:
// ******************************

import { Fund } from './fund';

// ******************************
// Declarations:
// ******************************

export interface FundInfo {
    id: number;
    code: string;
    info: {
        score: number;
        currentPrice: number;
        fundPrices: { [key: string]: number };
    };
    fund: Fund;
}

// ******************************
