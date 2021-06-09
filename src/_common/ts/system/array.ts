import Promise from 'bluebird';

// ******************************
// Declarations:
// ******************************

export function forEachThen<T>(in_array: Array<T>, in_action: (item: T, idx: number) => any | Promise<any>): Promise<void> {
    const execRequest = (idx: number): Promise<void> => {
        if (idx >= in_array.length) {
            return Promise.resolve();
        }
        let item = in_array[idx];
        return Promise.resolve(in_action(item, idx)).then(() => execRequest(idx + 1));
    };
    return execRequest(0);
}

// ******************************
