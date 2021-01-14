// ******************************
// Declarations:
// ******************************

export interface CartItem {
    cart_item_id: number;
    amount: number;
    fund: {
        id: number;
        fund_type: string;
    };
}

// ******************************
