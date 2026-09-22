import mongoose from "mongoose";
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