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
exports.readHiddenLineSync = exports.readLineSync = void 0;
const env_1 = require("./env");
const print = __importStar(require("../env/server/print"));
const cprint = require('color-print');
function readLineSync(in_question) {
    return _readLineSync(cprint.toWhite(in_question + ':') + ' ');
}
exports.readLineSync = readLineSync;
function readHiddenLineSync(in_question, in_username) {
    if (env_1.isTTY()) {
        try {
            return _readHiddenLineSync(in_question);
        }
        catch (e) {
        }
    }
    if (env_1.isWindows()) {
        try {
            return _readHiddenLineSyncWindows(in_question, in_username || '');
        }
        catch (e) {
        }
    }
    if (env_1.isMacOSX()) {
        try {
            return _readHiddenLineSync(in_question);
        }
        catch (e) {
        }
    }
    return _readHiddenLineSyncInClear(in_question);
}
exports.readHiddenLineSync = readHiddenLineSync;
function _readLineSync(in_question) {
    print.out(in_question);
    let input = null;
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (text) => {
        input = text;
    });
    while (!input) {
        require('deasync').sleep(100);
    }
    process.stdin.pause();
    return input.toString().trim();
}
function _readHiddenLineSync(in_question) {
    const readlineSync = require('readline-sync');
    const input = readlineSync.question(cprint.toWhite(in_question + ': '), {
        hideEchoBack: true,
    });
    return input;
}
function _readHiddenLineSyncWindows(in_question, in_username) {
    const exec = require('./exec');
    const file = require('./file');
    const path = require('path');
    print.out(cprint.toWhite(in_question) + ' ' + cprint.toYellow('(in Windows Credential Window)') + '\n');
    const bundledScriptPath = path.join(__dirname, 'readPassword.ps1');
    const copiedScriptPath = path.join(env_1.getTemp(), 'node-read-password.ps1');
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
function _readHiddenLineSyncInClear(in_question) {
    const input = _readLineSync(cprint.toWhite(in_question) +
        cprint.toRed(' (WARNING: due to shell incompatibility, the input cannot be hidden):') +
        cprint.toBlack(' ', true));
    print.out(cprint.toBlue(''));
    return input;
}
