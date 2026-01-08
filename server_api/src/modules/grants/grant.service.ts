import { CacheService } from "../../util/cache/cache.service";
import { DeleteDto } from "../../util/delete.dto";
import { Directorate } from "../organization/organization.model";
import { CreateGrantDTO, GetGrantsDTO, UpdateGrantDTO } from "./grant.dto";
import { GrantRepository, IGrantRepository } from "./grant.repository";

export class GrantService {

    private repository: IGrantRepository;

    constructor(repository?: IGrantRepository) {
        this.repository = repository || new GrantRepository();
    }

    async createGrant(dto: CreateGrantDTO) {
       // await CacheService.validateOwnership(dto.userId, dto.directorateId);
        const directorateDoc = await Directorate.findById(dto.directorateId).lean();
        if (!directorateDoc) {
            throw new Error("Directorate Not Found!");
        }
        const createdGrant = await this.repository.create(dto);
        return createdGrant;
    }

    async getGrants(options: GetGrantsDTO) {
        return await this.repository.find(options);
    }

    /*

    static async getUserGrants(userId: string) {
        const organizations = await CacheService.getUserOrganizations(userId);
        return await Grant.find({ directorate: { $in: organizations } }).populate('directorate').lean();
    }
        */


    async updateGrant(dto: UpdateGrantDTO) {
        const { id, data, userId } = dto;
        const grantDoc = await this.repository.findById(id);
        if (!grantDoc) throw new Error("Grant not found");
        //await CacheService.validateOwnership(userId, grantDoc.directorate);
        return this.repository.update(id, data);
    }

    async deleteGrant(dto: DeleteDto) {
        const { id, applicantId: userId } = dto;
        const grantDoc = await this.repository.findById(id);
        if (!grantDoc) throw new Error("Grant not found");
        //await CacheService.validateOwnership(userId, grantDoc.directorate);
        return await this.repository.delete(id);
    }
}
