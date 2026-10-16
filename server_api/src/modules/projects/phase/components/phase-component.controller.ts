import { Request, Response } from "express";
import { errorResponse, successResponse } from "../../../../common/helpers/response";
import { ERROR_CODES } from "../../../../common/errors/error.codes";
import { AuthenticatedRequest } from "../../../auth/auth.middleware";
import { ProjectComponentService } from "./phase-component.service";

export class ProjectComponentController {
    constructor(private readonly service: ProjectComponentService) {}

    get = async (req: Request, res: Response) => {
        try {
            const components = await this.service.getComponents({
                project: req.query.project as string | undefined,
                phase: req.query.phase as string | undefined,
            });
            successResponse(res, 200, "Project components fetched successfully", components);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };

    create = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.auth) throw new Error(ERROR_CODES.UNAUTHORIZED);
            const { project, title, description, contributors } = req.body;
            const component = await this.service.create({
                project: String(project),
                title: String(title || ""),
                description,
                contributors: Array.isArray(contributors) ? contributors.map(String) : [],
            }, req.auth.userId);
            successResponse(res, 201, "Project component created successfully", component);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };

    update = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.auth) throw new Error(ERROR_CODES.UNAUTHORIZED);
            const { title, description, contributors } = req.body;
            const component = await this.service.update(req.params.id, {
                title,
                description,
                contributors: Array.isArray(contributors) ? contributors.map(String) : undefined,
            }, req.auth.userId);
            successResponse(res, 200, "Project component updated successfully", component);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };

    delete = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.auth) throw new Error(ERROR_CODES.UNAUTHORIZED);
            const component = await this.service.delete(req.params.id, req.auth.userId);
            successResponse(res, 200, "Project component deleted successfully", component);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };
}
