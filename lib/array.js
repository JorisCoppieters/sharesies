'use strict'; // JS: ES6

// ******************************
// Requires:
// ******************************

const Promise = require('bluebird');

// ******************************
// Prototypes:
// ******************************

Array.prototype.forEachThen = function (in_action) {
    return new Promise((resolveAll) => {
        this.reduce(
            (state, item, idx) =>
                state.then(() => {
                    return in_action(item, idx);
                }),
            Promise.resolve()
        ).then(resolveAll);
    });
};

// ******************************
