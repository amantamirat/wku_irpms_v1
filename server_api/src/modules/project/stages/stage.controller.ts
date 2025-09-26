import { Request, Response } from "express";
import {
    ProjectStageService,
    CreateProjectStageDto,
    GetProjectStageOptions,
    UpdateProjectStageDto
} from "./stage.service";
import { errorResponse, successResponse } from "../../../util/response";

export class ProjectStageController {

    static async createProjectStage(req: Request, res: Response) {
        try {
            if (!req.file) {
                return errorResponse(res, 400, "Document is required");
            }
            const data: CreateProjectStageDto = {
                project: req.body.project,
                stage: req.body.stage,
                status: req.body.status,
                documentPath: req.file.path, // uploaded file path
            };

            const projectStage = await ProjectStageService.createProjectStage(data);
            successResponse(res, 201, "Project stage created successfully", projectStage);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async getProjectStages(req: Request, res: Response) {
        try {
            const { project, stage, status } = req.query;
            const filter: GetProjectStageOptions = {
                project: project as string ?? undefined,
                stage: stage as string ?? undefined,
                status: status as any ?? undefined,
            };

            const stages = await ProjectStageService.getProjectStages(filter);
            successResponse(res, 200, "Project stages fetched successfully", stages);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async findProjectStage(req: Request, res: Response) {
        try {
            const { id, project, stage } = req.query;
            const filter: GetProjectStageOptions = {
                _id: id as string ?? undefined,
                project: project as string ?? undefined,
                stage: stage as string ?? undefined,
            };

            const projectStage = await ProjectStageService.findProjectStage(filter);
            successResponse(res, 200, "Project stage fetched successfully", projectStage);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async updateProjectStage(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const data: Partial<UpdateProjectStageDto> = {
                status: req.body.status,
            };

            const updated = await ProjectStageService.updateProjectStage(id, data);
            successResponse(res, 200, "Project stage updated successfully", updated);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async deleteProjectStage(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const deleted = await ProjectStageService.deleteProjectStage(id);
            successResponse(res, 200, "Project stage deleted successfully", deleted);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }
}
