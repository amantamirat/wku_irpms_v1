export interface IRange {
    min: number;
    max: number;
}

export function isValidRange(range: IRange): boolean {
    return (
        Number.isFinite(range.min) &&
        Number.isFinite(range.max) &&
        range.min >= 0 &&
        range.max > 0 &&
        range.min <= range.max
    );
}

export function matchRange(
    range: IRange,
    value: number,
    includeMin = false,
    includeMax = false
): boolean {
    if (
        range.min !== undefined &&
        (includeMin ? value < range.min : value <= range.min)
    )
        return false;

    if (
        range.max !== undefined &&
        (includeMax ? value > range.max : value >= range.max)
    )
        return false;

    return true;
}