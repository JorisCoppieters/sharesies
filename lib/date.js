'use strict'; // JS: ES6

// ******************************
// Prototypes:
// ******************************

Date.prototype.toDateStamp = function () {
    let dateObj = this;
    let year = dateObj.getFullYear();
    let month = ('0' + (dateObj.getMonth() + 1)).slice(-2);
    let date = ('0' + dateObj.getDate()).slice(-2);
    return year + '-' + month + '-' + date;
};

// ******************************
// Functions:
// ******************************

function getDateStampRange(in_numDays) {
    let numDays = in_numDays || 365;
    let dateKeys = [...Array(numDays).keys()]
        .map(day => new Date(Date.now() - (3600 * 24 * 1000 * day)))
        .map(date => date.toDateStamp());
    return dateKeys;
}

// ******************************
// Exports:
// ******************************

module.exports['getDateStampRange'] = getDateStampRange;

// ******************************
