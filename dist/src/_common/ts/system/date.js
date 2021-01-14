"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fromDateStamp = exports.toDateStamp = exports.getDateStampRange = exports.getNiceDate = exports.getLedgerDateTimestamp = exports.getNiceDateTimestamp = exports.getDurationTimestamp = exports.curDateStamp = exports.getNow = void 0;
function getNow() {
    return new Date().getTime();
}
exports.getNow = getNow;
function curDateStamp() {
    const date = new Date();
    return [date.getFullYear(), ('00' + (date.getMonth() + 1)).slice(-2), ('00' + date.getDate()).slice(-2)].join('-');
}
exports.curDateStamp = curDateStamp;
function getDurationTimestamp(in_seconds) {
    const hours = Math.floor(in_seconds / 3600);
    const minutes = Math.floor((in_seconds - hours * 3600) / 60);
    const seconds = Math.floor(in_seconds - hours * 3600 - minutes * 60);
    const hoursPart = ('0' + hours).slice(-2);
    const minutesPart = ('0' + minutes).slice(-2);
    const secondsPart = ('0' + seconds).slice(-2);
    return hoursPart + ':' + minutesPart + ':' + secondsPart;
}
exports.getDurationTimestamp = getDurationTimestamp;
function getNiceDateTimestamp(in_date) {
    const dateObj = in_date ? new Date(in_date) : new Date();
    const year = dateObj.getFullYear();
    const month = ('0' + (dateObj.getMonth() + 1)).slice(-2);
    const date = ('0' + dateObj.getDate()).slice(-2);
    const hours = ('0' + dateObj.getHours()).slice(-2);
    const minutes = ('0' + dateObj.getMinutes()).slice(-2);
    const seconds = ('0' + dateObj.getSeconds()).slice(-2);
    return hours + ':' + minutes + ':' + seconds + ' ' + date + '/' + month + '/' + year;
}
exports.getNiceDateTimestamp = getNiceDateTimestamp;
function getLedgerDateTimestamp(in_date) {
    const dateObj = in_date ? new Date(in_date) : new Date();
    const year = dateObj.getFullYear();
    const month = ('0' + (dateObj.getMonth() + 1)).slice(-2);
    const date = ('0' + dateObj.getDate()).slice(-2);
    const hours = ('0' + dateObj.getHours()).slice(-2);
    const minutes = ('0' + dateObj.getMinutes()).slice(-2);
    const seconds = ('0' + dateObj.getSeconds()).slice(-2);
    return `${year}-${month}-${date} ${hours}:${minutes}:${seconds}`;
}
exports.getLedgerDateTimestamp = getLedgerDateTimestamp;
function getNiceDate(in_date) {
    const dateObj = in_date ? new Date(in_date) : new Date();
    const year = dateObj.getFullYear();
    const month = ('0' + (dateObj.getMonth() + 1)).slice(-2);
    const date = ('0' + dateObj.getDate()).slice(-2);
    return `${date}/${month}/${year}`;
}
exports.getNiceDate = getNiceDate;
function getDateStampRange(in_numDays) {
    let numDays = in_numDays || 365;
    let dateKeys = [...Array(numDays)].map((_, idx) => idx).map((day) => new Date(Date.now() - 3600 * 24 * 1000 * day)).map((date) => toDateStamp(date));
    return dateKeys;
}
exports.getDateStampRange = getDateStampRange;
function toDateStamp(in_date) {
    const dateObj = in_date ? new Date(in_date) : new Date();
    const year = dateObj.getFullYear();
    const month = ('0' + (dateObj.getMonth() + 1)).slice(-2);
    const date = ('0' + dateObj.getDate()).slice(-2);
    return `${year}-${month}-${date}`;
}
exports.toDateStamp = toDateStamp;
function fromDateStamp(in_date) {
    if (!in_date) {
        return new Date();
    }
    return new Date(`${in_date}`);
}
exports.fromDateStamp = fromDateStamp;
