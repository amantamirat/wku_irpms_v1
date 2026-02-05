import { Request, Response } from "express";
import { errorResponse, successResponse } from "../../../../common/helpers/response";
import { GetCompositionDTO, UpdateCompositionDTO } from "./composition.dto";
import { CompositionService } from "./composition.service";

export class CompositionController {

    private service: CompositionService;

    constructor(service: CompositionService) {
        this.service = service;
    }

    //----------------------------------------
    // CREATE COMPOSITION
    //----------------------------------------
    create = async (req: Request, res: Response) => {
        try {
            const { constraint, value, max, min, item } = req.body;

            const data = {
                constraint: constraint as string,
                value,
                max,
                min,
                item
            };

            const created = await this.service.create(data);
            successResponse(res, 201, "Composition created successfully", created);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };

    //----------------------------------------
    // GET COMPOSITIONS
    //----------------------------------------
    get = async (req: Request, res: Response) => {
        try {
            const { constraint } = req.query;

            if (!constraint) {
                throw new Error("constraint required");
            }

            const options: GetCompositionDTO = {
                constraint: constraint as string
            };

            const compositions = await this.service.getCompositions(options);
            successResponse(res, 200, "Compositions fetched successfully", compositions);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };

    //----------------------------------------
    // UPDATE COMPOSITION
    //----------------------------------------
    update = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { value, max, min, item } = req.body;

            const dto: UpdateCompositionDTO = {
                id,
                data: {
                    value: value ?? undefined,
                    max: max ?? undefined,
                    min: min ?? undefined,
                    item: item ?? undefined,
                }
            };

            const updated = await this.service.update(dto);
            successResponse(res, 200, "Composition updated successfully", updated);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };

    //----------------------------------------
    // DELETE COMPOSITION
    //----------------------------------------
    delete = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;

            const deleted = await this.service.delete(id);
            successResponse(res, 200, "Composition deleted successfully", deleted);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };
}
