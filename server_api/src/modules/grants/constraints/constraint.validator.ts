
import mongoose from "mongoose";
import Applicant from "../../applicants/applicant.model";
import { ApplicantConstraintType, OperationMode, ProjectConstraintType } from "./constraint.enum";
import { ApplicantConstraint, ProjectConstraint } from "./constraint.model";
import { Gender } from "../../applicants/applicant.enum";
import { CreateProjectDto } from "../../project/project.service";
import { Composition } from "./compositions/composition.model";

export class ConstraintValidator {

    static async validateProjectConstraints(grantId: mongoose.Types.ObjectId, data: CreateProjectDto) {
        const constraints = await ProjectConstraint.find({ grant: grantId }).lean();
        if (!constraints || constraints.length === 0) return;

        const numParticipants = data.collaborators?.length ?? 0;
        const numPhases = data.phases?.length ?? 0;
        const totalBudget = (data.phases ?? []).reduce((sum, p) => sum + (p.budget ?? 0), 0);
        const totalDuration = (data.phases ?? []).reduce((sum, p) => sum + (p.duration ?? 0), 0);

        for (const constraint of constraints) {

            const { min, max } = constraint;

            switch (constraint.constraint) {
                case ProjectConstraintType.PARTICIPANT:
                    if (numParticipants < min || numParticipants > max) {
                        throw new Error(`Participant count (${numParticipants}) must be between ${constraint.min} and ${constraint.max}`);
                    }
                    break;

                case ProjectConstraintType.PHASE_COUNT:
                    if (numPhases < min || numPhases > max) {
                        throw new Error(`Phase count (${numPhases}) must be between ${min} and ${max}`);
                    }
                    break;

                case ProjectConstraintType.BUDGET_TOTAL:
                    if (totalBudget < min || totalBudget > max) {
                        throw new Error(`Total project budget (${totalBudget}) must be between ${min} and ${max}`);
                    }
                    break;

                case ProjectConstraintType.TIME_TOTAL:
                    if (totalDuration < min || totalDuration > max) {
                        throw new Error(`Total project duration (${totalDuration}) must be between ${min} and ${max}`);
                    }
                    break;

                // --- Per-phase constraints ---
                case ProjectConstraintType.BUDGET_PHASE:
                    for (const [i, phase] of (data.phases ?? []).entries()) {
                        if (phase.budget < min || phase.budget > max) {
                            throw new Error(`Phase ${i + 1} budget (${phase.budget}) must be between ${min} and ${max}`);
                        }
                    }
                    break;

                case ProjectConstraintType.TIME_PHASE:
                    for (const [i, phase] of (data.phases ?? []).entries()) {
                        if (phase.duration < min || phase.duration > max) {
                            throw new Error(`Phase ${i + 1} duration (${phase.duration}) must be between ${min} and ${max}`);
                        }
                    }
                    break;
                default:
                    // For now, ignore other constraint types
                    break;
            }
        }

    }



