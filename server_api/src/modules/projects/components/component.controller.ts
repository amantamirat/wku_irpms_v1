
import { Request, Response } from "express";

import { DeleteDto } from "../../../common/dtos/delete.dto";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import {
    successResponse,
    errorResponse,
} from "../../../common/helpers/response";

import { AuthenticatedRequest } from "../../auth/auth.middleware";
import { CreateProjectComponentDTO, FilterProjectComponents, UpdateProjectComponentDTO } from "./component.dto";
import { ProjectComponentService } from "./component.service";



export class ProjectComponentController {

    constructor(
        private readonly service: ProjectComponentService
    ) { }


    // -----------------------
    // Create
    // -----------------------

    create = async (
        req: AuthenticatedRequest,
        res: Response
    ) => {
        try {
            if (!req.auth)
                throw new Error(ERROR_CODES.UNAUTHORIZED);

            const {
                project,
                title,
                description,
                contributors,
                //investigator,
            } = req.body;

            const data: CreateProjectComponentDTO = {
                project: String(project),
                title,
                description,
                contributors: contributors ?? [],
                //investigator,
            };

            const created =
                await this.service.create(
                    data,
                    req.auth.userId
                );

            successResponse(
                res,
                201,
                "Project component created successfully",
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


    // -----------------------
    // Fetch / Query
    // -----------------------

    get = async (
        req: Request,
        res: Response
    ) => {
        try {
            const {
                project,
                title,
                //investigator,
            } = req.query;

            const filter: FilterProjectComponents = {
                project: project as string,
                title: title as string,
                //investigator: investigator as string,
            };

            const components =
                await this.service.getComponents(
                    filter,
                    {
                        populate: true,
                    }
                );

            successResponse(
                res,
                200,
                "Project components fetched successfully",
                components
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


    // -----------------------
    // Get By ID
    // -----------------------

    getById = async (
        req: Request,
        res: Response
    ) => {
        try {
            const { id } = req.params;

            const component =
                await this.service.getById(
                    String(id),
                    {
                        populate: true,
                    }
                );

            successResponse(
                res,
                200,
                "Project component fetched successfully",
                component
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


    // -----------------------
    // Update
    // -----------------------

    update = async (
        req: AuthenticatedRequest,
        res: Response
    ) => {
        try {
            if (!req.auth)
                throw new Error(ERROR_CODES.UNAUTHORIZED);

            const { id } = req.params;

            const {
                title,
                description,
                contributors,
                //investigator,
            } = req.body;

            const dto = {
                id: String(id),

                data: {
                    title,
                    description,
                    contributors,
                    //investigator,
                    updatedBy: req.auth.userId,
                } as UpdateProjectComponentDTO,

                userId: req.auth.userId,
            };

            const updated =
                await this.service.update(dto);

            successResponse(
                res,
                200,
                "Project component updated successfully",
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


    // -----------------------
    // Delete
    // -----------------------

    delete = async (
        req: AuthenticatedRequest,
        res: Response
    ) => {
        try {
            if (!req.auth)
                throw new Error(ERROR_CODES.UNAUTHORIZED);

            const { id } = req.params;

            const dto: DeleteDto = {
                id: String(id),
            };

            const deleted =
                await this.service.delete(
                    dto,
                    req.auth.userId
                );

            successResponse(
                res,
                200,
                "Project component deleted successfully",
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
