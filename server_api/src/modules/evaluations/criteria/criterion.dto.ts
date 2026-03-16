import mongoose from "mongoose";
import { FormType } from "./criterion.model";

export interface CreateCriterionDTO {
    evaluation: string;
    title: string;
    weight: number;
    formType: FormType;
}

export interface UpdateCriterionDTO {
    id: string;
    data: Partial<{
        title: string;
        weight: number;
        formType: FormType;
    }>;
}

export interface GetCriteriaDTO {
    evaluation?: string;
    stage?: string;
    reviewer?:string;
    populate?:boolean;
}


export interface ImportCriterionOptionDTO {
    title: string;
    score: number;
}

export interface ImportCriterionDTO {
    title: string;
    weight: number;
    formType: FormType;
    options?: ImportCriterionOptionDTO[];
}

export interface ImportCriteriaBatchDTO {
    evaluation: mongoose.Types.ObjectId;
    criteriaData: ImportCriterionDTO[];
}
