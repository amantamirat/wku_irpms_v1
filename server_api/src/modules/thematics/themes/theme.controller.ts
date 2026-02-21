import { Request, Response } from "express";
import { ThemeService } from "./theme.service";
import { CreateThemeDTO, UpdateThemeDTO } from "./theme.dto";
import { successResponse, errorResponse } from "../../../common/helpers/response";
import { AuthenticatedRequest } from "../../users/user.middleware";


export class ThemeController {

    private service: ThemeService;

    constructor(service?: ThemeService) {
        this.service = service || new ThemeService();
    }

    create = async (req: Request, res: Response) => {
        try {
            //const { title, priority, parent, thematicArea } = req.body;
            const data: CreateThemeDTO = req.body;
            const theme = await this.service.create(data);
            successResponse(res, 201, "Theme created successfully", theme);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    get = async (req: Request, res: Response) => {
        try {
            const { parent, thematicArea, level } = req.query;
            const themes = await this.service.getThemes({
                parent: parent as string,
                thematicArea: thematicArea as string,
                level: level !== undefined ? Number(level) : undefined
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

            if (!req.user) {
                throw new Error("User not found!");
            }

            const userId = req.user.userId;

            const dto: UpdateThemeDTO = {
                id,
                data: { title, priority },
                userId,
            };

            const updated = await this.service.update(dto);
            successResponse(res, 200, "Theme updated successfully", updated);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    delete = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const { id } = req.params;

            if (!req.user) {
                throw new Error("User not found!");
            }

            const userId = req.user.userId;

            const deleted = await this.service.delete({ id, applicantId: userId });
            successResponse(res, 200, "Theme deleted successfully", deleted);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }


    import = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const { thematicAreaId, themesData } = req.body;
            if (!thematicAreaId || !Array.isArray(themesData)) {
                return errorResponse(res, 400, "thematic_areaId and themesData are required");
            }
            const result = await this.service.importThemes(
                thematicAreaId as any,
                themesData
            );
            successResponse(
                res,
                201,
                "Themes imported successfully",
                result
            );
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };
}
