import { Request, Response } from "express";
import fs from "fs";
import { successResponse, errorResponse } from "../../../common/helpers/response";

import {
    CreateDocumentDTO,
    GetDocumentDTO,
    SubmitProjectDTO,
    UpdateStatusDTO
} from "./document.dto";

import { AuthenticatedRequest } from "../../users/user.middleware";
import { DocumentService } from "./document.service";
import { DeleteDto } from "../../../common/dtos/delete.dto";
import { DocStatus } from "./document.status";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { AppError } from "../../../common/errors/app.error";

export class ProjectDocController {

    private service: DocumentService;

    constructor(service: DocumentService) {
        this.service = service;
    }
    // ---------------------------------------------------
    // CREATE
    // ---------------------------------------------------
    create = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.user) {
                throw new AppError(ERROR_CODES.USER_NOT_FOUND);
            }
            if (!req.file) throw new Error(ERROR_CODES.FILE_NOT_FOUND);

            const { project, stage } = req.body;

            const dto: CreateDocumentDTO = {
                project,
                stage,
                documentPath: `uploads/${req.file.filename}`,
                applicantId: req.user.applicantId
            };

            const created = await this.service.create(dto);
            successResponse(res, 201, "Project document created successfully", created);

        } catch (err: any) {
            if (req.file) {
                fs.unlink(`uploads/${req.file.filename}`, () => { });
            }
            errorResponse(res, 400, err.message, err);
        }
    };

    // ---------------------------------------------------
    // Update Status
    // ---------------------------------------------------
    updateStatus = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const { status, documents } = req.body;
            const dto: UpdateStatusDTO = {
                documents, status: status as DocStatus,
            };
            const updated = await this.service.updateStatus(dto);
            successResponse(res, 200, "Stage status updated successfully", updated);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };
    // ---------------------------------------------------
    // GET
    // ---------------------------------------------------
    get = async (req: Request, res: Response) => {
        try {
            const { project, stage, status, skip, limit } = req.query;

            const dto: GetDocumentDTO = {
                project: project as string,
                stage: stage as string,
                status: status as any,
                skip: skip ? Number(skip) : undefined,
                limit: limit ? Number(limit) : undefined,
            };

            const docs = await this.service.get(dto);
            successResponse(res, 200, "Project documents fetched successfully", docs);

        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };

    getById = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const doc = await this.service.getById(id);
            successResponse(res, 200, 'doc fetched', doc);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };

    // ---------------------------------------------------
    // SUBMIT
    // ---------------------------------------------------

    submit = async (req: AuthenticatedRequest, res: Response) => {
        let uploadedFilePath: string | undefined;
        try {
            if (!req.user) throw new Error(ERROR_CODES.USER_NOT_FOUND);
            if (!req.file) throw new Error(ERROR_CODES.FILE_NOT_FOUND);

            uploadedFilePath = req.file.path;

            const project = JSON.parse(req.body.project);

            const dto: SubmitProjectDTO = {
                call: project.call,
                title: project.title,
                summary: project.summary,
                applicant: req.user.applicantId,
                collaborators: (project.collaborators || []).map(
                    (c: any) => c.applicant
                ),

                themes: (project.themes || []).map(
                    (t: any) => t.theme
                ),

                phases: (project.phases || []).map((p: any) => ({
                    type: p.type,
                    activity: p.activity,
                    duration: p.duration,
                    budget: p.budget,
                    description: p.description,
                    status: p.status,
                    order: p.order
                })),
                documentPath: `uploads/${req.file.filename}`
            };
            const submitted = await this.service.submit(dto);
            successResponse(res, 201, "Project submitted successfully", submitted);
        } catch (err: any) {
            if (req.file) {
                fs.unlink(`uploads/${req.file.filename}`, () => { });
            }
            errorResponse(res, 400, err.message, err);
        }
    };
    // ---------------------------------------------------
    // DELETE
    // ---------------------------------------------------
    delete = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.user) throw new Error("User not found!");

            const { id } = req.params;

            const dto: DeleteDto = {
                id,
                applicantId: req.user.applicantId,
            };

            const deletedDoc = await this.service.delete(dto);

            if (deletedDoc?.documentPath) {
                fs.unlink(deletedDoc.documentPath, () => { });
            }

            successResponse(
                res,
                200,
                "Project document deleted successfully",
                deletedDoc
            );

        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };
}
