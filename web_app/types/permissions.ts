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
    STATUS: {
      //PEND: "user:status.pending",
      ACTIVATE: "user:status.active",
      SUSPEND: "user:status.suspended"
    },
    DELETE: "user:delete"
  },

  APPLICANT: {
    CREATE: "applicant:create",
    READ: "applicant:read",
    UPDATE: "applicant:update",
    ROLE_UPDATE: "applicant:role:update",
    OWNERSHIP_UPDATE: "applicant:ownership:update",
    DELETE: "applicant:delete"
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

  STUDENT: {
    CREATE: "student:create",
    READ: "student:read",
    UPDATE: "student:update",
    DELETE: "student:delete",
  },

  PUBLICATION: {
    CREATE: "publication:create",
    READ: "publication:read",
    UPDATE: "publication:update",
    DELETE: "publication:delete",
  },

  SPECIALIZATION: {
    CREATE: "specialization:create",
    READ: "specialization:read",
    UPDATE: "specialization:update",
    DELETE: "specialization:delete",
  },


  CALENDAR: {
    CREATE: "calendar:create",
    READ: "calendar:read",
    UPDATE: "calendar:update",
    STATUS: {
      PLANNED: "calendar:status.planned",
      ACTIVATE: "calendar:status.active",
      CLOSE: "calendar:status.closed",
    },
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

  COMPOSITION: {
    CREATE: "composition:create",
    READ: "composition:read",
    UPDATE: "composition:update",
    DELETE: "composition:delete",
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

  CRITERION: {
    CREATE: "criterion:create",
    READ: "criterion:read",
    UPDATE: "criterion:update",
    DELETE: "criterion:delete",
    IMPORT: "criterion:import",
  },

  OPTION: {
    CREATE: "option:create",
    READ: "option:read",
    UPDATE: "option:update",
    DELETE: "option:delete",
  },
  PROJECT: {
    CREATE: "project:create",
    READ: "project:read",
    UPDATE: "project:update",
    STATUS: {
      ACCEPT: "project:status.accepted",
      NEGOTIATE: "project:status.negotiation",
      APPROVE: "project:status.approved",
      GRANT: "project:status.granted",
      COMPLETE: "project:status.completed"
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
      REVIEW: "phase:status.reviewed",
      APPROVE: "phase:status.approved",
      ACTIVATE: "phase:status.active",
      COMPLETE: "phase:status.completed"
    },
    DELETE: "phase:delete",
  },
  PHASE_DOCUMENT: {
    CREATE: "phase:document:create",
    READ: "phase:document:read",
    UPDATE: "phase:document:update",
    DELETE: "phase:document:delete",
  },
  PROJECT_THEME: {
    CREATE: "project_theme:create",
    READ: "project_theme:read",
    UPDATE: "project_theme:update",
    DELETE: "project_theme:delete",
  },
  DOCUMENT: {
    CREATE: "document:create",
    READ: "document:read",
    UPDATE: "document:update",
    STATUS: {
      SUBMIT: "document:status.submitted",
      SELECT: "document:status.selected",
      ACCEPT: "document:status.accepted",
      REJECT: "document:status.rejected",
      REVIEW: "document:status.reviewed",
    },
    SUBMIT: "document:submit",
    DELETE: "document:delete",
    UPDATE_STATUS: "document:update_status",
  },
  REVIEWER: {
    CREATE: "reviewer:create",
    READ: "reviewer:read",
    UPDATE: "reviewer:update",
    STATUS: {
      PEND: "reviewer:status.pending",
      SUBMIT: "reviewer:status.submitted",
      ACCEPT: "reviewer:status.accepted",
      APPROVE: "reviewer:status.approved"
    },
    DELETE: "reviewer:delete",
  },

  THEMATIC: {
    CREATE: "thematic:create",
    READ: "thematic:read",
    UPDATE: "thematic:update",
    DELETE: "thematic:delete",
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
  },
  REPORT: {
    OVERVIEW: "report:overview",
  }
} as const;


export type PermissionAction = "CREATE" | "READ" | "UPDATE" | "DELETE";