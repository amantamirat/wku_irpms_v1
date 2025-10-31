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
        const { criterionId, title, value } = dto;

        const criterion = await Criterion.findById(criterionId);
        if (!criterion) throw new Error("Criterion not found.");

        if (value > criterion.weight) {
            throw new Error(
                `Option weight (${value}) exceeds its criterion limit (${criterion.weight}).`
            );
        }

        return await Option.create(dto);
    }

    /**
     * Get all options under a given criterion.
     */
    static async getOptions(dto: GetOptionsDTO) {
        const { criterionId } = dto;
        return await Option.find({ criterion: criterionId })
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
