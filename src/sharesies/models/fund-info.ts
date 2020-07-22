// ******************************
// Declarations:
// ******************************

export interface FundInfo {
    code: string;
    fundPrices: number[];
    fundPricesNormalized: number[];
    minPrice: number;
    maxPrice: number;
    priceRange: number;
    priceSum: number;
    priceCount: number;
    avgPrice: number;
    currentPrice: number;
    currentNormalizedPrice: number;
    currentNormalizedMarketPrice: number;
    currentPotentialPrice: number;
    marketVariability: number;
    priceGainPotential: number;
    growth: number;
    score: number;
}

// ******************************
