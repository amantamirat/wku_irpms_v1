import { DocStatus } from "../calls/stages/documents/document.enum";
import { IDocumentRepository } from "../calls/stages/documents/document.repository";
import { ProjectStatus } from "./project.enum";
import { IProject } from "./project.model";
import { IProjectRepository } from "./project.repository";
import { ProjectStateMachine } from "./project.state-machine";

export class ProjectSynchronizer {
    private repository: IProjectRepository;
    private documentRepository: IDocumentRepository;
    constructor(repository: IProjectRepository, projectStageRepo: IDocumentRepository) {
        this.repository = repository;
        this.documentRepository = projectStageRepo;
    }
    async syncProjectStatus(projectId: string, project?: Partial<IProject>) {
        const projectDoc = project ?? await this.repository.findById(projectId);
        if (!projectDoc || !projectDoc.status) return;

        const projectStages = await this.documentRepository.find({ project: projectId });

        const currentStatus = projectDoc.status;
        let newStatus: ProjectStatus;
        if (projectStages.length === 0) {
            newStatus = ProjectStatus.pending;
        }
        else {
            if (projectStages.some(d => d.status === DocStatus.rejected)) {
                newStatus = ProjectStatus.rejected;
            } else {
                newStatus = ProjectStatus.submitted;
            }
        }
        // Update only if allowed by the state machine
        if (!ProjectStateMachine.canTransition(currentStatus, newStatus)) {
            return;// or throw an error
        }
        const updated = await this.repository.update(projectId, { status: newStatus })
        return updated;
    }
}