//import { DecisionMode } from "./grant.stage.model";

import { StageCategory } from "./grant.stage.model";


export interface CreateStageDTO {
    grant: string;
    name: string;
    order?: number;
    evaluation: string;
    minReviewers: number;
    maxReviewers: number;
    // NEW
    category: StageCategory;
    minAcceptanceScore: number;
}

export interface UpdateStageDTO {
    id: string;
    data: Partial<{
        name: string;
        order: number;
        evaluation: string;
        minReviewers: number;
        maxReviewers: number;

        // NEW
        //decisionMode: DecisionMode;
        minAcceptanceScore: number;
    }>;
}

export interface GetStageDTO {
    grant?: string;
    evaluation?: string;
    order?: number;
    populate?: boolean;

    // optional filtering (useful later)
  //  decisionMode?: DecisionMode;
}

export interface ExistsStageDTO {
    grant?: string;
    evaluation?: string;
    order?: number;
}