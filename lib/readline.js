'use strict'; // JS: ES6

// ******************************
// Requires:
// ******************************

const cprint = require('color-print');

const env = require('./env');
const print = require('./print');

// ******************************
// Functions:
// ******************************

function _readLineSync (in_question) {
    print.out(in_question);
    let input = '';
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (text) => {
        input = text;
    });
    while(!input) {require('deasync').sleep(100);}
    process.stdin.pause();
    return input.trim();
}

// ******************************

function readLineSync (in_question) {
    return _readLineSync(cprint.toWhite(in_question + ':') + ' ');
}

// ******************************

function readHiddenLineSync (in_question, in_username) {
    if (env.isTTY()) {
        try {
            return _readHiddenLineSync(in_question);
        } catch (e) {
            // Ignore error
        }
    }

    if (env.isWindows()) {
        try {
            return _readHiddenLineSyncWindows(in_question, in_username);
        } catch (e) {
            // Ignore error
        }
    }

    if (env.isMacOSX()) {
        try {
            return _readHiddenLineSync(in_question);
        } catch (e) {
            // Ignore error
        }
    }

    return _readHiddenLineSyncInClear(in_question);
}

// ******************************

function _readHiddenLineSync (in_question) {
    const readlineSync = require('readline-sync');
    const input = readlineSync.question(cprint.toWhite(in_question + ': '), {
        hideEchoBack: true
    });
    return input;
}

// ******************************

function _readHiddenLineSyncWindows (in_question, in_username) {
    const exec = require('./exec');
    const file = require('./file');
    const path = require('path');

    print.out(cprint.toWhite(in_question) + ' ' + cprint.toYellow('(in Windows Credential Window)') + '\n');

    const bundledScriptPath = path.join(__dirname, 'readPassword.ps1');
    const copiedScriptPath = path.join(env.getTemp(), 'node-read-password.ps1');
    file.write(copiedScriptPath, file.read(bundledScriptPath));
    const cmdResult = exec.cmdSync('powershell', ['-f', copiedScriptPath, '-prompt', in_username], {
        hide: true
    });
    file.delete(copiedScriptPath);
    if (cmdResult.hasError) {
        throw cmdResult.error;
    }
    return cmdResult.result;
}

// ******************************

function _readHiddenLineSyncInClear (in_question) {
    return _readLineSync(cprint.toWhite(in_question) + cprint.toRed(' (WARNING: due to shell incompatibility, the input cannot be hidden):') + cprint.toBlack(' ', true));
}

// ******************************
// Exports:
// ******************************

module.exports['sync'] = readLineSync;
module.exports['hiddenSync'] = readHiddenLineSync;

// ******************************
