import { Theme } from "@/app/(main)/thematics/themes/models/theme.model";
import { User } from "../../../users/models/user.model";
import { Activity } from "../../activities/models/phase-activity.model";
import { Project } from "../../models/project.model";
import { TransitionMap } from "@/hooks/useStateTransitionActions";

export enum ProjectComponentStatus {
    pending = 'pending',
    approved = 'approved',
    completed = 'completed',
    refused = 'refused',
}

export interface ProjectComponentDTO {
    _id?: string;
    project?: string | Project;
    title: string;
    description?: string;
    contributors?: string[] | User[];
    activities?: string[] | Activity[];
    themes?: string[] | Theme[];
    status?: ProjectComponentStatus;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface FilterProjectComponents {
    project?: string | Project;
    //investigator?: string;
}

export const PROJECT_COMPONENT_TRANSITIONS: TransitionMap = {
    [ProjectComponentStatus.pending]: [
        {
            next: ProjectComponentStatus.approved,
            action: "Approve",
            icon: "pi pi-check",
            severity: "success",
        },
        {
            next: ProjectComponentStatus.refused,
            action: "Refuse",
            icon: "pi pi-times",
            severity: "danger",
            requireReason: true,
        },
    ],

    [ProjectComponentStatus.approved]: [
        {
            next: ProjectComponentStatus.pending,
            action: "Set Pending",
            icon: "pi pi-undo",
            severity: "warning",
            requireReason: true,
        },
        {
            next: ProjectComponentStatus.completed,
            action: "Complete",
            icon: "pi pi-check-circle",
            severity: "success",
        },
    ],

    [ProjectComponentStatus.completed]: [
        {
            next: ProjectComponentStatus.approved,
            action: "Reopen",
            icon: "pi pi-refresh",
            severity: "warning",
            requireReason: true,
        },
    ],

    [ProjectComponentStatus.refused]: [
        {
            next: ProjectComponentStatus.pending,
            action: "Set Pending",
            icon: "pi pi-undo",
            severity: "warning",
            requireReason: true,
        },
    ],
};