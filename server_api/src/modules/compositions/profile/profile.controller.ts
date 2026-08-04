import { Request, Response } from "express";

import { ERROR_CODES } from "../../../common/errors/error.codes";
import { successResponse, errorResponse } from "../../../common/helpers/response";
import { AuthenticatedRequest } from "../../auth/auth.middleware";
import {
    CreateProfileDTO,
    UpdateProfileDTO,
    GetProfileDTO
} from "./profile.dto";
import { ProfileService } from "./profile.service";


export class ProfileController {

    private service: ProfileService;


    constructor(service: ProfileService) {
        this.service = service;
    }



    // ✅ Create Eligibility Profile
    create = async (
        req: AuthenticatedRequest,
        res: Response
    ) => {

        try {

            if (!req.auth)
                throw new Error(ERROR_CODES.UNAUTHORIZED);


            const userId = req.auth.userId;


            const data: CreateProfileDTO = {
                ...req.body,
                userId
            };


            const profile =
                await this.service.create(data);


            successResponse(
                res,
                201,
                "Eligibility profile created successfully",
                profile
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




    // ✅ Get Profiles
    get = async (
        req: Request,
        res: Response
    ) => {

        try {


            const profiles =
                await this.service.findAll();

            successResponse(
                res,
                200,
                "Eligibility profiles fetched successfully",
                profiles
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


    // ✅ Get Profile By Id
    getById = async (
        req: Request,
        res: Response
    ) => {

        try {

            const {
                id
            } = req.params;


            const profile =
                await this.service.getById(id);

            successResponse(
                res,
                200,
                "Eligibility profile fetched successfully",
                profile
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



    // ✅ Update Profile
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


            const dto: UpdateProfileDTO = {

                id: String(id),

                data: req.body,

                userId

            };

            const updated =
                await this.service.update(dto);

            successResponse(
                res,
                200,
                "Eligibility profile updated successfully",
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





    // ✅ Delete Profile
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
                "Eligibility profile deleted successfully",
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