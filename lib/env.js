'use strict'; // JS: ES6

// ******************************
// Requires:
// ******************************

const folder = require('./folder');

// ******************************
// Functions:
// ******************************

function isLinux () {
    let os = require('os');
    return os.platform() === 'linux';
}

// ******************************

function isWindows () {
    let os = require('os');
    return os.platform() === 'win32';
}

// ******************************

function setupConfigFolder () {
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

function getConfigFolder () {
    return setupConfigFolder();
}

// ******************************
// Exports:
// ******************************

module.exports['isWindows'] = isWindows;
module.exports['isLinux'] = isLinux;
module.exports['setupConfigFolder'] = setupConfigFolder;
module.exports['getUserExplorerHome'] = getUserExplorerHome;
module.exports['getUserHome'] = getUserHome;
module.exports['getShellHome'] = getShellHome;
module.exports['getTemp'] = getTemp;
module.exports['getConfigFolder'] = getConfigFolder;

// ******************************
