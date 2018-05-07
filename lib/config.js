'use strict'; // JS: ES6

// ******************************
// Requires:
// ******************************

const file = require('./file');

// ******************************
// Globals:
// ******************************

let g_CONFIG_OBJECT = false;

// ******************************
// Functions:
// ******************************

function load () {
    let configFile = './.credentials';
    try {
        g_CONFIG_OBJECT = JSON.parse(file.read(configFile));
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
    let configFile = './.credentials';
    file.write(configFile, JSON.stringify(g_CONFIG_OBJECT), true);
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
