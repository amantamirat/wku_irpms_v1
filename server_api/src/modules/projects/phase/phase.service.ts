import { Project } from "../project.model";
import { CreatePhaseDto, DeletePhaseDto, GetPhasesOptions, UpdatePhaseDto } from "./phase.dto";
import { PhaseType } from "./phase.enum";
import { BasePhase, Phase } from "./phase.model"; // only BasePhase import



export class PhaseService {

    static async createPhase(dto: CreatePhaseDto) {
        if (dto.type === PhaseType.phase) {
            const project = await Project.findById(dto.project).lean();
            if (!project) throw new Error("Project not found");
        } else if (dto.type === PhaseType.breakdown) {
            const phase = await Phase.findById(dto.parent).lean();
            if (!phase) throw new Error("Phase not found");
        }
        return await BasePhase.create(dto);
    }

    static async getPhases(options: GetPhasesOptions) {
        const filter: any = {};
        if (options.project) filter.project = options.project;
        else if (options.parent) filter.parent = options.parent;
        return await BasePhase.find(filter).lean();
    }

    static async updatePhase(dto: UpdatePhaseDto) {
        const { id, data, userId } = dto;
        const doc = await BasePhase.findById(id);
        if (!doc) throw new Error("Phase not found");
        Object.assign(doc, data);
        return await doc.save();
    }

    static async deletePhase(dto: DeletePhaseDto) {
        const { id, userId } = dto;
        const doc = await BasePhase.findById(id);
        if (!doc) throw new Error("Phase not found");
        return await doc.deleteOne();
    }
}
