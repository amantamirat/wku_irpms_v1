import { Request, Response } from "express";
import fs from "fs";
import { errorResponse, successResponse } from "../../../../common/helpers/response";

import {
    CreateProjectDocumentDTO,
    GetProjectDocumentDTO,
    UpdateProjectDocumentDTO
} from "./document.dto";
import { AuthenticatedRequest } from "../../../users/user.middleware";
import { DocumentService } from "./document.service";
import { DeleteDto } from "../../../../util/delete.dto";

const projectStageService = new DocumentService();

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

            const dto: CreateProjectDocumentDTO = {
                project: project,
                stage: stage,
                documentPath: `uploads/${req.file.filename}`
            };

            const created = await projectStageService.create(dto);

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
            const { project, stage, status, skip, limit } = req.query;

            const filter: GetProjectDocumentDTO = {
                project: project ? String(project) : undefined,
                stage: stage ? String(stage) : undefined,
                status: status ? String(status) as any : undefined,
                skip: skip ? Number(skip) : undefined,
                limit: limit ? Number(limit) : undefined
            };

            const createdDoc = await projectStageService.get(filter);
            successResponse(res, 200, "Project stages fetched successfully", createdDoc);

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
            if (!status) {
                throw new Error("Status Required");
            }

            const dto: UpdateProjectDocumentDTO = {
                id,
                data: status
            };

            const updated = await projectStageService.update(dto);

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

            const dto: DeleteDto = {
                id,
                userId: req.user._id
            };

            const deletedDoc = await projectStageService.delete(dto);
            const { deleted } = deletedDoc;
            if (deleted?.documentPath) {
                fs.unlink(deleted.documentPath, () => { });
            }
            successResponse(res, 200, "Project stage deleted successfully", deletedDoc);

        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }
}
