import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { isValid } from "../../../common/types/range";
import { CreateRequirementDTO, UpdateRequirementDTO } from "./requirement.dto";
import { AggregationMode } from "./requirement.model";
import { RequirementRepository } from "./requirement.repository";


export class RequirementService {

    constructor(private readonly requirementRepository: RequirementRepository) { }


    async create(data: CreateRequirementDTO) {


        if (!isValid(data.threshold)) {
            throw new AppError(
                ERROR_CODES.INVALID_INPUT,
                'Threshold range is invalid.'
            );
        }

        if (data.mode === AggregationMode.RATIO) {
            const { min, max } = data.threshold;

            if (
                min < 0 ||
                max > 1 ||
                min > max
            ) {
                throw new AppError(
                    ERROR_CODES.INVALID_INPUT,
                    'Threshold range must be between 0 and 1 for aggregation mode RATIO.'
                );
            }
        }

        return this.requirementRepository.create(data);

    }



    async findAll() {
        return this.requirementRepository.findAll({ populate: true });

    }



    async getById(id: string) {

        const requirement =
            await this.requirementRepository.findById(id);


        if (!requirement) {
            throw new AppError(
                ERROR_CODES.REQUIRMENT_NOT_FOUND
            );
        }


        return requirement;

    }


    async update(dto: UpdateRequirementDTO) {

        const { id, data } = dto;
        const requirement =
            await this.requirementRepository.findById(id);

        if (!requirement) {
            throw new AppError(
                ERROR_CODES.REQUIRMENT_NOT_FOUND
            );
        }

        const updatedRequirement = await this.requirementRepository.update(
            id, data);

        return updatedRequirement;

    }



    async delete(id: string) {

        const requirement =
            await this.requirementRepository.delete(id);


        if (!requirement) {
            throw new AppError(
                ERROR_CODES.REQUIRMENT_NOT_FOUND
            );
        }


        return requirement;

    }

}
