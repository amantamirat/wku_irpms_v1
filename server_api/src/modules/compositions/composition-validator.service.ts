import { Types } from "mongoose";
import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";
import { matchRange } from "../../common/types/range";
import { ICall } from "../calls/call.model";
import { ValidationResult } from "../constraints/services/constraint-validator.service";
import { GrantRepository } from "../grants/grant.repository";
import { IUser } from "../users/user.model";
import { IComposition } from "./composition.model";
import { CompositionRepository } from "./composition.repository";
import {
    HistoryValidationContext,
    HistoryValidatorService
} from "./history/history-validator.service";
import {
    IHistoryRule,
    IHistoryRuleReference
} from "./history/history.model";
import { HistoryRepository } from "./history/history.repository";
import { ProfileValidatorService } from "./profile/profile-validator.service";
import { IEligibilityProfile } from "./profile/profile.model";
import { ProfileRepository } from "./profile/profile.repository";
import { AggregationMode } from "./requirements/requirement.model";
import { RequirementRepository } from "./requirements/requirement.repository";

export class CompositionValidationService {

    constructor(
        private readonly compositionRepo: CompositionRepository,
        private readonly grantRepo: GrantRepository,
        private readonly profileRepo: ProfileRepository,
        private readonly historyRepo: HistoryRepository,
        private readonly requirementRepo: RequirementRepository,
        private readonly profileValidator: ProfileValidatorService,
        private readonly historyValidator: HistoryValidatorService
    ) { }

    /**
     * Public entry point to validate a composition project.
     */
    public async validate(
        compositionId: string,
        call: ICall,
        dto: {
            lead: IUser;
            members: IUser[];
        }
    ): Promise<ValidationResult> {

        const composition =
            await this.getComposition(compositionId);

        const grant = await this.grantRepo.findById(
            String(call.grant)
        );

        if (!grant) {
            throw new AppError(
                ERROR_CODES.GRANT_NOT_FOUND
            );
        }

        const validationContext: HistoryValidationContext = {
            call: String(call._id),
            organization: String(grant.organization),
            calendar: String(call.calendar),
            source: grant.fundingSource
        };

        const errors: string[] = [];

        await this.validateLead(
            composition,
            dto.lead,
            validationContext,
            errors
        );

        await this.validateMembers(
            composition.memberRequirements?.map(
                id => String(id)
            ) ?? [],
            dto.members,
            validationContext,
            errors
        );

        return {
            valid: errors.length === 0,
            errors
        };
    }

    private async getComposition(
        id: string
    ): Promise<IComposition> {

        const composition =
            await this.compositionRepo.findById(id);

        if (!composition) {
            throw new AppError(
                ERROR_CODES.COMPOSITION_NOT_FOUND
            );
        }

        return composition;
    }

    /**
     * Validate the project lead.
     */
    private async validateLead(
        composition: IComposition,
        lead: IUser,
        validationContext: HistoryValidationContext,
        errors: string[]
    ): Promise<void> {

        const profileDoc = await this.profileRepo.findById(
            String(composition.leadProfileRule)
        );

        await this.validateUser(
            lead,
            validationContext,
            {
                profile: profileDoc ? profileDoc : undefined,
                historyRuleReferences: composition.leadHistoryRules
            },
            errors
        );
    }

    /**
     * Generic user validation.
     *
     * Can be used for both lead and members.
     *
     * If errors is provided, validation failures are added to it.
     * If errors is omitted, only the boolean result is returned.
     */
    private async validateUser(
        user: IUser,
        validationContext: HistoryValidationContext,
        requirements: {
            profile?: IEligibilityProfile;
            historyRuleReferences?: IHistoryRuleReference[];
        },
        errors?: string[]
    ): Promise<boolean> {

        console.log("validating: ", user.name);

        const { profile, historyRuleReferences } = requirements;
        /*
         * Profile requirement
         */
        if (profile) {
            const matches =
                await this.profileValidator.matches(
                    profile,
                    user
                );

            if (!matches) {
                errors?.push(
                    `${user.name} does not satisfy the required profile.`
                );
                return false;
            }
        }

        /*
         * History requirements
         */
        for (
            const historyReference of historyRuleReferences ?? []
        ) {

            const historyRuleDoc =
                await this.historyRepo.findById(String(historyReference.rule));


            if (!historyRuleDoc) {
                continue;
            }

            const matches =
                await this.historyValidator.matches(
                    user,
                    historyReference.context,
                    historyRuleDoc,
                    validationContext
                );

            if (!matches) {
                errors?.push(
                    `${user.name} does not satisfy the required requirements.`
                );

                return false;
            }
        }

        return true;
    }

    /**
  * Validate member requirements.
  *
  * Each requirement can use COUNT or RATIO aggregation.
  */
    private async validateMembers(
        requirementIds: string[],
        members: IUser[],
        validationContext: HistoryValidationContext,
        errors: string[]
    ): Promise<void> {

        for (const requirementId of requirementIds) {

            const requirement = await this.requirementRepo.findById(requirementId);

            if (!requirement) {
                continue;
            }

            const profileDoc = await this.profileRepo.findById(
                String(requirement.profile)
            );


            const historyRuleReferences =
                requirement.historyRules ?? [];

            let qualifyingCount = 0;

            for (const member of members) {

                const qualifies =
                    await this.validateUser(
                        member,
                        validationContext,
                        {
                            profile: profileDoc ? profileDoc : undefined,
                            historyRuleReferences: historyRuleReferences
                        }
                    );

                if (qualifies) {
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

    /*
    private async getHistoryRule(
        historyReference: IHistoryRuleReference
    ): Promise<IHistoryRule | undefined | null> {

        if (typeof historyReference.rule === "object") {
            return historyReference.rule as unknown as IHistoryRule;
        }

        return this.historyRepo.findById(
            String(historyReference.rule)
        );
    }
*/
    /*
        private async getProfile(
            profile:
                | IEligibilityProfile
                | Types.ObjectId
                | string
                | undefined
                | null
        ): Promise<IEligibilityProfile | undefined | null> {
    
            if (!profile || profile === "undefined" || profile === "null") {
                return undefined;
            }
    
            // Already populated
            if (
                typeof profile === "object" &&
                !(profile instanceof Types.ObjectId) &&
                "_id" in profile
            ) {
                return profile as IEligibilityProfile;
            }
    
            // Ensure it's a valid hex string or ObjectId before querying
            if (!Types.ObjectId.isValid(String(profile))) {
                return undefined;
            }
    
            // Reference/ObjectId
            return this.profileRepo.findById(String(profile));
        }
            */
}