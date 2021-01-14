// ******************************
// Globals:
// ******************************

let g_CWD: string = '';

// ******************************
// Declarations:
// ******************************

export function exists(in_fileName: string) {
    if (!in_fileName) {
        return false;
    }

    let fs = require('fs');
    let path = require('path');

    let file = path.resolve(_cwd(), in_fileName);
    return fs.existsSync(file);
}

// ******************************

export function read(in_fileName: string) {
    let fs = require('fs');
    let path = require('path');

    let file = path.resolve(_cwd(), in_fileName);
    if (!fs.existsSync(file)) {
        return '';
    }
    return fs.readFileSync(file).toString();
}

// ******************************

export function readJSON(in_fileName: string) {
    return JSON.parse(read(in_fileName));
}

// ******************************

export function write(in_fileName: string, in_fileContents: string, in_overwrite: boolean) {
    let fs = require('fs');
    let path = require('path');

    let file = path.resolve(_cwd(), in_fileName);
    if (!fs.existsSync(file) || in_overwrite) {
        fs.writeFileSync(file, in_fileContents);
    }
    return file;
}

// ******************************

export function writeJSON(in_fileName: string, in_object: object, in_overwrite: boolean) {
    return write(in_fileName, JSON.stringify(in_object), in_overwrite);
}

// ******************************

export function deleteFile(in_fileName: string) {
    if (!in_fileName) {
        return false;
    }

    let fs = require('fs');
    let path = require('path');
    let file = path.resolve(_cwd(), in_fileName);
    return fs.unlink(file, () => {});
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
