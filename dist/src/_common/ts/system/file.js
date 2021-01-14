"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFile = exports.writeJSON = exports.write = exports.readJSON = exports.read = exports.exists = void 0;
let g_CWD = '';
function exists(in_fileName) {
    if (!in_fileName) {
        return false;
    }
    let fs = require('fs');
    let path = require('path');
    let file = path.resolve(_cwd(), in_fileName);
    return fs.existsSync(file);
}
exports.exists = exists;
function read(in_fileName) {
    let fs = require('fs');
    let path = require('path');
    let file = path.resolve(_cwd(), in_fileName);
    if (!fs.existsSync(file)) {
        return '';
    }
    return fs.readFileSync(file).toString();
}
exports.read = read;
function readJSON(in_fileName) {
    return JSON.parse(read(in_fileName));
}
exports.readJSON = readJSON;
function write(in_fileName, in_fileContents, in_overwrite) {
    let fs = require('fs');
    let path = require('path');
    let file = path.resolve(_cwd(), in_fileName);
    if (!fs.existsSync(file) || in_overwrite) {
        fs.writeFileSync(file, in_fileContents);
    }
    return file;
}
exports.write = write;
function writeJSON(in_fileName, in_object, in_overwrite) {
    return write(in_fileName, JSON.stringify(in_object), in_overwrite);
}
exports.writeJSON = writeJSON;
function deleteFile(in_fileName) {
    if (!in_fileName) {
        return false;
    }
    let fs = require('fs');
    let path = require('path');
    let file = path.resolve(_cwd(), in_fileName);
    return fs.unlink(file, () => { });
}
exports.deleteFile = deleteFile;
function _cwd() {
    if (!g_CWD) {
        let process = require('process');
        g_CWD = process.cwd();
    }
    return g_CWD;
}
