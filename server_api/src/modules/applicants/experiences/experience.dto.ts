//experience.dto.ts
import EmploymentType  from "./employment-type.enum";


export interface GetExperiencesDTO {
    applicantId: string;
}

export interface CreateExperienceDTO {
    applicantId: string;
    jobTitle?: string;
    organizationId: string;
    rankId: string;
    startDate: Date;
    endDate?: Date | null;
    isCurrent: boolean;
    employmentType: EmploymentType;
    userId: string;
}

export interface UpdateExperienceDTO {
    id: string;
    data: Partial<{
        jobTitle?: string;
        organizationId?: string;
        rankId?: string;
        startDate?: Date;
        endDate?: Date | null;
        isCurrent?: boolean;
        employmentType?: EmploymentType;
    }>;
    userId: string;
}

export interface DeleteExperienceDTO {
    id: string;
    userId: string;
}
