import { format, intervalToDuration, isValid, formatDuration as dateFnsFormatDuration, differenceInCalendarDays } from "date-fns";

export type Unpopulate<T> =
    T extends { _id: infer ID }
    ? ID
    : T extends Array<infer U>
    ? Array<Unpopulate<U>>
    : T extends object
    ? { [K in keyof T]: Unpopulate<T[K]> }
    : T;


export const sanitize = <T>(
    obj: T,
    isRoot = true
): Unpopulate<T> => {

    // Primitive, null, undefined
    if (obj === null || typeof obj !== 'object') {
        return obj as Unpopulate<T>;
    }

    // Date
    if (obj instanceof Date) {
        return obj as Unpopulate<T>;
    }

    // Array
    if (Array.isArray(obj)) {
        return obj
            .map((item) => sanitize(item, false))
            .filter(
                (item) => item !== undefined && item !== null
            ) as Unpopulate<T>;
    }

    // Only convert nested populated objects to their _id
    if (!isRoot && '_id' in obj) {
        return (obj as { _id: unknown; })._id as Unpopulate<T>;
    }

    // Root / plain object
    const sanitizedObj: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
        sanitizedObj[key] = sanitize(value, false);
    }

    // Remove internal database fields if sending an update
    // delete sanitizedObj._id;
    //delete sanitizedObj.createdAt
    //delete sanitizedObj.updatedAt;

    return sanitizedObj as Unpopulate<T>;
};


export const extractId = <T extends { _id?: string; }>(
    value: string | T | undefined | null
): string | undefined => {
    if (!value) return undefined;
    return typeof value === "object" ? value._id : value;
};


export const etbCurrencyFormatter = new Intl.NumberFormat(
    'en-US',
    {
        style: 'currency',
        currency: 'ETB',
        maximumFractionDigits: 0
    }
);

export const formatDate = (date?: Date | string | null): string => {
    if (!date) return 'N/A';

    const parsedDate = new Date(date);

    return isValid(parsedDate)
        ? format(parsedDate, 'MMM d, yyyy')
        : 'N/A';
};

export const formatDateTime = (date?: Date | string | null): string => {
    if (!date) return 'N/A';

    const parsedDate = new Date(date);

    return isValid(parsedDate)
        ? format(parsedDate, 'MMM d, yyyy hh:mm a')
        : 'N/A';
};


export const formatDuration = (duration?: number): string => {
    if (!duration) return 'N/A';

    const result = intervalToDuration({
        start: 0,
        end: duration * 24 * 60 * 60 * 1000,
    });

    return dateFnsFormatDuration(result, {
        format: ['years', 'months', 'days'],
        delimiter: ' ',
    });
};


export const capitalize = (value: string) =>
    value.charAt(0).toUpperCase() + value.slice(1);



export const computeDurationFromDates = (
    startDate?: Date | string,
    endDate?: Date | string
): number => {
    if (!startDate || !endDate) return 0;

    const start = new Date(startDate);
    const end = new Date(endDate);

    const diff = differenceInCalendarDays(end, start);

    return diff < 0 ? 0 : diff + 1;
};



export const getReferenceName = <K extends PropertyKey>(
    value: unknown,
    property: K,
    fallback: string = "N/A"
): string => {
    if (!value || typeof value !== 'object') return fallback;

    const record = value as Record<PropertyKey, unknown>;
    const result = record[property];

    return result != null ? String(result) : fallback;
};


export const countWords = (text?: string) => (text?.trim() ? text.trim().split(/\s+/).length : 0);
