import mongoose from "mongoose";
import { ProjectStatus } from "../../projects/project.model";
import { FundingSource } from "../../grants/grant.model";
import { ValidationResult } from "../../constraints/services/constraint-validator.service";
import { HistoryContext, HistoryParticipation, IHistoryRule } from "./history.model";
import { sameId } from "../../../common/utils/mongoose.utils";
import { checkRange2 } from "../../../common/types/range";
import { IUser } from "../../users/user.model";



export type collaborationRole = Exclude<HistoryParticipation, HistoryParticipation.ANY>;

type GrantInput = {
    source: FundingSource;
    organization: string | mongoose.Types.ObjectId;
}

export type ProjectInput = {
    _id?: string | mongoose.Types.ObjectId;
    grant: GrantInput;
    calendar: string | mongoose.Types.ObjectId;
    call?: string | mongoose.Types.ObjectId;
    role: collaborationRole;
    status: ProjectStatus;
};

export interface HistoryValidationInput {
    user: string|IUser;
    projects: ProjectInput[];
}


export interface HistoryContextInput {
    organization: string;
    source: FundingSource;
    call?: string;
    calendar?: string;
}


export class HistoryValidationService {

    constructor(
    ) { }

    async validate(
        historyRule: IHistoryRule,
        historyContext: HistoryContextInput,
        history: HistoryValidationInput
    ): Promise<ValidationResult> {
        const errors: string[] = [];

        // 1. Filter by context
        const contextResult = this.filterByContext(
            history.projects,
            historyRule.context,
            historyContext
        );

        if (contextResult.error) {
            return { valid: false, errors: [contextResult.error] };
        }

        // 2. Filter by participation (skipped for ANY / null)
        const participating = this.filterByParticipation(
            contextResult.projects,
            historyRule.participation ?? HistoryParticipation.ANY
        );

        // 3. Count projects whose status is one of the rule's metrics
        const metrics = historyRule.metrics ?? [];
        const count = metrics.length
            ? participating.filter(p => metrics.includes(p.status)).length
            : participating.length;


        // 4. Validate against sumRange

        const range = historyRule.sumRange;
        if (range) {
            const result = checkRange2(range, count);

            if (result === 'below') {
                errors.push(
                    `${historyRule.name}: user ${history.user} has ${count} project(s) with status [${historyRule.metrics?.join(", ") ?? "any"}] as ${historyRule.participation ?? HistoryParticipation.ANY} in this ${historyRule.context}, minimum required is ${range.min}.`
                );
            } else if (result === 'above') {
                errors.push(
                    `${historyRule.name}: user ${history.user} has ${count} project(s) with status [${historyRule.metrics?.join(", ") ?? "any"}] as ${historyRule.participation ?? HistoryParticipation.ANY} in this ${historyRule.context}, maximum allowed is ${range.max}.`
                );
            }
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

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
                    projects: projects.filter(p =>
                        sameId(p.grant.organization, input.organization)
                    )
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
}