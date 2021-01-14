"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCredentialsFile = exports.saveCredentials = exports.setCredentials = exports.getCredentials = exports.loadCredentials = void 0;
const secureBlob_1 = require("./secureBlob");
const file_1 = require("../system/file");
const env_1 = require("../system/env");
let g_CREDENTIALS = {};
function loadCredentials() {
    let credentialsContent = file_1.read(getCredentialsFile());
    try {
        g_CREDENTIALS = JSON.parse(secureBlob_1.decrypt(credentialsContent));
    }
    catch (e) {
        try {
            g_CREDENTIALS = JSON.parse(credentialsContent);
        }
        catch (e) {
            g_CREDENTIALS = {};
        }
    }
    return g_CREDENTIALS;
}
exports.loadCredentials = loadCredentials;
function getCredentials(key) {
    if (!Object.keys(g_CREDENTIALS).length) {
        loadCredentials();
    }
    return g_CREDENTIALS[key] || '';
}
exports.getCredentials = getCredentials;
function setCredentials(key, val) {
    if (!Object.keys(g_CREDENTIALS).length) {
        loadCredentials();
    }
    g_CREDENTIALS[key] = val;
    saveCredentials();
}
exports.setCredentials = setCredentials;
function saveCredentials() {
    file_1.write(getCredentialsFile(), secureBlob_1.encrypt(JSON.stringify(g_CREDENTIALS)), true);
    return true;
}
exports.saveCredentials = saveCredentials;
function getCredentialsFile() {
    const path = require('path');
    let credentialsFile = path.resolve(env_1.getConfigFolder(), 'credentials');
    return credentialsFile;
}
exports.getCredentialsFile = getCredentialsFile;
