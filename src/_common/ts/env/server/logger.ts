// ******************************
// Imports:
// ******************************

import { LOG_LEVEL } from '../enums';
import { LoggerConfig } from './models/logger-config';

import process from 'process';

const cprint = require('color-print');

// ******************************
// State:
// ******************************

const CONFIG = new LoggerConfig();

// ******************************
// Declarations:
// ******************************

export function getLogLevel(): LOG_LEVEL {
    return CONFIG.logLevel;
}

// ******************************

export function configureLogLevel(in_logLevel: LOG_LEVEL) {
    CONFIG.logLevel = in_logLevel;
}

// ******************************

export const data = _data;
export const error = _error;
export const info = _info;
export const success = _success;
export const verbose = _verbose;
export const warning = _warning;
export const unimplemented = (in_functionName: string) => _warning(`Unimplemented: ${in_functionName}`);

// ******************************
// Helper Functions:
// ******************************

function _verbose(in_message: string) {
    if (CONFIG.logLevel < LOG_LEVEL.Verbose) {
        return;
    }
    cprint.darkGrey(in_message);
    return;
}

// ******************************

function _data(in_message: string) {
    process.stdout.write(`${in_message}\n`);
    return;
}

// ******************************

function _info(in_message: string) {
    if (CONFIG.logLevel < LOG_LEVEL.Info) {
        return;
    }
    cprint.cyan(in_message);
    return;
}

// ******************************

function _success(in_message: string) {
    if (CONFIG.logLevel < LOG_LEVEL.Info) {
        return;
    }
    cprint.green(in_message);
    return;
}

// ******************************

function _warning(in_message: string) {
    if (CONFIG.logLevel < LOG_LEVEL.Warning) {
        return;
    }
    cprint.yellow(in_message);
    return;
}

// ******************************

function _error(in_message: string) {
    if (CONFIG.logLevel < LOG_LEVEL.Error) {
        return;
    }
    cprint.red(in_message);
    return;
}

// ******************************
