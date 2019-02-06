'use strict'; // JS: ES6

// ******************************
// Prototypes:
// ******************************

String.prototype.leftPad = function (in_pad, in_padAmount) {
    let str = this;
    let pad = in_pad || ' ';
    let padAmount = in_padAmount || str.length;
    return (pad.repeat(padAmount) + str).substr(-padAmount);
};

// ******************************

String.prototype.rightPad = function (in_pad, in_padAmount) {
    let str = this;
    let pad = in_pad || ' ';
    let padAmount = in_padAmount || str.length;
    return (str + pad.repeat(padAmount)).substr(0, padAmount);
};

// ******************************

String.prototype.centerPad = function (in_pad, in_padAmount) {
    let str = this;
    let pad = in_pad || ' ';
    let padAmount = in_padAmount || str.length;

    while (str.length < padAmount) {
        let leftOrRight = (str.length % 2 === 1);
        str = (leftOrRight ? pad : '') + str + (leftOrRight ? '' : pad);
    }

    return str;
};


// ******************************
// Exports:
// ******************************

module.exports['toTitleCase'] = (in_contents, in_options) => {
    let opts = in_options || {};
    opts.onlyAdjustFirstLetter = opts.onlyAdjustFirstLetter || false;

    return in_contents
        .replace(/\w\S*/g, (txt) => {
            if (opts.onlyAdjustFirstLetter) {
                return txt.charAt(0).toUpperCase() + txt.substr(1);
            } else {
                return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
            }
        });
};

// ******************************

module.exports['trimObject'] = (in_data) => {
    return _trimObject(in_data);
};

// ******************************
// Helper Functions:
// ******************************

function _trimObject(in_data) {
    let data = in_data;
    let dataType = typeof(data);
    if (data !== null && dataType === 'object') {
        if (Array.isArray(data)) {
            let arrayCutOff = 10;
            if (data.length > arrayCutOff) {
                data = data.slice(0, arrayCutOff).concat([`(${data.length - arrayCutOff} more...)`]);
            }
            data = data
                .map(val => _trimObject(val));
        } else if (data instanceof Date) {
            return data.toString();
        } else {
            data = Object.keys(data)
                .reduce((dict, key) => {
                    dict[key] = _trimObject(data[key]);
                    return dict;
                }, {});
        }
    } else if (dataType === 'string') {
        if (data.length > 1000) {
            data = data.slice(0, 1000) + '...';
        }
    }

    return data;
}

// ******************************
