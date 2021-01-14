"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function default_1(in_start, in_end) {
    const dayMult = 1000 * 60 * 60 * 24;
    const start = new Date(in_start);
    start.setHours(0);
    start.setMinutes(0);
    start.setSeconds(0);
    start.setMilliseconds(0);
    const end = new Date(in_end);
    end.setHours(0);
    end.setMinutes(0);
    end.setSeconds(0);
    end.setMilliseconds(0);
    return Math.floor((end.getTime() - start.getTime()) / dayMult + 0.5);
}
exports.default = default_1;
