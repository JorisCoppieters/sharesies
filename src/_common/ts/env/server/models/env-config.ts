import { ApiConfig } from './api-config';
import { AppConfig } from './app-config';

// ******************************
// Declarations:
// ******************************

export class EnvConfig {
    api: ApiConfig;
    app: AppConfig;

    constructor(in_logLevel: number) {
        this.api = new ApiConfig(in_logLevel);
        this.app = new AppConfig(in_logLevel);
    }
}

// ******************************
