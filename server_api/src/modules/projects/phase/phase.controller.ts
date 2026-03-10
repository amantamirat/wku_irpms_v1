import { Request, Response } from "express";
import { DeleteDto } from "../../../common/dtos/delete.dto";
import { errorResponse, successResponse } from "../../../common/helpers/response";
import { AuthenticatedRequest } from "../../users/user.middleware";
import { CreatePhaseDto, GetPhasesOptions, UpdatePhaseDto, UpdatePhaseStatusDto } from "./phase.dto";
import { PhaseType } from "./phase.enum";
import { PhaseService } from "./phase.service";
import { PhaseStatus } from "./phase.status";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { TransitionRequestDto } from "../../../common/dtos/transition.dto";

export class PhaseController {
    private service: PhaseService;

    constructor(service?: PhaseService) {
        this.service = service || new PhaseService();
    }
    // -----------------------
    // Create
    // -----------------------
    create = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.user) throw new Error("User not found!");

            const {
                activity,
                duration,
                budget,
                description,
                project,
            } = req.body;

            const data: CreatePhaseDto = {
                activity,
                duration,
                budget,
                description: description ?? undefined,
                project: project as string,
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
            const { project } = req.query;

            const filter: GetPhasesOptions = {
                project: project as string,
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
            if (!req.user) throw new Error("User not found!");

            const { id } = req.query;
            const { activity, duration, budget, description } = req.body;

            const dto: UpdatePhaseDto = {
                id: id as string,
                data: {
                    activity: activity ?? undefined,
                    duration: duration ?? undefined,
                    budget: budget ?? undefined,
                    description: description ?? undefined,
                },
                applicantId: req.user.applicantId,
            };

            const updated = await this.service.update(dto);
            successResponse(res, 200, "Phase updated successfully", updated);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };
    // ---------------------------------------------------
    // Update Status
    // ---------------------------------------------------
    updateStatus = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.user) throw new Error(ERROR_CODES.USER_NOT_FOUND);
            const { id } = req.params;
            const { current, next } = req.body;
            const dto: TransitionRequestDto = {
                id: String(id),
                current: current,
                next: next,
                applicantId: req.user.applicantId,
            };
            const updated = await this.service.updateStatus(dto);
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
            if (!req.user) throw new Error("User not found!");
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
