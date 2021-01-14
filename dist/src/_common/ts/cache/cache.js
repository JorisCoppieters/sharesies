"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.YEAR = exports.WEEK = exports.DAY = exports.D = exports.HOUR = exports.H = exports.MIN = exports.M = exports.SEC = exports.S = exports.cached = exports.clearAll = exports.clear = void 0;
const cache_1 = require("./models/cache");
const env_1 = require("../system/env");
const blob = __importStar(require("../security/secureBlob"));
const file = __importStar(require("../system/file"));
const bluebird_1 = __importDefault(require("bluebird"));
const cprint = require('color-print');
const c_MAX_CACHE_LOAD_AGE = 1000 * 60 * 60 * 1;
let g_CACHE_ITEMS = {};
let g_CACHE_LOADED = null;
function clear(in_key) {
    let key = (in_key || '').trim();
    return new bluebird_1.default((resolve) => {
        let cacheItems = _loadCache();
        if (cacheItems[key]) {
            delete cacheItems[key];
            _saveCache();
        }
        return resolve(true);
    });
}
exports.clear = clear;
function clearAll() {
    return new bluebird_1.default((resolve) => {
        _loadCache();
        g_CACHE_ITEMS = [];
        _saveCache();
        return resolve(true);
    });
}
exports.clearAll = clearAll;
exports.cached = (in_fn, in_key, in_expire = 0, in_clear = false) => {
    return (in_clear ? bluebird_1.default.resolve(undefined) : _get(in_key)).then((value) => {
        if (value) {
            return value;
        }
        return in_fn().then((value) => {
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
exports.S = 1;
exports.SEC = 1;
exports.M = 60;
exports.MIN = 60;
exports.H = 60 * 60;
exports.HOUR = 60 * 60;
exports.D = 60 * 60 * 24;
exports.DAY = 60 * 60 * 24;
exports.WEEK = 60 * 60 * 24 * 7;
exports.YEAR = 60 * 60 * 24 * 365;
function _get(in_key) {
    return new bluebird_1.default((resolve) => {
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
function _set(in_key, in_value, in_expire) {
    let now = new Date().getTime();
    let key = (in_key || '').trim();
    return new bluebird_1.default((resolve) => {
        let cacheItems = _loadCache();
        cacheItems[key] = {
            value: blob.encrypt(in_value),
            encrypted: true,
            expires: in_expire > 0 ? now + in_expire * 1000 : -1,
        };
        _saveCache();
        return resolve(true);
    });
}
function _loadCache() {
    let now = new Date().getTime();
    if (g_CACHE_LOADED && g_CACHE_LOADED >= now - c_MAX_CACHE_LOAD_AGE) {
        return g_CACHE_ITEMS;
    }
    let path = require('path');
    let cacheFile = path.resolve(env_1.getConfigFolder(), 'cache');
    g_CACHE_ITEMS = _loadCacheFromFile(cacheFile);
    g_CACHE_LOADED = now;
    return g_CACHE_ITEMS;
}
function _saveCache() {
    if (!g_CACHE_LOADED) {
        return false;
    }
    let path = require('path');
    let cacheFile = path.resolve(env_1.getConfigFolder(), 'cache');
    _saveCacheToFile(cacheFile, g_CACHE_ITEMS);
    return true;
}
function _loadCacheFromFile(in_cacheFile) {
    let path = require('path');
    let cacheFile = path.resolve(in_cacheFile);
    if (!file.exists(cacheFile)) {
        return {};
    }
    let cache = file.readJSON(cacheFile);
    let now = new Date().getTime();
    let cacheItems = {};
    (cache.items || [])
        .filter((item) => {
        return item.expires === -1 || item.expires > now;
    })
        .forEach((item) => {
        cacheItems[item.key] = item;
    });
    return cacheItems;
}
function _saveCacheToFile(in_cacheFile, in_cacheItems) {
    let path = require('path');
    let cacheFile = path.resolve(in_cacheFile);
    let now = new Date().getTime();
    let cache = new cache_1.Cache();
    cache.items = Object.keys(in_cacheItems)
        .map((key) => {
        return Object.assign({
            key: key,
        }, in_cacheItems[key]);
    })
        .filter((item) => {
        return item.expires === -1 || item.expires > now;
    });
    file.writeJSON(cacheFile, cache, true);
}
