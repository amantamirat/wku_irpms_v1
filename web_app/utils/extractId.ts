export const extractId = <T extends { _id?: string }>(
    value: string | T | undefined | null
): string | undefined => {
    if (!value) return undefined;
    return typeof value === "object" ? value._id : value;
};