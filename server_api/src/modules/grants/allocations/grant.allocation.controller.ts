import { Request, Response } from "express";
import { GrantAllocationService } from "./grant.allocation.service";
import { CreateGrantAllocationDTO, GetGrantAllocationsDTO, UpdateGrantAllocationDTO } from "./grant.allocation.dto";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { successResponse, errorResponse } from "../../../common/helpers/response";
import { AuthenticatedRequest } from "../../users/auth/auth.middleware";
import { TransitionRequestDto } from "../../../common/dtos/transition.dto";


export class GrantAllocationController {
    constructor(private readonly service: GrantAllocationService) { }

    /**
     * Create a new Grant Allocation
     */
    create = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.user) throw new Error(ERROR_CODES.UNAUTHORIZED);

            const data: CreateGrantAllocationDTO = {
                ...req.body,
            };

            const allocation = await this.service.create(data);

            successResponse(res, 201, "Grant allocation created successfully", allocation);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };

    /**
     * Get all allocations, optionally filtered by grant or calendar
     */
    get = async (req: Request, res: Response) => {
        try {
            const { grant, calendar, populate } = req.query;

            const options: GetGrantAllocationsDTO = {
                ...(grant && { grant: String(grant) }),
                ...(calendar && { calendar: String(calendar) }),
                ...(populate !== undefined && { populate: populate === "true" }),
            };

            const allocations = await this.service.get(options);

            successResponse(res, 200, "Grant allocations fetched successfully", allocations);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };

    getById = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const grantAllocation = await this.service.getById(id);
            successResponse(res, 200, 'Grant allocation fetched successfully', grantAllocation);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };

    /**
     * Update a Grant Allocation
     */
    update = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const { id } = req.params;
            const { totalBudget } = req.body;

            const dto: UpdateGrantAllocationDTO = {
                id: String(id),
                data: { totalBudget },
            };

            const updated = await this.service.update(dto);

            successResponse(res, 200, "Grant allocation updated successfully", updated);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };


    transitionState = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.user) throw new Error(ERROR_CODES.UNAUTHORIZED);
            const { id } = req.params;
            const { current, next } = req.body;
            const dto: TransitionRequestDto = {
                id: String(id),
                current: current,
                next: next,
                applicantId: req.user.applicantId,
            };
            const updated = await this.service.transitionState(dto);
            successResponse(res, 200, "Allocation status updated successfully", updated);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };

    /**
     * Delete a Grant Allocation
     */
    delete = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const { id } = req.params;

            const deleted = await this.service.delete(id);

            successResponse(res, 200, "Grant allocation deleted successfully", deleted);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };

    /**
     * Reserve budget for a project
     * 
     *  reserveBudget = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const { allocationId, amount } = req.body;

            const updated = await this.service.reserveBudget(allocationId, amount);

            successResponse(res, 200, "Budget reserved successfully", updated);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };
     */


    /**
     * Release reserved budget (e.g., if project deleted)
     * releaseBudget = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const { allocationId, amount } = req.body;

            await this.service.releaseBudget(allocationId, amount);

            successResponse(res, 200, "Budget released successfully");
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };
     */

}