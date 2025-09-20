import { Theme } from "@/app/(main)/themes/models/theme.model";
import { Project } from "../../models/project.model";

export type ProjectTheme = {
    _id?: string;
    project: string | Project;
    theme: string | Theme;
}