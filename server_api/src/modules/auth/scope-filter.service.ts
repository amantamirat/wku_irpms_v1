import { IProjectRepository } from "../projects/project.repository";
import { AuthScope } from "./auth.types";

class ScopeFilterService {
    constructor(private readonly projectRepo: IProjectRepository) { }

    getProjectFilter(
        scope: AuthScope
    ): Record<string, unknown> {
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

    // --- Private Helper ---
    private async getProjectIds(scope: AuthScope): Promise<any[]> {
        if (scope === "*" || !scope?.length) {
            return [];
        }
        const projectFilter = this.getProjectFilter(scope);
        return await this.projectRepo.findIdsByFilter(projectFilter);
    }

    // --- Public Entity Filters ---

    async getApplicationFilter(
        scope: string[] | "*" | null
    ): Promise<Record<string, unknown>> {
        if (scope === "*") return {};
        if (!scope?.length) return { project: { $in: [] } };

        const projectIds = await this.getProjectIds(scope);
        return { project: { $in: projectIds } };
    }

    async getPhaseFilter(
        scope: string[] | "*" | null
    ): Promise<Record<string, unknown>> {
        if (scope === "*") return {};
        if (!scope?.length) return { project: { $in: [] } };

        const projectIds = await this.getProjectIds(scope);
        return { project: { $in: projectIds } };
    }

    async getVerificationFilter(
        scope: string[] | "*" | null
    ): Promise<Record<string, unknown>> {
        if (scope === "*") return {};
        if (!scope?.length) return { project: { $in: [] } };

        const projectIds = await this.getProjectIds(scope);
        return { project: { $in: projectIds } };
    }
}

export default ScopeFilterService;