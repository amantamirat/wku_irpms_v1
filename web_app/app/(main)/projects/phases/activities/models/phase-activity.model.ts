import { Phase } from "../../models/phase.model";

export enum PhaseActivityStatus {
    planned = "planned",
    approved = "approved",
    refused = "refused",
    active = "active",
    completed = "completed",
    cancelled = "cancelled",
}

export interface IPhaseActivityDetailCost {
    duration: number;
    participants: number;
    unitPrice: number;
}

export type PhaseActivity = {
    _id?: string;

    phase: string | Phase;

    title: string;
    description?: string;

    cost: number;
    detailCost?: IPhaseActivityDetailCost;

    startDate?: Date;
    endDate?: Date;

    status?: PhaseActivityStatus;

    createdAt?: Date;
    updatedAt?: Date;
};

export interface FilterPhaseActivityOptions {
    phase?: string | Phase;
    status?: PhaseActivityStatus;
}

// --- Validation Logic ---
export const validatePhaseActivity = (
    activity: PhaseActivity
): { valid: boolean; message?: string } => {

    if (!activity.phase) {
        return { valid: false, message: "Phase is required." };
    }

    if (!activity.title || activity.title.trim() === "") {
        return { valid: false, message: "Activity title is required." };
    }

    if (!activity.startDate) {
        return { valid: false, message: "Start date is required." };
    }

    if (!activity.endDate) {
        return { valid: false, message: "End date is required." };
    }

    if (new Date(activity.startDate) > new Date(activity.endDate)) {
        return {
            valid: false,
            message: "Start date cannot be after the end date.",
        };
    }

    if (activity.cost === undefined || activity.cost < 0) {
        return {
            valid: false,
            message: "A valid cost is required.",
        };
    }

    if (activity.detailCost) {
        if (activity.detailCost.duration < 1) {
            return {
                valid: false,
                message: "Detail duration must be at least 1 day.",
            };
        }

        if (activity.detailCost.participants < 1) {
            return {
                valid: false,
                message: "Participants must be at least 1.",
            };
        }

        if (activity.detailCost.unitPrice < 0) {
            return {
                valid: false,
                message: "Unit price cannot be negative.",
            };
        }

        // Protect and verify total cost if detailCost is provided
        const expectedCost = 
            activity.detailCost.duration * 
            activity.detailCost.participants * 
            activity.detailCost.unitPrice;
        
        if (Math.abs(activity.cost - expectedCost) > 0.01) {
            return {
                valid: false,
                message: `Total cost must equal detail duration × participants × unit price (${expectedCost.toFixed(2)}).`,
            };
        }
    }

    return { valid: true };
};