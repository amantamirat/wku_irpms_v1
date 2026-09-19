import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";
import { matchRange } from "../../common/types/range";
import { IUser } from "../users/user.model";
import { IComposition } from "./composition.model";
import { CompositionRepository } from "./composition.repository";
import {
    HistoryContext,
    IHistoryRule,
    IHistoryRuleReference
} from "./history/history.model";
import { HistoryRepository } from "./history/history.repository";
import { ProfileValidatorService } from "./profile/profile-validator.service";
import { IEligibilityProfile } from "./profile/profile.model";
import { ProfileRepository } from "./profile/profile.repository";
import { AggregationMode } from "./requirements/requirement.model";
import { RequirementRepository } from "./requirements/requirement.repository";

export interface CompositionValidationResult {
    valid: boolean;
    errors: string[];
}

export class CompositionValidationService {

    constructor(
        private readonly compositionRepo: CompositionRepository,
        private readonly profileRepo: ProfileRepository,
        private readonly historyRepo: HistoryRepository,
        private readonly requirementRepo: RequirementRepository,
        private readonly profileValidator: ProfileValidatorService
    ) { }


    private async getComposition(id: string): Promise<IComposition> {

        const composition = await this.compositionRepo.findById(id);

        if (!composition) {
            throw new AppError(ERROR_CODES.COMPOSITION_NOT_FOUND);
        }

        return composition;
    }


    private async validateLead(
        composition: IComposition,
        lead: IUser,
        errors: string[]
    ): Promise<void> {

        /*
         * Lead profile requirement
         */
        if (composition.leadProfileRule) {

            const profile = await this.profileRepo.findById(
                String(composition.leadProfileRule)
            );

            if (
                profile &&
                !this.profileValidator.matches(profile, lead)
            ) {
                errors.push(
                    "Lead does not satisfy the required profile."
                );
            }
        }


        /*
         * Lead history requirements
         */
        if (composition.leadHistoryRules?.length) {

            for (const historyReference of composition.leadHistoryRules) {

                const historyRule = await this.historyRepo.findById(
                    String(historyReference.rule)
                );

                if (
                    historyRule &&
                    !this.matchHistory(
                        historyRule,
                        lead,
                        historyReference.context
                    )
                ) {
                    errors.push(
                        "Lead does not satisfy the required history."
                    );
                }
            }
        }
    }


    private async validateMembers(
        requirementIds: string[],
        members: IUser[],
        errors: string[]
    ): Promise<void> {

        for (const requirementId of requirementIds) {

            const requirement = await this.requirementRepo.findById(
                requirementId,
                { populate: true }
            );

            if (!requirement) {
                continue;
            }

            const profile = requirement.profile
                ? (
                    typeof requirement.profile === "object"
                        ? requirement.profile as unknown as IEligibilityProfile
                        : (
                            await this.profileRepo.findById(
                                String(requirement.profile)
                            ) ?? undefined
                        )
                )
                : undefined;

            const historyRules = requirement.historyRules ?? [];

            let qualifyingCount = 0;

            for (const member of members) {

                if (
                    await this.matchesRequirement(
                        member,
                        profile,
                        historyRules
                    )
                ) {
                    qualifyingCount++;
                }
            }

            const value =
                requirement.mode === AggregationMode.COUNT
                    ? qualifyingCount
                    : members.length > 0
                        ? qualifyingCount / members.length
                        : 0;

            if (!matchRange(requirement.threshold, value)) {

                const currentValue =
                    requirement.mode === AggregationMode.RATIO
                        ? `${(value * 100).toFixed(1)}%`
                        : `${qualifyingCount}`;

                errors.push(
                    `Member requirement "${requirement.name}" is not satisfied. Current value: ${currentValue}.`
                );
            }
        }
    }


    private async matchesRequirement(
        member: IUser,
        profile?: IEligibilityProfile,
        historyRules: IHistoryRuleReference[] = []
    ): Promise<boolean> {

        /*
         * Profile requirement
         */
        if (
            profile &&
            !this.profileValidator.matches(profile, member)
        ) {
            return false;
        }


        /*
         * All history rules must be satisfied.
         */
        for (const historyReference of historyRules) {

            const historyRule =
                typeof historyReference.rule === "object"
                    ? historyReference.rule as unknown as IHistoryRule
                    : await this.historyRepo.findById(
                        String(historyReference.rule)
                    );

            if (
                historyRule &&
                !this.matchHistory(
                    historyRule,
                    member,
                    historyReference.context
                )
            ) {
                return false;
            }
        }

        return true;
    }


    private matchHistory(
        rule: IHistoryRule,
        user: IUser,
        context: HistoryContext
    ): boolean {

        /*
         * Context allows the same history rule to be interpreted
         * according to where it is used.
         *
         * For example:
         *   LEAD   -> validate the lead's history
         *   MEMBER -> validate the member's history
         */

        // TODO: apply the context when your HistoryContext-specific
        // history metrics are finalized.

        /*
        const history = user.history;

        if (
            rule.submitted &&
            !matchRange(rule.submitted, history.submitted)
        ) {
            return false;
        }

        if (
            rule.rejected &&
            !matchRange(rule.rejected, history.rejected)
        ) {
            return false;
        }

        if (
            rule.completed &&
            !matchRange(rule.completed, history.completed)
        ) {
            return false;
        }

        if (
            rule.granted &&
            !matchRange(rule.granted, history.granted)
        ) {
            return false;
        }
        */

        return true;
    }
}