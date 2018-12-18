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
