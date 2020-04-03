'use strict'; // JS: ES6

// ******************************
// Globals:
// ******************************

let g_CWD = null;

// ******************************
// Functions:
// ******************************

function _write (in_fileName, in_fileContents, in_overwrite) {
    let fs = require('fs');
    let path = require('path');

    let file = path.resolve(_cwd(), in_fileName);
    if (!fs.existsSync(file) || in_overwrite) {
        fs.writeFileSync(file, in_fileContents);
    }
    return file;
}

// ******************************

function _writeJSON (in_fileName, in_object, in_overwrite) {
    return _write(in_fileName, JSON.stringify(in_object), in_overwrite);
}

// ******************************

function _read (in_fileName) {
    let fs = require('fs');
    let path = require('path');

    let file = path.resolve(_cwd(), in_fileName);
    if (!fs.existsSync(file)) {
        return '';
    }
    return fs.readFileSync(file).toString();
}

// ******************************

function _readJSON (in_fileName) {
    return JSON.parse(_read(in_fileName));
}

// ******************************

function _delete (in_fileName) {
    if (!in_fileName) {
        return false;
    }

    let fs = require('fs');
    let path = require('path');
    let file = path.resolve(_cwd(), in_fileName);
    return fs.unlink(file, () => {});
}

// ******************************

function _exists (in_fileName) {
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

module.exports['exists'] = _exists;
module.exports['read'] = _read;
module.exports['readJSON'] = _readJSON;
module.exports['write'] = _write;
module.exports['writeJSON'] = _writeJSON;
module.exports['delete'] = _delete;

// ******************************
