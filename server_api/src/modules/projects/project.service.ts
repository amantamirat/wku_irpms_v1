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
import { CompositionValidator } from "../grants/compositions/composition.validator";
import { GrantStatus } from "../grants/grant.model";
import { IGrantRepository } from "../grants/grant.repository";
import { NotificationService } from "../notifications/notification.service";
import { CollaboratorStatus } from "./collaborators/collaborator.model";
import { ICollaboratorRepository } from "./collaborators/collaborator.repository";
import { CollaboratorService } from "./collaborators/collaborator.service";
import { PhaseStatus } from "./phase/phase.model";
import { IPhaseRepository } from "./phase/phase.repository";
import { PhaseService } from "./phase/phase.service";
import { ProjectStatus } from "./project.model";
import { PROJECT_TRANSITIONS } from "./project.state-machine";


export class ProjectService {

    constructor(
        private readonly projectRepo: IProjectRepository,
        private readonly collabRepo: ICollaboratorRepository,
        private readonly phaseRepo: IPhaseRepository,
        private readonly grantRepo: IGrantRepository,
        private readonly collabService: CollaboratorService,
        private readonly phaseService: PhaseService,
        private readonly compValidator: CompositionValidator,
        private readonly notificationService?: NotificationService,
    ) { }


    async validateProject(project: string) {
        const projectDoc = await this.projectRepo.findById(project);
        if (!projectDoc) throw new AppError(ERROR_CODES.PROJECT_NOT_FOUND);
        if (projectDoc.status !== ProjectStatus.draft)
            throw new AppError(ERROR_CODES.PROJECT_NOT_DRAFT);
        return projectDoc;
    }

    async create(dto: CreateProjectDTO, options?: { skipValidation?: boolean }) {
        const { grant, title, summary, leadPI, collaborators, phases, themes, userId } = dto;

        if (!options?.skipValidation) {
            const grantDoc = await this.grantRepo.findById(grant);
            if (!grantDoc) throw new Error(ERROR_CODES.GRANT_NOT_FOUND);
            if (grantDoc.status !== GrantStatus.active) throw new Error(ERROR_CODES.GRANT_NOT_ACTIVE);
            const grantId = String(grantDoc._id);
            //check title uniqueness 
            // await this.compValidator.validatePI(grantId, leadPI);
            //await this.constValidator.validateMetadata(grantId, title, summary);
            // await this.constValidator.validateThemes(grantId, themes);
        }
        const created = await this.projectRepo.create({ ...dto, createdBy: userId });
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
                        member: collab.member,
                        isLeadPI: leadPI === collab.member,
                        status: userId === collab.member ? CollaboratorStatus.verified : CollaboratorStatus.pending,
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
        const { id, data, userId: userId } = dto;
        const projectDoc = await this.validateProject(id);
        const grantId = String(projectDoc.grant);
        // Resolve next values
        const nextTitle = data.title ?? projectDoc.title;
        const nextSummary = data.summary ?? projectDoc.summary;
        // Validate metadata only if changed
        if (
            nextTitle !== projectDoc.title ||
            nextSummary !== projectDoc.summary
        ) {
            /*
            await this.constValidator.validateMetadata(
                grantId,
                nextTitle,
                nextSummary
            );
            */
        }
        const nextThemes = data.themes ?? projectDoc.themes.map(String);

        const themesChanged =
            JSON.stringify(projectDoc.themes.map(String).sort()) !==
            JSON.stringify(nextThemes.map(String).sort());

        if (themesChanged) {
            /*
            await this.constValidator.validateThemes(
                grantId,
                nextThemes
            );
            */
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

        if (to === ProjectStatus.submitted ||
            to === ProjectStatus.rejected ||
            to === ProjectStatus.active ||
            to === ProjectStatus.terminated ||
            to === ProjectStatus.completed
        ) {

            throw new AppError(ERROR_CODES.INVALID_OPERTATION);
        }

        if (to === ProjectStatus.draft) {
            if (projectDoc.currentApplication) {
                throw new AppError(ERROR_CODES.APPLICATION_ALREADY_EXISTS);
            }
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
        const { id, userId } = dto;
        await this.validateProject(id);
        await this.collabRepo.deleteByProject(id);
        await this.phaseRepo.deleteByProject(id);
        return this.projectRepo.delete(id);
    }
}
