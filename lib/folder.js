'use strict'; // JS: ES6

// ******************************
// Globals:
// ******************************

let g_CWD = null;

// ******************************
// Functions:
// ******************************

function create(in_folderName) {
    let fs = require('fs');
    let path = require('path');

    let folder = path.resolve(_cwd(), in_folderName);
    if (!fs.existsSync(folder)) {
        let parentFolder = path.dirname(folder);
        create(parentFolder);
        fs.mkdirSync(folder);
    }
    return folder;
}

// ******************************
// Helper Functions:
// ******************************

function _cwd() {
    if (!g_CWD) {
        let process = require('process');
        g_CWD = process.cwd();
    }
    return g_CWD;
}

// ******************************
// Exports:
// ******************************

module.exports['create'] = create;

// ******************************
