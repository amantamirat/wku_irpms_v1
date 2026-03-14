import { Request, Response } from "express";
import { errorResponse, successResponse } from "../../../common/helpers/response";
import { AuthenticatedRequest } from "../../users/auth/auth.middleware";
import { CreateProjectThemeDTO, GetProjectThemeOptions } from "./project.theme.dto";
import { ProjectThemeService } from "./project.theme.service";

export class ProjectThemeController {

    private service: ProjectThemeService;

    constructor(service: ProjectThemeService) {
        this.service = service;
    }
    // -----------------------
    // Create
    // -----------------------
    create = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.user) throw new Error("User not found!");

            const { theme, project } = req.body;

            const dto: CreateProjectThemeDTO = {
                theme,
                project,
                applicantId: req.user.applicantId
            };

            const created = await this.service.create(dto);
            successResponse(res, 201, "Project Theme created successfully", created);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };

    // -----------------------
    // Fetch / Query
    // -----------------------
    get = async (req: Request, res: Response) => {
        try {
            const { project } = req.query;

            const filter: GetProjectThemeOptions = {
                project: project as string,
            };

            const themes = await this.service.get(filter);
            successResponse(res, 200, "Project Themes fetched successfully", themes);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };

    // -----------------------
    // Delete
    // -----------------------
    delete = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.user) throw new Error("User not found!");
            const { id } = req.params;
            const deleted = await this.service.delete({ id, applicantId: req.user.applicantId });
            successResponse(res, 200, "Project Theme deleted successfully", deleted);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };
}
