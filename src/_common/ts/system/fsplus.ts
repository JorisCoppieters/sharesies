// ******************************
// Imports:
// ******************************

import fs from 'fs';

// ******************************
// Declarations:
// ******************************

export function readJSONFile(in_filePath: string): Promise<object> {
    return new Promise((resolve, reject) => {
        fs.readFile(in_filePath, (error, content) => {
            if (error) {
                return reject(error);
            }
            return resolve(JSON.parse(content.toString()));
        });
    });
}

// ******************************

export function writeJSONFile(in_filePath: string, in_fileContents: string | object): Promise<boolean> {
    return new Promise((resolve, reject) => {
        fs.writeFile(in_filePath, JSON.stringify(in_fileContents), (error) => {
            if (error) {
                return reject(error);
            }
            return resolve(true);
        });
    });
}

// ******************************

export function readFile(in_filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
        fs.readFile(in_filePath, (error, content) => {
            if (error) {
                return reject(error);
            }
            return resolve(content.toString());
        });
    });
}

// ******************************

export function writeFile(in_filePath: string, in_fileContents: string | Buffer): Promise<boolean> {
    return new Promise((resolve, reject) => {
        fs.writeFile(in_filePath, in_fileContents, (error) => {
            if (error) {
                return reject(error);
            }
            return resolve(true);
        });
    });
}

// ******************************

export function removeFile(in_filePath: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
        fs.unlink(in_filePath, (error) => {
            if (error) {
                return reject(error);
            }
            return resolve(true);
        });
    });
}

// ******************************

export function mkdir(in_folderPath: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
        fs.exists(in_folderPath, (exists) => {
            if (exists) {
                return resolve(true);
            }
            fs.mkdir(in_folderPath, (error) => {
                if (error) {
                    return reject(error);
                }
                return resolve(true);
            });
        });
    });
}

// ******************************

export function checkExists(in_filePath: string): Promise<boolean> {
    return new Promise((resolve) => {
        fs.exists(in_filePath, (exists) => {
            return resolve(exists);
        });
    });
}

// ******************************
