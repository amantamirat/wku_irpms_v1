import { IDocumentRepository } from "./documents/document.repository";
import { DocStatus } from "./documents/document.status";
import { IPhaseRepository } from "./phase/phase.repository";
import { IProjectRepository } from "./project.repository";
import { ProjectStateMachine } from "./project.state-machine";
import { ProjectStatus } from "./project.status";

export abstract class ProjectSynchronizer {
    constructor(
        protected readonly projectRepository: IProjectRepository
    ) { }
    abstract sync(project: string): Promise<any>;
}

export class StatusSynchronizer extends ProjectSynchronizer {

    constructor(
        private readonly repository: IProjectRepository,
        private readonly documentRepository: IDocumentRepository,
    ) {
        super(repository);
    }

    async sync(project: string) {
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

export class PhaseSynchronizer extends ProjectSynchronizer {

    constructor(
        private readonly repository: IProjectRepository,
        private readonly phaseRepository: IPhaseRepository,
    ) {
        super(repository);
    }

    async sync(project: string): Promise<void> {
        const phases = await this.phaseRepository.find({ project });

        const { totalBudget, totalDuration } = phases.reduce(
            (acc, phase) => {
                acc.totalBudget += phase.budget ?? 0;
                acc.totalDuration += phase.duration ?? 0;
                return acc;
            },
            { totalBudget: 0, totalDuration: 0 }
        );

        await this.repository.update(project, { totalBudget, totalDuration });
    }
}
