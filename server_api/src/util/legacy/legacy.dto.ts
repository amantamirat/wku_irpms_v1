export interface LegacyProjectDTO {
    Project_Title: string;
    Academic_Year: string;

    PI_Name: string;
    PI_Department: string;
    PI_College: string;

    Team_Members_Detail: string;

    Approved_Budget: number;

    Theme: string;
    SubTheme: string;
}


export interface LegacyUserSeedDTO {
    Id: string;
    Name: string;
    Gender?: string;
    IsWorking?: string;
    AdminRole?: string;
    Department?: string;
    CollCode?: string | null;
    InterArea?: string | null;
    OnDuty?: string;
    CanEdit?: number;
    Highlight?: number;
}


export interface ExtractedMember {
    name: string;
    department: string;
    college: string;
}