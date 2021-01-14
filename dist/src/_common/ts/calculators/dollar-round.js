"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function default_1(in_value) {
    const s = in_value < 0 ? -1 : 1;
    const v = Math.floor(Math.abs(in_value) + 0.005);
    if (v === 0)
        return 0;
    return v * s;
}
exports.default = default_1;
