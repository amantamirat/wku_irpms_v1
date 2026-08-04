import { Request, Response } from "express";

import { ERROR_CODES } from "../../../common/errors/error.codes";
import { successResponse, errorResponse } from "../../../common/helpers/response";
import { AuthenticatedRequest } from "../../auth/auth.middleware";
import { CreateRequirementDTO, UpdateRequirementDTO } from "./requirement.dto";
import { RequirementService } from "./requirement.service";


export class RequirementController {

    private service: RequirementService;


    constructor(service: RequirementService) {
        this.service = service;
    }



    // ✅ Create Eligibility Requirement
    create = async (
        req: AuthenticatedRequest,
        res: Response
    ) => {

        try {

            if (!req.auth)
                throw new Error(ERROR_CODES.UNAUTHORIZED);


            const userId = req.auth.userId;


            const data: CreateRequirementDTO = {
                ...req.body,
                userId
            };


            const requirement =
                await this.service.create(data);


            successResponse(
                res,
                201,
                "Eligibility requirement created successfully",
                requirement
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

    // ✅ Get Requirements
    get = async (
        req: Request,
        res: Response
    ) => {

        try {


            const requirements =
                await this.service.findAll();

            successResponse(
                res,
                200,
                "Eligibility requirements fetched successfully",
                requirements
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


    // ✅ Get Requirement By Id
    getById = async (
        req: Request,
        res: Response
    ) => {

        try {

            const {
                id
            } = req.params;


            const requirement =
                await this.service.getById(id);

            successResponse(
                res,
                200,
                "Eligibility requirement fetched successfully",
                requirement
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

    // ✅ Update Requirement
    update = async (
        req: AuthenticatedRequest,
        res: Response
    ) => {

        try {

            if (!req.auth)
                throw new Error(ERROR_CODES.UNAUTHORIZED);

            const {
                id
            } = req.params;


            const userId =
                req.auth.userId;


            const dto: UpdateRequirementDTO = {

                id: String(id),

                data: req.body,

                userId

            };

            const updated =
                await this.service.update(dto);

            successResponse(
                res,
                200,
                "Eligibility requirement updated successfully",
                updated
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

    // ✅ Delete Requirement
    delete = async (
        req: AuthenticatedRequest,
        res: Response
    ) => {

        try {

            const {
                id
            } = req.params;


            const deleted =
                await this.service.delete(id);

            successResponse(
                res,
                200,
                "Eligibility requirement deleted successfully",
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