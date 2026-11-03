import mongoose from "mongoose";

export type FilterValue =
    | string
    | number
    | boolean
    | Date
    | mongoose.Types.ObjectId;

export type filteredData = Record<string, any>;

export function buildFilter(
    data: Record<string, any>,
    allowedFields: string[]
): filteredData {

    const filter: filteredData = {};

    for (const field of allowedFields) {
        const value = data[field];

        if (
            value === undefined ||
            value === null ||
            value === ""
        ) {
            continue;
        }

        filter[field] = value;
    }

    return filter;
}