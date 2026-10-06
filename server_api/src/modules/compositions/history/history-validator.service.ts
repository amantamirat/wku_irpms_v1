import {
    IRange,
    matchesRange
} from "../../../common/types/range";

import { FundingSource } from "../../grants/grant.model";
import { GrantRepository } from "../../grants/grant.repository";

import {
    ApplicationStatus,
    IApplication
} from "../../projects/applications/application.model";
import { ApplicationRepository } from "../../projects/applications/application.repository";

import { FilterCollaborators } from "../../projects/collaborators/collaborator.dto";
import { ICollaborator } from "../../projects/collaborators/collaborator.model";
import { CollaboratorRepository } from "../../projects/collaborators/collaborator.repository";

import { FilterProjectsDTO } from "../../projects/project.dto";
import {
    IProject,
    ProjectStatus
} from "../../projects/project.model";
import { ProjectRepository } from "../../projects/project.repository";

import { IUser } from "../../users/user.model";

import {
    HistoryContext,
    HistoryMetric,
    HistoryParticipation,
    IHistoryRule
} from "./history.model";

export interface HistoryValidationContext {
    call: string;
    stage: string;
    organization: string;
    calendar: string;
    source: FundingSource;
}

interface HistoryMetrics {
    granted: number;
    refused: number;
    completed: number;
    verified: number;

    submitted: number;
    accepted: number;
    rejected: number;
}

export class HistoryValidatorService {

    constructor(
        private readonly applicationRepo: ApplicationRepository,
        private readonly projectRepo: ProjectRepository,
        private readonly collaboratorRepo: CollaboratorRepository,
        private readonly grantRepo: GrantRepository
    ) { }

    // ===================================================
    // MATCH RULE
    // ===================================================

    async matches(
        user: IUser,
        context: HistoryContext,
        rule: IHistoryRule,
        validationContext: HistoryValidationContext
    ): Promise<boolean> {

        // ------------------------------------------------
        // Get user's historical metrics
        // ------------------------------------------------

        const metrics = await this.getMetrics(
            user,
            rule.participation ?? HistoryParticipation.ANY,
            context,
            validationContext
        );

        // ------------------------------------------------
        // Individual project rules
        // ------------------------------------------------
        /*
                if (rule.project?.granted) {
                    if (
                        !matchesRange(
                            rule.project.granted,
                            metrics.granted
                        )
                    ) {
                        return false;
                    }
                }
        
                if (rule.project?.refused) {
                    if (
                        !matchesRange(
                            rule.project.refused,
                            metrics.refused
                        )
                    ) {
                        return false;
                    }
                }
        
                if (rule.project?.completed) {
                    if (
                        !matchesRange(
                            rule.project.completed,
                            metrics.completed
                        )
                    ) {
                        return false;
                    }
                }
        
                // ------------------------------------------------
                // Individual application rules
                // ------------------------------------------------
        
                if (rule.application?.submitted) {
                    if (
                        !matchesRange(
                            rule.application.submitted,
                            metrics.submitted
                        )
                    ) {
                        return false;
                    }
                }
        
                if (rule.application?.accepted) {
                    if (
                        !matchesRange(
                            rule.application.accepted,
                            metrics.accepted
                        )
                    ) {
                        return false;
                    }
                }
        
                if (rule.application?.rejected) {
                    if (
                        !matchesRange(
                            rule.application.rejected,
                            metrics.rejected
                        )
                    ) {
                        return false;
                    }
                }
        
        */
        // ------------------------------------------------
        // Total rule
        // ------------------------------------------------

        if (rule.total) {

            const metricValues: Record<
                HistoryMetric,
                number
            > = {
                [HistoryMetric.PROJECT_GRANTED]: metrics.granted,

                [HistoryMetric.PROJECT_REFUSED]: metrics.refused,

                [HistoryMetric.PROJECT_COMPLETED]: metrics.completed,

                [HistoryMetric.PROJECT_VERIFIED]: metrics.verified,

                [HistoryMetric.APPLICATION_SUBMITTED]: metrics.submitted,

                [HistoryMetric.APPLICATION_ACCEPTED]: metrics.accepted,

                [HistoryMetric.APPLICATION_REJECTED]: metrics.rejected,
                /*
                                [HistoryMetric.VERIFICATION_SUBMITTED]: 0,
                                [HistoryMetric.VERIFICATION_VERIFIED]: 0,
                                [HistoryMetric.VERIFICATION_REJECTED]: 0*/
            };

            const total = rule.total.fields.reduce(
                (sum, field) => {
                    return sum + metricValues[field];
                },
                0
            );

            if (
                !matchesRange(
                    rule.total.range,
                    total
                )
            ) {
                return false;
            }
        }

        // ------------------------------------------------
        // All configured conditions passed
        // ------------------------------------------------

        return true;
    }

    // ===================================================
    // GET METRICS
    // ===================================================

