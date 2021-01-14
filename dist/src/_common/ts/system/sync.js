"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runGenerator = void 0;
function runGenerator(generatorFunction) {
    let next = function (err, arg) {
        if (err && typeof err === 'string')
            return it.throw(new Error(err));
        if (err)
            return it.throw(err);
        let result = it.next(arg);
        if (result.done)
            return;
        if (result.value && result.value.then) {
            result.value
                .then((resolveResult) => {
                next(null, resolveResult);
            })
                .catch((rejectResult) => {
                next(rejectResult, null);
            });
        }
        else {
            next(null, result.value);
        }
    };
    let it = generatorFunction();
    return next();
}
exports.runGenerator = runGenerator;
