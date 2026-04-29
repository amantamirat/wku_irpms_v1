import { Request, Response } from "express";
import { errorResponse, successResponse } from "../../../../common/helpers/response";
import { AuthenticatedRequest } from "../../../auth/auth.middleware";
import { CreatePhaseDocDTO, GetPhaseDocDTO } from "./phase.doc.dto";
import { PhaseDocService } from "./phase.doc.service";
import { AppError } from "../../../../common/errors/app.error";
import { ERROR_CODES } from "../../../../common/errors/error.codes";
import fs from "fs";

export class PhaseDocController {

    private service: PhaseDocService;

    constructor(service?: PhaseDocService) {
        this.service = service || new PhaseDocService();
    }

    create = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.auth) throw new AppError(ERROR_CODES.UNAUTHORIZED);

            if (!req.file) throw new Error(ERROR_CODES.FILE_NOT_FOUND);

            const { phase, description } = req.body;

            const dto: CreatePhaseDocDTO = {
                phase,
                description,
                documentPath: `uploads/${req.file.filename}`,
            };

            const created = await this.service.create(dto);
            successResponse(res, 201, "Phase document created successfully", created);
        } catch (err: any) {
            if (req.file) {
                fs.unlink(`uploads/${req.file.filename}`, () => { });
            }
            errorResponse(res, 400, err.message, err);
        }
    };


    get = async (req: Request, res: Response) => {
        try {
            const { phase, type } = req.query;

            const filter: GetPhaseDocDTO = {
                phase: phase as string,
            };

            const docs = await this.service.get(filter);
            successResponse(res, 200, "Phase documents fetched successfully", docs);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };


    delete = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.auth) throw new AppError(ERROR_CODES.UNAUTHORIZED);

            const { id } = req.params;
            const deleted = await this.service.delete(id);
            if (deleted) {
                fs.unlink(deleted.documentPath, () => { });
            }
            successResponse(res, 200, "Phase document deleted successfully", deleted);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };
}
