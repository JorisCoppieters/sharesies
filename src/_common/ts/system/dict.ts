import { EntriesOptions } from './models/entries-options';
import { Promise } from 'bluebird';

// ******************************
// Declarations:
// ******************************

// tslint:disable:no-any

export function resolveKeyValues(in_dict: any) {
    return Promise.all(
        _toEntries(in_dict).map((entry) =>
            (_isPromise(entry.value) ? entry.value : Promise.resolve(entry.value)).then((value: any) => _keyValObj(entry.key, value))
        )
    ).then(_fromEntries);
}

// ******************************

export function toEntries(in_object: any, in_options: EntriesOptions = new EntriesOptions()): any {
    return _toEntries(in_object, in_options);
}

// ******************************

export function fromEntries(in_object: any, in_options: EntriesOptions = new EntriesOptions()): any {
    return _fromEntries(in_object, in_options);
}

// ******************************

export function getOrderedKeys(in_dictionary: { [key: string]: any }) {
    return Object.keys(in_dictionary).sort();
}

// ******************************

export function getOrderedValues(in_dictionary: { [key: string]: any }, in_castFunction: Function) {
    return getOrderedKeys(in_dictionary).map((key) => (in_castFunction ? in_castFunction(in_dictionary[key]) : in_dictionary[key]));
}

// ******************************
// Helper Functions:
// ******************************

function _isPromise(in_value: any) {
    return in_value && typeof in_value === 'object' && typeof in_value.then === 'function';
}

// ******************************

function _keyValObj(in_key: any, in_value: any) {
    return {
        key: in_key,
        value: in_value,
    };
}

// ******************************

function _toEntries(in_object: any, in_options: EntriesOptions = new EntriesOptions()) {
    if (!in_object) {
        throw new Error('dict.toEntries - in_object is invalid');
    }
    return Object.keys(in_object).map((key) => {
        const entry: any = {};
        entry[in_options.keyField || 'key'] = key;
        entry[in_options.valueField || 'value'] = in_object[key];
        return entry;
    });
}

// ******************************

function _fromEntries(in_entries: any, in_options: EntriesOptions = new EntriesOptions()) {
    if (!in_entries) {
        throw new Error('dict.fromEntries - in_entries is invalid');
    }
    return in_entries.reduce((object: any, entry: any) => {
        const key = entry[in_options.keyField || 'key'];
        const value = entry[in_options.valueField || 'value'];
        object[key] = value;
        return object;
    }, {});
}

// ******************************
