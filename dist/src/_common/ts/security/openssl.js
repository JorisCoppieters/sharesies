"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createHttpsServerOptions = void 0;
const vars_1 = require("../env/server/vars");
const dict = __importStar(require("../system/dict"));
const fsPlus = __importStar(require("../system/fsplus"));
const bluebird_1 = require("bluebird");
function createHttpsServerOptions() {
    return bluebird_1.Promise.resolve()
        .then(() => fsPlus.checkExists(`${vars_1.CERTS_FOLDER}/${vars_1.ENV_PREFIX}${vars_1.HOST}.crt`))
        .then((exists) => !exists
        ? null
        : dict.resolveKeyValues({
            cert: fsPlus.readFile(`${vars_1.CERTS_FOLDER}/${vars_1.ENV_PREFIX}${vars_1.HOST}.crt`),
            key: fsPlus.readFile(`${vars_1.CERTS_FOLDER}/${vars_1.ENV_PREFIX}${vars_1.HOST}.key`),
        }));
}
exports.createHttpsServerOptions = createHttpsServerOptions;
