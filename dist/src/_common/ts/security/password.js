"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSalt = exports.hashPassword = void 0;
const crypto_1 = __importDefault(require("crypto"));
function hashPassword(in_password) {
    if (!in_password) {
        return null;
    }
    return crypto_1.default.createHash('sha1').update(in_password).digest('base64');
}
exports.hashPassword = hashPassword;
function generateSalt() {
    return Buffer.from(crypto_1.default.randomBytes(8)).toString('hex');
}
exports.generateSalt = generateSalt;
