// project.service.ts
import {
    ApplyProjectDTO,
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
import { ICallRepository } from "../calls/call.repository";
import { CallStatus } from "../calls/call.status";
import { IGrantAllocationRepository } from "../grants/allocations/grant.allocation.repository";
import { AllocationStatus } from "../grants/allocations/grant.allocation.state-machine";
import { ConstraintValidator } from "../grants/constraints/constraint.validator";
import { ICollaboratorRepository } from "./collaborators/collaborator.repository";
import { CollaboratorService } from "./collaborators/collaborator.service";
import { IPhaseRepository } from "./phase/phase.repository";
import { PROJECT_TRANSITIONS, ProjectStatus } from "./project.state-machine";
import mongoose, { ClientSession } from "mongoose";
import { IProjectStageRepository } from "./stages/project.stage.repository";
import { ICallStageRepository } from "../calls/stages/call.stage.repository";
import { CallStageStatus } from "../calls/stages/call.stage.model";
import { IProjectSynchronizer } from "./stages/project.stage.synchronizer";
import { ProjectAuth } from "./project.auth";


export class ProjectService {

    constructor(
        private readonly projRepo: IProjectRepository,
        private readonly projAuth: ProjectAuth,
        private readonly allocRepo: IGrantAllocationRepository,
        private readonly callRepo: ICallRepository,
        private readonly callStageRepo: ICallStageRepository,
        private readonly collabRepo: ICollaboratorRepository,
        private readonly phaseRepo: IPhaseRepository,
        private readonly projectStageRepo: IProjectStageRepository,
        private readonly synchronizer: IProjectSynchronizer,
        private readonly collabService: CollaboratorService,
        private readonly validator: ConstraintValidator,
    ) { }


    async validateProject(project: string, applicant: string, session?: ClientSession) {
        const projectDoc = await this.projAuth.authProject(project, applicant, session);
        if (projectDoc.status !== ProjectStatus.draft) {
            throw new AppError(ERROR_CODES.INVALID_PROJECT_STATUS);
        }
        return projectDoc;
    }

    async create(dto: CreateProjectDTO, options?: { skipValidation?: boolean }, session?: ClientSession) {
        const { grantAllocation, title, summary, themes, applicant } = dto
        if (!options?.skipValidation) {
            const grantAllocDoc = await this.allocRepo.findById(grantAllocation);
            if (!grantAllocDoc) throw new Error(ERROR_CODES.ALLOCATION_NOT_FOUND);
            if (grantAllocDoc.status !== AllocationStatus.active) throw new Error(ERROR_CODES.ALLOCATION_NOT_ACTIVE);
            const grantId = String(grantAllocDoc.grant);
            await this.validator.validateMetadata(grantId, title, summary);
            await this.validator.validateThemes(grantId, themes);
        }
        const created = await this.projRepo.create(dto, session);
        if (created) {
            await this.collabService.create({
                project: String(created._id),
                projectTitle: title,
                applicant: applicant,
                role: "Principal Investigator",
                userId: applicant
            },
                options,
                session);
        }
        return created;
    }


    async apply(dto: ApplyProjectDTO) {
        const { call, title, summary, applicant, collaborators, phases, themes } = dto;
        const lead = collaborators.find(c => c.isLeadPI);
        if (!lead) throw new AppError(ERROR_CODES.LEAD_PI_REQUIRED);
        if (lead.applicant !== applicant) throw new AppError(ERROR_CODES.UNAUTHORIZED);

        const callDoc = await this.callRepo.findById(call);
        if (!callDoc) throw new AppError(ERROR_CODES.CALL_NOT_FOUND);
        if (callDoc.status !== CallStatus.active) throw new AppError(ERROR_CODES.CALL_NOT_ACTIVE);

        const callStageDoc = await this.callStageRepo.findOne(call, 1);
        if (!callStageDoc) throw new AppError(ERROR_CODES.STAGE_NOT_FOUND);
        if (callStageDoc.status !== CallStageStatus.active) throw new AppError(ERROR_CODES.STAGE_NOT_ACTIVE);
        if (callStageDoc.deadline < new Date()) throw new AppError(ERROR_CODES.STAGE_DEADLINE_PASSED);

        const grantAllocation = String(callDoc.grantAllocation);
        const grantAllocDoc = await this.allocRepo.findById(grantAllocation);
        if (!grantAllocDoc) throw new Error(ERROR_CODES.ALLOCATION_NOT_FOUND);
        if (grantAllocDoc.status !== AllocationStatus.active) throw new Error(ERROR_CODES.ALLOCATION_NOT_ACTIVE);

        const totalBudget = phases.reduce((sum, p) => sum + (p.budget ?? 0), 0);
        const totalDuration = phases.reduce((sum, p) => sum + (p.duration ?? 0), 0);
        
        const grantId = String(grantAllocDoc.grant);
        await this.validator.validateAll(grantId, {
            collaborators, phases, themes, title, summary
        });
       
        //Start a Mongo Database Session
        const session = await mongoose.startSession();
        session.startTransaction();
        try {

            const createdProj = await this.create(
                { call, grantAllocation, title, summary, applicant, themes, totalBudget, totalDuration },
                { skipValidation: true }, session);

            const projectId = String(createdProj._id);

            for (const collab of collaborators) {
                if (collab.applicant === applicant) {
                    continue;
                }
                await this.collabService.create({
                    project: projectId,
                    applicant: collab.applicant,
                    role: collab.role,
                    userId: applicant
                }, { skipValidation: true }, session);
            }

            await this.phaseRepo.createMany(
                phases.map(phase => ({
                    project: projectId,
                    order: phase.order,
                    title: phase.title,
                    budget: phase.budget,
                    duration: phase.duration,
                    description: phase.description,
                    applicantId: applicant
                }), session)
            );

            await this.projectStageRepo.create({
                project: projectId,
                grantStage: String(callStageDoc.grantStage),
                callStage: String(callStageDoc._id),
                documentPath: dto.docPath,
                applicantId: applicant
            }, session);

            await this.synchronizer.sync(projectId, session)
            await session.commitTransaction();
            return createdProj;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }


    async getProjects(options: GetProjectsDTO) {
        return this.projRepo.find(options);
    }

    // ---------------------------------------------------
    // UPDATE
    // ---------------------------------------------------
    async update(dto: UpdateProjectDTO) {
        const { id, data, applicantId } = dto;
        const projectDoc = await this.validateProject(id, applicantId);
        return this.projRepo.update(id, data);
    }


    async transitionState(dto: TransitionRequestDto) {
        const { id, current, next } = dto;

        const proDoc = await this.projRepo.findById(id);
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
            //throw new AppError(ERROR_CODES.UNSUPPORTED_OPERTATION);
        }
        return await this.projRepo.updateStatus(id, to);
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
        const projectDoc = await this.validateProject(id, applicantId ?? '');
        await this.collabRepo.deleteByProject(id);
        await this.phaseRepo.deleteByProject(id);
        return this.projRepo.delete(id);
    }
}
