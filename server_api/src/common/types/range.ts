export interface IRange {
    min: number;
    max: number;
}

export function isValid(range: IRange): boolean {
    if (
        range.min !== undefined &&
        range.max !== undefined &&
        range.min > range.max
    ) {
        return false;
    }

    return true;
}


export function matchesRange(
    range: IRange,
    value: number,
    inclusiveMax = false,
): boolean {
    if (range.min !== undefined && value < range.min)
        return false;

    if (range.max !== undefined) {
        if (inclusiveMax) {
            if (value > range.max)
                return false;
        } else {
            if (value >= range.max)
                return false;
        }
    }

    return true;
}
