import { Request, Response } from "express";
import { errorResponse, successResponse } from "../../../common/helpers/response";
import { AuthenticatedRequest } from "../../auth/auth.middleware";
import { ThemeService } from "./theme.service";
import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";


export class ThemeController {

    constructor(private service: ThemeService) {
    }

    create = async (req: Request, res: Response) => {
        try {
            const { title, priority, parent, thematicArea } = req.body;
            const theme = await this.service.create({
                thematicArea,
                title,
                parent,
                priority
            });
            successResponse(res, 201, "Theme created successfully", theme);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    get = async (req: Request, res: Response) => {
        try {
            const { parent, thematicArea, level, populate } = req.query;
            const themes = await this.service.getThemes({
                parent: parent as string,
                thematicArea: thematicArea as string,
                level: level !== undefined ? Number(level) : undefined,
                ...(populate !== undefined && { populate: populate === "true" })
            });
            successResponse(res, 200, "Themes fetched successfully", themes);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    update = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const { id } = req.params;
            const { title, priority } = req.body;
            const updated = await this.service.update({
                id,
                data: { title, priority },
            });
            successResponse(res, 200, "Theme updated successfully", updated);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    delete = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.user) {
                throw new AppError(ERROR_CODES.UNAUTHORIZED);
            }
            const userId = req.user.applicantId;
            const { id } = req.params;
            const deleted = await this.service.delete({ id, applicantId: userId });
            successResponse(res, 200, "Theme deleted successfully", deleted);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    import = async (req: Request, res: Response) => {
        try {
            const file = req.file;
            if (!file) throw new Error(ERROR_CODES.FILE_NOT_FOUND);
            const { id } = req.params;
            const result = await this.service.importFromFile(file, id);
            successResponse(res, 201, "Themes imported", result);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }



}
