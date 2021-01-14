"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bankers_round_1 = __importDefault(require("./bankers-round"));
describe('Bankers Round', () => {
    test(`0`, () => expect(bankers_round_1.default(0)).toEqual(0));
    test(`0.01`, () => expect(bankers_round_1.default(0.01)).toEqual(0.01));
    test(`0.001`, () => expect(bankers_round_1.default(0.001)).toEqual(0));
    test(`0.009`, () => expect(bankers_round_1.default(0.009)).toEqual(0.01));
    test(`1000.123`, () => expect(bankers_round_1.default(1000.123)).toEqual(1000.12));
    test(`-40.40`, () => expect(bankers_round_1.default(-40.40)).toEqual(-40.40));
    test(`-23.401`, () => expect(bankers_round_1.default(-23.401)).toEqual(-23.40));
    test(`-23.409`, () => expect(bankers_round_1.default(-23.409)).toEqual(-23.41));
    test(`1.525`, () => expect(bankers_round_1.default(1.525)).toEqual(1.52));
    test(`1.535`, () => expect(bankers_round_1.default(1.535)).toEqual(1.54));
    test(`12.245`, () => expect(bankers_round_1.default(12.245)).toEqual(12.24));
    test(`12.255`, () => expect(bankers_round_1.default(12.255)).toEqual(12.26));
});
