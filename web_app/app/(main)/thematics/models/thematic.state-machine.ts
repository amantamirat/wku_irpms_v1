import { TransitionMap } from "@/hooks/useStateTransitionActions";
export enum ThematicStatus {
    draft = 'draft',
    published = 'published',
    archived = 'archived'
}




export const THEMATIC_TRANSITIONS: TransitionMap = {
    [ThematicStatus.draft]: [
        {
            next: ThematicStatus.published,
            action: "Publish",
            icon: "pi pi-check",
            severity: "success"
        }
    ],

    [ThematicStatus.published]: [
        {
            next: ThematicStatus.archived,
            action: "Archive",
            icon: "pi pi-lock",
            severity: "danger"
        },
        {
            next: ThematicStatus.draft,
            action: "Set Draft",
            icon: "pi pi-undo",
            severity: "warning",
            requireReason: true
        }
    ],

    [ThematicStatus.archived]: [
        {
            next: ThematicStatus.published,
            action: "Republish",
            icon: "pi pi-refresh",
            severity: "success"
        }
    ]
};