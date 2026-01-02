import { Request, Response } from "express";
import { errorResponse, successResponse } from "../../../../common/helpers/response";
import { AuthenticatedRequest } from "../../../users/user.middleware";
import { CreatePhaseDocDTO, GetPhaseDocDTO } from "./phase.doc.dto";
import { PhaseDocService } from "./phase.doc.service";
import { AppError } from "../../../../common/errors/app.error";
import { ERROR_CODES } from "../../../../common/errors/error.codes";

export class PhaseDocController {

    private service: PhaseDocService;

    constructor(service?: PhaseDocService) {
        this.service = service || new PhaseDocService();
    }

    create = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.user) throw new AppError(ERROR_CODES.USER_NOT_FOUND);

            const { phase, type, documentPath } = req.body;

            const dto: CreatePhaseDocDTO = {
                phase,
                type,
                documentPath,
            };

            const created = await this.service.create(dto);
            successResponse(res, 201, "Phase document created successfully", created);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };


    get = async (req: Request, res: Response) => {
        try {
            const { phase, type } = req.query;

            const filter: GetPhaseDocDTO = {
                phase: phase as string,
                //type: type as any
            };

            const docs = await this.service.get(filter);
            successResponse(res, 200, "Phase documents fetched successfully", docs);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };


    delete = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.user) throw new AppError(ERROR_CODES.USER_NOT_FOUND);

            const { id } = req.params;
            const deleted = await this.service.delete(id);
            successResponse(res, 200, "Phase document deleted successfully", deleted);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };
}
