'use strict'; // JS: ES6

// ******************************
// Requires:
// ******************************

const Promise = require('bluebird');

// ******************************
// Global:
// ******************************

let g_HEADER_ACCEPT_LANGUAGE = 'en-NZ,en-GB;q=0.9,en-US;q=0.8,en;q=0.7';
let g_HEADER_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.167 Safari/537.36';
let g_HEADER_REFERER = 'https://app.sharesies.nz/portfolio';
let g_HEADER_AUTHORITY = 'app.sharesies.nz';
let g_COOKIE_VALUES = [];

// ******************************
// Functions:
// ******************************

function post (in_url, in_requestData) {
    return new Promise((resolve, reject) => {
        _request(in_url, 'POST', in_requestData, resolve, reject);
    });
}

// ******************************

function get (in_url, in_requestData) {
    return new Promise((resolve, reject) => {
        _request(in_url, 'GET', in_requestData, resolve, reject);
    });
}

// ******************************
// Helper Functions:
// ******************************

function _setCookieValues (in_cookieValues) {
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

// ******************************

function _request (in_url, in_method, in_requestData, in_onSuccess, in_onError) {
    let url = in_url;
    let requestData = in_requestData || {};

    if (in_method === 'GET') {
        if (Object.keys(requestData).length) {
            let qs = require('querystring');
            url += '?' + qs.stringify(requestData);
        }
    }

    // cprint.cyan(`Sending ${in_method} request to: ${url}`);

    let requestOptions = {
        uri: 'https://app.sharesies.nz/api/' + url,
        method: in_method,
        timeout: 30000,
        headers: {
            'accept-language': g_HEADER_ACCEPT_LANGUAGE,
            'user-agent': g_HEADER_USER_AGENT,
            'referer': g_HEADER_REFERER,
            'authority': g_HEADER_AUTHORITY,
            'cookie': Object.keys(g_COOKIE_VALUES)
                .map(key => {
                    let val = g_COOKIE_VALUES[key];
                    return key + (val ? `=${val}` : '');
                })
                .join(';')
        },
        rejectUnauthorized: false,
        requestCert: true,
        agent: false
    };

    if (in_method === 'POST') {
        requestOptions['json'] = requestData;
    } else {
        requestOptions['json'] = true;
    }

    let request = require('request');
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
                _setCookieValues(setCookie);
            }
            in_onSuccess(body);
        }
        return;
    });
}

// ******************************
// Exports:
// ******************************

module.exports['_setCookieValues'] = _setCookieValues;
module.exports['post'] = post;
module.exports['get'] = get;

// ******************************
