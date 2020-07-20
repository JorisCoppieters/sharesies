// ******************************
// Imports:
// ******************************

import { Cache } from './models/cache';
import { getConfigFolder } from '../system/env';
import * as blob from '../security/secureBlob';
import * as file from '../system/file';

const cprint = require('color-print');

// ******************************
// Constants:
// ******************************

const c_CLASS_NAME = 'cache';
const c_MAX_CACHE_LOAD_AGE = 1000 * 60 * 60 * 1; // 1 Minute

// ******************************
// Globals:
// ******************************

let g_CACHE_ITEMS: { [id: string]: any } = {};
let g_CACHE_LOADED: number | null = null;

// ******************************
// Declarations:
// ******************************

export function clear(in_key: string) {
    let key = (in_key || '').trim();

    return new Promise((resolve) => {
        let cacheItems = _loadCache();

        if (cacheItems[key]) {
            delete cacheItems[key];
            _saveCache();
        }

        return resolve(true);
    });
}

// ******************************

export function clearAll() {
    return new Promise((resolve) => {
        _loadCache();
        g_CACHE_ITEMS = [];
        _saveCache();
        return resolve(true);
    });
}

// ******************************

export const cached = (in_fn: Function, in_key: string, in_expire: number = 0, in_clear: boolean = false) => {
    return (in_clear ? Promise.resolve(undefined) : _get(in_key)).then((value) => {
        if (value) {
            return value;
        }

        return in_fn().then((value: string) => {
            if (!value) {
                return value;
            }
            return _set(in_key, value, in_expire)
                .then(() => value)
                .catch((err) => {
                    cprint.red(err);
                    return value;
                });
        });
    });
};

// ******************************

export const S = 1;
export const M = 60;
export const H = 60 * 60;
export const D = 60 * 60 * 24;

// ******************************
// Helper Functions:
// ******************************

function _get(in_key: string) {
    return new Promise((resolve) => {
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

function _set(in_key: string, in_value: string, in_expire: number) {
    let fn = `${c_CLASS_NAME}._set`;

    if (!in_expire) {
        throw new Error(`${fn}: expiry not set!`);
    }

    let now = new Date().getTime();
    let key = (in_key || '').trim();

    return new Promise((resolve) => {
        let cacheItems = _loadCache();
        cacheItems[key] = {
            value: blob.encrypt(in_value),
            encrypted: true,
            expires: now + in_expire * 1000,
        };
        _saveCache();
        return resolve(true);
    });
}

// ******************************

function _loadCache() {
    let now = new Date().getTime();
    if (g_CACHE_LOADED && g_CACHE_LOADED >= now - c_MAX_CACHE_LOAD_AGE) {
        return g_CACHE_ITEMS;
    }

    let path = require('path');
    let cacheFile = path.resolve(getConfigFolder(), 'cache');
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
    let cacheFile = path.resolve(getConfigFolder(), 'cache');
    _saveCacheToFile(cacheFile, g_CACHE_ITEMS);
    return true;
}

// ******************************

function _loadCacheFromFile(in_cacheFile: string): { [id: string]: any } {
    let path = require('path');

    let cacheFile = path.resolve(in_cacheFile);
    if (!file.exists(cacheFile)) {
        return {};
    }

    let cache = file.readJSON(cacheFile);

    let now = new Date().getTime();
    let cacheItems: { [id: string]: any } = {};

    (cache.items || [])
        .filter((item: any) => {
            return item.expires > now;
        })
        .forEach((item: any) => {
            // if (item.encrypted) {
            //     item.value = blob.decrypt(item.value);
            // }
            cacheItems[item.key] = item;
        });

    return cacheItems;
}

// ******************************

function _saveCacheToFile(in_cacheFile: string, in_cacheItems: { [id: string]: any }) {
    let path = require('path');

    let cacheFile = path.resolve(in_cacheFile);

    let now = new Date().getTime();

    let cache: Cache = new Cache();

    cache.items = Object.keys(in_cacheItems)
        .map((key) => {
            return Object.assign(
                {
                    key: key,
                },
                in_cacheItems[key]
            );
        })
        .filter((item) => {
            return item.expires > now;
        });

    file.writeJSON(cacheFile, cache, true);
}

// ******************************
