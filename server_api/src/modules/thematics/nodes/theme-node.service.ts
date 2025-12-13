import { DeleteDto } from "../../../util/delete.dto";
import { CreateNodeDTO, GetNodeDTO, UpdateNodeDTO } from "./theme-node.dto";
import { IThemeNodeRepository, ThemeNodeRepository } from "./theme-node.repository";

export class NodeService {
    
    private repository: IThemeNodeRepository;

    constructor(repository?: IThemeNodeRepository) {
        this.repository = repository || new ThemeNodeRepository();
    }

    async create(dto: CreateNodeDTO) {
        const { parent } = dto;
        if (parent) {
            const themeNodeDoc = await this.repository.findById(parent);
            if (!themeNodeDoc) {
                throw new Error("Parent node not found");
            }
            dto.isRoot = false;
        }
        else {
            dto.isRoot = true;
        }
        return await this.repository.create(dto);
    }

    async getNodes(filters: GetNodeDTO) {
        return await this.repository.find(filters);
    }

    async update(dto: UpdateNodeDTO) {
        const { id, data } = dto;

        const nodeDoc = await this.repository.update(id, data);
        if (!nodeDoc) throw new Error("Node not found");

        return nodeDoc;
    }

    async delete(dto: DeleteDto) {
        const { id } = dto;
        const children = await this.repository.find({ parent: id });
        if (children.length > 0) {
            throw new Error("Cannot delete node with children. Delete children first.");
        }
        return await this.repository.delete(id);
    }
}
