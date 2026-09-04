import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";
import { IRange, matchRange } from "../../common/types/range";
import { ExperienceRepository } from "../users/experiences/experience.repository";
import { IUser } from "../users/user.model";
import { IComposition } from "./composition.model";
import { CompositionRepository } from "./composition.repository";
import { IHistoryRule } from "./history/history.model";
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
        //private readonly exprienceRepo: ExperienceRepository,
        private readonly profileValidator: ProfileValidatorService
    ) { }

    private async getComposition(id: string): Promise<IComposition> {
        const composition = await this.compositionRepo.findById(id);
        if (!composition) {
            throw new AppError(ERROR_CODES.COMPOSITION_NOT_FOUND);
        }
        return composition;
    }

    private async validateLead(composition: IComposition, lead: IUser, errors: string[]) {

        if (composition.leadProfileRule) {

            const profile = await this.profileRepo.findById(String(composition.leadProfileRule));

            if (profile && !this.profileValidator.matches(profile, lead)) {
                errors.push("Lead does not satisfy the required profile.");
            }
        }

        if (composition.leadHistoryRule) {

            const history = await this.historyRepo.findById(
                String(composition.leadHistoryRule)
            );

            if (history && !this.matchHistory(history, lead)) {
                errors.push("Lead does not satisfy the required history.");
            }
        }
    }


    private async validateMembers(requirementIds: string[], members: IUser[], errors: string[]): Promise<void> {

        for (const requirementId of requirementIds) {

            const requirement = await this.requirementRepo.findById(requirementId);

            if (!requirement) {
                continue;
            }

            const profile = requirement.profile
                ? (await this.profileRepo.findById(String(requirement.profile))) ?? undefined
                : undefined;

            const history = requirement.historyRule
                ? (await this.historyRepo.findById(String(requirement.historyRule))) ?? undefined
                : undefined;

            let qualifyingCount = 0;

            for (const member of members) {
                if (await this.matchesRequirement(member, profile, history)) {
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


    private async matchesRequirement(member: IUser, profile?: IEligibilityProfile,
        history?: IHistoryRule): Promise<boolean> {
        return (!profile || await this.profileValidator.matches(profile, member)) &&
            (!history || this.matchHistory(history, member));
    }






    private matchHistory(rule: IHistoryRule, user: IUser): boolean {

        /*
        const history = user.history;

        if (rule.submitted &&
            !this.matchRange(rule.submitted, history.submitted))
            return false;

        if (rule.rejected &&
            !this.matchRange(rule.rejected, history.rejected))
            return false;

        if (rule.completed &&
            !this.matchRange(rule.completed, history.completed))
            return false;

        if (rule.granted &&
            !this.matchRange(rule.granted, history.granted))
            return false;
*/
        return true;
    }


}