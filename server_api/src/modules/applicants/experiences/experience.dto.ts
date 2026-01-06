//experience.dto.ts
import { EmploymentType } from "./experience.model";

export interface GetExperiencesDTO {
    applicant?: string;
}

export interface CreateExperienceDTO {
    applicant: string;
    jobTitle?: string;
    organization: string;
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
        jobTitle: string;
        organization: string;
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
