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
import { IApplicationRepository } from "./applications/application.repository";
import { ApplicationService } from "./applications/application.service";
import { NotificationService } from "../notifications/notification.service";
import { CompositionValidator } from "../grants/compositions/composition.validator";
import { IStageRepository } from "../calls/stages/stage.repository";
import { GrantRepository, IGrantRepository } from "../grants/grant.repository";
import { GrantStatus } from "../grants/grant.model";
import { GrantStageRepository, IGrantStageRepository } from "../grants/stages/grant.stage.repository";


export class ProjectService {

    constructor(
        private readonly projectRepo: IProjectRepository,
        private readonly collabRepo: ICollaboratorRepository,
        private readonly phaseRepo: IPhaseRepository,
        private readonly grantRepo: IGrantRepository,
        private readonly callRepo: ICallRepository,
        private readonly stageRepo: IStageRepository,
        private readonly collabService: CollaboratorService,
        private readonly phaseService: PhaseService,
        private readonly applicationService: ApplicationService,
        private readonly constValidator: ConstraintValidator,
        private readonly compValidator: CompositionValidator,

        private readonly projAuth: ProjectAuth = new ProjectAuth(projectRepo),
        private readonly notificationService?: NotificationService,
    ) { }


    async validateProject(project: string, applicant: string, session?: ClientSession) {
        const projectDoc = await this.projAuth.authProject(project, applicant);
        if (projectDoc.status !== ProjectStatus.draft) {
            throw new AppError(ERROR_CODES.INVALID_PROJECT_STATUS);
        }
        return projectDoc;
    }

    async create(dto: CreateProjectDTO, options?: { skipValidation?: boolean }) {
        const { grant, title, summary, applicant, collaborators, phases, themes, userId } = dto;

        if (!options?.skipValidation) {
            const grantDoc = await this.grantRepo.findById(grant);
            if (!grantDoc) throw new Error(ERROR_CODES.GRANT_NOT_FOUND);
            if (grantDoc.status !== GrantStatus.active) throw new Error(ERROR_CODES.GRANT_NOT_ACTIVE);
            const grantId = String(grantDoc._id);
            //check title uniqueness 
            await this.compValidator.validatePI(grantId, applicant);
            await this.constValidator.validateMetadata(grantId, title, summary);
            await this.constValidator.validateThemes(grantId, themes);
        }
        const created = await this.projectRepo.create(dto);
        if (!created) {
            throw new AppError(ERROR_CODES.PROJECT_NOT_FOUND);
        }
        const projectId = String(created._id);
        if (collaborators?.length) {
            for (const collab of collaborators) {
                await this.collabService.create(
                    {
                        project: projectId,
                        projectTitle: title,
                        applicant: collab.applicant,
                        isLeadPI: applicant === collab.applicant,
                        status: userId === collab.applicant ? CollaboratorStatus.verified : CollaboratorStatus.pending,
                        role: collab.isLeadPI
                            ? "Principal Investigator"
                            : collab.role
                    }, options);
            }
        }
        // Create phases
        if (phases?.length) {
            const orderedPhases = [...phases].sort(
                (a, b) => a.order - b.order
            );
            for (const phase of orderedPhases) {
                await this.phaseService.create(
                    {
                        project: projectId,
                        order: phase.order,
                        title: phase.title,
                        budget: phase.budget,
                        duration: phase.duration,
                        description: phase.description
                    }, options);
            }
        }
        return created;
    }


    async apply(dto: ApplyProjectDTO) {
        const { call, title, summary, applicant, collaborators, phases, themes, userId, docPath } = dto;
        const lead = collaborators.find(c => c.isLeadPI);
        if (!lead) throw new AppError(ERROR_CODES.LEAD_PI_NOT_FOUND);
        if (lead.applicant !== userId) throw new AppError(ERROR_CODES.UNAUTHORIZED);

        const callDoc = await this.callRepo.findById(call);
        if (!callDoc) throw new AppError(ERROR_CODES.CALL_NOT_FOUND);
        if (callDoc.status !== CallStatus.active) throw new AppError(ERROR_CODES.CALL_NOT_ACTIVE);

        const stageDoc = await this.stageRepo.findOne(String(callDoc._id), 1);
        if (!stageDoc) throw new AppError(ERROR_CODES.STAGE_NOT_FOUND);
        const deadline = stageDoc.deadline;
        if (deadline < new Date()) {
            throw new AppError(ERROR_CODES.STAGE_DEADLINE_PASSED);
        }

        const calendarId = String(callDoc.calendar);
        const grantId = String(callDoc.grant);
        await this.constValidator.validateAll(grantId, { participantCount: collaborators.length, phases, themes, title, summary });
        await this.compValidator.validateAll(grantId, collaborators);
        const skipValidation = { skipValidation: true };
        try {
            const createdProj = await this.create({ ...dto, grant: grantId, calendar: calendarId },
                skipValidation);
            const projectId = String(createdProj._id);
            await this.applicationService.create({
                project: projectId, stage: String(stageDoc._id), documentPath: docPath, userId: userId
            }, skipValidation);
            return createdProj;
        } catch (error) {
            throw error;
        } finally {

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
        const isCallProject = !!projectDoc.call;
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

        if (to === ProjectStatus.draft && isCallProject ||
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
