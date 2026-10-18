//experience.dto.ts
import { EmploymentType } from "./experience.model";


export interface CreateExperienceDTO {
    user: string;
    organization: string;
    position: string;
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
}


