import { Request, Response } from "express";



import {
    CreateDocumentTemplateDTO,
    FilterDocumentTemplateDTO,
    UpdateDocumentTemplateDTO,
} from "./document-template.dto";

import { DocumentTemplateService } from "./document-template.service";
import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";
import { successResponse, errorResponse } from "../../common/helpers/response";
import { AuthenticatedRequest } from "../auth/auth.middleware";
import { AgreementGeneratorService } from "./services/agreementGeneratorService";


export class DocumentTemplateController {

    constructor(
        private readonly service: DocumentTemplateService,
        private readonly generator: AgreementGeneratorService
    ) { }


    create = async (
        req: AuthenticatedRequest,
        res: Response
    ) => {
        try {
            if (!req.auth) {
                throw new AppError(ERROR_CODES.UNAUTHORIZED);
            }

            if (!req.file) {
                throw new AppError(ERROR_CODES.FILE_NOT_FOUND);
            }

            const dto = JSON.parse(
                req.body.documentTemplate
            ) as CreateDocumentTemplateDTO;

            const created = await this.service.create(
                dto,
                req.file,
                req.auth.userId
            );

            successResponse(
                res,
                201,
                "Document template created successfully",
                created
            );

        } catch (err: any) {
            errorResponse(
                res,
                400,
                err.message,
                err
            );
        }
    };


    get = async (
        req: Request,
        res: Response
    ) => {
        try {

            const {
                name,
                type,
                status,
                version,
            } = req.query;

            const filter: FilterDocumentTemplateDTO = {
                name: name as string,
                type: type as any,
                status: status as any,
                version: version
                    ? Number(version)
                    : undefined,
            };

            const templates = await this.service.get(filter);

            successResponse(
                res,
                200,
                "Document templates fetched successfully",
                templates
            );

        } catch (err: any) {
            errorResponse(
                res,
                400,
                err.message,
                err
            );
        }
    };


    getById = async (
        req: Request,
        res: Response
    ) => {
        try {

            const { id } = req.params;

            const template =
                await this.service.getById(id);

            successResponse(
                res,
                200,
                "Document template fetched successfully",
                template
            );

        } catch (err: any) {
            errorResponse(
                res,
                400,
                err.message,
                err
            );
        }
    };


    update = async (
        req: AuthenticatedRequest,
        res: Response
    ) => {
        try {

            throw new AppError(ERROR_CODES.UNSUPPORTED_OPERTATION);

            /*
            if (!req.auth) {
                throw new AppError(ERROR_CODES.UNAUTHORIZED);
            }

            const { id } = req.params;

            const dto =
                req.body as UpdateDocumentTemplateDTO;

            const updated =
                await this.service.update(
                    id,
                    dto,
                    req.auth.userId
                );

            successResponse(
                res,
                200,
                "Document template updated successfully",
                updated
            );
            */
        } catch (err: any) {
            errorResponse(
                res,
                400,
                err.message,
                err
            );
        }
    };

    generate = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.auth) throw new AppError(ERROR_CODES.UNAUTHORIZED);
            const { phaseId } = req.params;

            const pdf = await this.generator.generatePhaseAgreement(phaseId);

            res.set({
                "Content-Type": "application/pdf",
                "Content-Disposition": `inline; filename="agreement-${phaseId}.pdf"`,
                "Cache-Control": "no-store",
            });
            res.send(pdf);                       // nothing saved to disk or DB
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };


    delete = async (
        req: AuthenticatedRequest,
        res: Response
    ) => {
        try {
            if (!req.auth) {
                throw new AppError(ERROR_CODES.UNAUTHORIZED);
            }

            const { id } = req.params;

            const deleted =
                await this.service.delete(
                    id,
                    req.auth.userId
                );

            successResponse(
                res,
                200,
                "Document template deleted successfully",
                deleted
            );

        } catch (err: any) {
            errorResponse(
                res,
                400,
                err.message,
                err
            );
        }
    };
}