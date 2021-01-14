"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppConfig = void 0;
const enums_1 = require("../../enums");
class AppConfig {
    constructor(in_logLevel) {
        this.debugResult = in_logLevel >= enums_1.LOG_LEVEL.Debug;
        this.debugAuth = in_logLevel >= enums_1.LOG_LEVEL.Info;
        this.debugAuthToken = in_logLevel >= enums_1.LOG_LEVEL.Info;
    }
}
exports.AppConfig = AppConfig;
