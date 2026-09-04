import { IRange, matchRange } from "../../../common/types/range";
import { SpecializationRepository } from "../../organization/specializations/specialization.repository";
import { ExperienceRepository } from "../../users/experiences/experience.repository";
import { IUser } from "../../users/user.model";
import { IEligibilityProfile } from "./profile.model";

export class ProfileValidatorService {

    constructor(
        private readonly experienceRepo: ExperienceRepository,
        private readonly specializationRepo: SpecializationRepository,
    ) { }

    async matches(
        profile: IEligibilityProfile,
        user: IUser
    ): Promise<boolean> {

        // Gender
        if (
            profile.gender !== undefined &&
            user.gender !== profile.gender
        ) {
            return false;
        }

        // Age
        if (profile.age) {

            if (!user.birthDate) {
                return false;
            }

            const age = this.calculateAge(user.birthDate);

            if (!matchRange(profile.age, age)) {
                return false;
            }
        }

        // Experience
        if (profile.experienceYears) {

            const experiences =
                await this.experienceRepo.find({
                    user: String(user._id)
                });

            const experienceYears =
                this.calculateTotalExperienceYears(experiences);

            if (
                !matchRange(
                    profile.experienceYears,
                    experienceYears
                )
            ) {
                return false;
            }
        }

        // Academic level
        if (profile.academicLevels?.length) {

            if (!user.specializations?.length) {
                return false;
            }

            const specializations =
                await this.specializationRepo.find({
                    ids: user.specializations?.map(id => id.toString())
                });

            const hasMatchingAcademicLevel =
                specializations.some(
                    specialization =>
                        profile.academicLevels!.includes(
                            specialization.academicLevel
                        )
                );

            if (!hasMatchingAcademicLevel) {
                return false;
            }
        }

        // Accessibility
        if (profile.accessibility?.length) {

            if (!user.accessibility?.length) {
                return false;
            }

            const hasMatchingAccessibility =
                user.accessibility.some(
                    accessibility =>
                        profile.accessibility!.includes(
                            accessibility
                        )
                );

            if (!hasMatchingAccessibility) {
                return false;
            }
        }

        return true;
    }

    private calculateAge(
        birthDate: Date | string
    ): number {

        const birth = new Date(birthDate);
        const today = new Date();

        let age =
            today.getFullYear() -
            birth.getFullYear();

        const monthDiff =
            today.getMonth() -
            birth.getMonth();

        if (
            monthDiff < 0 ||
            (
                monthDiff === 0 &&
                today.getDate() < birth.getDate()
            )
        ) {
            age--;
        }

        return age;
    }

    private calculateTotalExperienceYears(
        experiences: any[]
    ): number {

        if (!experiences?.length) {
            return 0;
        }

        const now = new Date();
        let totalMs = 0;

        for (const experience of experiences) {

            if (!experience.startDate) {
                continue;
            }

            const start =
                new Date(experience.startDate);

            const end =
                experience.isCurrent || !experience.endDate
                    ? now
                    : new Date(experience.endDate);

            if (end > start) {
                totalMs +=
                    end.getTime() -
                    start.getTime();
            }
        }

        const msPerYear =
            1000 * 60 * 60 * 24 * 365.25;

        return totalMs / msPerYear;
    }
}