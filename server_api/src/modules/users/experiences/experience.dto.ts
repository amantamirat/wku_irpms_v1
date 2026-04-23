//experience.dto.ts
import { EmploymentType } from "./experience.model";


export interface CreateExperienceDTO {
    applicant: string;
    organization: string;
    position: string;
    rank: string;
    startDate: Date;
    endDate?: Date | null;
    isCurrent: boolean;
    employmentType: EmploymentType;
    userId: string;
}

export interface UpdateExperienceDTO {
    id: string;
    data: Partial<{
        organization: string;
        position: string;
        rank: string;
        startDate: Date;
        endDate: Date | null;
        isCurrent: boolean;
        employmentType: EmploymentType;
    }>;
    userId?: string;
}

export interface DeleteExperienceDTO {
    id: string;
    userId: string;
}

export interface GetExperiencesDTO {
    applicant?: string;
    organization?: string;
    populate?: boolean;
}

export interface ExistExperienceDTO {
    applicant?: string;
    rank?: string;
    organization?: string;
}
