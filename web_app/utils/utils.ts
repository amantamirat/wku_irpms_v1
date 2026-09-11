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
        currency: 'ETB'
    }
);


export const capitalize = (value: string) =>
    value.charAt(0).toUpperCase() + value.slice(1);