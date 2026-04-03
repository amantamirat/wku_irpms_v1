import { GrantAllocation } from "../models/grant.allocation.model";

// Helper to display Allocation in Dropdown (e.g., "2026 - Global Research Fund")
export const getAllocationLabel = (alloc: any): string => {
    if (!alloc) return "";
    const year = typeof alloc.calendar === 'object' ? alloc.calendar?.year : 'Year';
    const title = typeof alloc.grant === 'object' ? alloc.grant?.title : 'Grant';
    return `${year} - ${title}`;
};

/* 2. The Template for the Dropdown (how it looks inside the picker) */
export const allocationOptionTemplate = (option: GrantAllocation) => {
    return <span>{getAllocationLabel(option)}</span>;
};
