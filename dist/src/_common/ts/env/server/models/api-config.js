"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiConfig = void 0;
const enums_1 = require("../../enums");
class ApiConfig {
    constructor(in_logLevel) {
        this.debugResult = in_logLevel >= enums_1.LOG_LEVEL.Debug;
        this.debugRequest = in_logLevel >= enums_1.LOG_LEVEL.Debug;
        this.debugRequestUri = in_logLevel >= enums_1.LOG_LEVEL.Info;
        this.debugContext = in_logLevel >= enums_1.LOG_LEVEL.Debug;
        this.debugError = in_logLevel >= enums_1.LOG_LEVEL.Info;
        this.debugResponse = in_logLevel >= enums_1.LOG_LEVEL.Debug;
        this.debugRegisterRoute = in_logLevel >= enums_1.LOG_LEVEL.Info;
    }
}
exports.ApiConfig = ApiConfig;
