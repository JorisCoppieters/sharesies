import { EnvConfig } from './models/env-config';
import { LOG_LEVEL, ENV_TYPE } from '../enums';
import { mkdir } from '../../system/fsplus';
import * as logger from './logger';

import path from 'path';

const cprint = require('color-print');

// ******************************
// Configuration:
// ******************************

const version = parseInt(process.env.APP_VERSION || '', 10) || 1;
export const VERSION = version;

const appName = (process.env.APP_NAME as string) || 'My App';
export const APP_NAME = appName;
export const APP_NAME_VARIABLE = APP_NAME.replace(/[ _]/, '-').toLowerCase();
export const APP_NAME_UPPERCASE_VARIABLE = APP_NAME.replace(/[ _-]/, '_').toUpperCase();
export const SESSION_STORAGE_PREFIX = APP_NAME_VARIABLE;
export const LOCAL_STORAGE_PREFIX = APP_NAME_VARIABLE;

const appHost = (process.env.APP_HOST as string) || `${APP_NAME_VARIABLE}.jobot-software.com`;
export const HOST = appHost;

const envType = _extractValidEnum('APP_ENV_TYPE', ENV_TYPE, ENV_TYPE.Development);

const debugMode = !!_getArgumentFlags().debug;
const verboseMode = !!_getArgumentFlags().verbose;

const portIdx = parseInt(process.env.APP_PORT_IDX || '', 10) || 0;

export const ADMIN_PASSWORD = process.env[`${APP_NAME_UPPERCASE_VARIABLE}_ADMIN_PASSWORD`] || null;

export const ENV: ENV_TYPE = envType;
export const IS_DEV = envType === ENV_TYPE.Development;
export const IS_TEST = envType === ENV_TYPE.Test;
export const IS_PROD = envType === ENV_TYPE.Production;
export const SHORT_ENV: string = IS_PROD ? 'prod' : IS_TEST ? 'test' : 'dev';
export const ENV_PREFIX: string = IS_PROD ? '' : `${SHORT_ENV}.`;

let logLevel = _extractValidEnum('APP_LOG_LEVEL', LOG_LEVEL, LOG_LEVEL.Info);
if (debugMode) {
    logLevel = Math.max(logLevel, LOG_LEVEL.Debug);
} else if (verboseMode) {
    logLevel = Math.max(logLevel, LOG_LEVEL.Verbose);
} else if (IS_PROD) {
    logLevel = LOG_LEVEL.Warning;
}

logger.configureLogLevel(logLevel);

const prodPortGroup = 4000;
const prodWebPortGroup = 5000;
const testPortGroup = 6000;
const testWebPortGroup = 7000;
const devPortGroup = 8000;
const devWebPortGroup = 9000;
export const HTTP_PORT = (IS_PROD ? prodPortGroup : IS_TEST ? testPortGroup : devPortGroup) + portIdx * 10;
export const HTTPS_PORT = (IS_PROD ? prodPortGroup : IS_TEST ? testPortGroup : devPortGroup) + portIdx * 10 + 1;
export const WEB_HTTPS_PORT = (IS_PROD ? prodWebPortGroup : IS_TEST ? testWebPortGroup : devWebPortGroup) + portIdx * 10 + 1;

export const WEB_PORT_PREFIX = IS_DEV ? `:${WEB_HTTPS_PORT}` : '';
export const PORT_PREFIX = IS_DEV ? `:${HTTPS_PORT}` : '';

export const WEB_URL = `https://${ENV_PREFIX}${appHost}${IS_DEV ? `:${WEB_HTTPS_PORT}` : ''}`;

export const SERVER_URL = `https://${ENV_PREFIX}${appHost}${IS_DEV ? `:${HTTPS_PORT}` : ''}`;

export const SOCKET_URL = `https://${ENV_PREFIX}${appHost}${IS_DEV ? `:${HTTPS_PORT}` : ''}`;
export const SOCKET_NAME_SPACE = 'ws';

export const ROOT_FOLDER = path.join(__dirname, IS_DEV ? `../../../../..` : `../../../..`);
export const HOME_FOLDER = process.env.HOME as string;

export const CERTS_FOLDER = IS_DEV ? path.join(ROOT_FOLDER, `src/_cert`) : path.join(HOME_FOLDER, 'certs');
mkdir(CERTS_FOLDER);

export const SITE_FOLDER = path.join(ROOT_FOLDER, IS_DEV ? 'dist/site' : 'site');

export const ASSETS_FOLDER = path.join(ROOT_FOLDER, IS_DEV ? 'dist/site/assets' : 'site/assets');

export const CONFIG = new EnvConfig(logLevel);

logger.info(`${APP_NAME} Environment Variables:`);
logger.info(`  ${cprint.toGreen('ENV')} => ${cprint.toCyan(ENV)}`);
logger.info(`  ${cprint.toGreen('SHORT_ENV')} => ${cprint.toCyan(SHORT_ENV)}`);
logger.info(`  ${cprint.toGreen('LOG_LEVEL')} => ${cprint.toCyan(logLevel)}`);

// ******************************
// Helper Functions:
// ******************************

function _getArgumentFlags() {
    try {
        return require('minimist')(process.argv.slice(2));
    } catch (e) {
        return [];
    }
}

// ******************************

// tslint:disable-next-line:no-any
function _extractValidEnum(in_envVariableKey: string, in_enum: any, in_default: any) {
    // tslint:disable-next-line:no-any
    let envVariable: any = process.env[in_envVariableKey];
    if (!isNaN(+envVariable)) {
        envVariable = parseInt(envVariable, 10);
    }
    if (
        Object.keys(in_enum)
            .map((key) => in_enum[key])
            .indexOf(envVariable) >= 0
    ) {
        return envVariable;
    }
    if (typeof envVariable === 'undefined') {
        return in_default;
    }
    logger.error(`Environment variable not configured correctly: ${in_envVariableKey}`);
    return in_default;
}

// ******************************
