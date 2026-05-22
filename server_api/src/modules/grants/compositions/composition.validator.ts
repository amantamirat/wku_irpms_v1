import { AppError } from "../../../common/errors/app.error";
import { ISpecializationRepository, SpecializationRepository } from "../../organization/specializations/specialization.repository";
import { ExperienceRepository, IExperienceRepository } from "../../users/experiences/experience.repository";
import { IUser } from "../../users/user.model";
import { IUserRepository, UserRepository } from "../../users/user.repository";
import { IComposition, OperationMode, TargetScope } from "./composition.model";
import { ICompositionRepository, CompositionRepository } from "./composition.repository";

export class CompositionValidator {
    constructor(
        private readonly compositionRepo: ICompositionRepository = new CompositionRepository(),
        private readonly userRepo: IUserRepository = new UserRepository(),
        private readonly exprRepo: IExperienceRepository = new ExperienceRepository(),
        private readonly specRepo: ISpecializationRepository = new SpecializationRepository()
    ) { }

    // =====================================================
    // CORE VALIDATION FUNCTION
    // =====================================================

    /**
     * Evaluates an individual team member against composition rule constraints 
     * established for a specific grant program based on their role (PI or Co-Investigator).
     * 
     * @param grant Target grant ID containing composition profiles
     * @param user Raw user database reference making up the applicant team member
     * @param isPI Flag indicating whether this user is the Principal Investigator
     */
    async validateCollab(grant: string, user: IUser, isPI: boolean): Promise<void> {
        // 1. Fetch active compliance frameworks assigned to the tracking grant
        const rules = await this.compositionRepo.find({ grant });
        if (!rules || rules.length === 0) return;

        for (const rule of rules) {
            // Check rules meant only for the Principal Investigator
            if (rule.targetScope === TargetScope.PI_ONLY && isPI) {
                await this.validateIndividual(user, rule);
            }

            // Check rules meant only for Co-Investigators / regular team members
            if (rule.targetScope === TargetScope.CO_ONLY && !isPI) {
                await this.validateIndividual(user, rule);
            }

            // Check rules applicable to everyone regardless of rank
            if (rule.targetScope === TargetScope.ALL_MEMBERS) {
                await this.validateIndividual(user, rule);
            }
        }
    }

    // =====================================================
    // AGGREGATE TEAM VALIDATION
    // =====================================================

    /**
     * Transforms individual matching structures into collective aggregate metrics.
     * Note: If you choose to use team rules later, this loop has been fixed to handle async matches.
     */
    async validateAggregate(grant: string, users: IUser[]): Promise<void> {
        const rule = await this.compositionRepo.findOne(grant, TargetScope.TEAM_AGGREGATE);
        if (!rule) { return }
        let qualifyingCount = 0;

        for (const user of users) {
            const matchesProfile = await this.matchesProfileCriteria(user, rule.profileRule);
            const matchesHistory = true//this.matchesHistoryCriteria(user, rule.projectHistoryRule);
            if (matchesProfile && matchesHistory) {
                qualifyingCount++;
            }
        }

        let valueToTest = 0;

        switch (rule.mode) {
            case OperationMode.COUNT:
                valueToTest = qualifyingCount;
                break;
            case OperationMode.RATIO:
                valueToTest = users.length > 0 ? (qualifyingCount / users.length) : 0;
                break;
            default:
                return;
        }

        if (rule.threshold) {
            const { min, max } = rule.threshold;
            const displayLabel = rule.mode === OperationMode.RATIO
                ? `${(valueToTest * 100).toFixed(1)}%`
                : `${valueToTest}`;

            if (valueToTest < min) {
                throw new AppError(
                    `Team aggregate check failed for [${rule.description}]. Current value is ${displayLabel}, but rule requires at least ${min}.`
                );
            }

            if (valueToTest > max) {
                throw new AppError(
                    `Team aggregate check failed for [${rule.description}]. Current value is ${displayLabel}, which exceeds maximum allowed limit of ${max}.`
                );
            }
        }
    }

    /**
     * Validates that an individual team member satisfies the restriction profiles.
     * Updated to be async to resolve database criteria rules.
     */
    private async validateIndividual(user: IUser, rule: IComposition): Promise<void> {
        // 🔹 Fixed: Correctly awaiting the async profile matching logic
        const matchesProfile = await this.matchesProfileCriteria(user, rule.profileRule);
        const matchesHistory = true;//await this.matchesHistoryCriteria(user, rule.projectHistoryRule);

        if (!matchesProfile || !matchesHistory) {
            throw new AppError(
                `Team member "${user.name || (user as any)._id}" does not qualify under the individual rules criteria: "${rule.description}"`
            );
        }
    }

    // =====================================================
    // PURE FILTER MATCHERS
    // =====================================================

    private async matchesProfileCriteria(user: IUser, criterion: any): Promise<boolean> {
        if (!criterion) return true;

        if (criterion.gender && user.gender !== criterion.gender) {
            return false;
        }

        if (criterion.age) {
            if (!user.birthDate) return false;
            const age = this.calculateAge(user.birthDate);
            if (age < (criterion.age.min ?? 0) || age > (criterion.age.max ?? Infinity)) {
                return false;
            }
        }

        if (criterion.experienceYears) {
            const userExperiences = await this.exprRepo.find({ user: String((user as any)._id) });
            const calculatedExpYears = this.calculateTotalExperienceYears(userExperiences);
            if (calculatedExpYears < (criterion.experienceYears.min ?? 0) || calculatedExpYears > (criterion.experienceYears.max ?? Infinity)) {
                return false;
            }
        }

        if (criterion.academicLevels && criterion.academicLevels.length > 0) {
            if (!user.specializations || user.specializations.length === 0) {
                return false;
            }

            const ids = (user.specializations ?? []).map(String);
            const specializations = await this.specRepo.find({ ids });

            const hasQualifyingLevel = specializations.some(spec =>
                spec.academicLevel && criterion.academicLevels.includes(spec.academicLevel)
            );

            if (!hasQualifyingLevel) {
                return false;
            }
        }

        return true;
    }

    /*

    private matchesHistoryCriteria(user: any, criterion: any): boolean {
        if (!criterion) return true;

        const history = user.projectHistory || {};

        if (criterion.submission) {
            const subs = history.submissionCount ?? 0;
            if (subs < (criterion.submission.min ?? 0) || subs > (criterion.submission.max ?? Infinity)) {
                return false;
            }
        }

        if (criterion.completion) {
            const comps = history.completionCount ?? 0;
            if (comps < (criterion.completion.min ?? 0) || comps > (criterion.completion.max ?? Infinity)) {
                return false;
            }
        }

        if (criterion.rejection) {
            const rejs = history.rejectionCount ?? 0;
            if (rejs < (criterion.rejection.min ?? 0) || rejs > (criterion.rejection.max ?? Infinity)) {
                return false;
            }
        }

        return true;
    }
*/


    // =====================================================
    // HELPER UTILITIES
    // =====================================================

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
}