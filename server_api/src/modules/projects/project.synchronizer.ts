import { IProjectDocument } from "../calls/stages/documents/document.model";
import { IDocumentRepository } from "../calls/stages/documents/document.repository";
import { DocStatus } from "../calls/stages/documents/document.status";
import { ProjectStatus } from "./project.status";
import { IProject } from "./project.model";
import { IProjectRepository } from "./project.repository";
import { ProjectStateMachine } from "./project.state-machine";

export class ProjectSynchronizer {

    private repository: IProjectRepository;
    private documentRepository: IDocumentRepository;

    constructor(repository: IProjectRepository, documentRepo: IDocumentRepository
    ) {
        this.repository = repository;
        this.documentRepository = documentRepo;
    }

    async syncProjectStatus(projectId: string, project?: Partial<IProject>,
        docs?: Partial<IProjectDocument>[]
    ) {
        const projectDoc = project ?? await this.repository.findById(projectId);
        if (!projectDoc || !projectDoc.status) return;
        const projectDocs = docs ?? await this.documentRepository.find({ project: projectId });

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
        if (ProjectStateMachine.canTransition(currentStatus, newStatus)) {
            const updated = await this.repository.update(projectId, { status: newStatus })
            return updated;
        }
    }
}