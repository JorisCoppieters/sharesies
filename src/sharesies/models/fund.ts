// ******************************
// Declarations:
// ******************************

export interface Fund {
    id: string;
    code: string;
    name: string;
    day_prices: { [key: string]: string };
    market_price: number;
}

// ******************************
