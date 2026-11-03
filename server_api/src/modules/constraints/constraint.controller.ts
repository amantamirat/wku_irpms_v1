import { Request, Response } from "express";
import { errorResponse, successResponse } from "../../common/helpers/response";
import {
    CreateConstraintDTO
} from "./constraint.dto";
import { ConstraintService } from "./constraint.service";


export class ConstraintController {

    constructor(
        private service: ConstraintService
    ) { }


    create = async (req: Request, res: Response) => {
        try {
            const dto: CreateConstraintDTO = req.body;

            const constraint = await this.service.create(dto);

            successResponse(
                res,
                201,
                "Constraint created successfully",
                constraint
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


    getById = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;

            const constraint = await this.service.findById(id);

            successResponse(
                res,
                200,
                "Constraint fetched successfully",
                constraint
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


    get = async (req: Request, res: Response) => {
        try {
            const constraints = await this.service.findAll();

            successResponse(
                res,
                200,
                "Constraints fetched successfully",
                constraints
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


    update = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;

            const dto: CreateConstraintDTO = req.body;

            const updated = await this.service.update(
                { id, data: dto }
            );

            successResponse(
                res,
                200,
                "Constraint updated successfully",
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


    delete = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;

            const deleted = await this.service.delete(id);

            successResponse(
                res,
                200,
                "Constraint deleted successfully",
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