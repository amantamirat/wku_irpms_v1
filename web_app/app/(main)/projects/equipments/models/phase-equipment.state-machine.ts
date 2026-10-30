import { PhaseEquipmentStatus } from "./phase-equipment.model";

import { TransitionMap } from "@/hooks/useStateTransitionActions";

export const PHASE_EQUIPMENT_TRANSITIONS: TransitionMap = {
    [PhaseEquipmentStatus.planned]: [
        {
            next: PhaseEquipmentStatus.approved,
            action: "Approve",
            icon: "pi pi-check",
            severity: "success",
        },
        {
            next: PhaseEquipmentStatus.refused,
            action: "Refuse",
            icon: "pi pi-times",
            severity: "danger",
        },
        {
            next: PhaseEquipmentStatus.cancelled,
            action: "Cancel",
            icon: "pi pi-ban",
            severity: "danger",
        },
    ],

    [PhaseEquipmentStatus.approved]: [
        {
            next: PhaseEquipmentStatus.delivered,
            action: "Mark Delivered",
            icon: "pi pi-truck",
            severity: "success",
        },
        {
            next: PhaseEquipmentStatus.cancelled,
            action: "Cancel",
            icon: "pi pi-ban",
            severity: "danger",
        },
        {
            next: PhaseEquipmentStatus.planned,
            action: "Set Planned",
            icon: "pi pi-undo",
            severity: "warning",
        },
    ],

    [PhaseEquipmentStatus.refused]: [
        {
            next: PhaseEquipmentStatus.planned,
            action: "Set Planned",
            icon: "pi pi-undo",
            severity: "warning",
        },
    ],

    [PhaseEquipmentStatus.delivered]: [
        {
            next: PhaseEquipmentStatus.approved,
            action: "Set Approved",
            icon: "pi pi-undo",
            severity: "warning",
        },
    ],

    [PhaseEquipmentStatus.cancelled]: [
        {
            next: PhaseEquipmentStatus.planned,
            action: "Set Planned",
            icon: "pi pi-undo",
            severity: "warning",
        },
    ],
};