'use strict'; // JS: ES6

// ******************************
// Requires:
// ******************************

const cprint = require('color-print');

const print = require('./print');

// ******************************
// Functions:
// ******************************

function sync (in_question) {
    print.out(cprint.toMagenta(in_question));
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
// Exports:
// ******************************

module.exports['sync'] = sync;

// ******************************
