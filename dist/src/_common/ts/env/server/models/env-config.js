"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnvConfig = void 0;
const api_config_1 = require("./api-config");
const app_config_1 = require("./app-config");
class EnvConfig {
    constructor(in_logLevel) {
        this.api = new api_config_1.ApiConfig(in_logLevel);
        this.app = new app_config_1.AppConfig(in_logLevel);
    }
}
exports.EnvConfig = EnvConfig;
