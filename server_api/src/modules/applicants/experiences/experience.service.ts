import { IExperienceRepository, ExperienceRepository } from "./experience.repository";
import {
    CreateExperienceDTO,
    UpdateExperienceDTO,
    GetExperiencesDTO,
    DeleteExperienceDTO
} from "./experience.dto";

export class ExperienceService {

    private repository: IExperienceRepository;

    constructor(repository?: IExperienceRepository) {
        this.repository = repository || new ExperienceRepository();
    }

    async getExperiences(options: GetExperiencesDTO) {
        if (!options.applicantId) {
            throw new Error("Applicant ID is required");
        }
        return this.repository.findByApplicant(options.applicantId);
    }

    /*
    async getExperienceById(id: string) {
        const exp = await this.repository.findById(id);
        if (!exp) throw new Error("Experience not found");
        return exp;
    }
    */

    async createExperience(dto: CreateExperienceDTO) {
        return this.repository.create(dto);
    }

    async updateExperience(dto: UpdateExperienceDTO) {
        const { id, data } = dto;

        const existing = await this.repository.findById(id);
        if (!existing) throw new Error("Experience not found");

        return this.repository.update(id, data);
    }

    async deleteExperience(dto: DeleteExperienceDTO) {
        const existing = await this.repository.findById(dto.id);
        if (!existing) throw new Error("Experience not found");

        await this.repository.delete(dto.id);
        return { message: "Experience deleted successfully" };
    }
}
