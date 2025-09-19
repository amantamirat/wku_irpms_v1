import mongoose from "mongoose";
import { BasePhase } from "./phase.model"; // only BasePhase import
import { PhaseType } from "../enums/phase.type.enum";

// DTOs
export interface CreatePhaseDto {
    activity: string;
    duration: number;
    budget: number;
    description?: string;
    project?: mongoose.Types.ObjectId;  // only if phase
    parent?: mongoose.Types.ObjectId;   // only if breakdown
    type: PhaseType;
}

export interface GetPhaseOptions {
    _id?: string;
    project?: string;
    parent?: string;
    type?: PhaseType;
}

export class PhaseService {
    
    static async createPhase(data: CreatePhaseDto) {
        return await BasePhase.create(data);
    }

    static async getPhases(options: GetPhaseOptions) {
        const filter: any = {};
        if (options._id) filter._id = options._id;
        if (options.project) filter.project = options.project;
        if (options.parent) filter.parent = options.parent;
        if (options.type) filter.type = options.type;
        return await BasePhase.find(filter)
            .lean();
    }

    static async findPhase(options: GetPhaseOptions) {
        const filter: any = {};
        if (options._id) filter._id = options._id;
        if (options.project) filter.project = options.project;
        if (options.parent) filter.parent = options.parent;
        if (options.type) filter.type = options.type;
        //return await BasePhase.findOne(filter).populate("project parent").lean();
        return await BasePhase.findOne(filter).lean();
    }

    static async updatePhase(id: string, data: Partial<CreatePhaseDto>) {
        const doc = await BasePhase.findById(id);
        if (!doc) throw new Error("Phase not found");
        Object.assign(doc, data);
        return await doc.save();
    }

    static async deletePhase(id: string) {
        const doc = await BasePhase.findById(id);
        if (!doc) throw new Error("Phase not found");
        return await doc.deleteOne();
    }
}
