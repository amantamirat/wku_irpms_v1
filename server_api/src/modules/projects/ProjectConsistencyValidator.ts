import mongoose from "mongoose";
import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";

interface ProjectAllocation {
    totalBudget?: number;
    totalDuration?: number;
}

interface PhaseAllocation {
    _id?: string | mongoose.Types.ObjectId;
    project?: string;
    order?: number;
    budget?: number;
    duration?: number;
    startDate?: Date | string;
    endDate?: Date | string;
}

interface ActivityAllocation {
    _id?: string | mongoose.Types.ObjectId;
    phase?: string | mongoose.Types.ObjectId;
    cost?: number;
    startDate?: Date | string;
    endDate?: Date | string;
}
export class ProjectConsistencyValidator {

    // ---------------------------------------------
    // BASIC HELPERS
    // ---------------------------------------------

    private getDate(value?: Date | string): number {
        if (!value) return NaN;

        return new Date(value).getTime();
    }

    private validateDateRange(
        startDate: Date | string | undefined,
        endDate: Date | string | undefined,
        label: string
    ): { start: number; end: number } {

        const start = this.getDate(startDate);
        const end = this.getDate(endDate);

        if (
            !Number.isFinite(start) ||
            !Number.isFinite(end) ||
            end < start
        ) {
            throw new AppError(
                ERROR_CODES.INVALID_INPUT,
                `Invalid ${label} start or end date.`
            );
        }

        return { start, end };
    }

    private validateNonNegative(
        value: number | undefined,
        label: string
    ): number {

        if (
            value === undefined ||
            !Number.isFinite(value) ||
            value < 0
        ) {
            throw new AppError(
                ERROR_CODES.INVALID_INPUT,
                `${label} must be a non-negative number.`
            );
        }

        return value;
    }

    // ---------------------------------------------
    // PROJECT
    // ---------------------------------------------

    validateProjectLimits(project: ProjectAllocation): void {

        this.validateNonNegative(
            project.totalBudget,
            "Project budget"
        );

        if (
            project.totalDuration === undefined ||
            !Number.isFinite(project.totalDuration) ||
            project.totalDuration <= 0
        ) {
            throw new AppError(
                ERROR_CODES.INVALID_INPUT,
                "Project duration must be greater than zero."
            );
        }
    }

    // ---------------------------------------------
    // PHASE ALLOCATIONS
    // ---------------------------------------------

    getAllocatedPhaseBudget(
        phases: PhaseAllocation[]
    ): number {

        return phases.reduce(
            (total, phase) =>
                total + this.validateNonNegative(
                    phase.budget,
                    "Phase budget"
                ),
            0
        );
    }

    getAllocatedPhaseDuration(
        phases: PhaseAllocation[]
    ): number {

        return phases.reduce(
            (total, phase) =>
                total + this.validateNonNegative(
                    phase.duration,
                    "Phase duration"
                ),
            0
        );
    }

    private formatNumber(value: number): string {
        return new Intl.NumberFormat("en-US", {
            maximumFractionDigits: 2
        }).format(value);
    }


    /**
 * Validates that phases do not overlap.
 * Phases without complete date information are skipped.
 */

    validatePhaseDates(
        targetPhase: PhaseAllocation,
        otherPhases: PhaseAllocation[]
    ): void {
        if (!targetPhase.startDate || !targetPhase.endDate) {
            return;
        }

        const { start, end } = this.validateDateRange(
            targetPhase.startDate,
            targetPhase.endDate,
            "phase"
        );

        const formatDate = (timestamp: number): string =>
            new Date(timestamp).toISOString().split("T")[0];

        for (const phase of otherPhases) {
            if (!phase.startDate || !phase.endDate) {
                continue;
            }

            const other = this.validateDateRange(
                phase.startDate,
                phase.endDate,
                "existing phase"
            );

            if (start < other.end && end > other.start) {
                const overlapStart = Math.max(start, other.start);
                const overlapEnd = Math.min(end, other.end);

                throw new AppError(
                    ERROR_CODES.INVALID_PHASE_DATES,
                    `Phase ${String(targetPhase.order)} 
                (${formatDate(start)} to ${formatDate(end)})
                overlaps with Phase ${String(phase.order)}
                (${formatDate(other.start)} to ${formatDate(other.end)}).
                Overlapping period: ${formatDate(overlapStart)}
                to ${formatDate(overlapEnd)}.`,
                    400,
                    {
                        targetPhaseId: targetPhase._id,
                        conflictingPhaseId: phase._id,
                        targetPhaseDates: {
                            startDate: formatDate(start),
                            endDate: formatDate(end)
                        },
                        conflictingPhaseDates: {
                            startDate: formatDate(other.start),
                            endDate: formatDate(other.end)
                        },
                        overlappingDates: {
                            startDate: formatDate(overlapStart),
                            endDate: formatDate(overlapEnd)
                        }
                    }
                );
            }
        }
    }


