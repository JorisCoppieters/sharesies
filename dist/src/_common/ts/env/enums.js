"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.API_METHOD = exports.LOG_LEVEL = exports.ENV_TYPE = void 0;
var ENV_TYPE;
(function (ENV_TYPE) {
    ENV_TYPE["Development"] = "Development";
    ENV_TYPE["Test"] = "Test";
    ENV_TYPE["Production"] = "Production";
})(ENV_TYPE = exports.ENV_TYPE || (exports.ENV_TYPE = {}));
var LOG_LEVEL;
(function (LOG_LEVEL) {
    LOG_LEVEL[LOG_LEVEL["Off"] = 0] = "Off";
    LOG_LEVEL[LOG_LEVEL["Error"] = 1] = "Error";
    LOG_LEVEL[LOG_LEVEL["Warning"] = 2] = "Warning";
    LOG_LEVEL[LOG_LEVEL["Info"] = 3] = "Info";
    LOG_LEVEL[LOG_LEVEL["Verbose"] = 4] = "Verbose";
    LOG_LEVEL[LOG_LEVEL["Debug"] = 5] = "Debug";
})(LOG_LEVEL = exports.LOG_LEVEL || (exports.LOG_LEVEL = {}));
var API_METHOD;
(function (API_METHOD) {
    API_METHOD["Post"] = "POST";
    API_METHOD["Get"] = "GET";
    API_METHOD["Put"] = "PUT";
    API_METHOD["Delete"] = "DELETE";
})(API_METHOD = exports.API_METHOD || (exports.API_METHOD = {}));
