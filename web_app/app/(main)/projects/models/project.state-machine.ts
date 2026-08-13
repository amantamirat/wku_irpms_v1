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