// ******************************
// Imports:
// ******************************

import { IS_DEV, IS_TEST } from './vars';
import { isObject } from 'util';
import * as logger from './logger';

const cprint = require('color-print');

// ******************************
// Declarations:
// ******************************

export function db(in_message: string | object): void {
    if (IS_DEV || IS_TEST) {
        logger.info(isObject(in_message) ? JSON.stringify(in_message, null, 4) : (in_message as string));
    }
}

// ******************************

export function dbErr(in_message: string): void {
    logger.error(in_message);
}

// ******************************

export function errors(response: any) {
    if (response.error) {
        process.stderr.write(cprint.toRed(response.error) + '\n');
        return true;
    }

    if (response.errors) {
        let errors = response.errors;
        Object.keys(errors).forEach((errorKey) => {
            let errorMessages = errors[errorKey];
            process.stderr.write(cprint.toRed(`Error for ${errorKey}`) + '\n');
            errorMessages.forEach((message: string) => {
                process.stderr.write(cprint.toRed(`- ${message}`) + '\n');
            });
        });
        return true;
    }

    return false;
}

// ******************************

export function action(action: string) {
    process.stdout.write(cprint.toGreen(action) + '\n');
    return true;
}

// ******************************

export function heading(heading: string) {
    process.stdout.write(cprint.toMagenta('-- ' + heading.toUpperCase() + ' --') + '\n');
    return true;
}

// ******************************

export function info(info: any) {
    if (typeof info === 'object') {
        info = JSON.stringify(info);
    }

    process.stdout.write(cprint.toWhite(info) + '\n');
    return true;
}

// ******************************

export function warning(message: string) {
    if (typeof message === 'object') {
        message = JSON.stringify(message);
    }

    process.stdout.write(cprint.toYellow(message) + '\n');
    return true;
}

// ******************************

export function line() {
    process.stdout.write('\n');
    return true;
}

// ******************************

export function out(in_message: string) {
    process.stdout.write(in_message);
    return true;
}

// ******************************
