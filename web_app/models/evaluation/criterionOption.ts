import { Weight } from "./weight";

export type CriterionOption = {
    weight: string | Weight;
    label: string;
    value: number;
    createdAt?: Date;
    updatedAt?: Date;
}
