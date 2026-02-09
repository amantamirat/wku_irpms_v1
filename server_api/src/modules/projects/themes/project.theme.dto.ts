

export interface CreateProjectThemeDTO {
    project: string;
    theme: string;
    applicantId?: string;
}

// ---------- GET / QUERY OPTIONS ----------
export interface GetProjectThemeOptions {
    project: string;
    populate?: boolean;
}

export interface ExistProjectThemeDto {
    theme?: string;
}




