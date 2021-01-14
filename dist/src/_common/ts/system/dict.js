"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrderedValues = exports.getOrderedKeys = exports.fromEntries = exports.toEntries = exports.resolveKeyValues = void 0;
const entries_options_1 = require("./models/entries-options");
const bluebird_1 = require("bluebird");
function resolveKeyValues(in_dict) {
    return bluebird_1.Promise.all(_toEntries(in_dict).map((entry) => (_isPromise(entry.value) ? entry.value : bluebird_1.Promise.resolve(entry.value)).then((value) => _keyValObj(entry.key, value)))).then(_fromEntries);
}
exports.resolveKeyValues = resolveKeyValues;
function toEntries(in_object, in_options = new entries_options_1.EntriesOptions()) {
    return _toEntries(in_object, in_options);
}
exports.toEntries = toEntries;
function fromEntries(in_object, in_options = new entries_options_1.EntriesOptions()) {
    return _fromEntries(in_object, in_options);
}
exports.fromEntries = fromEntries;
function getOrderedKeys(in_dictionary) {
    return Object.keys(in_dictionary).sort();
}
exports.getOrderedKeys = getOrderedKeys;
function getOrderedValues(in_dictionary, in_castFunction) {
    return getOrderedKeys(in_dictionary).map((key) => (in_castFunction ? in_castFunction(in_dictionary[key]) : in_dictionary[key]));
}
exports.getOrderedValues = getOrderedValues;
function _isPromise(in_value) {
    return in_value && typeof in_value === 'object' && typeof in_value.then === 'function';
}
function _keyValObj(in_key, in_value) {
    return {
        key: in_key,
        value: in_value,
    };
}
function _toEntries(in_object, in_options = new entries_options_1.EntriesOptions()) {
    if (!in_object) {
        throw new Error('dict.toEntries - in_object is invalid');
    }
    return Object.keys(in_object).map((key) => {
        const entry = {};
        entry[in_options.keyField || 'key'] = key;
        entry[in_options.valueField || 'value'] = in_object[key];
        return entry;
    });
}
function _fromEntries(in_entries, in_options = new entries_options_1.EntriesOptions()) {
    if (!in_entries) {
        throw new Error('dict.fromEntries - in_entries is invalid');
    }
    return in_entries.reduce((object, entry) => {
        const key = entry[in_options.keyField || 'key'];
        const value = entry[in_options.valueField || 'value'];
        object[key] = value;
        return object;
    }, {});
}
