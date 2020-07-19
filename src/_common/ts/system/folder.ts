// ******************************
// Globals:
// ******************************

let g_CWD: string = '';

// ******************************
// Declarations:
// ******************************

export function create(in_folderName: string) {
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
