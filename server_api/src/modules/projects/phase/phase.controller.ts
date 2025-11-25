import { Request, Response } from "express";
import { DeleteDto } from "../../../util/delete.dto";
import { errorResponse, successResponse } from "../../../util/response";
import { AuthenticatedRequest } from "../../users/auth/auth.middleware";
import { CreatePhaseDto, GetPhasesOptions, UpdatePhaseDto } from "./phase.dto";
import { PhaseType } from "./phase.enum";
import { PhaseService } from "./phase.service";

const service = new PhaseService();

export class PhaseController {


    static async createPhase(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) throw new Error('User not found!');
            const { type, activity, duration, budget, description, project, parent } = req.body;
            const data: CreatePhaseDto = {
                //type: type as PhaseType,
                type: PhaseType.phase,
                activity: activity,
                duration: duration,
                budget: budget,
                description: description ? description : undefined,
                project: project as string,
                //parent: type === PhaseType.breakdown ? new mongoose.Types.ObjectId(parent as string) : undefined,
                //parent: type === PhaseType.breakdown ? new mongoose.Types.ObjectId(parent as string) : undefined,
                userId: req.user._id,

            };
            const created = await service.createPhase(data);
            successResponse(res, 201, "Phase created successfully", created);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async getPhases(req: Request, res: Response) {
        try {
            const { project, parent } = req.query;
            const filter: GetPhasesOptions = {
                project: String(project),
                //parent: parent ? new mongoose.Types.ObjectId(String(parent)) : undefined
            };
            const phases = await service.getPhases(filter);
            successResponse(res, 200, "Phases fetched successfully", phases);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async updatePhase(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) throw new Error('User not found!');
            const { id } = req.params;
            const { activity, duration, budget, description, parent } = req.body;
            const dto: UpdatePhaseDto = {
                id,
                data: {
                    activity: activity ?? undefined,
                    duration: duration ?? undefined,
                    budget: budget ?? undefined,
                    description: description ?? undefined,
                    //parent: parent ? new mongoose.Types.ObjectId(parent as string) : undefined,
                },
                userId: req.user._id,
            };
            const updated = await service.updatePhase(dto);
            successResponse(res, 200, "Phase updated successfully", updated);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async deletePhase(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) throw new Error('User not found!');
            const { id } = req.params;
            const dto: DeleteDto = { id, userId: req.user._id };
            const deleted = await service.deletePhase(dto);
            successResponse(res, 200, "Phase deleted successfully", deleted);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }
}
