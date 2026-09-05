// project.service.ts
import {
    CreateProjectDTO,
    FilterProjectsDTO,
    UpdateProjectDTO,
} from "./project.dto";
import { IProjectRepository } from "./project.repository";
import { DeleteDto } from "../../common/dtos/delete.dto";
import { TransitionRequestDto } from "../../common/dtos/transition.dto";
import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";
import { TransitionHelper } from "../../common/helpers/transition.helper";
import { ICallRepository } from "../calls/call.repository";
import { ConstraintValidationService } from "../constraints/services/constraint-validator.service";
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
import { CALL_PROJECT_TRANSITIONS, STANDALONE_PROJECT_TRANSITIONS } from "./project.state-machine";
import { FilterOptions } from "../../common/dtos/filter.dto";


export class ProjectService {

    constructor(
        private readonly projectRepo: IProjectRepository,
        private readonly collabRepo: ICollaboratorRepository,
        private readonly phaseRepo: IPhaseRepository,
        private readonly grantRepo: IGrantRepository,
        private readonly collabService: CollaboratorService,
        private readonly phaseService: PhaseService,
        private readonly callRepo: ICallRepository,
        private readonly constValidator: ConstraintValidationService,
        private readonly notificationService: NotificationService
    ) { }


    async create(dto: CreateProjectDTO, options?: { skipValidation?: boolean }) {
        const { call, grant, title, summary, leadPI, collaborators, phases, themes, userId } = dto;

        if (!options?.skipValidation) {
            const grantDoc = await this.grantRepo.findById(grant);
            if (!grantDoc) throw new Error(ERROR_CODES.GRANT_NOT_FOUND);
            if (grantDoc.status !== GrantStatus.active) throw new Error(ERROR_CODES.GRANT_NOT_ACTIVE);
        }
        if (await this.projectRepo.exists({ title })) {
            throw new AppError(
                ERROR_CODES.PROJECT_ALREADY_EXISTS,
                "A project with this title already exists. Please choose a different title."
            );
        }
        const created = await this.projectRepo.create({
            ...dto, status: ProjectStatus.draft,
            createdBy: userId
        });
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


    async getProjects(filter: FilterProjectsDTO, options?: FilterOptions) {
        return this.projectRepo.find(filter, options);
    }

    getMyProjects = async (
        userId: string,
        options?: FilterOptions
    ) => {
        return this.projectRepo.find(
            {
                leadPI: userId
            },
            { ...options, populate: true }
        );
    };

    async getById(id: string, options?: FilterOptions) {
        const proj = await this.projectRepo.findById(id, options);
        if (!proj) throw new AppError(ERROR_CODES.PROJECT_NOT_FOUND);
        return proj;
    }

    // ---------------------------------------------------
    // UPDATE
    // ---------------------------------------------------
    async update(dto: UpdateProjectDTO) {
        const { id, data, userId } = dto;
        const projectDoc = await this.getById(id);
        if (projectDoc.status !== ProjectStatus.draft)
            throw new AppError(ERROR_CODES.PROJECT_NOT_DRAFT);

        const nextThemes = data.themes ?? projectDoc.themes.map(String);
        const themesChanged =
            JSON.stringify(projectDoc.themes.map(String).sort()) !==
            JSON.stringify(nextThemes.map(String).sort());

        if (projectDoc.call && themesChanged) {
            const callDoc = await this.callRepo.findById(String(projectDoc.call));
            if (!callDoc) throw new AppError(ERROR_CODES.CALL_NOT_FOUND);

            if (callDoc.constraint) {
                const constraintId = String(callDoc.constraint);
                if (constraintId && this.constValidator) {
                    const result = await this.constValidator.validateThemes(constraintId, nextThemes);
                    if (!result.valid) {
                        throw new AppError(
                            ERROR_CODES.INVALID_CONSTRAINT,
                            "Theme validation failed",
                            400,
                            result
                        );
                    }
                }
            }
        }
        return this.projectRepo.update(id, data);
    }


    async transitionState(dto: TransitionRequestDto) {
        const { id, current, next } = dto;

        const projectDoc = await this.getById(id);

        const from = projectDoc.status as ProjectStatus;
        const to = next as ProjectStatus;

        if (current && current !== from) {
            throw new AppError(ERROR_CODES.STATE_OUT_OF_SYNC);
        }

        const transitionsMap = projectDoc.call
            ? CALL_PROJECT_TRANSITIONS
            : STANDALONE_PROJECT_TRANSITIONS;

        TransitionHelper.validateTransition(from, to, transitionsMap);

        /*
        TransitionHelper.validateTransition(
            from,
            to,
            PROJECT_TRANSITIONS
        );
        */

        if (from !== ProjectStatus.granted && to === ProjectStatus.approved) {
            await this.notificationService.notifyProjectFinalization(
                String(projectDoc.leadPI), projectDoc.title
            );
        }
        if (to === ProjectStatus.refused) {
            await this.notificationService.notifyProjectRefusal(
                String(projectDoc.leadPI), projectDoc.title
            );
        }

        //rollback notification remain

        if (to === ProjectStatus.granted) {
            const phases = await this.phaseRepo.find({ project: id });
            if (!phases.every(p => p.status === PhaseStatus.approved))
                throw new AppError(ERROR_CODES.PHASES_NOT_FULLY_APPROVED);

            /*
            const collabs = await this.collabRepo.find({ project: id });
            if (!collabs.every(c => c.status === CollaboratorStatus.verified))
                throw new AppError(ERROR_CODES.COLLABORATORS_NOT_FULLY_VERIFIED);*/

        }

        return await this.projectRepo.updateStatus(id, to);
    }


    // ---------------------------------------------------
    // DELETE
    // ---------------------------------------------------
    async delete(dto: DeleteDto) {
        const { id, userId } = dto;
        const projectDoc = await this.getById(id);
        if (
            projectDoc.status !== ProjectStatus.draft &&
            projectDoc.status !== ProjectStatus.submitted
        ) {
            throw new AppError(
                ERROR_CODES.INVALID_PROJECT_STATUS,
                "The project must be in draft or submitted status to perform this operation."
            );
        }
        await this.collabRepo.deleteByProject(id);
        await this.phaseRepo.deleteByProject(id);
        return this.projectRepo.delete(id);
    }
}
