import { Request, Response } from "express";
import mongoose from "mongoose";
import { errorResponse, successResponse } from "../../../util/response";
import {CreatePhaseDto, GetPhaseOptions, PhaseService } from "./phase.service";
import { PhaseType } from "../enums/phase.type.enum";

export class PhaseController {
    static async createPhase(req: Request, res: Response) {
        try {
            const data: CreatePhaseDto = {
                activity: req.body.activity,
                duration: req.body.duration,
                budget: req.body.budget,
                description: req.body.description,
                project: req.body.project ? new mongoose.Types.ObjectId(req.body.project) : undefined,
                parent: req.body.parent ? new mongoose.Types.ObjectId(req.body.parent) : undefined,
                type: req.body.type as PhaseType,
            };
            const created = await PhaseService.createPhase(data);
            successResponse(res, 201, "Phase created successfully", created);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async getPhases(req: Request, res: Response) {
        try {
            const { _id, project, parent, type } = req.query;
            const filter: GetPhaseOptions = {
                project: project ? String(project) : undefined,
                parent: parent ? String(parent) : undefined
            };
            const phases = await PhaseService.getPhases(filter);
            successResponse(res, 200, "Phases fetched successfully", phases);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async updatePhase(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const data: Partial<CreatePhaseDto> = {
                activity: req.body.activity,
                duration: req.body.duration,
                budget: req.body.budget,
                description: req.body.description,
                project: req.body.project,
                parent: req.body.parent,
                type: req.body.type as PhaseType,
            };
            const updated = await PhaseService.updatePhase(id, data);
            successResponse(res, 200, "Phase updated successfully", updated);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async deletePhase(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const deleted = await PhaseService.deletePhase(id);
            successResponse(res, 200, "Phase deleted successfully", deleted);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }
}
