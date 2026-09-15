import { ProjectStatus } from "./project.model";

export const PROJECT_STATUS_ORDER: ProjectStatus[] = [
    ProjectStatus.draft,
    ProjectStatus.submitted,
    ProjectStatus.rejected,
    ProjectStatus.accepted,
    ProjectStatus.approved,
    ProjectStatus.refused,
    ProjectStatus.granted,
    ProjectStatus.active,
    ProjectStatus.completed,
    ProjectStatus.terminated,
];
/*
export const STANDALONE_PROJECT_STATUS_ORDER: ProjectStatus[] = [
    ProjectStatus.draft,
    ProjectStatus.approved,
    ProjectStatus.refused,
    ProjectStatus.granted,
    ProjectStatus.active,
    ProjectStatus.completed,
    ProjectStatus.terminated,
];
*/
/*
export const PROJECT_TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
    [ProjectStatus.draft]: [
        ProjectStatus.approved, //when call does not exist
        ProjectStatus.refused //when call does not exist
    ],

    [ProjectStatus.submitted]: [
        ProjectStatus.accepted, //when call exist
        ProjectStatus.rejected, //when call exist
    ],

    [ProjectStatus.rejected]: [
        ProjectStatus.submitted //back when call exist
    ],

    [ProjectStatus.accepted]: [
        ProjectStatus.approved,
        ProjectStatus.refused,
        ProjectStatus.submitted //back when call exist
    ],

    [ProjectStatus.approved]: [
        ProjectStatus.granted,
        ProjectStatus.draft, //back when call does not exist
        ProjectStatus.accepted //back when call exist
    ],

    [ProjectStatus.refused]: [
        ProjectStatus.accepted,//back when call exist
        ProjectStatus.draft //back when call does not exist
    ],

    [ProjectStatus.granted]: [
        ProjectStatus.active,
        ProjectStatus.approved //back
    ],

    [ProjectStatus.active]: [
        ProjectStatus.completed,
        ProjectStatus.terminated,
        ProjectStatus.granted //back
    ],

    [ProjectStatus.completed]: [
        ProjectStatus.active
    ],

    [ProjectStatus.terminated]: [
        ProjectStatus.active
    ]
};
*/

const COMMON_TRANSITIONS: Partial<Record<ProjectStatus, ProjectStatus[]>> = {
    [ProjectStatus.granted]: [
        //ProjectStatus.active,
        ProjectStatus.approved // Rollback
    ],
    /*
    [ProjectStatus.active]: [
        ProjectStatus.completed,
        ProjectStatus.terminated,
        ProjectStatus.granted // Rollback
    ],
   
    [ProjectStatus.completed]: [
        ProjectStatus.active
    ],

    [ProjectStatus.terminated]: [
        ProjectStatus.active
    ]
         */
};

// 1. Standalone (Non-Call) State Graph
export const STANDALONE_PROJECT_TRANSITIONS: Partial<Record<ProjectStatus, ProjectStatus[]>> = {
    [ProjectStatus.draft]: [
        ProjectStatus.approved,
        ProjectStatus.refused
    ],
    [ProjectStatus.approved]: [
        ProjectStatus.granted,
        ProjectStatus.draft // Rollback
    ],
    [ProjectStatus.refused]: [
        ProjectStatus.draft // Rollback
    ],
    ...COMMON_TRANSITIONS
};


// 2. Call-Associated State Graph
export const CALL_PROJECT_TRANSITIONS: Partial<Record<ProjectStatus, ProjectStatus[]>> = {
    [ProjectStatus.accepted]: [
        ProjectStatus.approved,
        ProjectStatus.refused
    ],
    [ProjectStatus.approved]: [
        ProjectStatus.granted,
        ProjectStatus.accepted // Rollback
    ],
    [ProjectStatus.refused]: [
        ProjectStatus.accepted // Rollback
    ],
    ...COMMON_TRANSITIONS
};


import { TransitionMap } from "@/hooks/useStateTransitionActions";

export const PROJECT_TRANSITIONS: TransitionMap = {
    [ProjectStatus.draft]: [
        {
            next: ProjectStatus.approved,
            action: "Approve",
            icon: "pi pi-check",
            severity: "success"
        },
        {
            next: ProjectStatus.refused,
            action: "Refuse",
            icon: "pi pi-times",
            severity: "danger"
        }
    ],

    [ProjectStatus.approved]: [
        {
            next: ProjectStatus.granted,
            action: "Grant",
            icon: "pi pi-check-circle",
            severity: "success"
        },
        {
            next: ProjectStatus.draft,
            action: "Set Draft",
            icon: "pi pi-undo",
            severity: "warning"
        }
    ],

    [ProjectStatus.refused]: [
        {
            next: ProjectStatus.draft,
            action: "Set Draft",
            icon: "pi pi-undo",
            severity: "warning"
        }
    ],

    [ProjectStatus.granted]: [
        {
            next: ProjectStatus.active,
            action: "Activate",
            icon: "pi pi-play",
            severity: "success"
        },
        {
            next: ProjectStatus.approved,
            action: "Set Approved",
            icon: "pi pi-undo",
            severity: "warning"
        }
    ],

    [ProjectStatus.active]: [
        {
            next: ProjectStatus.completed,
            action: "Complete",
            icon: "pi pi-check-circle",
            severity: "success"
        },
        {
            next: ProjectStatus.terminated,
            action: "Terminate",
            icon: "pi pi-times",
            severity: "danger"
        },
        {
            next: ProjectStatus.granted,
            action: "Set Granted",
            icon: "pi pi-undo",
            severity: "warning"
        }
    ],

    [ProjectStatus.completed]: [
        {
            next: ProjectStatus.active,
            action: "Reopen",
            icon: "pi pi-refresh",
            severity: "warning"
        }
    ],

    [ProjectStatus.terminated]: [
        {
            next: ProjectStatus.active,
            action: "Reactivate",
            icon: "pi pi-refresh",
            severity: "success"
        }
    ]
};