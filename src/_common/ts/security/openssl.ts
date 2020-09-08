import { CERTS_FOLDER, ENV_PREFIX, HOST } from '../env/server/vars';
import * as dict from '../system/dict';
import * as fsPlus from '../system/fsplus';

import { Promise } from 'bluebird';
import { ServerOptions } from 'https';

// ******************************
// Declarations:
// ******************************

export function createHttpsServerOptions(): Promise<ServerOptions | null> {
    return Promise.resolve()
        .then(() => fsPlus.checkExists(`${CERTS_FOLDER}/${ENV_PREFIX}${HOST}.crt`))
        .then((exists) =>
            !exists
                ? null
                : dict.resolveKeyValues({
                      cert: fsPlus.readFile(`${CERTS_FOLDER}/${ENV_PREFIX}${HOST}.crt`),
                      key: fsPlus.readFile(`${CERTS_FOLDER}/${ENV_PREFIX}${HOST}.key`),
                  })
        );
}

// ******************************
