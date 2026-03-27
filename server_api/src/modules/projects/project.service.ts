// project.service.ts
import {
    CreateProjectDTO,
    GetProjectsDTO,
    UpdateProjectDTO,
    UpdateStatusDTO
} from "./project.dto";
import { IProjectRepository, ProjectRepository } from "./project.repository";

import { SYSTEM } from "../../common/constants/system.constant";
import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";
import { DeleteDto } from "../../common/dtos/delete.dto";
import { ApplicantRepository, IApplicantRepository } from "../applicants/applicant.repository";
import { CallRepository, ICallRepository } from "../calls/call.repository";
import { CollaboratorRepository, ICollaboratorRepository } from "./collaborators/collaborator.repository";
import { CollaboratorStatus } from "./collaborators/collaborator.status";
import { IPhaseRepository, PhaseRepository } from "./phase/phase.repository";
import { PhaseStatus } from "./phase/phase.status";
import { PROJECT_TRANSITIONS, ProjectStatus } from "./project.state-machine";
import { GrantRepository, IGrantRepository } from "../grants/grant.repository";
import { GrantStatus } from "../grants/grant.model";
import { TransitionRequestDto } from "../../common/dtos/transition.dto";
import { TransitionHelper } from "../../common/helpers/transition.helper";

export class ProjectService {

    constructor(
        private repository: IProjectRepository = new ProjectRepository(),
        private grantRepo: IGrantRepository = new GrantRepository(),
        private callRepository: ICallRepository = new CallRepository(),
        private appRepository: IApplicantRepository = new ApplicantRepository(),
        private collabRepository: ICollaboratorRepository = new CollaboratorRepository(),
        private phaseRepository: IPhaseRepository = new PhaseRepository(),
    ) { }

    async create(dto: CreateProjectDTO) {
        const { grant, applicant } = dto

        const grantDoc = await this.grantRepo.findById(grant);
        if (!grantDoc) throw new Error(ERROR_CODES.GRANT_NOT_FOUND);
        if (grantDoc.status !== GrantStatus.active) throw new Error(ERROR_CODES.GRANT_NOT_ACTIVE);

        const appDoc = await this.appRepository.findById(applicant);
        if (!appDoc) throw new Error(ERROR_CODES.APPLICANT_NOT_FOUND);

        const created = await this.repository.create(dto);
        return created;
    }


    async getProjects(options: GetProjectsDTO) {
        return this.repository.find(options);
    }

    // ---------------------------------------------------
    // UPDATE
    // ---------------------------------------------------
    async update(dto: UpdateProjectDTO) {
        const { id, data, applicantId } = dto;

        const projectDoc = await this.repository.findById(id);
        if (!projectDoc) throw new Error(ERROR_CODES.PROJECT_NOT_FOUND);

        /*
        if (String(projectDoc.applicant) !== applicantId && SYSTEM.SU_USER !== applicantId)
            throw new AppError(ERROR_CODES.USER_NOT_LEAD_PI);*/

        if (projectDoc.status !== ProjectStatus.draft)
            throw new Error(ERROR_CODES.PROJECT_NOT_DRAFT);

        return this.repository.update(dto.id, dto.data);
    }


    async transitionState(dto: TransitionRequestDto) {
        const { id, current, next } = dto;

        const proDoc = await this.repository.findById(id);
        if (!proDoc) {
            throw new AppError(ERROR_CODES.PROJECT_NOT_FOUND);
        }
        const from = proDoc.status as ProjectStatus;
        const to = next as ProjectStatus;

        if (current && current !== from) {
            throw new AppError(ERROR_CODES.STATE_OUT_OF_SYNC);
        }

        TransitionHelper.validateTransition(
            from,
            to,
            PROJECT_TRANSITIONS
        );

        if (next === ProjectStatus.draft) {
            //if (await this.callRepository.exists({ calendar: id })) {
            // throw new AppError(ERROR_CODES.CALL_ALREADY_EXISTS);
            // }
        }

        return await this.repository.update(id, {
            status: to
        });
    }

    /*
        async transitionState(dto: UpdateStatusDTO) {
            const { id, status } = dto.data;
            const next = status;
    
            const projectDoc = await this.repository.findById(id);
            if (!projectDoc) throw new AppError(ERROR_CODES.PROJECT_NOT_FOUND);
    
            const current = projectDoc.status;
            ProjectStateMachine.validateTransition(current, next);
    
            if (next === ProjectStatus.approved) {
                const phases = await this.phaseRepository.find({ project: id });
                //validate against grant in here
                if (!phases.every(p => p.status === PhaseStatus.approved))
                    throw new AppError(ERROR_CODES.PHASES_NOT_FULLY_APPROVED);
    
                const collabs = await this.collabRepository.find({ project: id });
                if (!collabs.every(c => c.status === CollaboratorStatus.verified))
                    throw new AppError(ERROR_CODES.COLLABORATORS_NOT_FULLY_VERIFIED);
            }
    
            const updated = await this.repository.update(id, { status: next });
            return updated;
    
        }
            */
    // ---------------------------------------------------
    // DELETE
    // ---------------------------------------------------
    async delete(dto: DeleteDto) {
        const { id, applicantId } = dto;
        const projectDoc = await this.repository.findById(id);
        if (!projectDoc) throw new Error(ERROR_CODES.PROJECT_NOT_FOUND);

        if (String(projectDoc.applicant) !== applicantId && SYSTEM.SU_USER !== applicantId)
            throw new AppError(ERROR_CODES.USER_NOT_LEAD_PI);

        if (projectDoc.status !== ProjectStatus.draft)
            throw new Error(ERROR_CODES.PROJECT_NOT_DRAFT);

        return this.repository.delete(dto.id);
    }
}
