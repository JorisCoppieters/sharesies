'use strict'; // JS: ES6

// ******************************
// Functions:
// ******************************

function getOrderedKeys(in_dictionary) {
    return Object.keys(in_dictionary).sort();
}

// ******************************

function getOrderedValues(in_dictionary, in_castFunction) {
    return getOrderedKeys(in_dictionary).map(key => in_castFunction ? in_castFunction(in_dictionary[key]) : in_dictionary[key]);
}

// ******************************
// Exports:
// ******************************

module.exports['getOrderedKeys'] = getOrderedKeys;
module.exports['getOrderedValues'] = getOrderedValues;

// ******************************
