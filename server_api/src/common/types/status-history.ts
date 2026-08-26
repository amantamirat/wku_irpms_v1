// common/types/status-history.ts

import mongoose from "mongoose";

export interface IStatusHistory<TStatus extends string = string> {
    status: TStatus;
    changedBy: mongoose.Types.ObjectId;
    changedAt: Date;
}