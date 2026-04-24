// Simple Position type
export type Position = {
    _id?: string;
    name: string;
    createdAt?: Date;
    updatedAt?: Date;
};

/* =========================
   Validation
========================= */

export const validatePosition = (
    pos: Position
): { valid: boolean; message?: string } => {

    if (!pos.name || pos.name.trim().length === 0) {
        return { valid: false, message: "Name is required." };
    }

    return { valid: true };
};

/* =========================
   Sanitize
========================= */

export const sanitizePosition = (pos: Partial<Position>): Position => {
    return {
        ...pos,
        name: pos.name?.trim() || ""
    } as Position;
};

/* =========================
   Empty Factory
========================= */

export const createEmptyPosition = (): Position => ({
    name: ""
});

/* =========================
   Query Options
========================= */

export interface GetPositionOptions {
    search?: string;
}