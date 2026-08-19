import { Request, Response } from "express";
import { VerificationConfigurationService } from "./verification-conf.service";
import {
    CreateVerificationConfigurationDTO,
    UpdateVerificationConfigurationDTO
} from "./verification-conf.dto";
import {
    successResponse,
    errorResponse
} from "../../../common/helpers/response";

export class VerificationConfigurationController {

    constructor(
        private readonly service: VerificationConfigurationService
    ) {}


    create = async (
        req: Request,
        res: Response
    ) => {
        try {
            const dto =
                req.body as CreateVerificationConfigurationDTO;

            const configuration =
                await this.service.create(dto);

            successResponse(
                res,
                201,
                "Verification configuration created successfully",
                configuration
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


    getAll = async (
        req: Request,
        res: Response
    ) => {
        try {
            const configurations =
                await this.service.getAll();

            successResponse(
                res,
                200,
                "Verification configurations fetched successfully",
                configurations
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

            const configuration =
                await this.service.getById(id);

            successResponse(
                res,
                200,
                "Verification configuration fetched successfully",
                configuration
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
        req: Request,
        res: Response
    ) => {
        try {
            const { id } = req.params;

            const dto =
                req.body as UpdateVerificationConfigurationDTO;

            const configuration =
                await this.service.update(
                    id,
                    dto
                );

            successResponse(
                res,
                200,
                "Verification configuration updated successfully",
                configuration
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


    delete = async (
        req: Request,
        res: Response
    ) => {
        try {
            const { id } = req.params;

            await this.service.delete(id);

            successResponse(
                res,
                200,
                "Verification configuration deleted successfully"
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