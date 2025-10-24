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
  POSITION: {
    CREATE: "position:create",
    READ: "position:read",
    UPDATE: "position:update",
    DELETE: "position:delete",
  },
} as const;
