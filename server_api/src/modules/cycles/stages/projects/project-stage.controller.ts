import { Request, Response } from "express";
import fs from "fs";
import { errorResponse, successResponse } from "../../../../util/response";

import {
    CreateProjectStageDTO,
    DeleteProjectStageDTO,
    GetProjectStagesDTO,
    UpdateProjectStageDTO
} from "./project-stage.dto";
import { AuthenticatedRequest } from "../../../users/auth/auth.middleware";
import { ProjectStageService } from "./project-stage.service";

const projectStageService = new ProjectStageService();

export class ProjectStageController {

    // ---------------------------------------------------
    // CREATE
    // ---------------------------------------------------
    static async createProjectStage(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.file) throw new Error("Document required");

            const { project, stage } = req.body;

            if (!project || !stage)
                throw new Error("projectId and stageId are required");

            const dto: CreateProjectStageDTO = {
                projectId: project,
                stageId: stage,
                documentPath: `uploads/${req.file.filename}`
            };

            const created = await projectStageService.createProjectStage(dto);

            successResponse(res, 201, "Project stage created successfully", created);

        } catch (err: any) {
            if (req.file) fs.unlink(`uploads/${req.file.filename}`, () => { });
            errorResponse(res, 400, err.message, err);
        }
    }

    // ---------------------------------------------------
    // GET
    // ---------------------------------------------------
    static async getProjectStages(req: Request, res: Response) {
        try {
            const { projectId, stageId, status, skip, limit } = req.query;

            const filter: GetProjectStagesDTO = {
                projectId: projectId ? String(projectId) : undefined,
                stageId: stageId ? String(stageId) : undefined,
                status: status ? String(status) as any : undefined,
                skip: skip ? Number(skip) : undefined,
                limit: limit ? Number(limit) : undefined
            };

            const data = await projectStageService.getProjectStages(filter);

            successResponse(res, 200, "Project stages fetched successfully", data);

        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    // ---------------------------------------------------
    // UPDATE
    // ---------------------------------------------------
    static async updateProjectStage(req: AuthenticatedRequest, res: Response) {
        try {
            const { id } = req.params;
            if (!id) throw new Error("id is required");

            const { status } = req.body;            

            const dto: UpdateProjectStageDTO = {
                id,
                data: status
            };

            const updated = await projectStageService.updateProjectStage(dto);

            successResponse(res, 200, "Project stage updated successfully", updated);

        } catch (err: any) {
            //if (newFilePath) fs.unlink(newFilePath, () => { });
            errorResponse(res, 400, err.message, err);
        }
    }

    // ---------------------------------------------------
    // DELETE
    // ---------------------------------------------------
    static async deleteProjectStage(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) throw new Error("User not found!");

            const { id } = req.params;

            const dto: DeleteProjectStageDTO = {
                id,
                userId: req.user._id
            };

            const deleted = await projectStageService.deleteProjectStage(dto);

            if (deleted?.documentPath) {
                fs.unlink(deleted.documentPath, () => { });
            }

            successResponse(res, 200, "Project stage deleted successfully", { deleted: true });

        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }
}
