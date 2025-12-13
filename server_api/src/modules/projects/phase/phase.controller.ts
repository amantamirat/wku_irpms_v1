import { Request, Response } from "express";
import { DeleteDto } from "../../../util/delete.dto";
import { errorResponse, successResponse } from "../../../common/helpers/response";
import { AuthenticatedRequest } from "../../users/user.middleware";
import { CreatePhaseDto, GetPhasesOptions, UpdatePhaseDto } from "./phase.dto";
import { PhaseType } from "./phase.enum";
import { PhaseService } from "./phase.service";

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
                type: PhaseType.phase,
                activity,
                duration,
                budget,
                description: description ?? undefined,
                project: project as string,
                userId: req.user._id,
            };

            const created = await this.service.createPhase(data);
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

            const { id } = req.params;
            const { activity, duration, budget, description } = req.body;

            const dto: UpdatePhaseDto = {
                id,
                data: {
                    activity: activity ?? undefined,
                    duration: duration ?? undefined,
                    budget: budget ?? undefined,
                    description: description ?? undefined,
                },
                userId: req.user._id,
            };

            const updated = await this.service.updatePhase(dto);
            successResponse(res, 200, "Phase updated successfully", updated);
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
                userId: req.user._id,
            };

            const deleted = await this.service.deletePhase(dto);
            successResponse(res, 200, "Phase deleted successfully", deleted);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };
}
