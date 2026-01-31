import mongoose from "mongoose";

export interface CreateOptionDTO {
    criterion: string;
    title: string;
    score: number;
}

export interface UpdateOptionDTO {
    id: string;
    data: Partial<{
        title: string;
        score: number;
    }>;
}

export interface GetOptionsDTO {
    criterion: string;
    populate?:boolean;
}
