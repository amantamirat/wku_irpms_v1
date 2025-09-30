import { Request, Response } from "express";
import {
    ProjectStageService,
    CreateProjectStageDto,
    GetProjectStageOptions,
    UpdateProjectStageDto
} from "./stage.service";
import fs from "fs";
import { errorResponse, successResponse } from "../../../util/response";
import mongoose from "mongoose";

export class ProjectStageController {

    static async createProjectStage(req: Request, res: Response) {
        if (!req.file) {
            return errorResponse(res, 400, "Document is required");
        }
        const documentPath = `uploads/${req.file.filename}`;
        try {
            const { project, stage } = req.body;
            const data: CreateProjectStageDto = {
                project: new mongoose.Types.ObjectId(project as string),
                stage: new mongoose.Types.ObjectId(stage as string),
                documentPath: documentPath,
            };
            const created = await ProjectStageService.createProjectStage(data);
            successResponse(res, 201, "Project stage created successfully", created);
        } catch (err: any) {
            if (req.file) {
                fs.unlink(documentPath, (unlinkErr) => {
                    if (unlinkErr) {
                        console.error("Failed to delete uploaded file:", unlinkErr);
                    }
                });
            }
            errorResponse(res, 400, err.message, err);
        }
    }

    static async getProjectStages(req: Request, res: Response) {
        try {
            const { project, stage, status } = req.query;
            const filter: GetProjectStageOptions = {
                project: project ? new mongoose.Types.ObjectId(project as string) : undefined,
                stage: stage ? new mongoose.Types.ObjectId(stage as string) : undefined,
                status: status as any ?? undefined,
            };
            const stages = await ProjectStageService.getProjectStages(filter);
            successResponse(res, 200, "Project stages fetched successfully", stages);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }    

    static async updateProjectStage(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            const data: Partial<UpdateProjectStageDto> = {
                status: status,
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
