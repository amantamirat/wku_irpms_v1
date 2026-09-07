import { IRange } from "@/types/range";

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