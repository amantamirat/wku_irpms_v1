
import mongoose from "mongoose";
import Applicant from "../../applicants/applicant.model";
import { ApplicantConstraintType, OperationMode, ProjectConstraintType } from "./constraint.enum";
import { ApplicantConstraint, ProjectConstraint } from "./constraint.model";
import { Gender } from "../../applicants/applicant.enum";
import { CreateProjectDto } from "../../project/project.service";

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
            throw new Error("Empty Collaborators.");
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
            const { mode, value, min, max, list } = constraint;

            switch (constraint.constraint) {

                case ApplicantConstraintType.GENDER: {
                    const genderCount = applicantData.filter(a => (list as Gender[]).includes(a.gender)).length;
                    if (mode === OperationMode.COUNT) {
                        if (genderCount < value) {
                            throw new Error(`At least ${value} gender[${list}] applicants are required (found ${genderCount}).`);
                        }
                    } else if (mode === OperationMode.RATIO) {
                        const ratio = genderCount / applicantData.length;
                        if (ratio < value / 100) {
                            throw new Error(`gender[${list}] applicant ratio (${(ratio * 100).toFixed(1)}%) must be at least ${(value * 100).toFixed(1)}%.`);
                        }
                    }
                    break;
                }

                case ApplicantConstraintType.ACCESSIBILITY: {
                    const accessibleCount = applicantData.filter(a => Array.isArray(a.accessibility) && a.accessibility.length > 0).length;
                    if (mode === OperationMode.COUNT) {
                        if (accessibleCount < value) {
                            throw new Error(`At least ${value} in accessible applicants are required (found ${accessibleCount}).`);
                        }
                    } else if (mode === OperationMode.RATIO) {
                        const ratio = accessibleCount / applicantData.length;
                        if (ratio < value / 100) {
                            throw new Error(`Accessible applicant ratio (${(ratio * 100).toFixed(1)}%) must be at least ${(value * 100).toFixed(1)}%.`);
                        }
                    }

                    break;
                }

                case ApplicantConstraintType.SCOPE: {
                    //the ratio of academic, external and supporitive
                    if (list && list.length > 0) {
                        const invalidScopes = applicantData.filter(a => !list.includes(a.scope));
                        if (invalidScopes.length > 0) {
                            const names = invalidScopes.map(a => `${a.first_name} ${a.last_name}`).join(", ");
                            throw new Error(`Applicants [${names}] have invalid scope. Allowed: ${list.join(", ")}.`);
                        }
                    }
                    break;
                }
                case ApplicantConstraintType.AGE: {
                    const now = new Date();
                    let ageCount = 0;
                    const minAge = min ?? 0;
                    const maxAge = max ?? Number.MAX_SAFE_INTEGER;
                    for (const app of applicantData) {
                        const age = now.getFullYear() - app.birth_date.getFullYear() -
                            (now < new Date(now.getFullYear(), app.birth_date.getMonth(), app.birth_date.getDate()) ? 1 : 0);
                        if (minAge < age && age < maxAge) {
                            ageCount++;
                        }
                    }
                    if (mode === OperationMode.COUNT) {
                        if (ageCount < value) {
                            throw new Error(`At least ${value} applicants must be within the age range of ${minAge}–${maxAge} years (found ${ageCount}).`);
                        }
                    } else if (mode === OperationMode.RATIO) {
                        const ratio = ageCount / applicantData.length;
                        if (ratio < value / 100) {
                            throw new Error(
                                `Applicants within the age range (${minAge}–${maxAge} years) are ${(ratio * 100).toFixed(1)}%, ` +
                                `but the required ratio is at least ${(value).toFixed(1)}%.`
                            );
                        }
                    }
                    break;
                }
                default:
                    // Skip EXPERIENCE for now
                    break;
            }
        }
    }
}
