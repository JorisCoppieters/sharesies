'use strict'; // JS: ES6

// ******************************
// Requires:
// ******************************

const env = require('./env');
const file = require('./file');

// ******************************
// Globals:
// ******************************

let g_CONFIG_OBJECT = false;

// ******************************
// Functions:
// ******************************

function load () {
    try {
        g_CONFIG_OBJECT = file.readJSON(env.getConfigFile());
    } catch (e) {
        g_CONFIG_OBJECT = {};
    }
    return g_CONFIG_OBJECT;
}

// ******************************

function get (key) {
    if (g_CONFIG_OBJECT === false) {
        load();
    }
    return g_CONFIG_OBJECT[key] || '';
}

// ******************************

function set (key, val) {
    if (g_CONFIG_OBJECT === false) {
        load();
    }
    g_CONFIG_OBJECT[key] = val;
    save();
}

// ******************************

function save () {
    file.writeJSON(env.getConfigFile(), g_CONFIG_OBJECT, true);
    return true;
}

// ******************************
// Exports:
// ******************************

module.exports['load'] = load;
module.exports['get'] = get;
module.exports['set'] = set;
module.exports['save'] = save;

// ******************************
