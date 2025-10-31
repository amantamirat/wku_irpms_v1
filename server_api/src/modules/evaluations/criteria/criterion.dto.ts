import mongoose from "mongoose";
import { FormType } from "./criterion.enum";

export interface CreateCriterionDTO {
    evaluation: mongoose.Types.ObjectId;
    title: string;
    weight: number;
    form_type: FormType;
}

export interface UpdateCriterionDTO {
    id: string;
    data: Partial<{
        title: string;
        weight: number;
        form_type: FormType;
    }>;
}

export interface GetCriteriaDTO {
    evaluation: mongoose.Types.ObjectId;
}

export interface DeleteCriterionDTO {
    id: string;
}

export interface ImportCriterionOptionDTO {
    title: string;
    value: number;
}

export interface ImportCriterionDTO {
    title: string;
    weight: number;
    form_type: FormType;
    options?: ImportCriterionOptionDTO[];
}

export interface ImportCriteriaBatchDTO {
    evaluation: mongoose.Types.ObjectId;
    criteriaData: ImportCriterionDTO[];
}
