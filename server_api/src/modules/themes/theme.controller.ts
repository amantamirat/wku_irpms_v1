import { Request, Response } from "express";
import { Types } from "mongoose";
import { ThemeService, CreateThemeDto, GetThemesOptions } from "./theme.service";
import { ThemeType } from "./enums/theme.type.enum";
import { errorResponse, successResponse } from "../../util/response";

export class ThemeController {

    static async createTheme(req: Request, res: Response) {
        try {
            const data: CreateThemeDto = req.body;
            const theme = await ThemeService.createTheme(data);
            successResponse(res, 201, "Theme created successfully", theme);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }
    
    static async getThemes(req: Request, res: Response) {
        try {
            const { type, parent, directorate } = req.query;
            const filter = {
                type: type as ThemeType | undefined,
                parent: parent ? new Types.ObjectId(parent as string) : undefined,
                directorate: directorate ? new Types.ObjectId(directorate as string) : undefined
            } as GetThemesOptions;
            const themes = await ThemeService.getThemes(filter);
            successResponse(res, 200, 'Themes fetched successfully', themes);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async updateTheme(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const data: Partial<CreateThemeDto> = req.body;
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
