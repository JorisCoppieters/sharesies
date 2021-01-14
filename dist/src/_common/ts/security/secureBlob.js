"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decrypt = exports.encrypt = void 0;
const crypto_1 = require("crypto");
const k_AUTH_BLOB_SECRET = '8FD809772E6D42319BB53A1C596A1421';
function encrypt(in_authBlob) {
    return _encrypt(JSON.stringify(in_authBlob || false));
}
exports.encrypt = encrypt;
function decrypt(in_authBlob) {
    try {
        return JSON.parse(_decrypt(in_authBlob));
    }
    catch (err) {
        return {};
    }
}
exports.decrypt = decrypt;
function _encrypt(in_text) {
    const iv = Buffer.from(crypto_1.randomBytes(16));
    const cipher = crypto_1.createCipheriv('aes-256-ctr', k_AUTH_BLOB_SECRET, iv);
    let encrypted = cipher.update(in_text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted.toString()}`;
}
function _decrypt(in_encrypted) {
    const textParts = in_encrypted.split(':');
    const iv = Buffer.from(textParts[0], 'hex');
    const decipher = crypto_1.createDecipheriv('aes-256-ctr', k_AUTH_BLOB_SECRET, iv);
    const encryptedText = Buffer.from(textParts[1], 'hex');
    let decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()]);
    return decrypted.toString();
}
