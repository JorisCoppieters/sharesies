// ******************************
// Imports:
// ******************************

import { getCredentials, setCredentials, saveCredentials } from './src/_common/ts/security/credentials';
import { login } from './src/sharesies/sharesies';

// import Promise from 'bluebird';
import { readLineSync, readHiddenLineSync } from './src/_common/ts/system/readline';

// ******************************
// Script:
// ******************************

if (!getCredentials('username')) {
    setCredentials('username', readLineSync('Please enter your username').trim());
}
if (!getCredentials('password')) {
    setCredentials('password', readHiddenLineSync('Please enter your password').trim());
}

saveCredentials();

let loginData = login(getCredentials('username'), getCredentials('password'));
console.log(loginData);

// ******************************
