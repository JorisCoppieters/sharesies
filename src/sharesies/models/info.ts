// ******************************
// Imports:
// ******************************

import { FundShare } from './fund-share';
import { Order } from './order';

// ******************************
// Declarations:
// ******************************

export interface Info {
    funds: FundShare[];
    orders: Order[];
}

// ******************************