    private async getMetrics(
        user: IUser,
        participation: HistoryParticipation,
        context: HistoryContext,
        validationContext: HistoryValidationContext
    ): Promise<HistoryMetrics> {

        // ------------------------------------------------
        // Collaborator filter
        // ------------------------------------------------

        const collabFilter: FilterCollaborators = {
            member: String(user._id)
        };

        if (
            participation === HistoryParticipation.LEAD
        ) {
            collabFilter.isLead = true;
        }

        else if (
            participation === HistoryParticipation.MEMBER
        ) {
            collabFilter.isLead = false;
        }

        // ------------------------------------------------
        // Find user's project participation
        // ------------------------------------------------

        const collaborators =
            await this.collaboratorRepo.find(
                collabFilter
            );

        // ------------------------------------------------
        // Get historical projects
        // ------------------------------------------------

        const projects =
            await this.getHistoricalProjects(
                context,
                validationContext,
                collaborators
            );

        const projectIds = projects.map(
            project => String(project._id)
        );

        // ------------------------------------------------
        // Get historical applications
        // ------------------------------------------------

        const applications = projectIds.length
            ? await this.getHistoricalApplications(
                context,
                validationContext,
                projectIds
            )
            : [];

        // ------------------------------------------------
        // Calculate metrics
        // ------------------------------------------------

        const [
            projectMetrics,
            applicationMetrics
        ] = await Promise.all([
            this.getProjectMetrics(projects),
            this.getApplicationMetrics(applications)
        ]);

        return {
            granted: projectMetrics.granted,
            refused: projectMetrics.refused,
            completed: projectMetrics.completed,
            verified: projectMetrics.verified,

            submitted: applicationMetrics.submitted,
            accepted: applicationMetrics.accepted,
            rejected: applicationMetrics.rejected
        };
    }

    // ===================================================
    // PROJECT METRICS
    // ===================================================

    private async getProjectMetrics(
        projects: IProject[]
    ) {

        return {
            granted: projects.filter(
                project =>
                    project.status === ProjectStatus.granted
            ).length,

            refused: projects.filter(
                project =>
                    project.status === ProjectStatus.refused
            ).length,

            completed: projects.filter(
                project =>
                    project.status === ProjectStatus.completed
            ).length,

            verified: projects.filter(
                project =>
                    project.status === ProjectStatus.verified
            ).length
        };
    }

    // ===================================================
    // APPLICATION METRICS
    // ===================================================

    private async getApplicationMetrics(
        applications: IApplication[]
    ) {

        return {
            submitted: applications.filter(
                application =>
                    application.status ===
                    ApplicationStatus.submitted
            ).length,

            accepted: applications.filter(
                application =>
                    application.status ===
                    ApplicationStatus.accepted
            ).length,

            rejected: applications.filter(
                application =>
                    application.status ===
                    ApplicationStatus.rejected
            ).length
        };
    }

    // ===================================================
    // HISTORICAL PROJECTS
    // ===================================================

    private async getHistoricalProjects(
        context: HistoryContext,
        validationContext: HistoryValidationContext,
        collaborators: ICollaborator[]
    ): Promise<IProject[]> {

        const projectIds = collaborators.map(
            collaborator =>
                String(collaborator.project)
        );

        if (!projectIds.length) {
            return [];
        }

        const filters: FilterProjectsDTO = {
            ids: projectIds
        };

        switch (context) {

            // --------------------------------------------
            // CALL
            // --------------------------------------------

            case HistoryContext.CALL:

                if (!validationContext.call) {
                    return [];
                }

                filters.call =
                    validationContext.call;

                break;

            // --------------------------------------------
            // CALENDAR
            // --------------------------------------------

            case HistoryContext.CALENDAR:

                if (!validationContext.calendar) {
                    return [];
                }

                filters.calendar =
                    validationContext.calendar;

                break;

            // --------------------------------------------
            // ORGANIZATION
            // --------------------------------------------

            case HistoryContext.ORGANIZATION: {

                if (!validationContext.organization) {
                    return [];
                }

                const grants =
                    await this.grantRepo.find({
                        organization:
                            validationContext.organization
                    });

                if (!grants.length) {
                    return [];
                }

                filters.grantIds =
                    grants.map(
                        grant =>
                            String(grant._id)
                    );

                break;
            }

            // --------------------------------------------
            // SOURCE
            // --------------------------------------------

            case HistoryContext.SOURCE: {

                if (!validationContext.source) {
                    return [];
                }

                const grants =
                    await this.grantRepo.find({
                        fundingSource:
                            validationContext.source
                    });

                if (!grants.length) {
                    return [];
                }

                filters.grantIds =
                    grants.map(
                        grant =>
                            String(grant._id)
                    );

                break;
            }

            // --------------------------------------------
            // STAGE
            // --------------------------------------------

            case HistoryContext.STAGE:
                // Stage applies to applications,
                // not projects.
                break;
        }

        return await this.projectRepo.find(
            filters,
            undefined
        );
    }

    // ===================================================
    // HISTORICAL APPLICATIONS
    // ===================================================

    private async getHistoricalApplications(
        context: HistoryContext,
        validationContext: HistoryValidationContext,
        projectIds: string[]
    ): Promise<IApplication[]> {

        if (!projectIds.length) {
            return [];
        }

        const filters: any = {
            projectIds
        };

        switch (context) {

            // --------------------------------------------
            // CALL
            // --------------------------------------------

            case HistoryContext.CALL:

                if (!validationContext.call) {
                    return [];
                }

                filters.call =
                    validationContext.call;

                break;

            // --------------------------------------------
            // STAGE
            // --------------------------------------------

            case HistoryContext.STAGE:

                if (!validationContext.stage) {
                    return [];
                }

                filters.stage =
                    validationContext.stage;

                break;
        }

        return await this.applicationRepo.find(
            filters
        );
    }
}