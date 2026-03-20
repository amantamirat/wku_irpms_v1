import { AcademicLevel } from "../../organizations/models/organization.model";

export type Specialization = {
    _id?: string;
    name: string;
    academicLevel?: AcademicLevel;
    createdAt?: Date;
    updatedAt?: Date;
}

export const validate = (
    spec: Specialization
): { valid: boolean; message?: string } => {

    if (!spec.name || spec.name.trim() === '') {
        return { valid: false, message: 'Name is required.' };
    }
    if (!spec.academicLevel) {
        return { valid: false, message: 'Academic level is required.' };
    }
    return { valid: true };
}