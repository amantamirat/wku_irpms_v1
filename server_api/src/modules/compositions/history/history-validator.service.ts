import { matchRange } from "../../../common/types/range";
import { IUser } from "../../users/user.model";
import {
    HistoryContext,
    HistoryParticipation,
    IHistoryRule
} from "./history.model";
import { ProjectRepository } from "../../projects/project.repository";
import { ApplicationRepository } from "../../projects/applications/application.repository";
import { FilterProjectsDTO } from "../../projects/project.dto";
import { CollaboratorStatus } from "../../projects/collaborators/collaborator.model";
import { CollaboratorRepository } from "../../projects/collaborators/collaborator.repository";
import { GrantRepository } from "../../grants/grant.repository";
import { IProject, ProjectStatus } from "../../projects/project.model";
import { FundingSource } from "../../grants/grant.model";
import { ApplicationStatus } from "../../projects/applications/application.model";
import { FilterCollaborators } from "../../projects/collaborators/collaborator.dto";

export interface HistoryValidationContext {
    call: string;
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

        //console.log("context", validationContext)
        //console.log("user", JSON.stringify(user));
        //console.log("metrics", metrics);


        /*
         * Project history
         */
        if (rule.project) {
            if (rule.project?.granted) {

                if (!matchRange(
                    rule.project.granted,
                    metrics.granted, true
                )) {
                    return false;
                }
            }

            if (rule.project?.refused) {

                if (!matchRange(
                    rule.project.refused,
                    metrics.refused, true
                )) {
                    return false;
                }
            }

            if (rule.project?.completed) {

                if (!matchRange(
                    rule.project.completed,
                    metrics.completed, true
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

                if (!matchRange(
                    rule.application.submitted,
                    metrics.submitted, true
                )) {
                    return false;
                }
            }

            if (rule.application?.accepted) {

                if (!matchRange(
                    rule.application.accepted,
                    metrics.accepted, true
                )) {
                    return false;
                }
            }

            if (rule.application?.rejected) {

                if (!matchRange(
                    rule.application.rejected,
                    metrics.rejected, true
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
        const projects = await this.getHistoricalProjects(
            user,
            participation,
            context,
            validationContext
        );

        const projectIds = projects.map(
            project => String(project._id)
        );

        const applications = projectIds.length
            ? await this.applicationRepo.find({
                projectIds
            })
            : [];

        return {
            granted: projects.filter(
                project => project.status === ProjectStatus.granted
            ).length,

            refused: projects.filter(
                project => project.status === ProjectStatus.refused
            ).length,

            completed: projects.filter(
                project => project.status === ProjectStatus.completed
            ).length,

            submitted: applications.length,

            accepted: applications.filter(
                application =>
                    application.status === ApplicationStatus.accepted
            ).length,

            rejected: applications.filter(
                application =>
                    application.status === ApplicationStatus.rejected
            ).length
        };
    }


    private async getHistoricalProjects(
        user: IUser,
        participation: HistoryParticipation,
        context: HistoryContext,
        validationContext: HistoryValidationContext
    ): Promise<Partial<IProject>[]> {

        const collabFilter: FilterCollaborators = {
            member: String(user._id),
            //status: CollaboratorStatus.verified
        };

        if (participation === HistoryParticipation.LEAD) {
            collabFilter.isLead = true;
        } else if (participation === HistoryParticipation.MEMBER) {
            collabFilter.isLead = false;
        }

        const collaborators = await this.collaboratorRepo.find(collabFilter);

        const projectIds = collaborators.map(
            collaborator => String(collaborator.project)
        );

        if (!projectIds.length) {
            return [];
        }

        const filters: FilterProjectsDTO = {
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

        return this.projectRepo.find(filters);
    }
}