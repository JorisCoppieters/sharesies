"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateGuid = void 0;
function generateGuid() {
    const s4 = () => Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}
exports.generateGuid = generateGuid;
