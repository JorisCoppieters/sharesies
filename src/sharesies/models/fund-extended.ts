// ******************************
// Imports:
// ******************************

import { Fund } from './fund';
import { FundInfo } from './fund-info';

// ******************************
// Declarations:
// ******************************

export interface FundExtended {
    id: string;
    code: string;
    info: FundInfo;
    fund: Fund;
}

// ******************************
