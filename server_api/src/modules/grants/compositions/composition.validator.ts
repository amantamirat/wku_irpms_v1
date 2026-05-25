import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { ISpecializationRepository, SpecializationRepository } from "../../organization/specializations/specialization.repository";
import { CollaboratorDto } from "../../projects/collaborators/collaborator.dto";
import { CollaboratorRepository, ICollaboratorRepository } from "../../projects/collaborators/collaborator.repository";
import { ExperienceRepository, IExperienceRepository } from "../../users/experiences/experience.repository";
import { IUser } from "../../users/user.model";
import { IUserRepository, UserRepository } from "../../users/user.repository";
import { IComposition, OperationMode, TargetScope } from "./composition.model";
import { CompositionRepository, ICompositionRepository } from "./composition.repository";

export class CompositionValidator {
    constructor(
        private readonly compositionRepo: ICompositionRepository = new CompositionRepository(),
        private readonly userRepo: IUserRepository = new UserRepository(),
        private readonly exprRepo: IExperienceRepository = new ExperienceRepository(),
        private readonly specRepo: ISpecializationRepository = new SpecializationRepository(),
        private readonly collabRepo: ICollaboratorRepository = new CollaboratorRepository(),
    ) { }

    // =====================================================
    // ALL-IN-ONE SYSTEM SUBMISSION VALIDATOR
    // =====================================================

    /**
    * Runs all team composition rules validation at once based on the list of collaborators. 
    * Use in: ProjectService.apply (Initial submission or full validation) 
    */
    async validateAll(grant: string, collaborators: CollaboratorDto[]) {
        // 1. Identify and validate presence of the Lead PI
        const lead = collaborators.find(c => c.isLeadPI);
        if (!lead) {
            throw new AppError(ERROR_CODES.LEAD_PI_NOT_FOUND);
        }

        const piId = lead.applicant;

        // 2. Identify all Co-PI IDs (everyone else who isn't the Lead PI)
        const coPiIds = collaborators
            .filter(c => !c.isLeadPI)
            .map(c => c.applicant);

        // Get a unique set of all member IDs to avoid duplicate queries
        const allMemberIds = Array.from(new Set([piId, ...coPiIds]));

        // 3. Concurrently fetch all raw user entities and necessary rule contexts
        const [users, piRule, coRule, memberRule, aggregateRule] = await Promise.all([
            this.userRepo.findAll({ ids: allMemberIds }),
            this.compositionRepo.findOne(grant, TargetScope.PI_ONLY),
            this.compositionRepo.findOne(grant, TargetScope.CO_ONLY),
            this.compositionRepo.findOne(grant, TargetScope.ALL_MEMBERS),
            this.compositionRepo.findOne(grant, TargetScope.TEAM_AGGREGATE)
        ]);

        // 4. Map database results to ensure users actually exist
        const userMap = new Map<string, IUser>();
        for (const user of users) {
            userMap.set(String((user as any)._id), user);
        }

        const piUser = userMap.get(piId);
        if (!piUser) throw new AppError(ERROR_CODES.USER_NOT_FOUND);

        const coPiUsers: IUser[] = [];
        for (const id of coPiIds) {
            const coPi = userMap.get(id);
            if (!coPi) throw new AppError(ERROR_CODES.USER_NOT_FOUND);
            coPiUsers.push(coPi);
        }

        // Gather total distinct profiles involved in this scope
        const allDistinctUsers = Array.from(userMap.values());

        // 5. Queue targeted assertions into a parallel promise execution pool
        const validationTasks: Promise<void>[] = [];

        // Validate PI individual contexts
        if (piRule) {
            validationTasks.push(this.validateIndividual(piUser, piRule));
        }

        // Validate Co-PI individual contexts
        if (coRule && coPiUsers.length > 0) {
            for (const coPi of coPiUsers) {
                validationTasks.push(this.validateIndividual(coPi, coRule));
            }
        }

        // Validate generic conditions across all checked profiles
        if (memberRule) {
            for (const member of allDistinctUsers) {
                validationTasks.push(this.validateIndividual(member, memberRule));
            }
        }

        // Run full composite team validation balances
        if (aggregateRule) {
            validationTasks.push(this.executeAggregateValidation(aggregateRule, allDistinctUsers));
        }

        await Promise.all(validationTasks);
    }

    async validateProjectAggregate(grant: string, project: string): Promise<void> {
        const collabs = await this.collabRepo.find({ project });
        const applicantIds = collabs.map(c => c.applicant.toString());
        const users = await this.userRepo.findAll({
            ids: applicantIds
        });
        await this.validateAggregate(grant, users);
    }

    // =====================================================
    // CORE VALIDATION FUNCTIONS
    // =====================================================

    private async validateUser(userid: string) {
        const user = await this.userRepo.findById(userid);
        if (!user) { throw new AppError(ERROR_CODES.USER_NOT_FOUND); }
        return user;
    }

    async validatePI(grant: string, userid: string): Promise<void> {
        const user = await this.validateUser(userid);
        const rule = await this.compositionRepo.findOne(grant, TargetScope.PI_ONLY);
        if (!rule) return;
        await this.validateIndividual(user, rule);
        await this.validateMember(grant, user);
    }

    async validateCoPI(grant: string, userid: string): Promise<void> {
        const user = await this.validateUser(userid);
        const rule = await this.compositionRepo.findOne(grant, TargetScope.CO_ONLY);
        if (!rule) return;
        await this.validateIndividual(user, rule);
        await this.validateMember(grant, user);
    }

    private async validateMember(grant: string, user: IUser): Promise<void> {
        const rule = await this.compositionRepo.findOne(grant, TargetScope.ALL_MEMBERS);
        if (!rule) return;
        await this.validateIndividual(user, rule);
    }

    // =====================================================
    // AGGREGATE TEAM VALIDATION
    // =====================================================

    async validateAggregate(grant: string, users: IUser[]): Promise<void> {
        const rule = await this.compositionRepo.findOne(grant, TargetScope.TEAM_AGGREGATE);
        if (!rule) return;
        await this.executeAggregateValidation(rule, users);
    }

    /**
     * Shared extraction handler executing core arithmetic metrics evaluation.
     */
    private async executeAggregateValidation(rule: IComposition, users: IUser[]): Promise<void> {
        let qualifyingCount = 0;

        for (const user of users) {
            const matchesProfile = await this.matchesProfileCriteria(user, rule.profileRule);
            const matchesHistory = true; // this.matchesHistoryCriteria(user, rule.projectHistoryRule);
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
     */
    private async validateIndividual(user: IUser, rule: IComposition): Promise<void> {
        const matchesProfile = await this.matchesProfileCriteria(user, rule.profileRule);
        const matchesHistory = true; // await this.matchesHistoryCriteria(user, rule.projectHistoryRule);

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