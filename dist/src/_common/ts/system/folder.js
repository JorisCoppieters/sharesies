"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.create = void 0;
let g_CWD = '';
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
exports.create = create;
function _cwd() {
    if (!g_CWD) {
        let process = require('process');
        g_CWD = process.cwd();
    }
    return g_CWD;
}
