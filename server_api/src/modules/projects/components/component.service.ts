import { ProjectAuth } from "../project.auth";

import { PERMISSIONS } from "../../../common/constants/permissions";
import { DeleteDto } from "../../../common/dtos/delete.dto";
import { FilterOptions } from "../../../common/dtos/filter.dto";
import { TransitionRequestDto } from "../../../common/dtos/transition.dto";      // adjust path
import { TransitionHelper } from "../../../common/helpers/transition.helper";    // adjust path
import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";

import { ProjectStatus } from "../project.model";
import { ProjectComponentRepository } from "./component.repository";
import { ICollaboratorRepository } from "../collaborators/collaborator.repository";
import {
    CreateProjectComponentDTO,
    FilterProjectComponents,
    UpdateProjectComponentDTO,
} from "./component.dto";
import { ProjectComponentStatus } from "./component.model";
import { PhaseActivityRepository } from "../activities/phase-activity.repository";
import { IThemeRepository } from "../../thematics/themes/theme.repository";
import { CollaboratorStatus } from "../collaborators/collaborator.model";


interface ComponentRelations {
    contributors?: (string | any)[];
    activities?: (string | any)[];
    themes?: (string | any)[];
}

export class ProjectComponentService {

    constructor(
        private readonly componentRepo: ProjectComponentRepository,
        private readonly collaboratorRepo: ICollaboratorRepository,
        private readonly activityRepo: PhaseActivityRepository,
        private readonly themeRepo: IThemeRepository,
        private readonly projectAuth: ProjectAuth
    ) { }

    // ---------------------------------------------------
    // HELPERS
    // ---------------------------------------------------

    private unique(ids: (string | any)[] = []): string[] {
        return [...new Set(ids.map(String))];
    }

    // ---------------------------------------------------
    // VALIDATE CONTRIBUTORS
    // Every contributor must be a collaborator of the project.
    // ---------------------------------------------------

    private async validateContributors(
        projectId: string,
        contributors: (string | any)[],
        requireVerified = false
    ) {
        const userIds = this.unique(contributors);
        if (!userIds.length) return;

        const collaborators = await this.collaboratorRepo.find({
            project: projectId,
        });

        // member -> collaborator status
        const statusByMember = new Map<string, CollaboratorStatus>(
            collaborators.map((c: any) => [
                String(c.member?._id ?? c.member),
                c.status as CollaboratorStatus,
            ])
        );

        // Every contributor must be a collaborator of this project
        if (userIds.some((id) => !statusByMember.has(id))) {
            throw new AppError(ERROR_CODES.COLLABORATOR_NOT_FOUND);
        }

        // Verification is only enforced when requested (on approval)
        if (
            requireVerified &&
            userIds.some(
                (id) => statusByMember.get(id) !== CollaboratorStatus.verified
            )
        ) {
            throw new AppError(ERROR_CODES.COLLABORATOR_NOT_VERIFIED);
        }
    }

    // ---------------------------------------------------
    // VALIDATE ACTIVITIES
    // Must exist and belong to the same project.
    // ---------------------------------------------------

    private async validateActivities(
        projectId: string,
        activities: (string | any)[]
    ) {
        const activityIds = this.unique(activities);

        const docs = await Promise.all(
            activityIds.map((id) => this.activityRepo.findById(id))
        );

        for (const activity of docs) {
            if (!activity) {
                throw new AppError(ERROR_CODES.PHASE_ACTIVITY_NOT_FOUND);
            }
            if (String(activity.project) !== projectId) {
                throw new AppError(ERROR_CODES.ACTIVITY_NOT_IN_PROJECT);
            }
        }
    }

    // ---------------------------------------------------
    // ACTIVITY BELONGS TO ONE COMPONENT ONLY
    // ---------------------------------------------------

    private async validateActivitiesNotAssigned(
        projectId: string,
        activities: (string | any)[],
        excludeComponentId?: string
    ) {
        const activityIds = this.unique(activities);
        if (!activityIds.length) return;

        const taken = await this.componentRepo.exists({
            project: projectId,
            activities: activityIds,
            excludeId: excludeComponentId,
        });

        if (taken) {
            throw new AppError(ERROR_CODES.ACTIVITY_ALREADY_IN_COMPONENT);
        }
    }

