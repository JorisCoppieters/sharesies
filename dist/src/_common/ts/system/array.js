"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.forEachThen = void 0;
const bluebird_1 = __importDefault(require("bluebird"));
function forEachThen(in_array, in_action) {
    return new bluebird_1.default((resolveAll) => {
        in_array
            .reduce((state, item, idx) => state.then(() => {
            return in_action(item, idx);
        }), bluebird_1.default.resolve())
            .then(resolveAll);
    });
}
exports.forEachThen = forEachThen;
