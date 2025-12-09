export const PERMISSIONS = {
  USER: {
    CREATE: "user:create",
    READ: "user:read",
    UPDATE: "user:update",
    DELETE: "user:delete",
    //RESET: "user:reset",
  },
  ROLE: {
    CREATE: "role:create",
    READ: "role:read",
    UPDATE: "role:update",
    DELETE: "role:delete",
  },
  PERMISSION: {
    READ: "permission:read",
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
  APPLICANT: {
    CREATE: "applicant:create",
    READ: "applicant:read",
    UPDATE: "applicant:update",
    DELETE: "applicant:delete",
    UPDATE_ROLES: "applicant:update_roles"
  },
  EXPERIENCE: {
    CREATE: "experience:create",
    READ: "experience:read",
    UPDATE: "experience:update",
    DELETE: "experience:delete",
  },
  CALENDAR: {
    CREATE: "calendar:create",
    READ: "calendar:read",
    UPDATE: "calendar:update",
    DELETE: "calendar:delete",
  },
  SPECIALIZATION: {
    CREATE: "specialization:create",
    READ: "specialization:read",
    UPDATE: "specialization:update",
    DELETE: "specialization:delete",
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
    DELETE: "call:delete",
  },
  CYCLE: {
    CALL: {
      CREATE: "cycle:call:create",
      READ: "cycle:call:read",
      UPDATE: "cycle:call:update",
      DELETE: "cycle:call:delete",
    },
    PROGRAM: {
      CREATE: "cycle:program:create",
      READ: "cycle:program:read",
      UPDATE: "cycle:program:update",
      DELETE: "cycle:program:delete",
    },
  },
  EVALUATION: {
    CREATE: "evaluation:create",
    READ: "evaluation:read",
    UPDATE: "evaluation:update",
    DELETE: "evaluation:delete",
  },
  THEME: {
    CREATE: "theme:create",
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
  PROJECT: {
    CREATE: "project:create",
    READ: "project:read",
    UPDATE: "project:update",
    DELETE: "project:delete",
  },
  COLLABORATOR: {
    CREATE: "collaborator:create",
    READ: "collaborator:read",
    UPDATE: "collaborator:update",
    CHANGE_STATUS: "collaborator:change_status", // New permission for status transitions
    DELETE: "collaborator:delete",
  },
  PHASE: {
    CREATE: "phase:create",
    READ: "phase:read",
    UPDATE: "phase:update",
    DELETE: "phase:delete",
  },
  REVIEWER: {
    CREATE: "reviewer:create",
    READ: "reviewer:read",
    UPDATE: "reviewer:update",
    APPROVE: "reviewer:approve",
    DELETE: "reviewer:delete",
  },
  RESULT: {
    CREATE: "result:create",
    READ: "result:read",
    UPDATE: "result:update",
    DELETE: "result:delete",
  }
} as const;
