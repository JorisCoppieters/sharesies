// ******************************
// Imports:
// ******************************

import { LOG_LEVEL } from '../../enums';

// ******************************
// Declarations:
// ******************************

export class AppConfig {
    debugResult: boolean;
    debugAuth: boolean;
    debugAuthToken: boolean;

    constructor(in_logLevel: number) {
        this.debugResult = in_logLevel >= LOG_LEVEL.Debug;
        this.debugAuth = in_logLevel >= LOG_LEVEL.Info;
        this.debugAuthToken = in_logLevel >= LOG_LEVEL.Info;
    }
}

// ******************************
