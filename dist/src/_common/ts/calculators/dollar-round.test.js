"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dollar_round_1 = __importDefault(require("./dollar-round"));
describe('Dollar Round', () => {
    test(`0`, () => expect(dollar_round_1.default(0)).toEqual(0));
    test(`0.01`, () => expect(dollar_round_1.default(0.01)).toEqual(0));
    test(`0.994`, () => expect(dollar_round_1.default(0.994)).toEqual(0));
    test(`0.995`, () => expect(dollar_round_1.default(0.995)).toEqual(1));
    test(`0.999`, () => expect(dollar_round_1.default(0.999)).toEqual(1));
    test(`-0.994`, () => expect(dollar_round_1.default(-0.994)).toEqual(0));
    test(`-0.995`, () => expect(dollar_round_1.default(-0.995)).toEqual(-1));
    test(`-0.999`, () => expect(dollar_round_1.default(-0.999)).toEqual(-1));
    test(`1000.123`, () => expect(dollar_round_1.default(1000.123)).toEqual(1000));
    test(`-40.40`, () => expect(dollar_round_1.default(-40.4)).toEqual(-40));
    test(`1.525`, () => expect(dollar_round_1.default(1.525)).toEqual(1));
    test(`12.245`, () => expect(dollar_round_1.default(12.245)).toEqual(12));
    test(`12.999`, () => expect(dollar_round_1.default(12.999)).toEqual(13));
});
