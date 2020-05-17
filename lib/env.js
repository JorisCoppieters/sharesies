'use strict'; // JS: ES6

// ******************************
// Requires:
// ******************************

const folder = require('./folder');

// ******************************
// Functions:
// ******************************

function isLinux() {
    let os = require('os');
    return os.platform() === 'linux';
}

// ******************************

function isMacOSX() {
    let os = require('os');
    return os.platform() === 'darwin';
}

// ******************************

function isWindows() {
    let os = require('os');
    return os.platform() === 'win32';
}

// ******************************

function isBash() {
    return process.env['SHELL'] && process.env['SHELL'].match('bash');
}

// ******************************

function isMinGW() {
    return isMinGW64() || isMinGW32();
}

// ******************************

function isMinGW64() {
    return process.env['MSYSTEM'] === 'MINGW64';
}

// ******************************

function isMinGW32() {
    return process.env['MSYSTEM'] === 'MINGW32';
}

// ******************************

function isTTY() {
    return process.stdout.isTTY;
}

// ******************************

function setupConfigFolder() {
    const path = require('path');
    let configFolder = folder.create(path.resolve(getShellHome(), '.sharesies'));
    return configFolder;
}

// ******************************

function getUserExplorerHome() {
    let home = process.env['USERPROFILE'];
    if (!home && process.platform === 'linux') {
        home = process.env['HOME'];
    }
    return home;
}

// ******************************

function getUserHome() {
    let home = process.env['HOME'];
    if (!home && process.platform === 'win32') {
        home = process.env['USERPROFILE'];
    }
    return home;
}

// ******************************

function getShellHome() {
    let home = process.env['HOME'];
    if (!home && process.platform === 'win32') {
        home = process.env['USERPROFILE'];
    }
    return home;
}

// ******************************

function getTemp() {
    return process.env['TEMP'];
}

// ******************************

function getConfigFolder() {
    return setupConfigFolder();
}

// ******************************
// Exports:
// ******************************

module.exports['isLinux'] = isLinux;
module.exports['isMacOSX'] = isMacOSX;
module.exports['isMinGW'] = isMinGW;
module.exports['isMinGW32'] = isMinGW32;
module.exports['isMinGW64'] = isMinGW64;
module.exports['isTTY'] = isTTY;
module.exports['isWindows'] = isWindows;
module.exports['setupConfigFolder'] = setupConfigFolder;
module.exports['getUserExplorerHome'] = getUserExplorerHome;
module.exports['getUserHome'] = getUserHome;
module.exports['getShellHome'] = getShellHome;
module.exports['getTemp'] = getTemp;
module.exports['getConfigFolder'] = getConfigFolder;

// ******************************
