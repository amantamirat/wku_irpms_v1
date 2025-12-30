// project.service.ts
import {
    CreateProjectDTO,
    GetProjectsDTO,
    SubmitProjectDTO,
    UpdateProjectDTO,
    UpdateStatusDTO
} from "./project.dto";
import { IProjectRepository, ProjectRepository } from "./project.repository";

import { DeleteDto } from "../../util/delete.dto";
import { ApplicantRepository, IApplicantRepository } from "../applicants/applicant.repository";
import { CallRepository, ICallRepository } from "../calls/call.repository";
import { CallStatus } from "../calls/call.status";
import { CollaboratorRepository, ICollaboratorRepository } from "./collaborators/collaborator.repository";
import { IPhaseRepository, PhaseRepository } from "./phase/phase.repository";
import { ProjectStateMachine } from "./project.state-machine";
import { ProjectStatus } from "./project.status";
import { PhaseStatus } from "./phase/phase.status";
import { CollaboratorStatus } from "./collaborators/collaborator.status";
import { IThemeRepository, ThemeRepository } from "../thematics/themes/theme.repository";
import { IStageRepository, StageRepository } from "../calls/stages/stage.repository";
import { StageStatus } from "../calls/stages/stage.status";

export class ProjectService {

    private repository: IProjectRepository;
    private callRepository: ICallRepository;
    private appRepository: IApplicantRepository;
    private collabRepository: ICollaboratorRepository;
    private phaseRepository: IPhaseRepository;
    private themeRepository: IThemeRepository;
    private stageRepository: IStageRepository;

    constructor(repository?: IProjectRepository, phaseRepository?: IPhaseRepository,
        themeRepository?: IThemeRepository, stageRepository?: IStageRepository
    ) {
        this.repository = repository || new ProjectRepository();
        this.appRepository = new ApplicantRepository();
        this.callRepository = new CallRepository();
        this.collabRepository = new CollaboratorRepository();
        this.phaseRepository = phaseRepository || new PhaseRepository();
        this.themeRepository = themeRepository || new ThemeRepository();
        this.stageRepository = stageRepository || new StageRepository();
    }

    async create(dto: CreateProjectDTO) {
        const callDoc = await this.callRepository.findById(dto.call);
        if (!callDoc) throw new Error("Call not found");
        if (callDoc.status !== CallStatus.active) throw new Error("Call is not active");
        const leadPIDoc = await this.appRepository.findOne({ id: dto.applicantId });
        if (!leadPIDoc) throw new Error("Lead PI not found");
        const created = await this.repository.create(dto);
        await this.collabRepository.create({ applicant: dto.applicantId, project: String(created._id) });
        return created;
    }

    //based on ownerships // and collaborations // and pi
    async getProjects(options: GetProjectsDTO) {
        return this.repository.find(options);
    }

    //submit project
    async submit(dto: SubmitProjectDTO) {
        const { call, leadPI, collaborators, themes } = dto;

        const callDoc = await this.callRepository.findById(call);
        if (!callDoc) throw new Error("Call not found");
        if (callDoc.status !== CallStatus.active) throw new Error("Call is not active");

        const firstStageDoc = await this.stageRepository.findOne({ call, order: 1 });
        if (!firstStageDoc) throw new Error("Stage not found");
        if (firstStageDoc.status !== StageStatus.active) throw new Error(`${firstStageDoc.name} stage is not active`);
        if (firstStageDoc.deadline < new Date()) throw new Error(`${firstStageDoc.name} stage deadline has passed`);

        const leadPIDoc = await this.appRepository.findOne({ id: leadPI });
        if (!leadPIDoc) throw new Error("Lead PI not found");

        const collabDocs = [];
        for (const collab of collaborators) {
            const collabDoc = await this.appRepository.findOne({ id: collab });
            if (!collabDoc) throw new Error(`Applicant not found: ${collab}`);
            collabDocs.push(collabDoc);
        }

        const themeDocs = [];
        for (const theme of themes) {
            const themeDoc = await this.themeRepository.findById(theme);
            if (!themeDoc) throw new Error(`Theme not found: ${theme}`);
            themeDocs.push(themeDoc);
        }
    }

    // ---------------------------------------------------
    // UPDATE
    // ---------------------------------------------------
    async update(dto: UpdateProjectDTO) {
        const { id, data, applicantId: userId } = dto;

        const projectDoc = await this.repository.findById(id);
        if (!projectDoc) throw new Error("Project not found");

        if (projectDoc.status !== ProjectStatus.pending)
            throw new Error("Project not is not pending");

        if (String(projectDoc.leadPI) !== userId) {
            throw new Error("Unauthorized: You cannot update this project.");
        }
        return this.repository.update(dto.id, dto.data);
    }

    // ---------------------------------------------------
    // UPDATE STATUS
    // ---------------------------------------------------
    async updateStatus(dto: UpdateStatusDTO) {
        const { id, status } = dto.data;
        const next = status;

        const projectDoc = await this.repository.findById(id);
        if (!projectDoc) throw new Error("Project not found");

        const current = projectDoc.status;
        ProjectStateMachine.validateTransition(current, next);
        /*
        if (next === ProjectStatus.negotiation) {
            if (!phases.every(p => p.status === PhaseStatus.proposed))
                throw new Error("PHASES_NOT_FULLY_PROPSED");
        }
        */
        if (next === ProjectStatus.approved) {
            const phases = await this.phaseRepository.find({ project: id });
            //validate against grant in here
            if (!phases.every(p => p.status === PhaseStatus.approved))
                throw new Error("PHASES_NOT_FULLY_APPROVED");

            const collabs = await this.collabRepository.find({ project: id });
            if (!collabs.every(c => c.status === CollaboratorStatus.verified))
                throw new Error("COLLABORATORS_NOT_FULLY_VERIFIED");
        }

        const updated = await this.repository.update(id, { status: next });
        return updated;

    }
    // ---------------------------------------------------
    // DELETE
    // ---------------------------------------------------
    async delete(dto: DeleteDto) {
        const { id } = dto;
        const projectDoc = await this.repository.findById(id);
        if (!projectDoc)
            throw new Error("Project not found");

        if (projectDoc.status !== ProjectStatus.pending)
            throw new Error("Project not is not pending");

        if (String(projectDoc.leadPI) !== dto.userId) {
            throw new Error("Unauthorized: You cannot delete this project.");
        }
        /*
        const collaborators = await this.collabRepository.find({ project: id });
        if (collaborators.length > 0) {
            throw new Error(`Cannot delete:  ${collaborators.length} collaborators exists.`);
        }
        */
        return this.repository.delete(dto.id);
    }
}
