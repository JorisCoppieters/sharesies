import dollarRound from '../calculators/dollar-round';

// ******************************
// Declarations:
// ******************************

export function leftPad(in_value: string, in_pad: string, in_padAmount: number) {
    let str = in_value;
    let pad = in_pad || ' ';
    let padAmount = in_padAmount || str.length;
    return (pad.repeat(padAmount) + str).substr(-padAmount);
}

// ******************************

export function rightPad(in_value: string, in_pad: string, in_padAmount: number) {
    let str = in_value;
    let pad = in_pad || ' ';
    let padAmount = in_padAmount || str.length;
    return (str + pad.repeat(padAmount)).substr(0, padAmount);
}

// ******************************

export function centerPad(in_value: string, in_pad: string, in_padAmount: number) {
    let str = in_value;
    let pad = in_pad || ' ';
    let padAmount = in_padAmount || str.length;

    while (str.length < padAmount) {
        let leftOrRight = str.length % 2 === 1;
        str = (leftOrRight ? pad : '') + str + (leftOrRight ? '' : pad);
    }

    return str;
}

// ******************************

export function trimObject(in_data: any) {
    let data = in_data;
    let dataType = typeof data;
    if (data !== null && dataType === 'object') {
        if (Array.isArray(data)) {
            let arrayCutOff = 10;
            if (data.length > arrayCutOff) {
                data = data.slice(0, arrayCutOff).concat([`(${data.length - arrayCutOff} more...)`]);
            }
            data = data.map((val: any) => trimObject(val));
        } else if (data instanceof Date) {
            return data.toString();
        } else {
            data = Object.keys(data).reduce((dict: { [key: string]: any }, key) => {
                dict[key] = trimObject(data[key]);
                return dict;
            }, {});
        }
    } else if (dataType === 'string') {
        if (data.length > 1000) {
            data = data.slice(0, 1000) + '...';
        }
    }

    return data;
}

// ******************************

export function toPriceString(in_value: number): string {
    const negative = in_value < 0;
    const absVal = Math.abs(in_value);
    const fullValue = dollarRound(absVal);
    const decimalValue = dollarRound((absVal - fullValue) * 100);
    const stringValue = `$${Number(fullValue).toLocaleString()}.${('00' + decimalValue).slice(-2)}`;
    return negative ? `(${stringValue})` : `${stringValue}`;
}

// ******************************

export function fromPriceString(in_value: string): number {
    let parsedValue = in_value.replace(/[,]/g, '').replace(/[$]/, '');
    const negative = parsedValue.match(/^\(.*\)$/);
    if (negative) {
        parsedValue = parsedValue.replace(/^\((.*)\)$/, '$1');
    }
    if (isNaN(parseFloat(parsedValue))) {
        return 0;
    } else {
        return (negative ? -1 : 1) * parseFloat(parsedValue);
    }
}

// ******************************

export function toPercentageString(in_value: number): string {
    const negative = in_value < 0;
    const fullValue = Math.floor(Math.abs(in_value));
    const decimalValue = Math.floor(Math.abs(in_value) * 100) - fullValue * 100;
    const stringValue = `${Number(fullValue).toLocaleString()}.${('00' + decimalValue).slice(-2)}%`;
    return negative ? `(${stringValue})` : `${stringValue}`;
}

// ******************************

export function fromPercentageString(in_value: string): number {
    let parsedValue = in_value.replace(/[,]/g, '').replace(/[%]/, '');
    const negative = parsedValue.match(/^\(.*\)$/);
    if (negative) {
        parsedValue = parsedValue.replace(/^\((.*)\)$/, '$1');
    }
    if (isNaN(parseFloat(parsedValue))) {
        return 0;
    } else {
        return (negative ? -1 : 1) * parseFloat(parsedValue);
    }
}

// ******************************
