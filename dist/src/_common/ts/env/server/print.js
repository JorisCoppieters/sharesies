"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.out = exports.line = exports.warning = exports.info = exports.heading = exports.action = exports.errors = exports.dbErr = exports.db = void 0;
const vars_1 = require("./vars");
const util_1 = require("util");
const logger = __importStar(require("./logger"));
const cprint = require('color-print');
function db(in_message) {
    if (vars_1.IS_DEV || vars_1.IS_TEST) {
        logger.info(util_1.isObject(in_message) ? JSON.stringify(in_message, null, 4) : in_message);
    }
}
exports.db = db;
function dbErr(in_message) {
    logger.error(in_message);
}
exports.dbErr = dbErr;
function errors(response) {
    if (response.error) {
        process.stderr.write(cprint.toRed(response.error) + '\n');
        return true;
    }
    if (response.errors) {
        let errors = response.errors;
        Object.keys(errors).forEach((errorKey) => {
            let errorMessages = errors[errorKey];
            process.stderr.write(cprint.toRed(`Error for ${errorKey}`) + '\n');
            errorMessages.forEach((message) => {
                process.stderr.write(cprint.toRed(`- ${message}`) + '\n');
            });
        });
        return true;
    }
    return false;
}
exports.errors = errors;
function action(action) {
    process.stdout.write(cprint.toGreen(action) + '\n');
    return true;
}
exports.action = action;
function heading(heading) {
    process.stdout.write(cprint.toMagenta('-- ' + heading.toUpperCase() + ' --') + '\n');
    return true;
}
exports.heading = heading;
function info(info) {
    if (typeof info === 'object') {
        info = JSON.stringify(info);
    }
    process.stdout.write(cprint.toWhite(info) + '\n');
    return true;
}
exports.info = info;
function warning(message) {
    if (typeof message === 'object') {
        message = JSON.stringify(message);
    }
    process.stdout.write(cprint.toYellow(message) + '\n');
    return true;
}
exports.warning = warning;
function line() {
    process.stdout.write('\n');
    return true;
}
exports.line = line;
function out(in_message) {
    process.stdout.write(in_message);
    return true;
}
exports.out = out;
