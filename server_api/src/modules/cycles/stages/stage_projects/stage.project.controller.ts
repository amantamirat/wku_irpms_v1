import { Request, Response } from "express";
import fs from "fs";
import mongoose from "mongoose";
import { errorResponse, successResponse } from "../../../../util/response";
import { ProjectStageService } from "./stage.project.service";
import { CreateProjectStageDTO, GetProjectStagesDTO, UpdateProjectStageDTO } from "./stage.project.dto";
import { ProjectStage } from "./stage.project.model";

export class ProjectStageController {

    static async createProjectStage(req: Request, res: Response) {
        if (!req.file) {
            return errorResponse(res, 400, "Document required");
        }
        const documentPath = `uploads/${req.file.filename}`;
        try {
            const { project, stage } = req.body;
            if (!project || !stage) {
                // cleanup uploaded file
                fs.unlink(documentPath, () => { /* ignore */ });
                return errorResponse(res, 400, "project and stage are required");
            }

            const data: CreateProjectStageDTO = {
                project: new mongoose.Types.ObjectId(project as string),
                stage: new mongoose.Types.ObjectId(stage as string),
                documentPath: documentPath,
            };

            const created = await ProjectStageService.createProjectStage(data);
            successResponse(res, 201, "Project stage created successfully", created);
        } catch (err: any) {
            if (req.file) {
                fs.unlink(`uploads/${req.file.filename}`, (unlinkErr) => {
                    if (unlinkErr) console.error("Failed to delete uploaded file:", unlinkErr);
                });
            }
            errorResponse(res, 400, err.message, err);
        }
    }

    static async getProjectStages(req: Request, res: Response) {
        try {
            const { project, stage, status, skip, limit } = req.query;
            const filter: GetProjectStagesDTO = {
                project: project ? new mongoose.Types.ObjectId(project as string) : undefined,
                stage: stage ? new mongoose.Types.ObjectId(stage as string) : undefined,
                status: status as any ?? undefined,
                skip: skip ? Number(skip) : undefined,
                limit: limit ? Number(limit) : undefined,
            };
            const stages = await ProjectStageService.getProjectStages(filter);
            successResponse(res, 200, "Project stages fetched successfully", stages);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async updateProjectStage(req: Request, res: Response) {
        let uploadedPath: string | undefined;
        try {
            const { id } = req.params;
            const { status } = req.body;

            if (!id) return errorResponse(res, 400, "id param required");

            const data: Partial<UpdateProjectStageDTO["data"]> = {};
            if (typeof status !== "undefined") data.status = status;

            if (req.file) {
                uploadedPath = `uploads/${req.file.filename}`;
                data.documentPath = uploadedPath;
            }

            // if replacing document, capture old path to remove later
            const oldDoc = req.file ? await ProjectStage.findById(id).lean() : null;
            const updated = await ProjectStageService.updateProjectStage(id, data);
            // delete old file after successful update if a new file was uploaded
            if (oldDoc && oldDoc.documentPath && uploadedPath) {
                fs.unlink(oldDoc.documentPath, (unlinkErr) => {
                    if (unlinkErr) console.error("Failed to delete old file:", unlinkErr);
                });
            }

            successResponse(res, 200, "Project stage updated successfully", updated);
        } catch (err: any) {
            if (uploadedPath) {
                fs.unlink(uploadedPath, () => { /* ignore */ });
            }
            errorResponse(res, 400, err.message, err);
        }
    }

    static async deleteProjectStage(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const deleted = await ProjectStageService.deleteProjectStage(id);
            if (deleted && deleted.documentPath) {
                fs.unlink(deleted.documentPath, (unlinkErr) => {
                    if (unlinkErr) console.error("Failed to delete uploaded file:", unlinkErr);
                });
            }
            successResponse(res, 200, "Project stage deleted successfully", { deleted: true });
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }
}