"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const guid_1 = require("./guid");
describe('guid', () => {
    test(`generate`, () => expect(guid_1.generateGuid()).toMatch(new RegExp(/[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}/i)));
});
