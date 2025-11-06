import mongoose from "mongoose";
import { CallStatus } from "./call.enum";

export interface GetCallsOptions {
    userId?:string;
    calendar?: mongoose.Types.ObjectId;
    directorate?: mongoose.Types.ObjectId;
    status?: CallStatus;
}

export interface CreateCallDto {
    directorate: mongoose.Types.ObjectId;
    calendar: mongoose.Types.ObjectId;
    title: string;
    description?: string;
    grant: mongoose.Types.ObjectId;
    theme: mongoose.Types.ObjectId;
    evaluation: mongoose.Types.ObjectId;
    status?: CallStatus;
}