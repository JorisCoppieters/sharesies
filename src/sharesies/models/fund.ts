// ******************************
// Declarations:
// ******************************

export interface Fund {
    id: number;
    code: string;
    day_prices: { [key: string]: number };
    market_price: number;
}

// ******************************
