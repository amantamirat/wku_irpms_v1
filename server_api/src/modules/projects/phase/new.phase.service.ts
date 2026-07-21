import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { IProjectRepository } from "../project.repository";
import { CreatePhaseDto } from "./phase.dto";
import { IPhaseRepository } from "./phase.repository";

export class NewPhaseService {

    constructor(
        private readonly phaseRepo: IPhaseRepository,
        private readonly projRepo: IProjectRepository,
    ) { }

    async create(dto: CreatePhaseDto) {
        const { project } = dto;
        try {
            // Determine the next phase order
            const count = await this.phaseRepo.countByProject(project);
            const order = count + 1;
            // Create the phase
            const created = await this.phaseRepo.create({
                ...dto,
                order
            });

            if (created) {
                // Update project totals
                await this.projRepo.incrementTotals(project, {
                    duration: created.duration ?? 0,
                    budget: created.budget ?? 0
                });
            }
            return created;
        } catch (err: any) {
            if (err?.code === 11000) {
                throw new AppError(ERROR_CODES.PHASE_ALREADY_EXISTS);
            }

            throw err;
        }
    }
}