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

export type RangeCheck = 'ok' | 'below' | 'above';

export function checkRange(range: IRange, value: number): RangeCheck {
    if (value < range.min) return 'below';
    if (value > range.max) return 'above';
    return 'ok';
}

/*
export function checkRange(range: IRange, value: number): boolean {
    if (value < range.min) return false;
    if (value > range.max) return false;
    return true;
}
*/

/*
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
*/
