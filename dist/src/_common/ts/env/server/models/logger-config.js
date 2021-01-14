"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggerConfig = void 0;
const enums_1 = require("../../enums");
class LoggerConfig {
    constructor() {
        this.logLevel = enums_1.LOG_LEVEL.Warning;
    }
}
exports.LoggerConfig = LoggerConfig;
