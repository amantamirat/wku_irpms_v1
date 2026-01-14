import { ProjectStatus } from "./project.status";
import { IProject } from "./project.model";
import { IProjectRepository } from "./project.repository";
import { ProjectStateMachine } from "./project.state-machine";
import { IProjectDocument } from "./documents/document.model";
import { IDocumentRepository } from "./documents/document.repository";
import { DocStatus } from "./documents/document.status";

export class ProjectSynchronizer {

    constructor(
        private readonly repository: IProjectRepository,
        private readonly documentRepository: IDocumentRepository
    ) { }

    async syncProjectStatus(project: string) {
        const projectDoc = await this.repository.findById(project);
        if (!projectDoc) return;

        const projectDocs = await this.documentRepository.find({ project });
        const currentStatus = projectDoc.status;

        let newStatus = ProjectStatus.submitted;
        if (projectDocs.length === 0) {
            newStatus = ProjectStatus.pending;
        }
        else if (projectDocs.some(d => d.status === DocStatus.rejected)) {
            newStatus = ProjectStatus.rejected;
        }
        else if (projectDocs.every(d => d.status === DocStatus.accepted)) {
            newStatus = ProjectStatus.accepted;
        }
        if (newStatus !== currentStatus &&
            ProjectStateMachine.canTransition(currentStatus, newStatus)) {
            const updated = await this.repository.update(project, { status: newStatus })
            return updated;
        }
    }
}