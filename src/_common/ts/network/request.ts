import { CONFIG } from '../../../_common/ts/env/server/vars';
import { trimObject } from '../system/string';

import Promise from 'bluebird';

const cprint = require('color-print');

// ******************************
// Constants:
// ******************************

const c_CLASS_NAME = 'request';

// ******************************
// Global:
// ******************************

let g_HEADER_ACCEPT_LANGUAGE = 'en-NZ,en-GB;q=0.9,en-US;q=0.8,en;q=0.7';
let g_HEADER_USER_AGENT =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.167 Safari/537.36';
let g_HEADER_REFERER = 'https://app.sharesies.nz/portfolio';
let g_HEADER_AUTHORITY = 'app.sharesies.nz';
let g_COOKIE_VALUES: { [key: string]: any } = {};

// ******************************
// Declarations:
// ******************************

export function post(in_url: string, in_requestData: { [key: string]: any }) {
    return new Promise((resolve, reject) => _request(in_url, 'POST', in_requestData, resolve, reject)).then(_debugResult);
}

// ******************************

export function get(in_url: string, in_requestData: { [key: string]: any }) {
    return new Promise((resolve, reject) => _request(in_url, 'GET', in_requestData, resolve, reject)).then(_debugResult);
}

// ******************************

export function setCookieValues(in_cookieValues: string[]) {
    let cookieValues = in_cookieValues
        .join(';')
        .split(';')
        .reduce((dict: { [key: string]: any }, cookieVal) => {
            let key = cookieVal.split('=')[0];
            let val = cookieVal.split('=')[1];
            dict[key] = val;
            return dict;
        }, {});

    g_COOKIE_VALUES = Object.assign(g_COOKIE_VALUES, cookieValues);
}

// ******************************
// Helper Functions:
// ******************************

function _request(in_url: string, in_method: string, in_requestData: { [key: string]: any }, in_onSuccess: Function, in_onError: Function) {
    let fn = `${c_CLASS_NAME}._request`;

    let url = in_url;
    let requestData = in_requestData || {};

    if (in_method === 'GET') {
        if (Object.keys(requestData).length) {
            let qs = require('querystring');
            url += '?' + qs.stringify(requestData);
        }
    }

    if (CONFIG.api.debugRequestUri) {
        cprint.cyan(`${fn}: Sending ${in_method} request to: ${url}`);
    }

    let uri = 'https://app.sharesies.nz/api/' + url;

    let requestOptions: { [key: string]: any } = {
        uri: uri,
        method: in_method,
        timeout: 30000,
        headers: {
            'accept-language': g_HEADER_ACCEPT_LANGUAGE,
            'user-agent': g_HEADER_USER_AGENT,
            referer: g_HEADER_REFERER,
            authority: g_HEADER_AUTHORITY,
            cookie: Object.keys(g_COOKIE_VALUES)
                .map((key: string) => {
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
    } else {
        requestOptions['json'] = true;
    }

    let request = require('request');

    if (CONFIG.api.debugRequest) {
        cprint.white(`${fn}: With request options ${JSON.stringify(trimObject(requestOptions), null, 4)}`);
    }

    request(requestOptions, (error: string, response: any, body: string) => {
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

            if (CONFIG.api.debugResponse) {
                cprint.white(`${fn}: Received response ${JSON.stringify(trimObject(body), null, 4)}`);
            }

            if (response.statusCode !== 200) {
                return in_onError(`HTTP Response: [${response.statusCode}] ${response.statusMessage} (${uri})`);
            }

            in_onSuccess(body);
        }
        return;
    });
}

// ******************************

function _debugResult(in_data: any) {
    let data = trimObject(in_data);
    if (typeof data === 'object') {
        data = JSON.stringify(data, null, 4);
    }

    if (CONFIG.api.debugResult) {
        cprint.white('API Debug Result:');
        cprint.white(data);
    }
    return in_data;
}

// ******************************
