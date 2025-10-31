import { FormType } from "../criteria/criterion.enum";
import { Criterion } from "../criteria/criterion.model";
import {
    CreateOptionDTO,
    DeleteOptionDTO,
    GetOptionsDTO,
    UpdateOptionDTO,
} from "./option.dto";
import { Option } from "./option.model";

export class OptionService {
    /**
     * Create a new option under a criterion.
     */
    static async createOption(dto: CreateOptionDTO) {
        const { criterion, title, value } = dto;

        const criterionDoc = await Criterion.findById(criterion);
        if (!criterionDoc) throw new Error("Criterion not found.");
        if (criterionDoc.form_type!==FormType.closed) throw new Error("Criterion must be closed.");

        if (value > criterionDoc.weight) {
            throw new Error(
                `Option weight (${value}) exceeds its criterion limit (${criterionDoc.weight}).`
            );
        }

        return await Option.create(dto);
    }

    /**
     * Get all options under a given criterion.
     */
    static async getOptions(dto: GetOptionsDTO) {
        const { criterion } = dto;
        return await Option.find({ criterion: criterion })
            .sort({ value: -1 })
            .lean();
    }

    /**
     * Update an existing option.
     */
    static async updateOption(dto: UpdateOptionDTO) {
        const { id, updates } = dto;

        const option = await Option.findById(id).populate("criterion");
        if (!option) throw new Error("Option not found.");

        if (updates.value !== undefined) {
            const criterion: any = option.criterion;
            if (updates.value > criterion.weight) {
                throw new Error(
                    `Option weight (${updates.value}) exceeds its criterion limit (${criterion.weight}).`
                );
            }
        }

        Object.assign(option, updates);
        return option.save();
    }

    /**
     * Delete an option by ID.
     */
    static async deleteOption(dto: DeleteOptionDTO) {
        const { id } = dto;
        return await Option.findByIdAndDelete(id);
    }
}
