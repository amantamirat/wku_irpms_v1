import { PriorityArea } from "./priorityArea";

export type SubArea = {
    _id?: string;
    priorityArea: string | PriorityArea;
    title: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export const validateSubArea = (subArea: SubArea): { valid: boolean; message?: string } => {

    if (!subArea.priorityArea) {
        return { valid: false, message: 'Sub Area is required.' };
    }

    if (!subArea.title || subArea.title.trim().length === 0) {
        return { valid: false, message: 'Title is required.' };
    }
    return { valid: true };
};