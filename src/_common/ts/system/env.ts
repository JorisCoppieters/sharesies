// ******************************
// Imports:
// ******************************

import { create as createFolder } from './folder';

// ******************************
// Declarations:
// ******************************

export function isLinux() {
    let os = require('os');
    return os.platform() === 'linux';
}

// ******************************

export function isMacOSX() {
    let os = require('os');
    return os.platform() === 'darwin';
}

// ******************************

export function isWindows() {
    let os = require('os');
    return os.platform() === 'win32';
}

// ******************************

export function isBash() {
    return process.env['SHELL'] && process.env['SHELL'].match('bash');
}

// ******************************

export function isMinGW() {
    return isMinGW64() || isMinGW32();
}

// ******************************

export function isMinGW64() {
    return process.env['MSYSTEM'] === 'MINGW64';
}

// ******************************

export function isMinGW32() {
    return process.env['MSYSTEM'] === 'MINGW32';
}

// ******************************

export function isTTY() {
    return process.stdout.isTTY;
}

// ******************************

export function setupConfigFolder() {
    const path = require('path');
    let configFolder = createFolder(path.resolve(getShellHome(), '.sharesies'));
    return configFolder;
}

// // ******************************

export function getUserExplorerHome() {
    let home = process.env['USERPROFILE'];
    if (!home && process.platform === 'linux') {
        home = process.env['HOME'];
    }
    return home;
}

// ******************************

export function getUserHome() {
    let home = process.env['HOME'];
    if (!home && process.platform === 'win32') {
        home = process.env['USERPROFILE'];
    }
    return home;
}

// ******************************

export function getShellHome() {
    let home = process.env['HOME'];
    if (!home && process.platform === 'win32') {
        home = process.env['USERPROFILE'];
    }
    return home;
}

// ******************************

export function getTemp() {
    return process.env['TEMP'];
}

// ******************************

export function getConfigFolder() {
    return setupConfigFolder();
}

// ******************************
