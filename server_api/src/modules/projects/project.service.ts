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
import { ConstraintValidator } from "../grants/constraints/constraint.validator";
import { PhaseType } from "./phase/phase.enum";
import { IProjectThemeRepository, ProjectThemeRepository } from "./themes/project.theme.repository";
import { ERROR_CODES } from "../../common/errors/error.codes";
import { AppError } from "../../common/errors/app.error";
import { IDocumentRepository, DocumentRepository } from "./documents/document.repository";

export class ProjectService {

    private repository: IProjectRepository;
    private callRepository: ICallRepository;
    private appRepository: IApplicantRepository;
    private collabRepository: ICollaboratorRepository;
    private phaseRepository: IPhaseRepository;
    private themeRepository: IThemeRepository;
    private projectThemeRepository: IProjectThemeRepository;
    private stageRepository: IStageRepository;
    private docRepository: IDocumentRepository;
    private validator: ConstraintValidator;

    constructor(repository?: IProjectRepository, phaseRepository?: IPhaseRepository,
        themeRepository?: IThemeRepository, stageRepository?: IStageRepository,
    ) {
        this.repository = repository || new ProjectRepository();
        this.appRepository = new ApplicantRepository();
        this.callRepository = new CallRepository();
        this.collabRepository = new CollaboratorRepository();
        this.phaseRepository = phaseRepository || new PhaseRepository();
        this.themeRepository = themeRepository || new ThemeRepository();
        this.stageRepository = stageRepository || new StageRepository();
        this.validator = new ConstraintValidator(this.repository);
        this.projectThemeRepository = new ProjectThemeRepository();
        this.docRepository = new DocumentRepository();
    }

    async create(dto: CreateProjectDTO) {
        const { call, leadPI } = dto

        if (call) {
            const callDoc = await this.callRepository.findById(call);
            if (!callDoc) throw new Error(ERROR_CODES.CALL_NOT_FOUND);
            if (callDoc.status !== CallStatus.active) throw new Error(ERROR_CODES.CALL_NOT_ACTIVE);

        }

        const leadPIDoc = await this.appRepository.findOne({ id: leadPI });
        if (!leadPIDoc) throw new Error(ERROR_CODES.APPLICANT_NOT_FOUND);

        const created = await this.repository.create(dto);
        return created;
    }

    //based on ownerships // and collaborations // and pi
    async getProjects(options: GetProjectsDTO) {
        return this.repository.find(options);
    }

    //submit project
    async submit(dto: SubmitProjectDTO) {

        const { call, title, summary, leadPI, collaborators, phases, themes, documentPath } = dto;

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

        await this.validator.validateProjectConstraints(String(callDoc.grant), collaborators, phases);

        const projectDoc = await this.repository.create({ call, title, leadPI: leadPI, summary });
        const projectId = String(projectDoc._id);

        await this.collabRepository.createMany(
            collaborators.map(col => ({
                project: projectId,
                applicant: col
            }))
        );

        await this.phaseRepository.createMany(
            phases.map(phase => ({
                type: PhaseType.phase,
                project: projectId,
                activity: phase.activity,
                budget: phase.budget,
                duration: phase.duration,
                description: phase.description
            }))
        );

        await this.projectThemeRepository.createMany(
            themes.map(thm => ({
                project: projectId,
                theme: thm
            }))
        );

        await this.docRepository.create({
            project: projectId,
            stage: String(firstStageDoc._id),
            documentPath: documentPath,
            applicantId: ""
        });

        await this.repository.update(projectId, { status: ProjectStatus.submitted });

    }

    // ---------------------------------------------------
    // UPDATE
    // ---------------------------------------------------
    async update(dto: UpdateProjectDTO) {
        const { id, data, applicantId: userId } = dto;

        const projectDoc = await this.repository.findById(id);
        if (!projectDoc) throw new Error("Project not found");

        if (String(projectDoc.leadPI) !== userId || "system" !== userId)
            throw new Error(ERROR_CODES.USER_NOT_LEAD_PI);

        if (projectDoc.status !== ProjectStatus.pending)
            throw new Error("Project not is not pending");

        return this.repository.update(dto.id, dto.data);
    }

    // ---------------------------------------------------
    // UPDATE STATUS
    // ---------------------------------------------------
    async updateStatus(dto: UpdateStatusDTO) {
        const { id, status } = dto.data;
        const next = status;

        const projectDoc = await this.repository.findById(id);
        if (!projectDoc) throw new AppError(ERROR_CODES.PROJECT_NOT_FOUND);

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
        const { id, applicantId: userId } = dto;
        const projectDoc = await this.repository.findById(id);
        if (!projectDoc) throw new Error(ERROR_CODES.PROJECT_NOT_FOUND);
        if (String(projectDoc.leadPI) !== userId || "system" !== userId)
            throw new Error(ERROR_CODES.USER_NOT_LEAD_PI);


        if (projectDoc.status !== ProjectStatus.pending)
            throw new Error("Project not is not pending");



        return this.repository.delete(dto.id);
    }
}
