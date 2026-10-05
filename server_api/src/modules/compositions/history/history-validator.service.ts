import { matchesRange } from "../../../common/types/range";
import { FundingSource } from "../../grants/grant.model";
import { GrantRepository } from "../../grants/grant.repository";
import { ApplicationStatus, IApplication } from "../../projects/applications/application.model";
import { ApplicationRepository } from "../../projects/applications/application.repository";
import { FilterCollaborators } from "../../projects/collaborators/collaborator.dto";
import { ICollaborator } from "../../projects/collaborators/collaborator.model";
import { CollaboratorRepository } from "../../projects/collaborators/collaborator.repository";
import { FilterProjectsDTO } from "../../projects/project.dto";
import { IProject, ProjectStatus } from "../../projects/project.model";
import { ProjectRepository } from "../../projects/project.repository";
import { IUser } from "../../users/user.model";
import {
    HistoryContext,
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

export class HistoryValidatorService {

    constructor(
        private readonly applicationRepo: ApplicationRepository,
        private readonly projectRepo: ProjectRepository,
        private readonly collaboratorRepo: CollaboratorRepository,
        private readonly grantRepo: GrantRepository,
    ) { }


    async matches(
        user: IUser,
        context: HistoryContext,
        rule: IHistoryRule,
        validationContext: HistoryValidationContext
    ): Promise<boolean> {

        const metrics = await this.getMetrics(
            user,
            rule.participation ?? HistoryParticipation.ANY,
            context,
            validationContext
        );

        //  console.log(user.name, "context==>", context, "metrics===>", metrics);

        /*
         * Project history
         */
        if (rule.project) {
            if (rule.project?.granted) {

                if (!matchesRange(
                    rule.project.granted,
                    metrics.granted
                )) {
                    return false;
                }
            }

            if (rule.project?.refused) {

                if (!matchesRange(
                    rule.project.refused,
                    metrics.refused
                )) {
                    return false;
                }
            }

            if (rule.project?.completed) {

                if (!matchesRange(
                    rule.project.completed,
                    metrics.completed
                )) {
                    return false;
                }
            }
        }

        /*
        * Application history
        */
        if (rule.application) {
            if (rule.application?.submitted) {

                if (!matchesRange(
                    rule.application.submitted,
                    metrics.submitted
                )) {
                    return false;
                }
            }

            if (rule.application?.accepted) {

                if (!matchesRange(
                    rule.application.accepted,
                    metrics.accepted
                )) {
                    return false;
                }
            }

            if (rule.application?.rejected) {

                if (!matchesRange(
                    rule.application.rejected,
                    metrics.rejected
                )) {
                    return false;
                }
            }

        }

        return true;
    }

    private async getMetrics(
        user: IUser,
        participation: HistoryParticipation,
        context: HistoryContext,
        validationContext: HistoryValidationContext
    ) {

        const collabFilter: FilterCollaborators = {
            member: String(user._id),
        };

        if (participation === HistoryParticipation.LEAD) {
            collabFilter.isLead = true;
        } else if (participation === HistoryParticipation.MEMBER) {
            collabFilter.isLead = false;
        }

        const collaborators = await this.collaboratorRepo.find(collabFilter);

        const projects = await this.getHistoricalProjects(
            context, validationContext, collaborators
        );

        const projectIds = projects.map(project => String(project._id));

        // Avoid querying with an empty id list (some repos ignore an empty $in)
        const applications = projectIds.length
            ? await this.getHistoricalApplications(context, validationContext, projectIds)
            : [];

        const [applicationMetrics, projectMetrics] = await Promise.all([
            this.getApplicationMetrics(applications),
            this.getProjectMetrics(projects)
        ]);

        return {
            granted: projectMetrics.granted ?? 0,
            refused: projectMetrics.refused ?? 0,
            completed: projectMetrics.completed ?? 0,
            submitted: applicationMetrics.submitted ?? 0,
            accepted: applicationMetrics.accepted ?? 0,
            rejected: applicationMetrics.rejected ?? 0
        };
    }


    private async getProjectMetrics(
        projects: IProject[],
    ) {
        return {
            granted: projects.filter(
                project => project!.status === ProjectStatus.granted
            ).length,

            refused: projects.filter(
                project => project!.status === ProjectStatus.refused
            ).length,

            completed: projects.filter(
                project => project!.status === ProjectStatus.completed
            ).length
        };
    }



    private async getApplicationMetrics(
        applications: IApplication[],
    ) {
        return {
            submitted: applications.filter(
                app => app.status === ApplicationStatus.submitted
            ).length,

            accepted: applications.filter(
                application =>
                    application.status === ApplicationStatus.accepted
            ).length,

            rejected: applications.filter(
                application =>
                    application.status === ApplicationStatus.rejected
            ).length,
        };
    }


    private async getHistoricalProjects(
        context: HistoryContext,
        validationContext: HistoryValidationContext,
        collaborators: ICollaborator[]
    ): Promise<IProject[]> {

        const projectIds = collaborators.map(
            collaborator => String(collaborator.project)
        );

        if (!projectIds.length) {
            return [];
        }

        const filters: FilterProjectsDTO =
        {
            ids: projectIds
        };

        switch (context) {

            case HistoryContext.CALL:
                if (!validationContext.call) {
                    return [];
                }

                filters.call = validationContext.call;
                break;

            case HistoryContext.CALENDAR:
                if (!validationContext.calendar) {
                    return [];
                }

                filters.calendar = validationContext.calendar;
                break;

            case HistoryContext.ORGANIZATION: {
                if (!validationContext.organization) {
                    return [];
                }

                const grants = await this.grantRepo.find({
                    organization: validationContext.organization
                });

                if (!grants.length) {
                    return [];
                }

                filters.grantIds = grants.map(
                    grant => String(grant._id)
                );

                break;
            }

            case HistoryContext.SOURCE: {
                if (!validationContext.source) {
                    return [];
                }

                const grants = await this.grantRepo.find({
                    fundingSource: validationContext.source
                });

                if (!grants.length) {
                    return [];
                }

                filters.grantIds = grants.map(
                    grant => String(grant._id)
                );

                break;
            }
        }

        return this.projectRepo.find(filters, undefined);
    }



    private async getHistoricalApplications(
        context: HistoryContext,
        validationContext: HistoryValidationContext,
        projectIds: string[],
    ): Promise<IApplication[]> {

        const filters: any = {
            projectIds: projectIds
        };

        switch (context) {

            case HistoryContext.CALL:
                if (!validationContext.call) {
                    return [];
                }

                filters.call = validationContext.call;
                break;

            case HistoryContext.STAGE:
                if (!validationContext.stage) {
                    return [];
                }

                filters.stage = validationContext.stage;
                break;
        }

        return this.applicationRepo.find(filters);
    }


}