import { FormType } from "./criterion.model";

// Shared interface to keep Option structure DRY
export interface CriterionOptionDTO {
    title: string;
    score: number;
}

// =========================
// 1️⃣ Create Criterion
// =========================
export interface CreateCriterionDTO {
    evaluation: string;
    title: string;
    weight: number;
    formType: FormType;
    order?: number;
    isRequired?: boolean;
    options?: CriterionOptionDTO[]; // ✅ Allow options during creation
}

// =========================
// 2️⃣ Update Criterion
// =========================
export interface UpdateCriterionDTO {
    id: string;
    data: Partial<{
        title: string;
        weight: number;
        formType: FormType;
        order: number;
        isRequired: boolean;
        options: CriterionOptionDTO[]; // ✅ Allow replacing the options array
    }>;
}

// =========================
// 3️⃣ Get Criteria (Query Filters)
// =========================
export interface GetCriteriaDTO {
    evaluation?: string;
    stage?: string;
    reviewer?: string;
    populate?: boolean;
    sort?: 'order' | 'createdAt'; // Useful for UI lists
}

// =========================
// 4️⃣ Import/Batch Criteria
// =========================

// We can reuse CriterionOptionDTO here for ImportCriterionOptionDTO

export interface ImportCriterionDTO {
    title: string;
    weight: number;
    formType: FormType;
    order?: number;
    options?: CriterionOptionDTO[];
}

export interface ImportCriteriaBatchDTO {
    evaluation: string; // Changed to string for API consistency (converted to ObjectId in Controller/Service)
    criteriaData: ImportCriterionDTO[];
}