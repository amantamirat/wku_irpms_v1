import { Request, Response } from "express";
import fs from "fs";
import { successResponse, errorResponse } from "../../../../common/helpers/response";

import {
    CreateDocumentDTO,
    GetDocumentDTO,
    UpdateStatusDTO
} from "./document.dto";

import { AuthenticatedRequest } from "../../../users/user.middleware";
import { DocumentService } from "./document.service";
import { DeleteDto } from "../../../../util/delete.dto";
import { DocStatus } from "./document.status";

export class ProjectDocController {

    private service: DocumentService;

    constructor(service?: DocumentService) {
        this.service = service || new DocumentService();
    }

    // ---------------------------------------------------
    // CREATE
    // ---------------------------------------------------
    create = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.user) {
                throw new Error("User not found!");
            }
            if (!req.file) throw new Error("Document required");

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
            if (!req.user) {
                throw new Error("User not found!");
            }
            const userId = req.user.userId;
            const { status } = req.params;
            const { documents } = req.body;

            const dto: UpdateStatusDTO = {
                data: { documents, status: status as DocStatus },
                //userId: userId,
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

            if (deletedDoc?.deleted?.documentPath) {
                fs.unlink(deletedDoc.deleted.documentPath, () => { });
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
