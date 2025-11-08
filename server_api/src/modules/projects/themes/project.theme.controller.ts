import { Request, Response } from 'express';

import { errorResponse, successResponse } from '../../../util/response';
import { CreateProjectThemeDto, GetProjectThemeOptions, ProjectThemeService } from './project.theme.service';
import mongoose from 'mongoose';

export class ProjectThemeController {

    static async createProjectTheme(req: Request, res: Response) {
        try {
            const data: CreateProjectThemeDto = {
                theme: req.body.theme,
                project: req.body.project
            };
            const theme = await ProjectThemeService.createProjectTheme(data);
            successResponse(res, 201, "Project Theme created successfully", theme);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async getProjectThemes(req: Request, res: Response) {
        try {
            const { project } = req.query;
            const filter = {
                project: project ? new mongoose.Types.ObjectId(project as string) : undefined
            } as GetProjectThemeOptions;
            const proThemes = await ProjectThemeService.getProjectThemes(filter);
            successResponse(res, 200, 'ProjectThemes fetched successfully', proThemes);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }


    static async deleteProjectTheme(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const deleted = await ProjectThemeService.deleteProjectTheme(id);
            successResponse(res, 201, "ProjectTheme deleted successfully", deleted);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

}


