import Promise from 'bluebird';

// ******************************
// Declarations:
// ******************************

export function forEachThen(in_array: any[], in_action: Function) {
    return new Promise((resolveAll) => {
        in_array
            .reduce(
                (state, item, idx) =>
                    state.then(() => {
                        return in_action(item, idx);
                    }),
                Promise.resolve()
            )
            .then(resolveAll);
    });
}

// ******************************
