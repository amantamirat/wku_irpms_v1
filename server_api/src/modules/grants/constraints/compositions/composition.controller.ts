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
    //----------------------------------------
    // CREATE COMPOSITION
    //----------------------------------------
    create = async (req: Request, res: Response) => {
        try {
            const { constraint, min, max, range, item, enumValue } = req.body;

            if (min > max) {
                throw new Error("min cannot be greater than max");
            }

            // Validate range if provided
            if (range) {
                if (range.min === undefined || range.max === undefined) {
                    throw new Error("Both range.min and range.max are required if range is provided");
                }
                if (range.min > range.max) {
                    throw new Error("range.min cannot be greater than range.max");
                }
            }

            const data = {
                constraint: constraint as string,
                min: Number(min),
                max: Number(max),
                range: range ? { min: Number(range.min), max: Number(range.max) } : undefined,
                item,
                enumValue
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
            const { range, max, min, item, enumValue } = req.body;


            const dto: UpdateCompositionDTO = {
                id,
                data: {
                    //range: {} ?? undefined,
                    max: max ?? undefined,
                    min: min ?? undefined,
                    //item: item ?? undefined,
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
