import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { isValidRange, matchRange } from "../../../common/types/range";
import { CreateRequirementDTO, UpdateRequirementDTO } from "./requirement.dto";
import { AggregationMode } from "./requirement.model";
import { RequirementRepository } from "./requirement.repository";


export class RequirementService {

    constructor(private readonly requirementRepository: RequirementRepository) { }


    async create(data: CreateRequirementDTO) {

      
        /*
        if (!isValidRange(data.threshold)) {
            throw new AppError(
                ERROR_CODES.INVALID_INPUT,
                'Threshold range is invalid.'
            );
        }*/

        if (data.mode === AggregationMode.RATIO) {
            if (!matchRange(data.threshold, 1.1)) {
                /*
                throw new AppError(
                    ERROR_CODES.INVALID_INPUT,
                    'Threshold range must be b/n 0 and 1 for aggrigation mode.'
                );*/
            }
        }

        return this.requirementRepository.create(data);

    }



    async findAll() {
        return this.requirementRepository.findAll();

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
