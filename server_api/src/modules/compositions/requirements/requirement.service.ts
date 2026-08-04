import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { CreateRequirementDTO, UpdateRequirementDTO } from "./requirement.dto";
import { RequirementRepository } from "./requirement.repository";


export class RequirementService {

    constructor(private readonly requirementRepository: RequirementRepository) { }


    async create(data: CreateRequirementDTO) {

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
