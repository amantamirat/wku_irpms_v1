import { CacheService } from "../../util/cache/cache.service";
import { DeleteDto } from "../../util/delete.dto";
import { GrantRepository, IGrantRepository } from "../grants/grant.repository";
import { Unit } from "../organization/organization.enum";
import { Directorate } from "../organization/organization.model";
import { IOrganizationRepository, OrganizationRepository } from "../organization/organization.repository";
import { CreateCallDTO, GetCallsOptions, UpdateCallDTO } from "./call.dto";
import { CallRepository, ICallRepository } from "./call.repository";

export class CallService {

    private repository: ICallRepository;
    private organizationRepo: IOrganizationRepository;
    private grantRepo: IGrantRepository;

    constructor(repository?: ICallRepository) {
        this.repository = repository || new CallRepository();
        this.organizationRepo = new OrganizationRepository();
        this.grantRepo = new GrantRepository();
    }

    async create(dto: CreateCallDTO) {
        //await CacheService.validateOwnership(dto.userId, dto.directorate);
        const directorateDoc = await this.organizationRepo.findById(dto.directorate);
        if (!directorateDoc || directorateDoc.type !== Unit.Directorate) {
            throw new Error("Directorate Not Found!");
        }
        const createdCall = await this.repository.create(dto);
        return createdCall;
    }

    async getCalls(options: GetCallsOptions) {
        return await this.repository.find(options);
    }


    async update(dto: UpdateCallDTO) {
        const { id, data, userId } = dto;
        const evalDoc = await this.repository.findById(id);
        if (!evalDoc) throw new Error("Call not found");

        await CacheService.validateOwnership(userId, evalDoc.directorate);

        return await this.repository.update(id, data);
    }

    async delete(dto: DeleteDto) {
        const { id, userId } = dto;
        const evalDoc = await this.repository.findById(id);
        if (!evalDoc) throw new Error("Call not found");

        await CacheService.validateOwnership(userId, evalDoc.directorate);

        return await this.repository.delete(id);
    }
}
