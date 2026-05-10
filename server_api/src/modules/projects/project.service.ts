// project.service.ts
import {
    ApplyProjectDTO,
    CreateProjectDTO,
    GetProjectsDTO,
    UpdateProjectDTO,
} from "./project.dto";
import { IProjectRepository } from "./project.repository";

import mongoose, { ClientSession } from "mongoose";
import { DeleteDto } from "../../common/dtos/delete.dto";
import { TransitionRequestDto } from "../../common/dtos/transition.dto";
import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";
import { TransitionHelper } from "../../common/helpers/transition.helper";
import { ICallRepository } from "../calls/call.repository";
import { CallStatus } from "../calls/call.status";
import { ICallStageRepository } from "../calls/stages/call.stage.repository";
import { IGrantAllocationRepository } from "../grants/allocations/grant.allocation.repository";
import { AllocationStatus } from "../grants/allocations/grant.allocation.state-machine";
import { ConstraintValidator } from "../grants/constraints/constraint.validator";
import { ICollaboratorRepository } from "./collaborators/collaborator.repository";
import { CollaboratorService } from "./collaborators/collaborator.service";
import { IPhaseRepository } from "./phase/phase.repository";
import { PhaseService } from "./phase/phase.service";
import { ProjectAuth } from "./project.auth";
import { ProjectStatus } from "./project.model";
import { PROJECT_TRANSITIONS } from "./project.state-machine";
import { IProjectStageRepository } from "./stages/project.stage.repository";
import { ProjectStageService } from "./stages/project.stage.service";
import { IProjectSynchronizer } from "./stages/project.stage.synchronizer";
import { PhaseStatus } from "./phase/phase.model";
import { CollaboratorStatus } from "./collaborators/collaborator.model";


export class ProjectService {

    constructor(
        private readonly projRepo: IProjectRepository,
        private readonly projAuth: ProjectAuth,
        private readonly allocRepo: IGrantAllocationRepository,
        private readonly callRepo: ICallRepository,
        private readonly collabRepo: ICollaboratorRepository,
        private readonly collabService: CollaboratorService,
        private readonly phaseRepo: IPhaseRepository,
        private readonly phaseService: PhaseService,
        private readonly projectStageRepo: IProjectStageRepository,
        private readonly projectStageService: ProjectStageService,        
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
        const { call, title, summary, applicant, collaborators, phases, themes, docPath } = dto;
        const lead = collaborators.find(c => c.isLeadPI);
        if (!lead) throw new AppError(ERROR_CODES.LEAD_PI_REQUIRED);
        if (lead.applicant !== applicant) throw new AppError(ERROR_CODES.UNAUTHORIZED);

        const callDoc = await this.callRepo.findById(call);
        if (!callDoc) throw new AppError(ERROR_CODES.CALL_NOT_FOUND);
        if (callDoc.status !== CallStatus.active) throw new AppError(ERROR_CODES.CALL_NOT_ACTIVE);

        const grantAllocation = String(callDoc.grantAllocation);
        const grantAllocDoc = await this.allocRepo.findById(grantAllocation);
        if (!grantAllocDoc) throw new Error(ERROR_CODES.ALLOCATION_NOT_FOUND);
        if (grantAllocDoc.status !== AllocationStatus.active) throw new Error(ERROR_CODES.ALLOCATION_NOT_ACTIVE);

        const grantId = String(grantAllocDoc.grant);
        await this.validator.validateAll(grantId, {
            collaborators, phases, themes, title, summary
        });

        //Start a Mongo Database Session
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const createdProj = await this.create(
                { call, grantAllocation, title, summary, applicant, themes },
                { skipValidation: true }, session);

            const projectId = String(createdProj._id);

            for (const collab of collaborators) {
                if (collab.applicant === applicant) {
                    continue;
                }
                await this.collabService.create({
                    project: projectId,
                    applicant: collab.applicant,
                    projectTitle: title,
                    role: collab.role,
                    userId: applicant
                }, { skipValidation: true }, session);
            }

            const orderedPhases = [...phases].sort((a, b) => a.order - b.order);

            for (const phase of orderedPhases) {
                await this.phaseService.create(
                    {
                        project: projectId,
                        order: phase.order,
                        title: phase.title,
                        budget: phase.budget,
                        duration: phase.duration,
                        description: phase.description,
                        applicantId: applicant
                    }, { skipValidation: true },
                    session
                );
            }

            await this.projectStageService.create(
                { project: projectId, documentPath: docPath, applicantId: applicant },
                session
            );
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
        await this.validateProject(id, applicantId);
        return this.projRepo.update(id, data);
    }


    async transitionState(dto: TransitionRequestDto) {
        const { id, current, next } = dto;

        const projectDoc = await this.projRepo.findById(id);
        if (!projectDoc) {
            throw new AppError(ERROR_CODES.PROJECT_NOT_FOUND);
        }
        const from = projectDoc.status as ProjectStatus;
        const to = next as ProjectStatus;

        if (current && current !== from) {
            throw new AppError(ERROR_CODES.STATE_OUT_OF_SYNC);
        }

        TransitionHelper.validateTransition(
            from,
            to,
            PROJECT_TRANSITIONS
        );

        if (next === ProjectStatus.draft || next === ProjectStatus.submitted
            || next === ProjectStatus.rejected ||
            (from !== ProjectStatus.finalization && next === ProjectStatus.accepted)
        ) {
            throw new AppError(ERROR_CODES.UNSUPPORTED_OPERTATION);
        }

        if (next === ProjectStatus.finalization) {
            //to send notification to update the phase and collabs and to make approve
        }
        if (next === ProjectStatus.approved) {

            const phases = await this.phaseRepo.find({ project: id });
            if (!phases.every(p => p.status === PhaseStatus.approved))
                throw new AppError(ERROR_CODES.PHASES_NOT_FULLY_APPROVED);

            const collabs = await this.collabRepo.find({ project: id });
            if (!collabs.every(c => c.status === CollaboratorStatus.verified))
                throw new AppError(ERROR_CODES.COLLABORATORS_NOT_FULLY_VERIFIED);

        }

        return await this.projRepo.updateStatus(id, to);
    }


    // ---------------------------------------------------
    // DELETE
    // ---------------------------------------------------
    async delete(dto: DeleteDto) {
        const { id, userId: applicantId } = dto;
        await this.validateProject(id, applicantId ?? '');
        await this.collabRepo.deleteByProject(id);
        await this.phaseRepo.deleteByProject(id);
        return this.projRepo.delete(id);
    }
}
