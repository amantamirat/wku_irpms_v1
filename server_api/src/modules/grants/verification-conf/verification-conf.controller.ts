import { Request, Response } from "express";
import { VerificationConfigurationService } from "./verification-conf.service";
import {
    CreateVerificationConfigurationDTO,
    FilterConfigurationDTO,
    UpdateVerificationConfigurationDTO
} from "./verification-conf.dto";
import {
    successResponse,
    errorResponse
} from "../../../common/helpers/response";
import { VerificationConfigurationStatus } from "./verification-conf.model";

export class VerificationConfigurationController {

    constructor(
        private readonly service: VerificationConfigurationService
    ) { }


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


    get = async (
        req: Request,
        res: Response
    ) => {
        try {

            const {
                deadline,
                status
            } = req.query;

            const filters: FilterConfigurationDTO = {
                deadline: deadline
                    ? new Date(String(deadline))
                    : undefined,

                status:
                    typeof status === "string"
                        ? status as VerificationConfigurationStatus
                        : undefined
            };

            const configurations =
                await this.service.get(
                    filters,
                    {
                        populate: true
                    }
                );

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



    getUpcoming = async (
        req: Request,
        res: Response
    ) => {
        try {
            const configurations =
                await this.service.getUpcoming({ populate: true });

            successResponse(
                res,
                200,
                "Upcoming verification configurations fetched successfully",
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

            console.log("i am call ed update of conf");

            const dto =
                req.body as UpdateVerificationConfigurationDTO;

            console.log(dto);

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