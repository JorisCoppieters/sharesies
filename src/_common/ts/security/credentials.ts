import { encrypt, decrypt } from './secureBlob';
import { write as writeFile, read as readFile } from '../system/file';
import { getConfigFolder } from '../system/env';

// ******************************
// Globals:
// ******************************

let g_CREDENTIALS: {[id: string]: string} = {};

// ******************************
// Declarations:
// ******************************

export function loadCredentials() {
    let credentialsContent = readFile(getCredentialsFile());
    try {
        g_CREDENTIALS = JSON.parse(decrypt(credentialsContent));
    } catch (e) {
        try {
            g_CREDENTIALS = JSON.parse(credentialsContent);
        } catch (e) {
            g_CREDENTIALS = {};
        }
    }
    return g_CREDENTIALS;
}

// ******************************

export function getCredentials(key: string) {
    if (!Object.keys(g_CREDENTIALS).length) {
        loadCredentials();
    }
    return g_CREDENTIALS[key] || '';
}

// ******************************

export function setCredentials(key: string, val: string) {
    if (!Object.keys(g_CREDENTIALS).length) {
        loadCredentials();
    }
    g_CREDENTIALS[key] = val;
    saveCredentials();
}

// ******************************

export function saveCredentials() {
    writeFile(getCredentialsFile(), encrypt(JSON.stringify(g_CREDENTIALS)), true);
    return true;
}

// ******************************

export function getCredentialsFile() {
    const path = require('path');
    let credentialsFile = path.resolve(getConfigFolder(), 'credentials');
    return credentialsFile;
}

// ******************************
