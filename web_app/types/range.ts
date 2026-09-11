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
/**
 * Formats an IRange object into a readable string (e.g., "10 - 50", "0 - ∞", or "-").
 */

export const formatRange = (
    range?: IRange,
    formatter: (val: number) => string = (val) => val.toString(),
    fallback: string = "-"
): string => {
    if (!range || (range.min == null && range.max == null)) {
        return fallback;
    }

    const minStr = range.min != null ? formatter(range.min) : "0";
    const maxStr = range.max != null ? formatter(range.max) : "∞";

    return `${minStr} - ${maxStr}`;
};

/*
export function matchRange(range: IRange, value: number): boolean {
    if (range.min !== undefined && value < range.min)
        return false;

    if (range.max !== undefined && value > range.max)
        return false;
    return value >= range.min && value <= range.max;
}*/