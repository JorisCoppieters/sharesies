'use strict'; // JS: ES6

// ******************************
// Globals:
// ******************************

let g_CWD = null;

// ******************************
// Functions:
// ******************************

function write (in_fileName, in_fileContents, in_overwrite) {
    let fs = require('fs');
    let path = require('path');

    let file = path.resolve(_cwd(), in_fileName);
    if (!fs.existsSync(file) || in_overwrite) {
        fs.writeFileSync(file, in_fileContents);
    }
    return file;
}

// ******************************

function writeJSON (in_fileName, in_object, in_overwrite) {
    return write(in_fileName, JSON.stringify(in_object), in_overwrite);
}

// ******************************

function read (in_fileName) {
    let fs = require('fs');
    let path = require('path');

    let file = path.resolve(_cwd(), in_fileName);
    if (!fs.existsSync(file)) {
        return '';
    }
    return fs.readFileSync(file).toString();
}

// ******************************

function readJSON (in_fileName) {
    return JSON.parse(read(in_fileName));
}

// ******************************

function exists (in_fileName) {
    if (!in_fileName) {
        return false;
    }

    let fs = require('fs');
    let path = require('path');

    let file = path.resolve(_cwd(), in_fileName);
    return fs.existsSync(file);
}

// ******************************
// Helper Functions:
// ******************************

function _cwd () {
    if (!g_CWD) {
        let process = require('process');
        g_CWD = process.cwd();
    }
    return g_CWD;
}

// ******************************
// Exports:
// ******************************

module.exports['exists'] = exists;
module.exports['read'] = read;
module.exports['readJSON'] = readJSON;
module.exports['write'] = write;
module.exports['writeJSON'] = writeJSON;

// ******************************
