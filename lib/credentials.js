'use strict'; // JS: ES6

// ******************************
// Requires:
// ******************************

const blob = require('./secureBlob');
const env = require('./env');
const file = require('./file');

// ******************************
// Globals:
// ******************************

let g_CREDENTIALS = false;

// ******************************
// Functions:
// ******************************

function load () {
    g_CREDENTIALS = file.read(getCredentialsFile());

    try {
        g_CREDENTIALS = JSON.parse(blob.decrypt(g_CREDENTIALS));
    } catch (e) {
        try {
            g_CREDENTIALS = JSON.parse(g_CREDENTIALS);
        } catch (e) {
            g_CREDENTIALS = {};
        }
    }
    return g_CREDENTIALS;
}

// ******************************

function get (key) {
    if (g_CREDENTIALS === false) {
        load();
    }
    return g_CREDENTIALS[key] || '';
}

// ******************************

function set (key, val) {
    if (g_CREDENTIALS === false) {
        load();
    }
    g_CREDENTIALS[key] = val;
    save();
}

// ******************************

function save () {
    file.write(getCredentialsFile(), blob.encrypt(JSON.stringify(g_CREDENTIALS)), true);
    return true;
}

// ******************************

function getCredentialsFile () {
    const path = require('path');
    let credentialsFile =  path.resolve(env.getConfigFolder(), 'credentials');
    return credentialsFile;
}

// ******************************
// Exports:
// ******************************

module.exports['load'] = load;
module.exports['get'] = get;
module.exports['set'] = set;
module.exports['save'] = save;

// ******************************
