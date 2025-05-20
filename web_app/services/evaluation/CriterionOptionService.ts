import { CriterionOption } from "@/models/evaluation/criterionOption";
import { MyService } from "../MyService";
import { ResponseType, Weight } from "@/models/evaluation/weight";

const end_point = '/criterionOptions/';

export const CriterionOptionService = {

    async getCriterionOptions(): Promise<CriterionOption[]> {
        const data = await MyService.get(end_point);
        return data as CriterionOption[];
    },

    async getCriterionOptionsByWeight(weight: Weight): Promise<CriterionOption[]> {
        if (!weight._id) {
            throw new Error("_id required.");
        }
        if (weight.response_type !== ResponseType.Closed) {
            throw new Error("Response Type is not Closed.");
        }
        const data = await MyService.get(`${end_point}weight/${weight._id}`);
        return data as CriterionOption[];
    },

    async createCriterionOption(criterionOption: Partial<CriterionOption>): Promise<CriterionOption> {
        const createdData = await MyService.post(end_point, criterionOption);
        return createdData as CriterionOption;
    },

    async updateCriterionOption(criterionOption: Partial<CriterionOption>): Promise<CriterionOption> {
        if (!criterionOption._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}${criterionOption._id}`;
        const updatedCriterionOption = await MyService.put(url, criterionOption);
        return updatedCriterionOption as CriterionOption;
    },

    async deleteCriterionOption(criterionOption: Partial<CriterionOption>): Promise<boolean> {
        if (!criterionOption._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}${criterionOption._id}`;
        const response = await MyService.delete(url);
        return response;
    },
};
