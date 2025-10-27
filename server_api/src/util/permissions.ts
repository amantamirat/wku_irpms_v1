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
  CALENDAR: {
    CREATE: "calendar:create",
    READ: "calendar:read",
    UPDATE: "calendar:update",
    DELETE: "calendar:delete",
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
} as const;
