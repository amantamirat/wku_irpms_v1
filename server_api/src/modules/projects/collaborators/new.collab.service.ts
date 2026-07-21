import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { IProjectRepository } from "../project.repository";
import { CreateCollaboratorDto } from "./collaborator.dto";
import { ICollaboratorRepository } from "./collaborator.repository";

export class NewCollaboratorService {

    constructor(
        private readonly collabRepo: ICollaboratorRepository,
        private readonly projectRepo: IProjectRepository,
    ) {
    }

    async create(dto: CreateCollaboratorDto) {
        const { project } = dto;
        try {
            const created = await this.collabRepo.create(dto);
            if (created) {
                await this.projectRepo.updateTotalCollabs(project, 1);
            }
            return created;
        } catch (err: any) {
            if (err?.code === 11000) {
                throw new AppError(ERROR_CODES.COLLABORATOR_ALREADY_EXISTS);
            }
            throw err;
        }
    }
}