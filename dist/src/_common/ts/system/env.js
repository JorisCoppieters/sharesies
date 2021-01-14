"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfigFolder = exports.getTemp = exports.getShellHome = exports.getUserHome = exports.getUserExplorerHome = exports.setupConfigFolder = exports.isTTY = exports.isMinGW32 = exports.isMinGW64 = exports.isMinGW = exports.isBash = exports.isWindows = exports.isMacOSX = exports.isLinux = void 0;
const folder_1 = require("./folder");
function isLinux() {
    let os = require('os');
    return os.platform() === 'linux';
}
exports.isLinux = isLinux;
function isMacOSX() {
    let os = require('os');
    return os.platform() === 'darwin';
}
exports.isMacOSX = isMacOSX;
function isWindows() {
    let os = require('os');
    return os.platform() === 'win32';
}
exports.isWindows = isWindows;
function isBash() {
    return process.env['SHELL'] && process.env['SHELL'].match('bash');
}
exports.isBash = isBash;
function isMinGW() {
    return isMinGW64() || isMinGW32();
}
exports.isMinGW = isMinGW;
function isMinGW64() {
    return process.env['MSYSTEM'] === 'MINGW64';
}
exports.isMinGW64 = isMinGW64;
function isMinGW32() {
    return process.env['MSYSTEM'] === 'MINGW32';
}
exports.isMinGW32 = isMinGW32;
function isTTY() {
    return process.stdout.isTTY;
}
exports.isTTY = isTTY;
function setupConfigFolder() {
    const path = require('path');
    let configFolder = folder_1.create(path.resolve(getShellHome(), '.sharesies'));
    return configFolder;
}
exports.setupConfigFolder = setupConfigFolder;
function getUserExplorerHome() {
    let home = process.env['USERPROFILE'];
    if (!home && process.platform === 'linux') {
        home = process.env['HOME'];
    }
    return home;
}
exports.getUserExplorerHome = getUserExplorerHome;
function getUserHome() {
    let home = process.env['HOME'];
    if (!home && process.platform === 'win32') {
        home = process.env['USERPROFILE'];
    }
    return home;
}
exports.getUserHome = getUserHome;
function getShellHome() {
    let home = process.env['HOME'];
    if (!home && process.platform === 'win32') {
        home = process.env['USERPROFILE'];
    }
    return home;
}
exports.getShellHome = getShellHome;
function getTemp() {
    return process.env['TEMP'];
}
exports.getTemp = getTemp;
function getConfigFolder() {
    return setupConfigFolder();
}
exports.getConfigFolder = getConfigFolder;
