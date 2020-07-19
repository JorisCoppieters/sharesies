// ******************************
// Declarations:
// ******************************

export function betweenRange(in_value: number, in_min: number, in_max: number): number {
    return Math.min(in_max, Math.max(in_min, in_value));
}

// ******************************
