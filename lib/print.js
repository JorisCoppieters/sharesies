'use strict'; // JS: ES6

// ******************************
// Requires:
// ******************************

const cprint = require('color-print');

// ******************************
// Functions:
// ******************************

function errors(response) {
    if (response.error) {
        process.stderr.write(cprint.toRed(response.error) + '\n');
        return true;
    }

    if (response.errors) {
        let errors = response.errors;
        Object.keys(errors).forEach(errorKey => {
            let errorMessages = errors[errorKey];
            process.stderr.write(cprint.toRed(`Error for ${errorKey}`) + '\n');
            errorMessages.forEach(message => {
                process.stderr.write(cprint.toRed(`- ${message}`) + '\n');
            });
        });
        return true;
    }

    return false;
}

// ******************************

function action(action) {
    process.stdout.write(cprint.toGreen(action) + '\n');
    return true;
}

// ******************************

function heading(heading) {
    process.stdout.write(cprint.toMagenta('-- ' + heading.toUpperCase() + ' --') + '\n');
    return true;
}

// ******************************

function info(info) {
    process.stdout.write(cprint.toWhite(info) + '\n');
    return true;
}

// ******************************

function line() {
    process.stdout.write('\n');
    return true;
}

// ******************************

function out(in_message) {
    process.stdout.write(in_message);
    return true;
}

// ******************************
// Exports:
// ******************************

module.exports['action'] = action;
module.exports['errors'] = errors;
module.exports['heading'] = heading;
module.exports['info'] = info;
module.exports['line'] = line;
module.exports['out'] = out;

// ******************************
