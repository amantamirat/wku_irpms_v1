export interface LegacyProjectSeedDTO {
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


export interface ExtractedMember {
    name: string;
    department: string;
    college: string;
}