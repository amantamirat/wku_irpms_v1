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
import { CallStatus } from "../calls/call.model";
import { IGrantAllocationRepository } from "../grants/allocations/grant.allocation.repository";
import { AllocationStatus, IGrantAllocation } from "../grants/allocations/grant.allocation.model";
import { ConstraintValidator } from "../grants/constraints/constraint.validator";
import { CollaboratorStatus } from "./collaborators/collaborator.model";
import { ICollaboratorRepository } from "./collaborators/collaborator.repository";
import { CollaboratorService } from "./collaborators/collaborator.service";
import { PhaseStatus } from "./phase/phase.model";
import { IPhaseRepository } from "./phase/phase.repository";
import { PhaseService } from "./phase/phase.service";
import { ProjectAuth } from "./project.auth";
import { ProjectStatus } from "./project.model";
import { PROJECT_TRANSITIONS } from "./project.state-machine";
import { IProjectStageRepository } from "./stages/project.stage.repository";
import { ProjectStageService } from "./stages/project.stage.service";
import { NotificationService } from "../notifications/notification.service";
import { CompositionValidator } from "../grants/compositions/composition.validator";
import { ICallStageRepository } from "../calls/stages/call.stage.repository";
import { CallStageStatus } from "../calls/stages/call.stage.model";
import { GrantRepository, IGrantRepository } from "../grants/grant.repository";
import { GrantStatus } from "../grants/grant.model";


export class ProjectService {

    constructor(
        private readonly projectRepo: IProjectRepository,
        private readonly projAuth: ProjectAuth,
        private readonly allocRepo: IGrantAllocationRepository,
        private readonly callRepo: ICallRepository,
        private readonly callStageRepo: ICallStageRepository,
        private readonly collabRepo: ICollaboratorRepository,
        private readonly collabService: CollaboratorService,
        private readonly phaseRepo: IPhaseRepository,
        private readonly phaseService: PhaseService,
        private readonly projectStageRepo: IProjectStageRepository,
        private readonly projectStageService: ProjectStageService,
        private readonly constValidator: ConstraintValidator,
        private readonly notificationService: NotificationService,
        private readonly compValidator = new CompositionValidator(),
        private readonly grantRepo: IGrantRepository = new GrantRepository(),
    ) { }


    async validateProject(project: string, applicant: string, session?: ClientSession) {
        const projectDoc = await this.projAuth.authProject(project, applicant, session);
        if (projectDoc.status !== ProjectStatus.draft) {
            throw new AppError(ERROR_CODES.INVALID_PROJECT_STATUS);
        }
        return projectDoc;
    }

    async create(dto: CreateProjectDTO, options?: { skipValidation?: boolean }, session?: ClientSession) {
        const { grant, title, summary, themes, applicant } = dto
        if (!options?.skipValidation) {
            const grantDoc = await this.grantRepo.findById(grant);
            if (!grantDoc) throw new Error(ERROR_CODES.GRANT_NOT_FOUND);
            if (grantDoc.status !== GrantStatus.active) throw new Error(ERROR_CODES.GRANT_NOT_ACTIVE);
            const grantId = String(grantDoc._id);
            await this.compValidator.validatePI(grantId, applicant);
            await this.constValidator.validateMetadata(grantId, title, summary);
            await this.constValidator.validateThemes(grantId, themes);
        }
        const created = await this.projectRepo.create(dto, session);
        if (created) {
            await this.collabService.create({
                project: String(created._id),
                projectTitle: title,
                applicant: applicant,
                role: "Principal Investigator",
                userId: applicant
            }, { skipValidation: true },
                session);
        }
        return created;
    }


