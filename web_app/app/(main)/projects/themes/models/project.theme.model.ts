import { Theme } from "@/app/(main)/themes/models/theme.model";
import { Project } from "../../models/project.model";

export type ProjectTheme = {
    _id?: string;
    project: string | Project;
    theme: string | Theme;
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