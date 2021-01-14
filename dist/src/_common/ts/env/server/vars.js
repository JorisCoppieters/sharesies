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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CONFIG = exports.ASSETS_FOLDER = exports.SITE_FOLDER = exports.CERTS_FOLDER = exports.HOME_FOLDER = exports.ROOT_FOLDER = exports.SOCKET_NAME_SPACE = exports.SOCKET_URL = exports.SERVER_URL = exports.WEB_URL = exports.PORT_PREFIX = exports.WEB_PORT_PREFIX = exports.WEB_HTTPS_PORT = exports.HTTPS_PORT = exports.HTTP_PORT = exports.ENV_PREFIX = exports.SHORT_ENV = exports.IS_PROD = exports.IS_TEST = exports.IS_DEV = exports.ENV = exports.ADMIN_PASSWORD = exports.HOST = exports.LOCAL_STORAGE_PREFIX = exports.SESSION_STORAGE_PREFIX = exports.APP_NAME_UPPERCASE_VARIABLE = exports.APP_NAME_VARIABLE = exports.APP_NAME = exports.VERSION = void 0;
const env_config_1 = require("./models/env-config");
const enums_1 = require("../enums");
const fsplus_1 = require("../../system/fsplus");
const logger = __importStar(require("./logger"));
const path_1 = __importDefault(require("path"));
const cprint = require('color-print');
const version = parseInt(process.env.APP_VERSION || '', 10) || 1;
exports.VERSION = version;
const appName = process.env.APP_NAME || 'My App';
exports.APP_NAME = appName;
exports.APP_NAME_VARIABLE = exports.APP_NAME.replace(/[ _]/, '-').toLowerCase();
exports.APP_NAME_UPPERCASE_VARIABLE = exports.APP_NAME.replace(/[ _-]/, '_').toUpperCase();
exports.SESSION_STORAGE_PREFIX = exports.APP_NAME_VARIABLE;
exports.LOCAL_STORAGE_PREFIX = exports.APP_NAME_VARIABLE;
const appHost = process.env.APP_HOST || `${exports.APP_NAME_VARIABLE}.jobot-software.com`;
exports.HOST = appHost;
const envType = _extractValidEnum('APP_ENV_TYPE', enums_1.ENV_TYPE, enums_1.ENV_TYPE.Development);
const debugMode = !!_getArgumentFlags().debug;
const verboseMode = !!_getArgumentFlags().verbose;
const portIdx = parseInt(process.env.APP_PORT_IDX || '', 10) || 0;
exports.ADMIN_PASSWORD = process.env[`${exports.APP_NAME_UPPERCASE_VARIABLE}_ADMIN_PASSWORD`] || null;
exports.ENV = envType;
exports.IS_DEV = envType === enums_1.ENV_TYPE.Development;
exports.IS_TEST = envType === enums_1.ENV_TYPE.Test;
exports.IS_PROD = envType === enums_1.ENV_TYPE.Production;
exports.SHORT_ENV = exports.IS_PROD ? 'prod' : exports.IS_TEST ? 'test' : 'dev';
exports.ENV_PREFIX = exports.IS_PROD ? '' : `${exports.SHORT_ENV}.`;
let logLevel = _extractValidEnum('APP_LOG_LEVEL', enums_1.LOG_LEVEL, enums_1.LOG_LEVEL.Info);
if (debugMode) {
    logLevel = Math.max(logLevel, enums_1.LOG_LEVEL.Debug);
}
else if (verboseMode) {
    logLevel = Math.max(logLevel, enums_1.LOG_LEVEL.Verbose);
}
else if (exports.IS_PROD) {
    logLevel = enums_1.LOG_LEVEL.Warning;
}
logger.configureLogLevel(logLevel);
const prodPortGroup = 4000;
const prodWebPortGroup = 5000;
const testPortGroup = 6000;
const testWebPortGroup = 7000;
const devPortGroup = 8000;
const devWebPortGroup = 9000;
exports.HTTP_PORT = (exports.IS_PROD ? prodPortGroup : exports.IS_TEST ? testPortGroup : devPortGroup) + portIdx * 10;
exports.HTTPS_PORT = (exports.IS_PROD ? prodPortGroup : exports.IS_TEST ? testPortGroup : devPortGroup) + portIdx * 10 + 1;
exports.WEB_HTTPS_PORT = (exports.IS_PROD ? prodWebPortGroup : exports.IS_TEST ? testWebPortGroup : devWebPortGroup) + portIdx * 10 + 1;
exports.WEB_PORT_PREFIX = exports.IS_DEV ? `:${exports.WEB_HTTPS_PORT}` : '';
exports.PORT_PREFIX = exports.IS_DEV ? `:${exports.HTTPS_PORT}` : '';
exports.WEB_URL = `https://${exports.ENV_PREFIX}${appHost}${exports.IS_DEV ? `:${exports.WEB_HTTPS_PORT}` : ''}`;
exports.SERVER_URL = `https://${exports.ENV_PREFIX}${appHost}${exports.IS_DEV ? `:${exports.HTTPS_PORT}` : ''}`;
exports.SOCKET_URL = `https://${exports.ENV_PREFIX}${appHost}${exports.IS_DEV ? `:${exports.HTTPS_PORT}` : ''}`;
exports.SOCKET_NAME_SPACE = 'ws';
exports.ROOT_FOLDER = path_1.default.join(__dirname, exports.IS_DEV ? `../../../../..` : `../../../..`);
exports.HOME_FOLDER = process.env.HOME;
exports.CERTS_FOLDER = exports.IS_DEV ? path_1.default.join(exports.ROOT_FOLDER, `src/_cert`) : path_1.default.join(exports.HOME_FOLDER, 'certs');
fsplus_1.mkdir(exports.CERTS_FOLDER);
exports.SITE_FOLDER = path_1.default.join(exports.ROOT_FOLDER, exports.IS_DEV ? 'dist/site' : 'site');
exports.ASSETS_FOLDER = path_1.default.join(exports.ROOT_FOLDER, exports.IS_DEV ? 'dist/site/assets' : 'site/assets');
exports.CONFIG = new env_config_1.EnvConfig(logLevel);
logger.info(`${exports.APP_NAME} Environment Variables:`);
logger.info(`  ${cprint.toGreen('ENV')} => ${cprint.toCyan(exports.ENV)}`);
logger.info(`  ${cprint.toGreen('SHORT_ENV')} => ${cprint.toCyan(exports.SHORT_ENV)}`);
logger.info(`  ${cprint.toGreen('LOG_LEVEL')} => ${cprint.toCyan(logLevel)}`);
function _getArgumentFlags() {
    try {
        return require('minimist')(process.argv.slice(2));
    }
    catch (e) {
        return [];
    }
}
function _extractValidEnum(in_envVariableKey, in_enum, in_default) {
    let envVariable = process.env[in_envVariableKey];
    if (!isNaN(+envVariable)) {
        envVariable = parseInt(envVariable, 10);
    }
    if (Object.keys(in_enum)
        .map((key) => in_enum[key])
        .indexOf(envVariable) >= 0) {
        return envVariable;
    }
    if (typeof envVariable === 'undefined') {
        return in_default;
    }
    logger.error(`Environment variable not configured correctly: ${in_envVariableKey}`);
    return in_default;
}
