// ******************************
// Declarations:
// ******************************

export interface Fund {
    id: number;
    code: string;
    name: string;
    day_prices: { [key: string]: number };
    market_price: number;
}

// ******************************
