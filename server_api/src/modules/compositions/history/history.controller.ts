import { Request, Response } from "express";

import { ERROR_CODES } from "../../../common/errors/error.codes";
import { successResponse, errorResponse } from "../../../common/helpers/response";
import { AuthenticatedRequest } from "../../auth/auth.middleware";
import { CreateHistoryDTO, UpdateHistoryDTO } from "./history.dto";
import { HistoryService } from "./history.service";


export class HistoryController {

    private service: HistoryService;


    constructor(service: HistoryService) {
        this.service = service;
    }



    // ✅ Create Eligibility History
    create = async (
        req: AuthenticatedRequest,
        res: Response
    ) => {

        try {

            if (!req.auth)
                throw new Error(ERROR_CODES.UNAUTHORIZED);


            const userId = req.auth.userId;


            const data: CreateHistoryDTO = {
                ...req.body,
                userId
            };


            const history =
                await this.service.create(data);


            successResponse(
                res,
                201,
                "Eligibility history created successfully",
                history
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




    // ✅ Get Historys
    get = async (
        req: Request,
        res: Response
    ) => {

        try {


            const histories =
                await this.service.getHistorys();



            successResponse(
                res,
                200,
                "Eligibility histories fetched successfully",
                histories
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





    // ✅ Get History By Id
    getById = async (
        req: Request,
        res: Response
    ) => {

        try {

            const {
                id
            } = req.params;


            const history =
                await this.service.getById(id);



            successResponse(
                res,
                200,
                "Eligibility history fetched successfully",
                history
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



    // ✅ Update History
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



            const dto: UpdateHistoryDTO = {

                id: String(id),

                data: req.body,

                userId

            };



            const updated =
                await this.service.update(dto);



            successResponse(
                res,
                200,
                "Eligibility history updated successfully",
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





    // ✅ Delete History
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
                "Eligibility history deleted successfully",
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