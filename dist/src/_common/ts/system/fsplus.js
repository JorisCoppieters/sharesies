"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkExists = exports.mkdir = exports.removeFile = exports.writeFile = exports.readFile = exports.writeJSONFile = exports.readJSONFile = void 0;
const fs_1 = __importDefault(require("fs"));
function readJSONFile(in_filePath) {
    return new Promise((resolve, reject) => {
        fs_1.default.readFile(in_filePath, (error, content) => {
            if (error) {
                return reject(error);
            }
            return resolve(JSON.parse(content.toString()));
        });
    });
}
exports.readJSONFile = readJSONFile;
function writeJSONFile(in_filePath, in_fileContents) {
    return new Promise((resolve, reject) => {
        fs_1.default.writeFile(in_filePath, JSON.stringify(in_fileContents), (error) => {
            if (error) {
                return reject(error);
            }
            return resolve(true);
        });
    });
}
exports.writeJSONFile = writeJSONFile;
function readFile(in_filePath) {
    return new Promise((resolve, reject) => {
        fs_1.default.readFile(in_filePath, (error, content) => {
            if (error) {
                return reject(error);
            }
            return resolve(content.toString());
        });
    });
}
exports.readFile = readFile;
function writeFile(in_filePath, in_fileContents) {
    return new Promise((resolve, reject) => {
        fs_1.default.writeFile(in_filePath, in_fileContents, (error) => {
            if (error) {
                return reject(error);
            }
            return resolve(true);
        });
    });
}
exports.writeFile = writeFile;
function removeFile(in_filePath) {
    return new Promise((resolve, reject) => {
        fs_1.default.unlink(in_filePath, (error) => {
            if (error) {
                return reject(error);
            }
            return resolve(true);
        });
    });
}
exports.removeFile = removeFile;
function mkdir(in_folderPath) {
    return new Promise((resolve, reject) => {
        fs_1.default.exists(in_folderPath, (exists) => {
            if (exists) {
                return resolve(true);
            }
            fs_1.default.mkdir(in_folderPath, (error) => {
                if (error) {
                    return reject(error);
                }
                return resolve(true);
            });
        });
    });
}
exports.mkdir = mkdir;
function checkExists(in_filePath) {
    return new Promise((resolve) => {
        fs_1.default.exists(in_filePath, (exists) => {
            return resolve(exists);
        });
    });
}
exports.checkExists = checkExists;
