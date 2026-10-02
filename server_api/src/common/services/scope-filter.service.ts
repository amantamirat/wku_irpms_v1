import mongoose from "mongoose";
import { IProjectRepository } from "../../modules/projects/project.repository";
import { AuthScope, ScopeFilter } from "../../modules/auth/auth.types";
import { toObjectId } from "../utils/mongoose.utils";
import { IUserRepository } from "../../modules/users/user.repository";

class ScopeFilterService {

    constructor(
        private readonly projectRepo: IProjectRepository,
        private readonly userRepo: IUserRepository
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

        const scopeIds = scope.map(
            id => toObjectId(id)
        );

        return {
            $or: [
                {
                    workspace: {
                        $in: scopeIds
                    }
                },
                {
                    organization: {
                        $in: scopeIds
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


    getUserFilter(
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

        const scopeIds = scope.map(
            id => toObjectId(id)
        );

        return {
            workspace: {
                $in: scopeIds
            }
        };
    }


    private async getUserIds(
        scope: AuthScope
    ): Promise<mongoose.Types.ObjectId[]> {

        if (scope === "*" || !scope?.length) {
            return [];
        }

        const userFilter =
            this.getUserFilter(scope);

        return this.userRepo.findIdsByFilter(
            userFilter
        );
    }


    async getCollaboratorFilter(
        scope: AuthScope
    ): Promise<ScopeFilter> {

        if (scope === "*") return {};

        if (!scope?.length) {
            return {
                member: { $in: [] }
            };
        }

        const userIds =
            await this.getUserIds(scope);

        return {
            member: { $in: userIds }
        };
    }

    async getReviewerFilter(
        scope: AuthScope
    ): Promise<ScopeFilter> {

        if (scope === "*") return {};

        if (!scope?.length) {
            return {
                reviewer: { $in: [] }
            };
        }

        const userIds =
            await this.getUserIds(scope);

        return {
            reviewer: { $in: userIds }
        };
    }

    /*
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
    */

    getCallFilter(
        scope: AuthScope
    ): ScopeFilter {

        if (scope === "*") return {};

        if (!scope?.length) {
            return {
                organization: { $in: [] }
            };
        }

        const scopeIds = scope.map(
            id => toObjectId(id)
        );

        return {
            organization: { $in: scopeIds }
        };
    }
}

export default ScopeFilterService;