"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setCookieValues = exports.get = exports.post = void 0;
const vars_1 = require("../../../_common/ts/env/server/vars");
const string_1 = require("../system/string");
const bluebird_1 = __importDefault(require("bluebird"));
const cprint = require('color-print');
const c_CLASS_NAME = 'request';
let g_HEADER_ACCEPT_LANGUAGE = 'en-NZ,en-GB;q=0.9,en-US;q=0.8,en;q=0.7';
let g_HEADER_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.167 Safari/537.36';
let g_HEADER_REFERER = 'https://app.sharesies.nz/portfolio';
let g_HEADER_AUTHORITY = 'app.sharesies.nz';
let g_COOKIE_VALUES = {};
function post(in_url, in_requestData) {
    return new bluebird_1.default((resolve, reject) => _request(in_url, 'POST', in_requestData, resolve, reject)).then(_debugResult);
}
exports.post = post;
function get(in_url, in_requestData) {
    return new bluebird_1.default((resolve, reject) => _request(in_url, 'GET', in_requestData, resolve, reject)).then(_debugResult);
}
exports.get = get;
function setCookieValues(in_cookieValues) {
    let cookieValues = in_cookieValues
        .join(';')
        .split(';')
        .reduce((dict, cookieVal) => {
        let key = cookieVal.split('=')[0];
        let val = cookieVal.split('=')[1];
        dict[key] = val;
        return dict;
    }, {});
    g_COOKIE_VALUES = Object.assign(g_COOKIE_VALUES, cookieValues);
}
exports.setCookieValues = setCookieValues;
function _request(in_url, in_method, in_requestData, in_onSuccess, in_onError) {
    let fn = `${c_CLASS_NAME}._request`;
    let url = in_url;
    let requestData = in_requestData || {};
    if (in_method === 'GET') {
        if (Object.keys(requestData).length) {
            let qs = require('querystring');
            url += '?' + qs.stringify(requestData);
        }
    }
    if (vars_1.CONFIG.api.debugRequestUri) {
        cprint.cyan(`${fn}: Sending ${in_method} request to: ${url}`);
    }
    let uri = 'https://app.sharesies.nz/api/' + url;
    let requestOptions = {
        uri: uri,
        method: in_method,
        timeout: 30000,
        headers: {
            'accept-language': g_HEADER_ACCEPT_LANGUAGE,
            'user-agent': g_HEADER_USER_AGENT,
            referer: g_HEADER_REFERER,
            authority: g_HEADER_AUTHORITY,
            cookie: Object.keys(g_COOKIE_VALUES)
                .map((key) => {
                let val = g_COOKIE_VALUES[key];
                return key + (val ? `=${val}` : '');
            })
                .join(';'),
        },
        rejectUnauthorized: false,
        requestCert: true,
        agent: false,
    };
    if (in_method === 'POST') {
        requestOptions['json'] = requestData;
    }
    else {
        requestOptions['json'] = true;
    }
    let request = require('request');
    if (vars_1.CONFIG.api.debugRequest) {
        cprint.white(`${fn}: With request options ${JSON.stringify(string_1.trimObject(requestOptions), null, 4)}`);
    }
    request(requestOptions, (error, response, body) => {
        if (error) {
            if (in_onError) {
                in_onError(error);
            }
            return;
        }
        if (in_onSuccess) {
            let setCookie = response.headers['set-cookie'];
            if (setCookie) {
                setCookieValues(setCookie);
            }
            if (vars_1.CONFIG.api.debugResponse) {
                cprint.white(`${fn}: Received response ${JSON.stringify(string_1.trimObject(body), null, 4)}`);
            }
            if (response.statusCode !== 200) {
                return in_onError(`HTTP Response: [${response.statusCode}] ${response.statusMessage} (${uri})`);
            }
            in_onSuccess(body);
        }
        return;
    });
}
function _debugResult(in_data) {
    let data = string_1.trimObject(in_data);
    if (typeof data === 'object') {
        data = JSON.stringify(data, null, 4);
    }
    if (vars_1.CONFIG.api.debugResult) {
        cprint.white('API Debug Result:');
        cprint.white(data);
    }
    return in_data;
}
