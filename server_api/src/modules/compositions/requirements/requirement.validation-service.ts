import { ValidationResult } from "../../constraints/services/constraint-validator.service";
import { IUser } from "../../users/user.model";
import { HistoryContextInput, HistoryValidationInput, HistoryValidationService } from "../history/history-validation-service";
import { HistoryRepository } from "../history/history.repository";
import { ProfileValidatorService } from "../profile/profile-validator.service";
import { ProfileRepository } from "../profile/profile.repository";
import { IMemberRequirement } from "./requirement.model";


export class RequirementValidationService {

    constructor(
        private readonly profileRepo: ProfileRepository,
        private readonly historyRuleRepo: HistoryRepository,
        private readonly profileValidator: ProfileValidatorService,
        private readonly historyValidator: HistoryValidationService,
    ) { }

    async validate(
        requirement: IMemberRequirement,
        user: IUser,
        historyContext: HistoryContextInput,
        history: HistoryValidationInput
    ): Promise<ValidationResult> {


        if (requirement.profile) {
            // 1. Load the profile this requirement applies to
            const profile = await this.profileRepo.findById(requirement.profile.toString());
            if (!profile) {
                return {
                    valid: false,
                    errors: [`${requirement.name}: eligibility profile ${requirement.profile} not found.`],
                };
            }

            // 2. If the user doesn't match the profile, the requirement doesn't apply to them
            const applies = await this.profileValidator.matches(profile, user);
            if (!applies) {
                return { valid: true, errors: [] };
            }
        }

        // 3. Load the history rules
        const rules = await this.historyRuleRepo.findByIds(requirement.historyRules);

        const errors: string[] = [];

        if (rules.length !== requirement.historyRules.length) {
            errors.push(`${requirement.name}: one or more history rules could not be found.`);
        }

        // 4. Run every history rule and collect all errors
        const results = await Promise.all(
            rules.map(rule => this.historyValidator.validate(rule, historyContext, history))
        );

        for (const result of results) {
            if (!result.valid) {
                errors.push(...result.errors);
            }
        }

        return {
            valid: errors.length === 0,
            errors,
        };
    }
}