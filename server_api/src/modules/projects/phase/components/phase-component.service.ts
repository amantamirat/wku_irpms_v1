import { PERMISSIONS } from "../../../../common/constants/permissions";
import { AppError } from "../../../../common/errors/app.error";
import { ERROR_CODES } from "../../../../common/errors/error.codes";
import { ICollaboratorRepository } from "../../collaborators/collaborator.repository";
import { ProjectStatus } from "../../project.model";
import { ProjectAuth } from "../../project.auth";
import { IPhaseActivityRepository } from "../activities/phase-activity.repository";
import { PhaseActivityStatus } from "../activities/phase-activity.model";
import { IPhaseRepository } from "../phase.repository";
import {
    CreateProjectComponentDto,
    FilterProjectComponents,
    UpdateProjectComponentDto,
} from "./phase-component.dto";
import { IProjectComponentRepository } from "./phase-component.repository";

export class ProjectComponentService {
    constructor(
        private readonly componentRepo: IProjectComponentRepository,
        private readonly phaseRepo: IPhaseRepository,
        private readonly activityRepo: IPhaseActivityRepository,
        private readonly collaboratorRepo: ICollaboratorRepository,
        private readonly projectAuth: ProjectAuth
    ) {}

    async getComponents(filter: FilterProjectComponents = {}) {
        let projectId = filter.project ? String(filter.project) : undefined;
        let phaseIds: string[] = [];

        if (filter.phase) {
            const phase = await this.phaseRepo.findById(String(filter.phase));
            if (!phase) throw new AppError(ERROR_CODES.PHASE_NOT_FOUND);
            projectId = String(phase.project);
            phaseIds = [String(phase._id)];
        } else if (projectId) {
            const phases = await this.phaseRepo.find({ project: projectId });
            phaseIds = phases.map(phase => String(phase._id));
        }

        if (!projectId) return [];

        const components = await this.componentRepo.find({ project: projectId });
        return Promise.all(components.map(async component => {
            const activities = phaseIds.length
                ? await this.activityRepo.find({
                    phases: phaseIds,
                    component: String(component._id),
                })
                : [];
            const statuses = activities.map(activity => activity.status);
            let status = "planned";
            if (statuses.length && statuses.every(value => value === PhaseActivityStatus.completed)) {
                status = "completed";
            } else if (statuses.some(value => value === PhaseActivityStatus.active)) {
                status = "active";
            } else if (
                statuses.length &&
                statuses.every(value =>
                    value === PhaseActivityStatus.approved ||
                    value === PhaseActivityStatus.completed
                )
            ) {
                status = "approved";
            }
            return { ...component, activities, status };
        }));
    }

    async create(dto: CreateProjectComponentDto, userId: string) {
        const { projectDoc, isLeadPI } = await this.projectAuth.auth(
            dto.project,
            userId,
            PERMISSIONS.PHASE_ACTIVITY.CREATE
        );
        this.ensureProjectEditable(projectDoc, isLeadPI);
        await this.validateContributors(
            dto.contributors,
            dto.project,
            String(projectDoc.leadPI)
        );
        return this.componentRepo.create(dto, userId);
    }

    async update(id: string, data: UpdateProjectComponentDto, userId: string) {
        const component = await this.componentRepo.findById(id);
        if (!component) throw new AppError(ERROR_CODES.PHASE_COMPONENT_NOT_FOUND);
        const projectId = String(component.project);
        const { projectDoc, isLeadPI } = await this.projectAuth.auth(
            projectId,
            userId,
            PERMISSIONS.PHASE_ACTIVITY.UPDATE
        );
        this.ensureProjectEditable(projectDoc, isLeadPI);
        if (data.contributors) {
            await this.validateContributors(data.contributors, projectId, String(projectDoc.leadPI));
        }
        return this.componentRepo.update(id, data, userId);
    }

    async delete(id: string, userId: string) {
        const component = await this.componentRepo.findById(id);
        if (!component) throw new AppError(ERROR_CODES.PHASE_COMPONENT_NOT_FOUND);
        const { projectDoc, isLeadPI } = await this.projectAuth.auth(
            String(component.project),
            userId,
            PERMISSIONS.PHASE_ACTIVITY.DELETE
        );
        this.ensureProjectEditable(projectDoc, isLeadPI);
        const activities = await this.activityRepo.find({ component: id });
        if (activities.length) {
            throw new AppError(
                ERROR_CODES.PHASE_COMPONENT_IN_USE,
                "A project component assigned to activities cannot be deleted."
            );
        }
        return this.componentRepo.delete(id);
    }

    private ensureProjectEditable(projectDoc: any, isLeadPI: boolean) {
        if (isLeadPI && projectDoc.status !== ProjectStatus.draft) {
            throw new AppError(ERROR_CODES.PROJECT_NOT_DRAFT);
        }
    }

    private async validateContributors(
        contributorIds: string[],
        projectId: string,
        leadPI: string
    ) {
        if (!contributorIds?.length) {
            throw new AppError(ERROR_CODES.PHASE_COMPONENT_CONTRIBUTORS_REQUIRED);
        }
        if (contributorIds.some(id => String(id) === leadPI)) {
            throw new AppError(ERROR_CODES.PHASE_COMPONENT_PI_NOT_ALLOWED);
        }
        const collaborators = await this.collaboratorRepo.find({ project: projectId });
        const memberIds = new Set(
            collaborators
                .filter(collaborator => !collaborator.isLeadPI)
                .map(collaborator => String((collaborator.member as any)?._id ?? collaborator.member))
        );
        if (contributorIds.some(id => !memberIds.has(String(id)))) {
            throw new AppError(ERROR_CODES.USER_NOT_COLLABORATOR);
        }
    }
}