    validatePhaseAllocations(
        project: ProjectAllocation,
        phases: PhaseAllocation[]
    ): void {

        const allocatedBudget =
            this.getAllocatedPhaseBudget(phases);

        const allocatedDuration =
            this.getAllocatedPhaseDuration(phases);

        const projectBudget = project.totalBudget ?? 0;
        const projectDuration = project.totalDuration ?? 0;

        if (allocatedBudget > projectBudget) {
            const remainingBudget = projectBudget - allocatedBudget;

            throw new AppError(
                ERROR_CODES.INVALID_PROJECT_BUDGET,
                `Total phase budget (${this.formatNumber(allocatedBudget)}) 
            exceeds the project budget (${this.formatNumber(projectBudget)}).
            The allocated budget exceeds the available budget by 
            ${this.formatNumber(Math.abs(remainingBudget))}.`,
                400,
                {
                    projectBudget,
                    allocatedBudget,
                    remainingBudget
                }
            );
        }

        if (allocatedDuration > projectDuration) {
            const remainingDuration = projectDuration - allocatedDuration;

            throw new AppError(
                ERROR_CODES.INVALID_PROJECT_DURATION,
                `Total phase duration (${this.formatNumber(allocatedDuration)}) 
            exceeds the project duration (${this.formatNumber(projectDuration)}).
            The allocated duration exceeds the available duration by 
            ${this.formatNumber(Math.abs(remainingDuration))}.`,
                400,
                {
                    projectDuration,
                    allocatedDuration,
                    remainingDuration
                }
            );
        }

        // Validate each phase date range.
        for (const phase of phases) {
            this.validateDateRange(
                phase.startDate,
                phase.endDate,
                "phase"
            );
        }
    }

    // ---------------------------------------------
    // ACTIVITY ALLOCATIONS
    // ---------------------------------------------

    getAllocatedActivityCost(
        activities: ActivityAllocation[]
    ): number {

        return activities.reduce(
            (total, activity) =>
                total + this.validateNonNegative(
                    activity.cost,
                    "Activity cost"
                ),
            0
        );
    }

    validateActivityDates(
        phase: PhaseAllocation,
        activities: ActivityAllocation[]
    ): void {

        const phaseDates = this.validateDateRange(
            phase.startDate,
            phase.endDate,
            "phase"
        );

        for (const activity of activities) {

            const activityDates = this.validateDateRange(
                activity.startDate,
                activity.endDate,
                "activity"
            );

            if (
                activityDates.start < phaseDates.start ||
                activityDates.end > phaseDates.end
            ) {
                throw new AppError(
                    ERROR_CODES.INVALID_ACTIVITY_DATES,
                    "Activity dates must fall within the parent phase dates.",
                    400,
                    {
                        activityId: activity._id,
                        phaseId: phase._id,
                        activityStartDate: activity.startDate,
                        activityEndDate: activity.endDate,
                        phaseStartDate: phase.startDate,
                        phaseEndDate: phase.endDate
                    }
                );
            }
        }
    }

    validateActivityAllocations(
        phase: PhaseAllocation,
        activities: ActivityAllocation[]
    ): void {

        const allocatedCost =
            this.getAllocatedActivityCost(activities);

        const phaseBudget = phase.budget ?? 0;

        if (allocatedCost > phaseBudget) {
            const remainingBudget = phaseBudget - allocatedCost;

            throw new AppError(
                ERROR_CODES.INVALID_PHASE_BUDGET,
                `Total activity cost (${this.formatNumber(allocatedCost)})
            exceeds the phase budget (${this.formatNumber(phaseBudget)}).
            The allocated activity cost exceeds the available phase budget by
            ${this.formatNumber(Math.abs(remainingBudget))}.`,
                400,
                {
                    phaseId: phase._id,
                    phaseBudget,
                    allocatedCost,
                    remainingBudget
                }
            );
        }

        this.validateActivityDates(
            phase,
            activities
        );
    }

    // ---------------------------------------------
    // FINAL VALIDATION
    // ---------------------------------------------

    validateFinalAllocation(
        project: ProjectAllocation,
        phases: PhaseAllocation[]
    ): void {

        this.validateProjectLimits(project);

        this.validatePhaseAllocations(
            project,
            phases
        );

        const allocatedBudget =
            this.getAllocatedPhaseBudget(phases);

        const allocatedDuration =
            this.getAllocatedPhaseDuration(phases);

        if (allocatedBudget !== project.totalBudget) {
            throw new AppError(
                ERROR_CODES.INVALID_PROJECT_BUDGET,
                "All project budget must be allocated to phases."
            );
        }

        if (allocatedDuration !== project.totalDuration) {
            throw new AppError(
                ERROR_CODES.INVALID_PROJECT_DURATION,
                "All project duration must be allocated to phases."
            );
        }
    }
}
