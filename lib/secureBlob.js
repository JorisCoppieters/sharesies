'use strict'; // JS: ES6

// ******************************
// Requires:
// ******************************

const crypto = require('crypto');

// ******************************
// Constants:
// ******************************

const k_AUTH_BLOB_SECRET = '703B4D46855F927C40746E566D8511C5';

// ******************************
// Function Exports:
// ******************************

module.exports['encrypt'] = (authBlob) => {
    _checkIsSet(authBlob, 'secureBlob.encryptBlob - authBlob');
    return _encrypt(JSON.stringify(authBlob || false));
};

// ******************************

module.exports['decrypt'] = (authBlob) => {
    _checkIsSet(authBlob, 'secureBlob.decryptBlob - authBlob');
    try {
        return JSON.parse(_decrypt(authBlob));
    } catch (err) {
        return {};
    }
};

// ******************************
// Helper Functions:
// ******************************

function _encrypt(text) {
    const iv = Buffer.from(crypto.randomBytes(16));
    const cipher = crypto.createCipheriv('aes-256-ctr', k_AUTH_BLOB_SECRET, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return `${iv.toString('hex')}:${encrypted.toString()}`;
}

// ******************************

function _decrypt(encrypted) {
    const textParts = encrypted.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-ctr', k_AUTH_BLOB_SECRET, iv);

    const encryptedText = Buffer.from(textParts.join(':'), 'hex');

    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted.toString();
}

// ******************************

function _checkIsSet(in_value, in_displayName) {
    if (typeof in_value === 'undefined') throw new Error(`${in_displayName} not set!`);
}

// ******************************
