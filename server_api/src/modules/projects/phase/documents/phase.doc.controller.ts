import fs from "fs";
import path from "path";
import { Request, Response } from "express";
import { errorResponse, successResponse } from "../../../../common/helpers/response";
import { AuthenticatedRequest } from "../../../auth/auth.middleware";
import { CreatePhaseDocDTO, FilterPhaseDocDTO } from "./phase.doc.dto";
import { PhaseDocumentService } from "./phase.doc.service";
import { AppError } from "../../../../common/errors/app.error";
import { ERROR_CODES } from "../../../../common/errors/error.codes";


export class PhaseDocumentController {



    constructor(private readonly service: PhaseDocumentService) {
    }

    create = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.auth) throw new Error(ERROR_CODES.UNAUTHORIZED);
            if (!req.file) throw new Error(ERROR_CODES.FILE_NOT_FOUND);

            const phaseDoc = JSON.parse(
                req.body.phaseDoc
            ) as CreatePhaseDocDTO;

            const created = await this.service.create(
                phaseDoc,
                req.file
            );

            successResponse(
                res,
                201,
                "Phase document created successfully",
                created
            );
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };


    get = async (req: Request, res: Response) => {
        try {
            const { phase } = req.query;

            const filter: FilterPhaseDocDTO = {
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
            const userId = req.auth.userId;

            const dto = { id };

            // Service deletes the record from the database and returns the deleted document metadata
            const deletedDoc = await this.service.delete(id, userId);

            // If the document had an associated file, safely delete it from the server
            if (deletedDoc?.documentPath) {
                const absolutePath = path.join(process.cwd(), deletedDoc.documentPath);

                fs.unlink(absolutePath, (unlinkErr) => {
                    if (unlinkErr) {
                        console.error(`Failed to delete physical file at ${absolutePath}:`, unlinkErr);
                    } else {
                        console.log(`Successfully deleted physical file: ${absolutePath}`);
                    }
                });
            }

            successResponse(
                res,
                200,
                "Phase document deleted successfully",
                deletedDoc
            );

        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };
}
