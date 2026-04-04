import { TransitionHelper } from "../../common/helpers/transition.helper";
import { ICollaboratorRepository } from "./collaborators/collaborator.repository";
import { IProjectStageRepository } from "./stages/project.stage.repository";
import { ProjectStageStatus } from "./stages/project.stage.status";
import { IPhaseRepository } from "./phase/phase.repository";
import { IProjectRepository } from "./project.repository";
import { PROJECT_TRANSITIONS, ProjectStatus } from "./project.state-machine";


export abstract class ProjectSynchronizer {
    constructor(
        protected readonly projectRepository: IProjectRepository
    ) { }
    abstract sync(project: string): Promise<any>;
}

export class ProjectStageSynchronizer extends ProjectSynchronizer {

    constructor(
        private readonly repository: IProjectRepository,
        private readonly projectStageRepository: IProjectStageRepository,
    ) {
        super(repository);
    }

    async sync(project: string) {
        const projectDoc = await this.repository.findById(project);
        if (!projectDoc) return;

        const projectDocs = await this.projectStageRepository.find({ project });
        const currentStatus = projectDoc.status;

        let newStatus = ProjectStatus.submitted;
        if (projectDocs.length === 0) {
            newStatus = ProjectStatus.draft;
        }
        else if (projectDocs.some(d => d.status === ProjectStageStatus.rejected)) {
            newStatus = ProjectStatus.rejected;
        }
        else if (projectDocs.every(d => d.status === ProjectStageStatus.accepted)) {
            newStatus = ProjectStatus.accepted;
        }
        if (newStatus !== currentStatus) {
            TransitionHelper.validateTransition(
                projectDoc.status,
                newStatus,
                PROJECT_TRANSITIONS
            );
            const updated = await this.repository.updateStatus(project, newStatus)
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

export class CollabSynchronizer extends ProjectSynchronizer {

    constructor(
        private readonly repository: IProjectRepository,
        private readonly collabRepository: ICollaboratorRepository,
    ) {
        super(repository);
    }

    async sync(project: string): Promise<void> {
        const collabs = await this.collabRepository.find({ project });
        const totalCollabs = collabs.length + 1;
        await this.repository.update(project, { totalCollabs });
    }
}

export class ProjectSyncOrchestrator {

    constructor(
        private readonly docSync: ProjectStageSynchronizer,
        private readonly phaseSync: PhaseSynchronizer,
        private readonly collabSync: CollabSynchronizer,
    ) { }

    async sync(projectId: string) {
        if (this.docSync) await this.docSync.sync(projectId);
        if (this.phaseSync) await this.phaseSync.sync(projectId);
        if (this.collabSync) await this.collabSync.sync(projectId);
    }
}

