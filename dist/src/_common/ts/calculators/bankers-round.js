"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function default_1(in_value) {
    const x = in_value * 100;
    const r = Math.round(x);
    const br = (x > 0 ? x : -x) % 1 === 0.5 ? (0 === r % 2 ? r : r - 1) : r;
    return br / 100;
}
exports.default = default_1;
