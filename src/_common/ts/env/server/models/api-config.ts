import { LOG_LEVEL } from '../../enums';

// ******************************
// Declarations:
// ******************************

export class ApiConfig {
    debugResult: boolean;
    debugRequest: boolean;
    debugRequestUri: boolean;
    debugContext: boolean;
    debugError: boolean;
    debugResponse: boolean;
    debugRegisterRoute: boolean;

    constructor(in_logLevel: number) {
        this.debugResult = in_logLevel >= LOG_LEVEL.Debug;
        this.debugRequest = in_logLevel >= LOG_LEVEL.Debug;
        this.debugRequestUri = in_logLevel >= LOG_LEVEL.Info;
        this.debugContext = in_logLevel >= LOG_LEVEL.Debug;
        this.debugError = in_logLevel >= LOG_LEVEL.Info;
        this.debugResponse = in_logLevel >= LOG_LEVEL.Debug;
        this.debugRegisterRoute = in_logLevel >= LOG_LEVEL.Info;
    }
}

// ******************************
