// common/helpers/filter.ts

import mongoose from "mongoose";

export type FilterValue =
    | string
    | number
    | boolean
    | Date
    | mongoose.Types.ObjectId;

export type MongoFilter = Record<string, any>;

export function buildFilter(
    query: Record<string, any>,
    allowedFields: string[]
): MongoFilter {

    const filter: MongoFilter = {};

    for (const field of allowedFields) {
        const value = query[field];

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