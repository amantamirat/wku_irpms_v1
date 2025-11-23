import { IProjectStageRepository } from "../cycles/stages/projects/project-stage.repository";
import { ProjectStatus } from "./project.enum";
import { IProject } from "./project.model";
import { IProjectRepository } from "./project.repository";
import { ProjectStateMachine } from "./project.state-machine";

export class ProjectSynchronizer {
    private repository: IProjectRepository;
    private projectStageRepo: IProjectStageRepository;
    constructor(repository: IProjectRepository, projectStageRepo: IProjectStageRepository) {
        this.repository = repository;
        this.projectStageRepo = projectStageRepo;
    }
    async syncProjectStatus(projectId: string, project?: Partial<IProject>) {
        const projectDoc = project ?? await this.repository.findById(projectId);
        if (!projectDoc || !projectDoc.status) return;

        const projectStages = await this.projectStageRepo.find({ projectId });

        const currentStatus = projectDoc.status;
        let newStatus: ProjectStatus;
        if (projectStages.length === 0) {
            newStatus = ProjectStatus.pending;
        }
        else {
            newStatus = ProjectStatus.submitted;
        }
        // Update only if allowed by the state machine
        if (!ProjectStateMachine.canTransition(currentStatus, newStatus)) {
            return;// or throw an error
        }
        const updated = await this.repository.update(projectId, { status: newStatus })
        return updated;
    }
}