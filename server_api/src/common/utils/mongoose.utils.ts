import mongoose, { Schema, Document } from "mongoose";
import { AppError } from "../errors/app.error";
import { ERROR_CODES } from "../errors/error.codes";

export function toObjectId(id: string): mongoose.Types.ObjectId {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new AppError(
            ERROR_CODES.INVALID_ID,
            `Invalid ObjectId: ${id}`
        );
    }
    return new mongoose.Types.ObjectId(id);
}

export const toStringId = (objectId: mongoose.Types.ObjectId | Document): string =>
    (objectId as any)._id !== undefined
        ? (objectId as any)._id.toString()
        : objectId.toString();

export function sameId(
    a: string | mongoose.Types.ObjectId,
    b: string | mongoose.Types.ObjectId
): boolean {
    return String(a) === String(b);
}