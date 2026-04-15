// constraint.config.ts

import { ProjectConstraintType } from "./constraint.model";

export type ConstraintUI = {
    label: string;
    icon: string;
    format?: (min?: number, max?: number) => string;
};

export const constraintUIMap: Record<ProjectConstraintType, ConstraintUI> = {
    [ProjectConstraintType.PARTICIPANT]: {
        label: "Participants",
        icon: "pi pi-users",
        format: (min?: number, max?: number) =>
            `${min ?? 0} - ${max ?? "∞"} people`
    },

    [ProjectConstraintType.PHASE_COUNT]: {
        label: "Phases",
        icon: "pi pi-sitemap",
        format: (min?: number, max?: number) =>
            `${min ?? 0} - ${max ?? "∞"} phases`
    },

    [ProjectConstraintType.BUDGET_TOTAL]: {
        label: "Total Budget",
        icon: "pi pi-wallet",
        format: (min?: number, max?: number) =>
            `${formatCurrency(min)} - ${formatCurrency(max)}`
    },

    [ProjectConstraintType.TIME_TOTAL]: {
        label: "Total Duration",
        icon: "pi pi-clock",
        format: (min?: number, max?: number) =>
            `${min ?? 0} - ${max ?? "∞"} days`
    },

    [ProjectConstraintType.BUDGET_PHASE]: {
        label: "Budget per Phase",
        icon: "pi pi-money-bill",
        format: (min?: number, max?: number) =>
            `${formatCurrency(min)} - ${formatCurrency(max)}`
    },

    [ProjectConstraintType.TIME_PHASE]: {
        label: "Time per Phase",
        icon: "pi pi-calendar",
        format: (min?: number, max?: number) =>
            `${min ?? 0} - ${max ?? "∞"} days`
    },
    /*
        [ProjectConstraintType.ACTIVITIES_PHASE]: {
            label: "Activities per Phase",
            icon: "pi pi-list",
            format: (min?: number, max?: number) =>
                `${min ?? 0} - ${max ?? "∞"} activities`
        },*/

    [ProjectConstraintType.THEME]: {
        label: "Theme",
        icon: "pi pi-tags",
        format: (min?: number, max?: number) =>
            `${min ?? 0} - ${max ?? "∞"} themes`
    },

    [ProjectConstraintType.SUB_THEME]: {
        label: "Sub Theme",
        icon: "pi pi-tag",
        format: (min?: number, max?: number) =>
            `${min ?? 0} - ${max ?? "∞"} sub-themes`
    },

    [ProjectConstraintType.FOCUS_AREA]: {
        label: "Focus Area",
        icon: "pi pi-compass",
        format: (min?: number, max?: number) =>
            `${min ?? 0} - ${max ?? "∞"} focus-areas`
    },

    [ProjectConstraintType.INDICATOR]: {
        label: "Indicator",
        icon: "pi pi-chart-line",
        format: (min?: number, max?: number) =>
            `${min ?? 0} - ${max ?? "∞"} indicators`
    },
    [ProjectConstraintType.PROJECT_TITLE]: {
        label: "Project Title",
        icon: "pi pi-bookmark",
        format: (min?: number, max?: number) =>
            `${min ?? 0} - ${max ?? "∞"} words`
    },
    [ProjectConstraintType.PROJECT_SUMMARY]: {
        label: "Project Summary",
        icon: "pi pi-align-left",
        format: (min?: number, max?: number) =>
            `${min ?? 0} - ${max ?? "∞"} words`
    },
};

// helper
const formatCurrency = (value?: number) => {
    if (value == null) return "0 ETB";
    return new Intl.NumberFormat('en-ET', {
        style: 'currency',
        currency: 'ETB',
        maximumFractionDigits: 0
    }).format(value);
};