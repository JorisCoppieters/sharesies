'use strict'; // JS: ES5

// ******************************
// Requries:
// ******************************

var cprint = require('color-print');

var c = require('./constants');

// ******************************
// Functions:
// ******************************

function printHelp () {
    cprint.magenta('Version ' + c.VERSION);
    process.stdout.write('\n');
    cprint.green('Options:');
    process.stdout.write(cprint.toWhite('-h') + '\t' + cprint.toCyan('Show this menu') + '\n');
    process.stdout.write(cprint.toWhite('-e') + '\t' + cprint.toCyan('Execute sharesies buying and selling suggestions') + '\n');
    process.stdout.write(cprint.toWhite('-d') + '\t' + cprint.toCyan('Run in debug mode') + '\n');
    process.stdout.write(cprint.toWhite('-c') + '\t' + cprint.toCyan('Clear the cache') + '\n');
}

// ******************************

function printVersion () {
    cprint.yellow('Version ' + c.VERSION);
}

// ******************************
// Exports:
// ******************************

module.exports['printHelp'] = printHelp;
module.exports['printVersion'] = printVersion;

// ******************************