    // ---------------------------------------------------
    // VALIDATE THEMES
    // Must exist and be one of the project's own themes.
    // ---------------------------------------------------

    private async validateThemes(
        projectDoc: { themes?: any[] },
        themes: (string | any)[]
    ) {
        const themeIds = this.unique(themes);
        if (!themeIds.length) return;

        const projectThemeIds = new Set(
            (projectDoc.themes ?? []).map((t: any) => String(t?._id ?? t))
        );

        const docs = await Promise.all(
            themeIds.map((id) => this.themeRepo.findById(id))
        );

        themeIds.forEach((id, i) => {
            if (!docs[i]) {
                throw new AppError(ERROR_CODES.THEME_NOT_FOUND);
            }
            if (!projectThemeIds.has(id)) {
                throw new AppError(ERROR_CODES.THEME_NOT_IN_PROJECT);
            }
        });
    }

    // ---------------------------------------------------
    // VALIDATE RELATIONS (only the fields provided)
    // ---------------------------------------------------

    private async validateRelations(
        projectId: string,
        projectDoc: { themes?: any[] },
        relations: ComponentRelations,
        excludeComponentId?: string
    ) {
        await Promise.all([
            relations.contributors !== undefined
                ? this.validateContributors(projectId, relations.contributors)
                : undefined,
            relations.activities !== undefined
                ? this.validateActivities(projectId, relations.activities)
                    .then(() => this.validateActivitiesNotAssigned(
                        projectId,
                        relations.activities!,
                        excludeComponentId
                    ))
                : undefined,
            relations.themes !== undefined
                ? this.validateThemes(projectDoc, relations.themes)
                : undefined,
        ]);
    }

    // ---------------------------------------------------
    // VALIDATE READY FOR APPROVAL
    // Contributors, activities and themes must all be assigned
    // and valid against the project.
    // ---------------------------------------------------

    private async validateReadyForApproval(
        component: {
            contributors: any[];
            activities: any[];
            themes: any[];
        },
        projectId: string,
        projectDoc: { themes?: any[] }
    ) {
        if (!component.contributors?.length) {
            throw new AppError(ERROR_CODES.COMPONENT_NO_CONTRIBUTORS);
        }
        if (!component.activities?.length) {
            throw new AppError(ERROR_CODES.COMPONENT_NO_ACTIVITIES);
        }
        if (!component.themes?.length) {
            throw new AppError(ERROR_CODES.COMPONENT_NO_THEMES);
        }

        // Re-check against current project data (collaborators or
        // project themes may have changed since the component was saved).
        await this.validateContributors(projectId, component.contributors, true);
        await this.validateActivities(projectId, component.activities);
        await this.validateThemes(projectDoc, component.themes);
    }

    // ---------------------------------------------------
    // CREATE
    // ---------------------------------------------------

    async create(
        dto: CreateProjectComponentDTO,
        userId: string
    ) {
        const projectId = String(dto.project);

        const { projectDoc, isLeadPI } = await this.projectAuth.auth(
            projectId,
            userId,
            PERMISSIONS.PROJECT_COMPONENT.CREATE
        );

        if (isLeadPI && projectDoc.status !== ProjectStatus.draft) {
            throw new AppError(ERROR_CODES.PROJECT_NOT_DRAFT);
        }

        await this.validateRelations(projectId, projectDoc, {
            contributors: dto.contributors,
            activities: dto.activities,
            themes: dto.themes,
        });

        return await this.componentRepo.create(dto, userId);
    }

    // ---------------------------------------------------
    // GET
    // ---------------------------------------------------

    async getComponents(
        filter: FilterProjectComponents,
        options?: FilterOptions
    ) {
        return await this.componentRepo.find(filter, options);
    }

    // ---------------------------------------------------
    // GET BY ID
    // ---------------------------------------------------

    async getById(
        id: string,
        options?: FilterOptions
    ) {
        const component = await this.componentRepo.findById(id, options);

        if (!component) {
            throw new AppError(ERROR_CODES.PROJECT_COMPONENT_NOT_FOUND);
        }

        return component;
    }

    // ---------------------------------------------------
    // UPDATE
    // ---------------------------------------------------

