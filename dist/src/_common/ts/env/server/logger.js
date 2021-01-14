"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.unimplemented = exports.warning = exports.verbose = exports.success = exports.info = exports.error = exports.data = exports.configureLogLevel = exports.getLogLevel = void 0;
const enums_1 = require("../enums");
const logger_config_1 = require("./models/logger-config");
const process_1 = __importDefault(require("process"));
const cprint = require('color-print');
const CONFIG = new logger_config_1.LoggerConfig();
function getLogLevel() {
    return CONFIG.logLevel;
}
exports.getLogLevel = getLogLevel;
function configureLogLevel(in_logLevel) {
    CONFIG.logLevel = in_logLevel;
}
exports.configureLogLevel = configureLogLevel;
exports.data = _data;
exports.error = _error;
exports.info = _info;
exports.success = _success;
exports.verbose = _verbose;
exports.warning = _warning;
exports.unimplemented = (in_functionName) => _warning(`Unimplemented: ${in_functionName}`);
function _verbose(in_message) {
    if (CONFIG.logLevel < enums_1.LOG_LEVEL.Verbose) {
        return;
    }
    cprint.darkGrey(in_message);
    return;
}
function _data(in_message) {
    process_1.default.stdout.write(`${in_message}\n`);
    return;
}
function _info(in_message) {
    if (CONFIG.logLevel < enums_1.LOG_LEVEL.Info) {
        return;
    }
    cprint.cyan(in_message);
    return;
}
function _success(in_message) {
    if (CONFIG.logLevel < enums_1.LOG_LEVEL.Info) {
        return;
    }
    cprint.green(in_message);
    return;
}
function _warning(in_message) {
    if (CONFIG.logLevel < enums_1.LOG_LEVEL.Warning) {
        return;
    }
    cprint.yellow(in_message);
    return;
}
function _error(in_message) {
    if (CONFIG.logLevel < enums_1.LOG_LEVEL.Error) {
        return;
    }
    cprint.red(in_message);
    return;
}
