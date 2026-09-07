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
   Empty Factory
========================= */

export const createEmptyPosition = (): Position => ({
    name: ""
});

/* =========================
   Query Options
========================= */

export interface FilterPositionOptions {
    name?: string;
}