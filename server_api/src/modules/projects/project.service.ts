// project.service.ts
import {
    CreateProjectDTO,
    GetProjectsDTO,
    UpdateProjectDTO,
} from "./project.dto";
import { IProjectRepository } from "./project.repository";

import { DeleteDto } from "../../common/dtos/delete.dto";
import { TransitionRequestDto } from "../../common/dtos/transition.dto";
import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";
import { TransitionHelper } from "../../common/helpers/transition.helper";
import { IApplicantRepository } from "../applicants/applicant.repository";
import { IGrantAllocationRepository } from "../grants/allocations/grant.allocation.repository";
import { AllocationStatus } from "../grants/allocations/grant.allocation.state-machine";
import { ICollaboratorRepository } from "./collaborators/collaborator.repository";
import { CollaboratorStatus } from "./collaborators/collaborator.status";
import { IPhaseRepository } from "./phase/phase.repository";
import { PROJECT_TRANSITIONS, ProjectStatus } from "./project.state-machine";

export class ProjectService {

    constructor(
        private readonly repository: IProjectRepository,
        private readonly grantAllocRepo: IGrantAllocationRepository,
        private readonly appRepo: IApplicantRepository,
        private readonly collabRepo: ICollaboratorRepository,
        private readonly phaseRepo: IPhaseRepository,
    ) { }

    async create(dto: CreateProjectDTO) {
        const { grantAllocation, applicant } = dto

        const grantAllocDoc = await this.grantAllocRepo.findById(grantAllocation);
        if (!grantAllocDoc) throw new Error(ERROR_CODES.ALLOCATION_NOT_FOUND);
        if (grantAllocDoc.status !== AllocationStatus.active) throw new Error(ERROR_CODES.ALLOCATION_NOT_ACTIVE);

        const appDoc = await this.appRepo.findById(applicant);
        if (!appDoc) throw new Error(ERROR_CODES.APPLICANT_NOT_FOUND);

        const created = await this.repository.create(dto);

        if (created) {
            await this.collabRepo.create({
                project: String(created._id),
                applicant: applicant,
                isLeadPI: true,
                status: CollaboratorStatus.verified
            });
        }

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

        if (String(projectDoc.applicant) !== applicantId)
            throw new AppError(ERROR_CODES.UNAUTHORIZED);

        if (projectDoc.status !== ProjectStatus.draft)
            throw new Error(ERROR_CODES.PROJECT_NOT_DRAFT);

        return this.repository.update(id, data);
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
            throw new AppError(ERROR_CODES.UNSUPPORTED_OPERTATION);
        }
        if (next === ProjectStatus.submitted) {
            throw new AppError(ERROR_CODES.UNSUPPORTED_OPERTATION);
        }
        return await this.repository.updateStatus(id, to);
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

        if (String(projectDoc.applicant) !== applicantId)
            throw new AppError(ERROR_CODES.UNAUTHORIZED);

        if (projectDoc.status !== ProjectStatus.draft)
            throw new Error(ERROR_CODES.PROJECT_NOT_DRAFT);

        await this.collabRepo.deleteByProject(id);
        await this.phaseRepo.deleteByProject(id);
        return this.repository.delete(dto.id);
    }
}
