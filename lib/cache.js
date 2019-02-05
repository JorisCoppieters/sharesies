'use strict'; // JS: ES6

// ******************************
// Constants:
// ******************************

const c_CLASS_NAME = 'cache';
const c_MAX_CACHE_LOAD_AGE = 1000 * 60 * 60 * 1; // 1 Minute

// ******************************
// Requires:
// ******************************

const blob = require('./secureBlob');
const cprint = require('color-print');
const env = require('./env');
const file = require('./file');

// ******************************
// Globals:
// ******************************

let g_CACHE_ITEMS = {};
let g_CACHE_LOADED = false;

// ******************************
// Functions:
// ******************************

module.exports['clear'] = _clear;

// ******************************

module.exports['clearAll'] = _clearAll;

// ******************************

module.exports['cached'] = (in_fn, in_key, in_expire, in_clear) => {
    return (in_clear ? Promise.resolve(undefined) : _get(in_key))
        .then(value => {
            if (value) {
                return value;
            }

            return in_fn()
                .then(value => {
                    if (!value) {
                        return value;
                    }
                    return _set(in_key, value, in_expire)
                        .then(() => value)
                        .catch(err => {
                            cprint.red(err);
                            return value;
                        });
                });
        });
};

// ******************************

module.exports['S'] = 1;
module.exports['M'] = 60;
module.exports['H'] = 60 * 60;
module.exports['D'] = 60 * 60 * 24;

// ******************************
// Helper Functions:
// ******************************

function _get (in_key) {
    return new Promise(resolve => {
        let cacheItems = _loadCache();
        if (!cacheItems[in_key]) {
            return resolve(false);
        }

        let item = cacheItems[in_key];
        if (item.encrypted) {
            return resolve(blob.decrypt(item.value));
        }

        return resolve(item.value);
    });
}

// ******************************

function _set (in_key, in_value, in_expire) {
    let fn = `${c_CLASS_NAME}._set`;

    if (!in_expire) {
        throw `${fn}: expiry not set!`;
    }

    let now = (new Date()).getTime();
    let key = (in_key || '').trim();

    return new Promise(resolve => {
        let cacheItems = _loadCache();
        cacheItems[key] = {
            value: blob.encrypt(in_value),
            encrypted: true,
            expires: now + in_expire * 1000
        };
        _saveCache();
        return resolve(true);
    });
}

// ******************************

function _clear (in_key) {
    let key = (in_key || '').trim();

    return new Promise(resolve => {
        let cacheItems = _loadCache();

        if (cacheItems[key]) {
            delete cacheItems[key];
            _saveCache();
        }

        return resolve(true);
    });
}

// ******************************

function _clearAll () {
    return new Promise(resolve => {
        _loadCache();
        g_CACHE_ITEMS = {};
        _saveCache();
        return resolve(true);
    });
}

// ******************************

function _loadCache() {
    let now = (new Date()).getTime();
    if (g_CACHE_LOADED && g_CACHE_LOADED >= new Date(now - c_MAX_CACHE_LOAD_AGE)) {
        return g_CACHE_ITEMS;
    }

    let path = require('path');
    let cacheFile = path.resolve(env.getConfigFolder(), '.cache');
    g_CACHE_ITEMS = _loadCacheFromFile(cacheFile);
    g_CACHE_LOADED = now;
    return g_CACHE_ITEMS;
}

// ******************************

function _saveCache() {
    if (!g_CACHE_LOADED) {
        return false;
    }

    let path = require('path');
    let cacheFile = path.resolve(env.getConfigFolder(), '.cache');
    _saveCacheToFile(cacheFile, g_CACHE_ITEMS);
    return true;
}

// ******************************

function _loadCacheFromFile(in_cacheFile) {
    let path = require('path');


    let cacheFile = path.resolve(in_cacheFile);
    if (!file.exists(cacheFile)) {
        return {};
    }

    let cache = file.readJSON(cacheFile);

    let now = (new Date()).getTime();
    let cacheItems = [];

    (cache.items || [])
        .filter(item => {
            return item.expires > now;
        })
        .forEach(item => {
            // if (item.encrypted) {
            //     item.value = blob.decrypt(item.value);
            // }
            cacheItems[item.key] = item;
        });


    return cacheItems;
}

// ******************************

function _saveCacheToFile(in_cacheFile, in_cacheItems) {
    let path = require('path');

    let cacheFile = path.resolve(in_cacheFile);

    let now = (new Date()).getTime();

    let cache = {};
    cache.items = Object.keys(in_cacheItems)
        .map(key => {
            return Object.assign({
                key: key,
            }, in_cacheItems[key]);
        })
        .filter(item => {
            return item.expires > now;
        });

    file.writeJSON(cacheFile, cache, true);
}

// ******************************
