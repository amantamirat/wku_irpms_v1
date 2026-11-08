import mongoose from "mongoose";
import { ProjectStatus } from "../../projects/project.model";
import { FundingSource } from "../../grants/grant.model";
import { ValidationResult } from "../../constraints/services/constraint-validator.service";
import { HistoryContext, HistoryParticipation, IHistoryRule } from "./history.model";
import { sameId } from "../../../common/utils/mongoose.utils";
import { checkRange } from "../../../common/types/range";

export type collaborationRole = Exclude<HistoryParticipation, HistoryParticipation.ANY>;

type GrantInput = {
    source: FundingSource;
    organization: string | mongoose.Types.ObjectId;
};

export type ProjectInput = {
    _id?: string | mongoose.Types.ObjectId;
    grant: GrantInput;
    calendar: string | mongoose.Types.ObjectId;
    call?: string | mongoose.Types.ObjectId;
    role: collaborationRole;
    status: ProjectStatus;
};

export interface HistoryValidationInput {
    userId: string;
    userName?: string;
    projects: ProjectInput[];
}

export interface HistoryContextInput {
    organization: string;
    organizationName?: string;
    source: FundingSource;
    call?: string;
    callName?: string;
    calendar?: string;
    calendarName?: string;
}

export class HistoryValidationService {

    async validate(
        rule: IHistoryRule,
        context: HistoryContextInput,
        history: HistoryValidationInput
    ): Promise<ValidationResult> {
        // 1. Filter by context (CALL, CALENDAR, ORGANIZATION, SOURCE)
        const contextResult = this.filterByContext(history.projects, rule.context, context);
        if (contextResult.error) {
            return { valid: false, errors: [contextResult.error] };
        }

        // 2. Filter by participation (no-op for ANY)
        const participation = rule.participation ?? HistoryParticipation.ANY;
        const participating = this.filterByParticipation(contextResult.projects, participation);

        // 3. Count projects matching the rule's statuses
        const count = this.countByStatus(participating, rule.metrics ?? []);

        // 4. Validate against the range
        const error = this.buildRangeError(rule, count, history, context);

        return error
            ? { valid: false, errors: [error] }
            : { valid: true, errors: [] };
    }

    // ---------------------------------------------------------------
    // Filtering & counting
    // ---------------------------------------------------------------

    private filterByContext(
        projects: ProjectInput[],
        context: HistoryContext,
        input: HistoryContextInput
    ): { projects: ProjectInput[]; error?: string } {
        switch (context) {
            case HistoryContext.CALL:
                if (!input.call) {
                    return { projects: [], error: "Call is required to evaluate a CALL history rule." };
                }
                return {
                    projects: projects.filter(p => p.call && sameId(p.call, input.call!))
                };

            case HistoryContext.CALENDAR:
                if (!input.calendar) {
                    return { projects: [], error: "Calendar is required to evaluate a CALENDAR history rule." };
                }
                return {
                    projects: projects.filter(p => sameId(p.calendar, input.calendar!))
                };

            case HistoryContext.ORGANIZATION:
                return {
                    projects: projects.filter(p => sameId(p.grant.organization, input.organization))
                };

            case HistoryContext.SOURCE:
                return {
                    projects: projects.filter(p => p.grant.source === input.source)
                };

            default:
                return { projects: [], error: `Unsupported history context: ${context}` };
        }
    }

    private filterByParticipation(
        projects: ProjectInput[],
        participation: HistoryParticipation
    ): ProjectInput[] {
        // No role filtering for ANY
        if (participation === HistoryParticipation.ANY) {
            return projects;
        }
        return projects.filter(p => p.role === participation);
    }

    private countByStatus(projects: ProjectInput[], statuses: ProjectStatus[]): number {
        return statuses.length
            ? projects.filter(p => statuses.includes(p.status)).length
            : projects.length;
    }

    // ---------------------------------------------------------------
    // Messages
    // ---------------------------------------------------------------

    private buildRangeError(
        rule: IHistoryRule,
        count: number,
        history: HistoryValidationInput,
        context: HistoryContextInput
    ): string | undefined {
        const range = rule.sumRange;
        if (!range) return undefined;

        const result = checkRange(range, count);
        if (result !== "below" && result !== "above") return undefined;

        const user = history.userName ?? history.userId;
        const statuses = rule.metrics?.length ? rule.metrics.join(", ") : "any";
        const participation = rule.participation ?? HistoryParticipation.ANY;
        const scope = this.describeContext(rule.context, context);
        const limit = result === "below"
            ? `minimum required is ${range.min}`
            : `maximum allowed is ${range.max}`;

        return `${rule.name}: user ${user} has ${count} project(s) with status [${statuses}] as ${participation} in ${scope}, ${limit}.`;
    }

    private describeContext(context: HistoryContext, input: HistoryContextInput): string {
        switch (context) {
            case HistoryContext.CALL:
                return `call ${input.callName ?? ''}`;
            case HistoryContext.CALENDAR:
                return `calendar ${input.calendarName ?? ''}`;
            case HistoryContext.ORGANIZATION:
                return `organization ${input.organizationName ?? ''}`;
            case HistoryContext.SOURCE:
                return `source ${input.source}`;
            default:
                return String(context).toLowerCase();
        }
    }
}