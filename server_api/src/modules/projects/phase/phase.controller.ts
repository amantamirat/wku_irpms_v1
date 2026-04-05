import { Request, Response } from "express";
import { DeleteDto } from "../../../common/dtos/delete.dto";
import { errorResponse, successResponse } from "../../../common/helpers/response";
import { AuthenticatedRequest } from "../../users/auth/auth.middleware";
import { CreatePhaseDto, GetPhasesOptions, UpdatePhaseDto } from "./phase.dto";
import { PhaseService } from "./phase.service";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { TransitionRequestDto } from "../../../common/dtos/transition.dto";

export class PhaseController {
    constructor(private readonly service: PhaseService) { }

    // -----------------------
    // Create
    // -----------------------
    create = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.user) throw new Error(ERROR_CODES.UNAUTHORIZED);

            const {
                order,       // Added: required for unique sequence
                duration,
                budget,
                description,
                project,
                breakdown    // Fixed: removed illegal [] syntax
            } = req.body;

            const data: CreatePhaseDto = {
                order: Number(order),
                duration: Number(duration),
                budget: Number(budget),
                description,
                project: project as string,
                breakdown,    // Passed to service for validation
                applicantId: req.user.applicantId,
            };

            const created = await this.service.create(data);
            successResponse(res, 201, "Phase created successfully", created);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };

    // -----------------------
    // Fetch / Query
    // -----------------------
    get = async (req: Request, res: Response) => {
        try {
            const { project, populate } = req.query;

            const filter: GetPhasesOptions = {
                project: project as string,
                populate: populate === 'true'
            };

            const phases = await this.service.getPhases(filter);
            successResponse(res, 200, "Phases fetched successfully", phases);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };

    // -----------------------
    // Update
    // -----------------------
    update = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.user) throw new Error(ERROR_CODES.UNAUTHORIZED);
            
            const { id } = req.params;
            const { order, duration, budget, description, breakdown, status } = req.body;

            const dto: UpdatePhaseDto = {
                id: id as string,
                data: {
                    order,
                    //duration,
                    //budget,
                    description,
                    breakdown,
                },
                applicantId: req.user.applicantId,
            };

            const updated = await this.service.update(dto);
            successResponse(res, 200, "Phase updated successfully", updated);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };

    // -----------------------
    // Transition State
    // -----------------------
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
            successResponse(res, 200, "Phase status updated successfully", updated);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };

    // -----------------------
    // Delete
    // -----------------------
    delete = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.user) throw new Error(ERROR_CODES.UNAUTHORIZED);
            const { id } = req.params;

            const dto: DeleteDto = {
                id,
                applicantId: req.user.applicantId,
            };

            const deleted = await this.service.delete(dto);
            successResponse(res, 200, "Phase deleted successfully", deleted);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };
}