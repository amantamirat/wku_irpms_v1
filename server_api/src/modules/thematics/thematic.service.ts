import { DeleteDto } from "../../util/delete.dto";
import { Unit } from "../organization/organization.enum";
import { IOrganizationRepository, OrganizationRepository } from "../organization/organization.repository";
import { CreateThematicDTO, GetThematicsDTO, UpdateThematicDTO } from "./thematic.dto";
import { IThematicRepository, ThematicRepository } from "./thematic.repository";

export class ThematicService {

    private repository: IThematicRepository;
    private organizationRepo: IOrganizationRepository;

    constructor(repository?: IThematicRepository) {
        this.repository = repository || new ThematicRepository();
        this.organizationRepo = new OrganizationRepository();
    }

    async create(dto: CreateThematicDTO) {
        const directorateDoc = await this.organizationRepo.findById(dto.directorate);
        if (!directorateDoc || directorateDoc.type !== Unit.Directorate) {
            throw new Error("Directorate Not Found!");
        }
        const createdThematic = await this.repository.create(dto);
        return createdThematic;
    }

    async getThematics(options: GetThematicsDTO) {
        return await this.repository.find(options);
    }

    async update(dto: UpdateThematicDTO) {
        const { id, data, userId } = dto;
        return this.repository.update(id, data);
    }

    async delete(dto: DeleteDto) {
        const { id, userId } = dto;
        return await this.repository.delete(id);
    }
}
