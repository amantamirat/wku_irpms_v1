export const PERMISSIONS = {
  USER: {
    CREATE: "user:create",
    READ: "user:read",
    UPDATE: "user:update",
    DELETE: "user:delete",
    RESET: "user:reset",
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
  CALENDAR: {
    CREATE: "calendar:create",
    READ: "calendar:read",
    UPDATE: "calendar:update",
    DELETE: "calendar:delete",
  },
  ORGANIAZTION: {
    CREATE: "organization:create",
    READ: "organization:read",
    UPDATE: "organization:update",
    DELETE: "organization:delete",
  },
  APPLICANT: {
    CREATE: "applicant:create",
    READ: "applicant:read",
    UPDATE: "applicant:update",
    DELETE: "applicant:delete",
  },

  GRANT: {
    CREATE: "grant:create",
    READ: "grant:read",
    UPDATE: "grant:update",
    DELETE: "grant:delete",
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
  REVIEWER: {
    CREATE: "reviewer:create",
    READ: "reviewer:read",
    UPDATE: "reviewer:update",
    APPROVE: "reviewer:approve",
    DELETE: "reviewer:delete",
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
  RESULT: {
    CREATE: "result:create",
    READ: "result:read",
    UPDATE: "result:update",
    DELETE: "result:delete",
  }
} as const;


export type PermissionAction = "CREATE" | "READ" | "UPDATE" | "DELETE";