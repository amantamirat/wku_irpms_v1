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
        currency: 'ETB'
    }
);


export const capitalize = (value: string) =>
    value.charAt(0).toUpperCase() + value.slice(1);


// Helper exported for reuse in SaveDialog and Manager
export const computeDurationFromDates = (startDate?: Date | string, endDate?: Date | string): number => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    if (diffTime < 0) return 0;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
};