// ******************************
// Imports:
// ******************************

import crypto from 'crypto';

// ******************************
// Declarations:
// ******************************

export function hashPassword(in_password: string | null): string | null {
    if (!in_password) {
        return null;
    }

    return crypto.createHash('sha1').update(in_password).digest('base64');
}

// ******************************

export function generateSalt(): string {
    return Buffer.from(crypto.randomBytes(8)).toString('hex');
}

// ******************************