    async apply(dto: ApplyProjectDTO) {
        const { call, title, summary, applicant, collaborators, phases, themes, docPath } = dto;
        const lead = collaborators.find(c => c.isLeadPI);
        if (!lead) throw new AppError(ERROR_CODES.LEAD_PI_NOT_FOUND);
        if (lead.applicant !== applicant) throw new AppError(ERROR_CODES.UNAUTHORIZED);

        const callDoc = await this.callRepo.findById(call);
        if (!callDoc) throw new AppError(ERROR_CODES.CALL_NOT_FOUND);
        if (callDoc.status !== CallStatus.active) throw new AppError(ERROR_CODES.CALL_NOT_ACTIVE);

        const callStageDoc = await this.callStageRepo.findOne({ callId: call, order: 1 });
        if (!callStageDoc) throw new AppError(ERROR_CODES.STAGE_NOT_FOUND);
        if (callStageDoc.status !== CallStageStatus.active) throw new AppError(ERROR_CODES.STAGE_NOT_ACTIVE);
        if (callStageDoc.deadline < new Date()) throw new AppError(ERROR_CODES.STAGE_DEADLINE_PASSED);

        const allocation = String(callDoc.grantAllocation);
        const allocDoc = await this.allocRepo.findById(allocation);
        if (!allocDoc) throw new Error(ERROR_CODES.ALLOCATION_NOT_FOUND);
        if (allocDoc.status !== AllocationStatus.active) throw new Error(ERROR_CODES.ALLOCATION_NOT_ACTIVE);
        const grantId = String(allocDoc.grant);
        await this.constValidator.validateAll(grantId, { participantCount: collaborators.length, phases, themes, title, summary });
        await this.compValidator.validateAll(grantId, collaborators);
        const skipValidation = { skipValidation: true };

        //Start a Mongo Database Session
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const createdProj = await this.create(
                { call, grant: allocation, title, summary, applicant, themes },
                skipValidation, session);

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
                }, skipValidation, session);
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
                    }, skipValidation, session);
            }

            await this.projectStageService.create(
                {
                    project: projectId,
                    projectTitle: title,
                    callStage: String(callStageDoc._id),
                    grantStage: String(callStageDoc.grantStage),
                    stageName: callDoc.title,
                    documentPath: docPath,
                    applicantId: applicant
                },
                skipValidation,
                session);
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
        return this.projectRepo.find(options);
    }

    async getById(id: string) {
        const proj = await this.projectRepo.findById(id);
        if (!proj) throw new AppError(ERROR_CODES.PROJECT_NOT_FOUND);
        return proj;
    }

    // ---------------------------------------------------
    // UPDATE
    // ---------------------------------------------------
    async update(dto: UpdateProjectDTO) {
        const { id, data, applicantId } = dto;

        const projectDoc = await this.validateProject(id, applicantId);

        const allocDoc = projectDoc.grant as unknown as IGrantAllocation;
        const grantId = String(allocDoc.grant);

        // Resolve next values
        const nextTitle = data.title ?? projectDoc.title;
        const nextSummary = data.summary ?? projectDoc.summary;

        // Validate metadata only if changed
        if (
            nextTitle !== projectDoc.title ||
            nextSummary !== projectDoc.summary
        ) {
            await this.constValidator.validateMetadata(
                grantId,
                nextTitle,
                nextSummary
            );
        }

        const nextThemes = data.themes ?? projectDoc.themes.map(String);

        const themesChanged =
            JSON.stringify(projectDoc.themes.map(String).sort()) !==
            JSON.stringify(nextThemes.map(String).sort());

        if (themesChanged) {
            await this.constValidator.validateThemes(
                grantId,
                nextThemes
            );
        }
        return this.projectRepo.update(id, data);
    }


    async transitionState(dto: TransitionRequestDto) {
        const { id, current, next } = dto;

        const projectDoc = await this.projectRepo.findById(id);
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

        if (to === ProjectStatus.draft ||
            to === ProjectStatus.submitted ||
            to === ProjectStatus.rejected ||
            (from === ProjectStatus.submitted && to === ProjectStatus.accepted) ||
            to === ProjectStatus.active ||
            to === ProjectStatus.terminated ||
            to === ProjectStatus.completed
        ) {
            throw new AppError(ERROR_CODES.INVALID_OPERTATION);
        }

        if (to === ProjectStatus.granted) {
            const phases = await this.phaseRepo.find({ project: id });
            if (!phases.every(p => p.status === PhaseStatus.approved))
                throw new AppError(ERROR_CODES.PHASES_NOT_FULLY_APPROVED);

            const collabs = await this.collabRepo.find({ project: id });
            if (!collabs.every(c => c.status === CollaboratorStatus.verified))
                throw new AppError(ERROR_CODES.COLLABORATORS_NOT_FULLY_VERIFIED);
        }

        return await this.projectRepo.updateStatus(id, to);
    }


    // ---------------------------------------------------
    // DELETE
    // ---------------------------------------------------
    async delete(dto: DeleteDto) {
        const { id, userId: applicantId } = dto;
        await this.validateProject(id, applicantId ?? '');
        await this.collabRepo.deleteByProject(id);
        await this.phaseRepo.deleteByProject(id);
        return this.projectRepo.delete(id);
    }
}
