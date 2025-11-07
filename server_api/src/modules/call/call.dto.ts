import mongoose from "mongoose";
import { CallStatus } from "./call.enum";

export interface GetCallsOptions {
    userId?: string;
    calendar?: mongoose.Types.ObjectId;
    directorate?: mongoose.Types.ObjectId;
    status?: CallStatus;
}

export interface CreateCallDto {
    calendar: mongoose.Types.ObjectId;
    directorate: mongoose.Types.ObjectId;
    title: string;
    description?: string;
    grant: mongoose.Types.ObjectId;
    theme: mongoose.Types.ObjectId;
    //evaluation: mongoose.Types.ObjectId;
    status?: CallStatus;
    userId: string;
}


export interface UpdateCallDto {
    id: string | mongoose.Types.ObjectId;
    data: {
        title?: string;
        description?: string;
        //grant: mongoose.Types.ObjectId;
        //theme: mongoose.Types.ObjectId;
        status?: CallStatus;
    };
    userId: string;
}

export interface DeleteCallDTO {
    id: string;
    userId: string;
}