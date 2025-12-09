import { Request, Response } from 'express';
import mongoose, { Types } from 'mongoose';
import { errorResponse, successResponse } from '../../common/helpers/response';
import { AuthenticatedRequest } from '../users/user.middleware';
import { CreateThemeDto, GetThemesOptions, ThemeService } from './theme.service';
import { ThemeType } from './theme.enum';

export class ThemeController {

    static async createTheme(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) {
                throw new Error("User not found!");
            }
            const userId = req.user._id;
            const { type, title, directorate, level, parent, thematic_area, priority } = req.body;

            const data: CreateThemeDto = {
                type: type,
                title: title,
                directorate: type === ThemeType.thematic_area && directorate
                    ? new mongoose.Types.ObjectId(directorate as string)
                    : undefined,
                level: type === ThemeType.thematic_area ? level : undefined,
                parent: type !== ThemeType.thematic_area && parent
                    ? new mongoose.Types.ObjectId(parent as string)
                    : undefined,
                thematic_area: type !== ThemeType.thematic_area && thematic_area
                    ? new mongoose.Types.ObjectId(thematic_area as string)
                    : undefined,
                priority: priority ?? undefined
            };

            const theme = await ThemeService.createTheme(data, userId);
            successResponse(res, 201, "Theme created successfully", theme);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async getThemes(req: Request, res: Response) {
        try {
            const { type, parent, thematic_area, directorate } = req.query;
            const filter: GetThemesOptions = {
                type: type as ThemeType | undefined,
                parent: parent ? new Types.ObjectId(parent as string) : undefined,
                thematic_area: thematic_area ? new Types.ObjectId(thematic_area as string) : undefined,
                directorate: directorate ? new Types.ObjectId(directorate as string) : undefined
            };

            const themes = await ThemeService.getThemes(filter);
            successResponse(res, 200, 'Themes fetched successfully', themes);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async getUserThemes(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) {
                throw new Error("User not found!");
            }
            const userId = req.user._id;
            const themes = await ThemeService.getUserThemes(userId);
            successResponse(res, 200, 'User themes fetched successfully', themes);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async updateTheme(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) {
                throw new Error("User not found!");
            }
            const userId = req.user._id;
            const { id } = req.params;
            const { title, level, parent, thematic_area, priority } = req.body;

            const data: Partial<CreateThemeDto> = {
                title: title ?? undefined,
                level: level ?? undefined,
                parent: parent ? new mongoose.Types.ObjectId(parent as string) : undefined,
                thematic_area: thematic_area ? new mongoose.Types.ObjectId(thematic_area as string) : undefined,
                priority: priority ?? undefined
            };
            const updated = await ThemeService.updateTheme(id, data, userId);
            successResponse(res, 201, "Theme updated successfully", updated);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async deleteTheme(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) {
                throw new Error("User not found!");
            }
            const userId = req.user._id;
            const { id } = req.params;
            const deleted = await ThemeService.deleteTheme(id, userId);
            successResponse(res, 201, "Theme deleted successfully", deleted);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async importThemesBatch(req: Request, res: Response) {
        try {
            const { thematicAreaId, themesData } = req.body;
            if (!thematicAreaId || !Array.isArray(themesData)) {
                return errorResponse(res, 400, "thematic_areaId and themesData are required");
            }
            const result = await ThemeService.importThemes(
                new mongoose.Types.ObjectId(thematicAreaId as string),
                themesData
            );
            return successResponse(res, 201, "Themes imported successfully", result);
        } catch (err: any) {
            return errorResponse(res, 400, err.message, err);
        }
    }
}