    static async validateApplicantConstraints(grantId: mongoose.Types.ObjectId, data: CreateProjectDto) {
        const collaborators = data.collaborators ?? [];
        if (collaborators.length === 0) {
            throw new Error("Empty collaborators.");
        }

        const applicants: mongoose.Types.ObjectId[] = collaborators.map(c => c.applicant);
        const leadPICount = collaborators.filter(c => c.isLeadPI === true).length;
        if (leadPICount !== 1) {
            throw new Error(`Each project must have exactly one Lead Principal Investigator (found ${leadPICount}).`);
        }

        const applicantConstraints = await ApplicantConstraint.find({ grant: grantId }).lean();
        if (!applicantConstraints || applicantConstraints.length === 0) return;

        const applicantData = await Applicant.find({ _id: { $in: applicants } }).lean();
        if (applicantData.length === 0 || applicantData.length !== applicants.length) {
            throw new Error("Applicants not found in the database.");
        }

        for (const constraint of applicantConstraints) {
            const compositions = await Composition.find({ parent: constraint._id }).lean();
            if (!compositions || compositions.length === 0) continue; // No subrules to check

            for (const comp of compositions) {
                const { item, value, min, max } = comp;
                const { mode } = constraint;

                switch (constraint.constraint) {
                    // ---------------- GENDER ----------------
                    case ApplicantConstraintType.GENDER: {
                        const filtered = applicantData.filter(a => a.gender === item);
                        const count = filtered.length;

                        if (value === 0 && count > 0) {
                            throw new Error(`No applicants of gender [${item}] are allowed (found ${count}).`);
                        }

                        if (mode === OperationMode.COUNT && value > 0) {
                            if (count < value) {
                                throw new Error(`At least ${value} ${item} applicants are required (found ${count}).`);
                            }
                        } else if (mode === OperationMode.RATIO && value > 0) {
                            const ratio = count / applicantData.length;
                            if (ratio < value ) {
                                throw new Error(`${item} applicants ratio (${(ratio * 100).toFixed(1)}%) must be at least ${(value).toFixed(1)}%.`);
                            }
                        }
                        break;
                    }

                    // ---------------- ACCESSIBILITY ----------------
                    case ApplicantConstraintType.ACCESSIBILITY: {
                        const filtered = applicantData.filter(a =>
                            Array.isArray(a.accessibility) && a.accessibility.includes(item as any)
                        );
                        const count = filtered.length;

                        if (value === 0 && count > 0) {
                            throw new Error(`Applicants with accessibility type [${item}] are not allowed (found ${count}).`);
                        }

                        if (mode === OperationMode.COUNT && value > 0) {
                            if (count < value) {
                                throw new Error(`At least ${value} applicants with accessibility [${item}] are required (found ${count}).`);
                            }
                        } else if (mode === OperationMode.RATIO && value > 0) {
                            const ratio = count / applicantData.length;
                            if (ratio < value) {
                                throw new Error(`Applicants with accessibility [${item}] ratio (${(ratio * 100).toFixed(1)}%) must be at least ${(value).toFixed(1)}%.`);
                            }
                        }
                        break;
                    }

                    // ---------------- SCOPE ----------------
                    case ApplicantConstraintType.SCOPE: {
                        const filtered = applicantData.filter(a => a.scope === item);
                        const count = filtered.length;

                        if (value === 0 && count > 0) {
                            throw new Error(`Applicants with scope [${item}] are not allowed (found ${count}).`);
                        }

                        if (mode === OperationMode.COUNT && value > 0) {
                            if (count < value) {
                                throw new Error(`At least ${value} applicants with scope [${item}] are required (found ${count}).`);
                            }
                        } else if (mode === OperationMode.RATIO && value > 0) {
                            const ratio = count / applicantData.length;
                            if (ratio < value) {
                                throw new Error(`Applicants with scope [${item}] ratio (${(ratio * 100).toFixed(1)}%) must be at least ${(value).toFixed(1)}%.`);
                            }
                        }
                        break;
                    }

                    // ---------------- AGE ----------------
                    case ApplicantConstraintType.AGE: {
                        const now = new Date();
                        const minAge = min ?? 0;
                        const maxAge = max ?? Number.MAX_SAFE_INTEGER;

                        const filtered = applicantData.filter(app => {
                            const age = now.getFullYear() - app.birth_date.getFullYear() -
                                (now < new Date(now.getFullYear(), app.birth_date.getMonth(), app.birth_date.getDate()) ? 1 : 0);
                            return age >= minAge && age <= maxAge;
                        });

                        const count = filtered.length;

                        if (value === 0 && count > 0) {
                            throw new Error(`No applicants should fall within the age range ${minAge}–${maxAge} years (found ${count}).`);
                        }

                        if (mode === OperationMode.COUNT && value > 0) {
                            if (count < value) {
                                throw new Error(`At least ${value} applicants must be within the age range ${minAge}–${maxAge} years (found ${count}).`);
                            }
                        } else if (mode === OperationMode.RATIO && value > 0) {
                            const ratio = count / applicantData.length;
                            if (ratio < value) {
                                throw new Error(
                                    `Applicants within the age range ${minAge}–${maxAge} years are ${(ratio * 100).toFixed(1)}%, ` +
                                    `but required ratio is at least ${(value).toFixed(1)}%.`
                                );
                            }
                        }
                        break;
                    }

                    default:
                        // EXPERIENCE or unimplemented constraints
                        break;
                }
            }
        }
    }


}
