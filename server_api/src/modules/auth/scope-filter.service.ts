import mongoose from "mongoose";
import { IProjectRepository } from "../projects/project.repository";
import { AuthScope, ScopeFilter } from "./auth.types";

class ScopeFilterService {

    constructor(
        private readonly projectRepo: IProjectRepository
    ) { }

    getProjectFilter(
        scope: AuthScope
    ): ScopeFilter {

        if (scope === "*") {
            return {};
        }

        if (!scope?.length) {
            return {
                _id: { $in: [] }
            };
        }

        return {
            $or: [
                {
                    workspace: {
                        $in: scope
                    }
                },
                {
                    organization: {
                        $in: scope
                    }
                }
            ]
        };
    }

    private async getProjectIds(
        scope: AuthScope
    ): Promise<mongoose.Types.ObjectId[]> {

        if (scope === "*" || !scope?.length) {
            return [];
        }

        const projectFilter =
            this.getProjectFilter(scope);

        return this.projectRepo.findIdsByFilter(
            projectFilter
        );
    }

    async getApplicationFilter(
        scope: AuthScope
    ): Promise<ScopeFilter> {

        if (scope === "*") return {};

        if (!scope?.length) {
            return {
                project: { $in: [] }
            };
        }

        const projectIds =
            await this.getProjectIds(scope);

        return {
            project: { $in: projectIds }
        };
    }

    async getCollaboratorFilter(
        scope: AuthScope
    ): Promise<ScopeFilter> {

        if (scope === "*") return {};

        if (!scope?.length) {
            return {
                project: { $in: [] }
            };
        }

        const projectIds =
            await this.getProjectIds(scope);

        return {
            project: { $in: projectIds }
        };
    }

     async getReviewerFilter(
        scope: AuthScope
    ): Promise<ScopeFilter> {

        if (scope === "*") return {};

        if (!scope?.length) {
            return {
                project: { $in: [] }
            };
        }

        const projectIds =
            await this.getProjectIds(scope);

        return {
            project: { $in: projectIds }
        };
    }

    async getPhaseFilter(
        scope: AuthScope
    ): Promise<ScopeFilter> {

        if (scope === "*") return {};

        if (!scope?.length) {
            return {
                project: { $in: [] }
            };
        }

        const projectIds =
            await this.getProjectIds(scope);

        return {
            project: { $in: projectIds }
        };
    }

    async getVerificationFilter(
        scope: AuthScope
    ): Promise<ScopeFilter> {

        if (scope === "*") return {};

        if (!scope?.length) {
            return {
                project: { $in: [] }
            };
        }

        const projectIds =
            await this.getProjectIds(scope);

        return {
            project: { $in: projectIds }
        };
    }
}

export default ScopeFilterService;