//experience.dto.ts
import { EmploymentType, ExperienceStatus } from "./experience.model";


export interface CreateExperienceDTO {
    user: string;
    organization: string;
    position: string;
    startDate: Date;
    endDate?: Date | null;
    isCurrent: boolean;
    employmentType: EmploymentType;
}

export interface UpdateExperienceDTO {
    id: string;
    data: Partial<{
        organization: string;
        position: string;
        startDate: Date;
        endDate: Date | null;
        isCurrent: boolean;
        employmentType: EmploymentType;
    }>;
    userId?: string;
}



export interface FilterExperiencesDTO {
    user?: string;
    organization?: string;
    position?: string;
    status?: ExperienceStatus
}


