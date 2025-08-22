import { Organization } from "@/models/organization";
import { Theme } from "../../themes/models/theme.model";
import { Evaluation } from "../../evals/models/eval.model";

export type Grant = {
    _id?: string;
    directorate: string | Organization;
    title: string;
    description?: string;
    theme: string | Theme;
    evaluation: string | Evaluation;
    createdAt?: Date;
    updatedAt?: Date;
}