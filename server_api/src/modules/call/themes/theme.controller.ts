import { Request, Response } from "express";
import mongoose from "mongoose";
import { ThemeService, CreateThemeDto, GetThemesOptions } from "./theme.service";
import { ThemeType } from "./theme.enum";
import { errorResponse, successResponse } from "../../../util/response";

export class ThemeController {

    static async createTheme(req: Request, res: Response) {
        try {
            const { type, title, directorate, level, parent, catalog } = req.body;
            const data: CreateThemeDto = {
                type: type,
                title: title,
                directorate: type === ThemeType.catalog ? new mongoose.Types.ObjectId(directorate as string) : undefined,
                level: type === ThemeType.catalog ? level : undefined,
                parent: type !== ThemeType.catalog ? new mongoose.Types.ObjectId(parent as string) : undefined,
                catalog: type !== ThemeType.catalog ? new mongoose.Types.ObjectId(catalog as string) : undefined
            };
            const theme = await ThemeService.createTheme(data);
            successResponse(res, 201, "Theme created successfully", theme);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async getThemes(req: Request, res: Response) {
        try {
            const { type, parent, catalog, directorate } = req.query;
            const filter: GetThemesOptions = {
                type: type as ThemeType | undefined,
                parent: parent ? new mongoose.Types.ObjectId(parent as string) : undefined,
                catalog: catalog ? new mongoose.Types.ObjectId(catalog as string) : undefined,
                directorate: directorate ? new mongoose.Types.ObjectId(directorate as string) : undefined
            };
            const themes = await ThemeService.getThemes(filter);
            successResponse(res, 200, 'Themes fetched successfully', themes);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async updateTheme(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { title, parent } = req.body;
            const data: Partial<CreateThemeDto> = {
                title: title,
                parent: parent ? new mongoose.Types.ObjectId(parent as string) : undefined
            };
            const updated = await ThemeService.updateTheme(id, data);
            successResponse(res, 201, "Theme updated successfully", updated);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async deleteTheme(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const deleted = await ThemeService.deleteTheme(id);
            successResponse(res, 201, "Theme deleted successfully", deleted);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }
}