    async update(

        id: string,
        data: UpdateProjectComponentDTO,
        userId: string,


    ) {


        const component = await this.componentRepo.findById(id);

        if (!component) {
            throw new AppError(ERROR_CODES.PROJECT_COMPONENT_NOT_FOUND);
        }

        // An approved component is locked so its approval stays valid.
        // To edit it, transition it back to pending first.
        if (component.status === ProjectComponentStatus.approved) {
            throw new AppError(ERROR_CODES.COMPONENT_LOCKED);
        }

        const projectId = String(component.project);

        const { projectDoc, isLeadPI } = await this.projectAuth.auth(
            projectId,
            userId,
            PERMISSIONS.PROJECT_COMPONENT.UPDATE
        );

        if (isLeadPI && projectDoc.status !== ProjectStatus.draft) {
            throw new AppError(ERROR_CODES.PROJECT_NOT_DRAFT);
        }

        await this.validateRelations(
            projectId,
            projectDoc,
            {
                contributors: data.contributors,
                activities: data.activities,
                themes: data.themes,
            },
            id
        );

        return await this.componentRepo.update(id, data, userId);
    }

    // ---------------------------------------------------
    // TRANSITION STATE
    // ---------------------------------------------------

    async transitionState(
        dto: TransitionRequestDto,
        userId: string
    ) {
        const { id, next, current, reason } = dto;

        const component = await this.componentRepo.findById(id);

        if (!component) {
            throw new AppError(ERROR_CODES.PROJECT_COMPONENT_NOT_FOUND);
        }

        const from = component.status as ProjectComponentStatus;
        const to = next as ProjectComponentStatus;

        if (current && current !== from) {
            throw new AppError(ERROR_CODES.STATE_OUT_OF_SYNC);
        }

        TransitionHelper.validateTransition(
            from,
            to,
            PROJECT_COMPONENT_TRANSITIONS
        );

        const projectId = String(component.project);


        const { projectDoc } = await this.projectAuth.auth(
            projectId,
            userId,
            //PERMISSIONS.PROJECT_COMPONENT.TRANSITION   // adjust to your permission name
        );

        if (to === ProjectComponentStatus.refused && !reason?.trim()) {
            //throw new AppError(ERROR_CODES.REASON_REQUIRED);
        }

        if (to === ProjectComponentStatus.approved) {
            await this.validateReadyForApproval(
                component,
                projectId,
                projectDoc
            );
        }

        return await this.componentRepo.updateStatus(
            id,
            { status: to, reason },
            userId
        );
    }

    // ---------------------------------------------------
    // DELETE
    // ---------------------------------------------------

    async delete(
        dto: DeleteDto,
        userId: string
    ) {
        const { id } = dto;

        const component = await this.componentRepo.findById(id);

        if (!component) {
            throw new AppError(ERROR_CODES.PROJECT_COMPONENT_NOT_FOUND);
        }

        const projectId = String(component.project);

        const { projectDoc, isLeadPI } = await this.projectAuth.auth(
            projectId,
            userId,
            PERMISSIONS.PROJECT_COMPONENT.DELETE
        );

        if (isLeadPI && projectDoc.status !== ProjectStatus.draft) {
            throw new AppError(ERROR_CODES.PROJECT_NOT_DRAFT);
        }

        return await this.componentRepo.delete(id);
    }

    // ---------------------------------------------------
    // DELETE BY PROJECT
    // ---------------------------------------------------

    async deleteByProject(
        projectId: string,
        userId: string
    ) {
        const { projectDoc, isLeadPI } = await this.projectAuth.auth(
            projectId,
            userId,
            PERMISSIONS.PROJECT_COMPONENT.DELETE
        );

        if (isLeadPI && projectDoc.status !== ProjectStatus.draft) {
            throw new AppError(ERROR_CODES.PROJECT_NOT_DRAFT);
        }

        return await this.componentRepo.deleteByProject(projectId);
    }
}

export const PROJECT_COMPONENT_TRANSITIONS: Record<
    ProjectComponentStatus,
    ProjectComponentStatus[]
> = {
    [ProjectComponentStatus.pending]: [
        ProjectComponentStatus.approved,
        ProjectComponentStatus.refused,
    ],
    [ProjectComponentStatus.approved]: [ProjectComponentStatus.pending], // reopen
    [ProjectComponentStatus.refused]: [ProjectComponentStatus.pending],  // resubmit
};