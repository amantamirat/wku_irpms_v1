//import { Scope } from "../../models/applicant.model";


export enum PositionType {
    position = "Position",
    rank = "Rank",
}

export type Position = {
    _id?: string;
    name: string;
    type: PositionType;
    category?: string ; // for position only
    parent?: string | Position; // for rank only
    createdAt?: Date;
    updatedAt?: Date;
};

 const posTypeOptions = Object.values(PositionType).map(t => ({ label: t, value: t }));


export const validatePosition = (pos: Position): { valid: boolean; message?: string } => {
    if (!pos.type) {
        return { valid: false, message: "Type is required." };
    }
    if (!pos.name || pos.name.trim().length === 0) {
        return { valid: false, message: "Name is required." };
    }

    if (pos.type === PositionType.position && !pos.category) {
        return { valid: false, message: "Category is required for Position." };
    }

    if (pos.type === PositionType.rank && !pos.parent) {
        return { valid: false, message: "Parent Position is required for Rank." };
    }

    return { valid: true };
};

export const sanitizePosition = (pos: Partial<Position>): Position => {
    return {
        ...pos,
        parent:
            typeof pos.parent === "object" && pos.parent !== null
                ? (pos.parent as Position)._id
                : pos.parent,
    } as Position;
};
