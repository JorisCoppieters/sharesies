// ******************************
// Declarations:
// ******************************

export default function (in_value: number): number {
    const s = in_value < 0 ? -1 : 1;
    const v = Math.floor(Math.abs(in_value) + 0.005);
    if (v === 0) return 0;
    return v * s;
}

// ******************************
