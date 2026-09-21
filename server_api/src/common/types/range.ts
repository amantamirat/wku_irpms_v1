export interface IRange {
    min: number;
    max: number;
}

export function isValidRange(range: IRange): boolean {
    return (
        Number.isFinite(range.min) &&
        Number.isFinite(range.max) &&
        range.min >= 0 &&
        range.max >= 0 &&
        range.min <= range.max
    );
}

export function matchRange(range: IRange, value: number): boolean {
    if (range.min !== undefined && value <= range.min)
        return false;

    if (range.max !== undefined && value >= range.max)
        return false;
    return value >= range.min && value <= range.max;
}