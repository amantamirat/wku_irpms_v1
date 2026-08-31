type Unpopulate<T> = T extends { _id: infer ID }
    ? ID
    : T extends Array<infer U>
    ? Array<Unpopulate<U>>
    : T extends object
    ? { [K in keyof T]: Unpopulate<T[K]> }
    : T;

export const sanitize = <T>(obj: T): Unpopulate<T> => {
    // Return early for primitives, null, or undefined
    if (obj === null || typeof obj !== 'object') {
        return obj as Unpopulate<T>;
    }

    // Handle Arrays recursively
    if (Array.isArray(obj)) {
        return obj
            .map((item) => sanitize(item))
            .filter((item) => item !== undefined && item !== null) as Unpopulate<T>;
    }

    // Handle populated object references (objects with an _id property)
    // Skip Date objects or other native complex types if needed
    if ('_id' in obj && !(obj instanceof Date)) {
        return (obj as { _id: unknown })._id as Unpopulate<T>;
    }

    // Handle plain nested objects recursively
    const sanitizedObj: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
        sanitizedObj[key] = sanitize(value);
    }

    return sanitizedObj as Unpopulate<T>;
};