export const PERMISSIONS = {
  PERMISSION: {
    READ: "permission:read",
  },
  ROLE: {
    CREATE: "role:create",
    READ: "role:read",
    UPDATE: "role:update",
    DELETE: "role:delete",
  },
  USER: {
    CREATE: "user:create",
    READ: "user:read",
    UPDATE: "user:update",
    DELETE: "user:delete",
    // RESET: "user:reset",
  },

  ORGANIAZTION: {
    COLLEGE: {
      CREATE: "college:create",
      READ: "college:read",
      UPDATE: "college:update",
      DELETE: "college:delete",
    },

    DEPARTMENT: {
      CREATE: "department:create",
      READ: "department:read",
      UPDATE: "department:update",
      DELETE: "department:delete",
    },

    PROGRAM: {
      CREATE: "program:create",
      READ: "program:read",
      UPDATE: "program:update",
      DELETE: "program:delete",
    },

    DIRECTORATE: {
      CREATE: "directorate:create",
      READ: "directorate:read",
      UPDATE: "directorate:update",
      DELETE: "directorate:delete",
    },

    CENTER: {
      CREATE: "center:create",
      READ: "center:read",
      UPDATE: "center:update",
      DELETE: "center:delete",
    },

    EXTERNAL: {
      CREATE: "external:create",
      READ: "external:read",
      UPDATE: "external:update",
      DELETE: "external:delete",
    },
  },

  SPECIALIZATION: {
    CREATE: "specialization:create",
    READ: "specialization:read",
    UPDATE: "specialization:update",
    DELETE: "specialization:delete",
  },

  APPLICANT: {
    CREATE: "applicant:create",
    READ: "applicant:read",
    UPDATE: "applicant:update",
    DELETE: "applicant:delete",
    UPDATE_ROLES: "applicant:update_roles"
  },
  CALENDAR: {
    CREATE: "calendar:create",
    READ: "calendar:read",
    UPDATE: "calendar:update",
    DELETE: "calendar:delete",
  },

  EXPERIENCE: {
    CREATE: "experience:create",
    READ: "experience:read",
    UPDATE: "experience:update",
    DELETE: "experience:delete",
  },
  GRANT: {
    CREATE: "grant:create",
    READ: "grant:read",
    UPDATE: "grant:update",
    DELETE: "grant:delete",
  },
  CONSTRAINT: {
    CREATE: "constraint:create",
    READ: "constraint:read",
    UPDATE: "constraint:update",
    DELETE: "constraint:delete",
  },
  CALL: {
    CREATE: "call:create",
    READ: "call:read",
    UPDATE: "call:update",
    STATUS: {
      PLANNED: "call:status.planned",
      ACTIVATE: "call:status.active",
      CLOSE: "call:status.closed",
    },
    DELETE: "call:delete",
    CHANGE_STATUS: "call:change_status", // New permission for status transitions
  },

  STAGE: {
    CREATE: "stage:create",
    READ: "stage:read",
    UPDATE: "stage:update",
    STATUS: {
      PLANNED: "stage:status.planned",
      ACTIVATE: "stage:status.active",
      CLOSE: "stage:status.closed",
    },
    DELETE: "stage:delete",
    CHANGE_STATUS: "stage:change_status", // New permission for status transitions
  },

  EVALUATION: {
    CREATE: "evaluation:create",
    READ: "evaluation:read",
    UPDATE: "evaluation:update",
    DELETE: "evaluation:delete",
  },
  PROJECT: {
    CREATE: "project:create",
    READ: "project:read",
    UPDATE: "project:update",
    STATUS: {
      NEGOTIATE: "project:status.negotiation",
      ACCEPT: "project:status.accepted"
    },
    DELETE: "project:delete",
  },
  COLLABORATOR: {
    CREATE: "collaborator:create",
    READ: "collaborator:read",
    UPDATE: "collaborator:update",
    STATUS: {
      VERIFY: "collaborator:status.verified",
      PEND: "collaborator:status.pending"
    },
    DELETE: "collaborator:delete",
  },
  PHASE: {
    CREATE: "phase:create",
    READ: "phase:read",
    UPDATE: "phase:update",
    STATUS: {
      PROPOSE: "phase:status.proposed",
      VERIFY: "phase:status.verified",
      APPROVE: "phase:status.approved",
    },
    DELETE: "phase:delete",
  },
  DOCUMENT: {
    CREATE: "document:create",
    READ: "document:read",
    UPDATE: "document:update",
    STATUS: {
      ACCEPT: "document:status.accepted",
      REJECT: "document:status.rejected",
      REVIEW: "document:status.reviewed",
    },
    DELETE: "document:delete",
    UPDATE_STATUS: "document:update_status",
  },
  REVIEWER: {
    CREATE: "reviewer:create",
    READ: "reviewer:read",
    UPDATE: "reviewer:update",
    CHANGE_STATUS: "reviewer:change_status", // New permission for status transitions
    APPROVE: "reviewer:approve",      // Keep as special approval permission
    DELETE: "reviewer:delete",
  },
  THEME: {
    CREATE: "theme:create",
    IMPORT: "theme:import",
    READ: "theme:read",
    UPDATE: "theme:update",
    DELETE: "theme:delete",
  },
  POSITION: {
    CREATE: "position:create",
    READ: "position:read",
    UPDATE: "position:update",
    DELETE: "position:delete",
  },
  RESULT: {
    CREATE: "result:create",
    READ: "result:read",
    UPDATE: "result:update",
    DELETE: "result:delete",
  }
} as const;


export type PermissionAction = "CREATE" | "READ" | "UPDATE" | "DELETE";