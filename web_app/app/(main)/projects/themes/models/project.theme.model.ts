import { Theme } from "@/app/(main)/thematics/themes/models/theme.model";
import { Project } from "../../models/project.model";

export type ProjectTheme = {
    _id?: string;
    project: string | Project;
    theme: string | Theme;
}

export interface GetProjectThemeOptions {
    project?: string|Project;
}

export const validateProjectTheme = (pt: ProjectTheme): { valid: boolean; message?: string } => {
    if (!pt.project) {
        return { valid: false, message: 'Project is required.' };
    }
    if (!pt.theme || (pt.theme as string).trim().length === 0) {
        return { valid: false, message: 'Title is required.' };
    }
    return { valid: true };
};

export const sanitizeProjectTheme = (pt: Partial<ProjectTheme>): ProjectTheme => {
    return {
        ...pt,
        project:
            typeof pt.project === "object" && pt.project !== null
                ? (pt.project as Project)._id
                : pt.project,
        theme:
            typeof pt.theme === "object" && pt.theme !== null
                ? (pt.theme as Theme)._id
                : pt.theme,
    } as ProjectTheme;
}