import { FormType } from "../../../../evaluations/criteria/criterion.enum";
import { Criterion } from "../../../../evaluations/criteria/criterion.model";
import { Option } from "../../../../evaluations/options/option.model";
import { Stage } from "../../stage.model";
import { Reviewer } from "../reviewer.model";
import { CreateResultDTO, GetResultsDTO, UpdateResultDTO } from "./result.dto";
import { DeleteDto } from "../../../../../util/delete.dto";
import { Result } from "./result.model";

export class ResultService {

    private static async validateResult(result: CreateResultDTO) {
        const reviewer = await Reviewer.findById(result.reviewer).populate("projectStage").lean();
        if (!reviewer) throw new Error("Reviewer not found");
        const stage = (reviewer.projectStage as any).stage;
        const stageDoc = await Stage.findById(stage).select("evaluation");
        if (!stageDoc) {
            throw new Error("Cycle stage not found.");
        }
        const criterion = await Criterion.findOne({ _id: result.criterion, evaluation: stageDoc.evaluation }).lean();
        if (!criterion) throw new Error("Criterion not found");
        if (criterion.form_type === FormType.open) {
            if (result.score === undefined || result.score === null) {
                throw new Error("Score is required");
            }
            const maxScore = criterion.weight;
            if (result.score < 0 || result.score > maxScore) {
                throw new Error(`Score must be between 0 and ${maxScore}`);
            }
        }
        if (criterion.form_type === FormType.closed) {
            if (!result.selected_option) {
                throw new Error("Selected option is required for closed form type");
            }
            const option = await Option.exists({ _id: result.selected_option, criterion: criterion._id });
            if (!option) {
                throw new Error("Selected option not found.");
            }
        }
    }

    static async createResult(data: CreateResultDTO) {
        await this.validateResult(data);
        return await Result.create(data);
    }

    static async getResults(options: GetResultsDTO) {
        const filter: any = {};
        if (options.reviewer) filter.reviewer = options.reviewer;
        return await Result.find(filter).populate("reviewer").populate("criterion").populate("selected_option").lean();
    }

    static async updateResult(dto: UpdateResultDTO) {
        const { id, data } = dto;
        const result = await Result.findById(id);
        if (!result) throw new Error("Result not found");
        Object.assign(result, data);
        return result.save();
    }

    static async deleteResult(dto: DeleteDto) {
        const { id } = dto;
        const doc = await Result.findById(id);
        if (!doc) throw new Error("Result not found");
        return await doc.deleteOne();
    }
}
