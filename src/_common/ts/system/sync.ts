export function runGenerator(generatorFunction: Function) {
    let next = function (err?: any, arg?: any) {
        if (err && typeof err === 'string') return it.throw(new Error(err));
        if (err) return it.throw(err);

        let result = it.next(arg);
        if (result.done) return;

        if (result.value && result.value.then) {
            result.value
                .then((resolveResult: any) => {
                    next(null, resolveResult);
                })
                .catch((rejectResult: any) => {
                    next(rejectResult, null);
                });
        } else {
            next(null, result.value);
        }
    };

    let it = generatorFunction();
    return next();
}

// ******************************
