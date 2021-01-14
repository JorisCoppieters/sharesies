import { randomBytes, createCipheriv, createDecipheriv } from "crypto";

// ******************************
// Constants:
// ******************************

const k_AUTH_BLOB_SECRET = '8FD809772E6D42319BB53A1C596A1421';

// ******************************
// Function Exports:
// ******************************

export function encrypt(in_authBlob: object | string) {
    return _encrypt(JSON.stringify(in_authBlob || false));
}

// ******************************

export function decrypt(in_authBlob: string) {
    try {
        return JSON.parse(_decrypt(in_authBlob));
    } catch (err) {
        return {};
    }
}

// ******************************
// Helper Functions:
// ******************************

function _encrypt(in_text: string) {
    const iv = Buffer.from(randomBytes(16));
    const cipher = createCipheriv('aes-256-ctr', k_AUTH_BLOB_SECRET, iv);

    let encrypted = cipher.update(in_text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return `${iv.toString('hex')}:${encrypted.toString()}`;
}

// ******************************

function _decrypt(in_encrypted: string) {
    const textParts = in_encrypted.split(':');
    const iv = Buffer.from(textParts[0], 'hex');
    const decipher = createDecipheriv('aes-256-ctr', k_AUTH_BLOB_SECRET, iv);

    const encryptedText = Buffer.from(textParts[1], 'hex');

    let decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()]);
    return decrypted.toString();
}

// ******************************
