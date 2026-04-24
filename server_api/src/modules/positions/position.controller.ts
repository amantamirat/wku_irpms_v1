import { Request, Response } from "express";
import mongoose from "mongoose";
import { PositionService } from "./position.service";
import {
    CreatePositionDTO,
    GetPositionsDTO,
    UpdatePositionDTO
} from "./position.dto";
import { successResponse, errorResponse } from "../../common/helpers/response";

export class PositionController {

    private service: PositionService;

    constructor(service: PositionService) {
        this.service = service;
    }

    // 🟢 CREATE
    create = async (req: Request, res: Response) => {
        try {

            const data: CreatePositionDTO = {
                name: req.body.name,
            };

            const created = await this.service.create(data);
            successResponse(res, 201, "Position created successfully", created);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    // 🟡 GET / FIND
    get = async (req: Request, res: Response) => {
        try {
            const {populate } = req.query;

            const options: GetPositionsDTO = {
                populate: populate === "true" // query param is string
            };

            const positions = await this.service.find(options);
            successResponse(res, 200, "Positions fetched successfully", positions);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    // 🟠 UPDATE
    update = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { name, parent } = req.body;

            const dtoData: UpdatePositionDTO["data"] = {
                name: name ?? undefined,
            };

            const updated = await this.service.update({ id, data: dtoData });
            successResponse(res, 200, "Position updated successfully", updated);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    // 🔴 DELETE
    delete = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const deleted = await this.service.delete(id);
            successResponse(res, 200, "Position deleted successfully", deleted);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }
}
