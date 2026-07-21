import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";
import { NewCollaboratorService } from "./collaborators/new.collab.service";
import { NewPhaseService } from "./phase/new.phase.service";
import { CreateGrantProjectDTO } from "./project.dto";
import { IProjectRepository } from "./project.repository";

export class NewProjectService {
    constructor(
        private readonly projectRepo: IProjectRepository,
        private readonly collabService: NewCollaboratorService,
        private readonly phaseService: NewPhaseService
    ) { }

    async create(dto: CreateGrantProjectDTO) {
        const {
            title, collaborators, phases
        } = dto;

        const created = await this.projectRepo.create(dto);

        if (!created) {
            throw new AppError(ERROR_CODES.PROJECT_NOT_FOUND);
        }

        const projectId = String(created._id);

        if (collaborators?.length) {
            for (const collab of collaborators) {
                await this.collabService.create(
                    {
                        project: projectId,
                        projectTitle: title,
                        applicant: collab.applicant,
                        role: collab.isLeadPI
                            ? "Principal Investigator"
                            : collab.role
                    }
                );
            }
        }

        // Create phases
        if (phases?.length) {
            const orderedPhases = [...phases].sort(
                (a, b) => a.order - b.order
            );
            for (const phase of orderedPhases) {
                await this.phaseService.create(
                    {
                        project: projectId,
                        order: phase.order,
                        title: phase.title,
                        budget: phase.budget,
                        duration: phase.duration,
                        description: phase.description
                    }
                );
            }
        }
    }

}