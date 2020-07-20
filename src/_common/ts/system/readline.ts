// ******************************
// Imports:
// ******************************

import { isTTY, isWindows, isMacOSX, getTemp } from './env';
import * as print from '../env/server/print';

const cprint = require('color-print');

// ******************************
// Declarations:
// ******************************

export function readLineSync(in_question: string) {
    return _readLineSync(cprint.toWhite(in_question + ':') + ' ');
}

// ******************************

export function readHiddenLineSync(in_question: string, in_username?: string) {
    if (isTTY()) {
        try {
            return _readHiddenLineSync(in_question);
        } catch (e) {
            // Ignore error
        }
    }

    if (isWindows()) {
        try {
            return _readHiddenLineSyncWindows(in_question, in_username || '');
        } catch (e) {
            // Ignore error
        }
    }

    if (isMacOSX()) {
        try {
            return _readHiddenLineSync(in_question);
        } catch (e) {
            // Ignore error
        }
    }

    return _readHiddenLineSyncInClear(in_question);
}

// ******************************
// Helper Functions:
// ******************************

function _readLineSync(in_question: string) {
    print.out(in_question);
    let input: Buffer | null = null;
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (text) => {
        input = text;
    });
    while (!input) {
        require('deasync').sleep(100);
    }
    process.stdin.pause();
    return (input as Buffer).toString().trim();
}

// ******************************

function _readHiddenLineSync(in_question: string) {
    const readlineSync = require('readline-sync');
    const input = readlineSync.question(cprint.toWhite(in_question + ': '), {
        hideEchoBack: true,
    });
    return input;
}

// ******************************

function _readHiddenLineSyncWindows(in_question: string, in_username: string) {
    const exec = require('./exec');
    const file = require('./file');
    const path = require('path');

    print.out(cprint.toWhite(in_question) + ' ' + cprint.toYellow('(in Windows Credential Window)') + '\n');

    const bundledScriptPath = path.join(__dirname, 'readPassword.ps1');
    const copiedScriptPath = path.join(getTemp(), 'node-read-password.ps1');
    file.write(copiedScriptPath, file.read(bundledScriptPath));
    const cmdResult = exec.cmdSync('powershell', ['-f', copiedScriptPath, '-prompt', in_username], {
        hide: true,
    });
    file.delete(copiedScriptPath);
    if (cmdResult.hasError) {
        throw new Error(cmdResult.error);
    }
    return cmdResult.result;
}

// ******************************

function _readHiddenLineSyncInClear(in_question: string) {
    const input = _readLineSync(
        cprint.toWhite(in_question) +
            cprint.toRed(' (WARNING: due to shell incompatibility, the input cannot be hidden):') +
            cprint.toBlack(' ', true)
    );
    print.out(cprint.toBlue(''));
    return input;
}

// ******************************
