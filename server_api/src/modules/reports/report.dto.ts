export interface OverviewFilterDTO {
    calendar?: string;
    directorate?: string;
    grant?:string;
    call?: string; //calendar, directorate, and grant  dependent
    grantType?: "internal" | "external";
    startDate?: Date;
    endDate?: Date;
}

export interface InstitutionalOverviewDTO {
    totalProjects: number;
    submittedProjects: number;
    grantedProjects: number;
    completedProjects: number;
    publishedProjects: number;

    totalFundingSecured: number;

    grantSuccessRate: number;
    completionRate: number;
    publicationRate: number;
}

