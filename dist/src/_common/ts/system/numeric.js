"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.betweenRange = void 0;
function betweenRange(in_value, in_min, in_max) {
    return Math.min(in_max, Math.max(in_min, in_value));
}
exports.betweenRange = betweenRange;
