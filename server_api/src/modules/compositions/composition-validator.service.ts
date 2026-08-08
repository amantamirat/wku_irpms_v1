import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";
import { ExperienceRepository } from "../users/experiences/experience.repository";
import { IUser } from "../users/user.model";
import { IComposition, IRange } from "./composition.model";
import { CompositionRepository } from "./composition.repository";
import { IHistoryRule } from "./history/history.model";
import { HistoryRepository } from "./history/history.repository";
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
        private readonly exprienceRepo: ExperienceRepository,
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

            if (profile && !this.matchProfile(profile, lead)) {
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

            if (!this.matchRange(requirement.threshold, value)) {

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
        return (!profile || await this.matchProfile(profile, member)) &&
            (!history || this.matchHistory(history, member));
    }

    private async matchProfile(profile: IEligibilityProfile, user: IUser): Promise<boolean> {
        if (profile.gender && user.gender !== profile.gender)
            return false;

        if (profile.age) {
            if (!user.birthDate) return false;
            const age = this.calculateAge(user.birthDate);
            if (!this.matchRange(profile.age, age)) return false;
        }

        if (profile.experienceYears) {
            const userExperiences = await this.exprienceRepo.find({ user: String(user._id) });
            const calculatedExpYears = this.calculateTotalExperienceYears(userExperiences);
            if (!this.matchRange(profile.experienceYears, calculatedExpYears)) return false;
        }

        // academic levels

        // accessibility

        return true;
    }

    private calculateAge(birthDate: Date | string): number {
        const birth = new Date(birthDate);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    }

    private calculateTotalExperienceYears(experiences: any[]): number {
        if (!experiences || experiences.length === 0) return 0;

        let totalMs = 0;
        const now = new Date();

        for (const exp of experiences) {
            if (!exp.startDate) continue;

            const start = new Date(exp.startDate);
            const end = (exp.isCurrent || !exp.endDate) ? now : new Date(exp.endDate);

            if (end > start) {
                totalMs += (end.getTime() - start.getTime());
            }
        }

        const msPerYear = 1000 * 60 * 60 * 24 * 365.25;
        return totalMs / msPerYear;
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

    private matchRange(range: IRange, value: number): boolean {
        if (range.min !== undefined && value < range.min)
            return false;

        if (range.max !== undefined && value > range.max)
            return false;

        return true;
    }
}