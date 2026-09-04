export interface IRange {
    min: number;
    max: number;
}

export function matchRange(range: IRange, value: number): boolean {
    if (range.min !== undefined && value < range.min)
        return false;

    if (range.max !== undefined && value > range.max)
        return false;

    return true;
}