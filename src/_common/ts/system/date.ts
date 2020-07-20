// ******************************
// Declarations:
// ******************************

export function getNow(): number {
    return new Date().getTime();
}

// ******************************

export function curDateStamp(): string {
    const date = new Date();
    return [date.getFullYear(), ('00' + (date.getMonth() + 1)).slice(-2), ('00' + date.getDate()).slice(-2)].join('-');
}

// ******************************

export function getDurationTimestamp(in_seconds: number): string {
    const hours = Math.floor(in_seconds / 3600);
    const minutes = Math.floor((in_seconds - hours * 3600) / 60);
    const seconds = Math.floor(in_seconds - hours * 3600 - minutes * 60);

    const hoursPart = ('0' + hours).slice(-2);
    const minutesPart = ('0' + minutes).slice(-2);
    const secondsPart = ('0' + seconds).slice(-2);
    return hoursPart + ':' + minutesPart + ':' + secondsPart;
}

// ******************************

export function getNiceDateTimestamp(in_date?: Date): string {
    const dateObj = in_date ? new Date(in_date) : new Date();
    const year = dateObj.getFullYear();
    const month = ('0' + (dateObj.getMonth() + 1)).slice(-2);
    const date = ('0' + dateObj.getDate()).slice(-2);

    const hours = ('0' + dateObj.getHours()).slice(-2);
    const minutes = ('0' + dateObj.getMinutes()).slice(-2);
    const seconds = ('0' + dateObj.getSeconds()).slice(-2);
    return hours + ':' + minutes + ':' + seconds + ' ' + date + '/' + month + '/' + year;
}

// ******************************

export function getLedgerDateTimestamp(in_date?: Date): string {
    const dateObj = in_date ? new Date(in_date) : new Date();
    const year = dateObj.getFullYear();
    const month = ('0' + (dateObj.getMonth() + 1)).slice(-2);
    const date = ('0' + dateObj.getDate()).slice(-2);

    const hours = ('0' + dateObj.getHours()).slice(-2);
    const minutes = ('0' + dateObj.getMinutes()).slice(-2);
    const seconds = ('0' + dateObj.getSeconds()).slice(-2);
    return `${year}-${month}-${date} ${hours}:${minutes}:${seconds}`;
}

// ******************************

export function getNiceDate(in_date?: Date): string {
    const dateObj = in_date ? new Date(in_date) : new Date();
    const year = dateObj.getFullYear();
    const month = ('0' + (dateObj.getMonth() + 1)).slice(-2);
    const date = ('0' + dateObj.getDate()).slice(-2);

    return `${date}/${month}/${year}`;
}

// ******************************

export function getDateStampRange(in_numDays: number): string[] {
    let numDays = in_numDays || 365;
    let dateKeys = [...Array(numDays).keys()].map((day) => new Date(Date.now() - 3600 * 24 * 1000 * day)).map((date) => toDateStamp(date));
    return dateKeys;
}

// ******************************

export function toDateStamp(in_date?: Date): string {
    const dateObj = in_date ? new Date(in_date) : new Date();
    const year = dateObj.getFullYear();
    const month = ('0' + (dateObj.getMonth() + 1)).slice(-2);
    const date = ('0' + dateObj.getDate()).slice(-2);

    return `${year}-${month}-${date}`;
}

// ******************************

export function fromDateStamp(in_date?: string | null): Date {
    if (!in_date) {
        return new Date();
    }

    return new Date(`${in_date}`);
}

// ******************************
