import { CreateSpecializationDTO, UpdateSpecializationDTO } from "./specialization.dto";
import { ISpecializationRepository, SpecializationRepository } from "./specialization.repository";

export class SpecializationService {

    private repository: ISpecializationRepository;

    constructor(repository?: ISpecializationRepository) {
        this.repository = repository || new SpecializationRepository();
    }

    async create(dto: CreateSpecializationDTO) {
        return await this.repository.create(dto);
    }

    async getAll() {
        const specializations = await this.repository.findAll();
        return specializations;
    }

    async update(dto: UpdateSpecializationDTO) {
        const { id, data } = dto;

        const updated = await this.repository.update(id, data);
        if (!updated) throw new Error("Specialization not found.");

        return updated;
    }

    async delete(id: string) {
        return await this.repository.delete(id);
    }
}
