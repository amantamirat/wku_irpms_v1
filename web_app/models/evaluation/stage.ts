import { Evaluation } from "./evaluation";

export type Stage = {
    _id?: string;
    evaluation: string | Evaluation;
    title: string;
    level: number;
    total_weight?: number;
    createdAt?: Date;
    updatedAt?: Date;
}

export const validateStage = (stage: Stage): { valid: boolean; message?: string } => {

    if (!stage.evaluation) {
        return { valid: false, message: 'Evaluation is required.' };
    }

    if (!stage.title || stage.title.trim().length === 0) {
        return { valid: false, message: 'Title is required.' };
    }

    if (stage.level == null || stage.level <= 0) {
        return { valid: false, message: 'Level must be greater than 0 and not null.' };
    }
    return { valid: true };
};