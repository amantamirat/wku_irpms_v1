import { CacheService } from "../../util/cache/cache.service";
import { DeleteDto } from "../../util/delete.dto";
import { GrantRepository, IGrantRepository } from "../grants/grant.repository";
import { Unit } from "../organization/organization.enum";
import { Directorate } from "../organization/organization.model";
import { IOrganizationRepository, OrganizationRepository } from "../organization/organization.repository";
import { CreateCallDTO, GetCallsOptions, UpdateCallDTO } from "./call.dto";
import { CallStatus } from "./call.enum";
import { CallRepository, ICallRepository } from "./call.repository";
import { CallStateMachine } from "./call.state-machine";
import { IStageRepository, StageRepository } from "./stages/stage.repository";

export class CallService {

    private repository: ICallRepository;
    private organizationRepo: IOrganizationRepository;
    private grantRepo: IGrantRepository;

    private stageRepository: IStageRepository;

    constructor(repository?: ICallRepository) {
        this.repository = repository || new CallRepository();
        this.organizationRepo = new OrganizationRepository();
        this.grantRepo = new GrantRepository();
        this.stageRepository = new StageRepository();
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
        const callDoc = await this.repository.findById(id);
        if (!callDoc) throw new Error("Call not found");
        //await CacheService.validateOwnership(userId, evalDoc.directorate);
        return await this.repository.update(id, data);
    }

    async changeStatus(dto: UpdateCallDTO) {
        const { id, data, userId } = dto;
        const nextState = data.status;
        if (!nextState) throw new Error("Status not found");
        const callDoc = await this.repository.findById(id);
        if (!callDoc) throw new Error("Call not found");
        const current = callDoc.status;
        // --- State Machine Validation ---
        CallStateMachine.validateTransition(current, nextState);
        if (nextState === CallStatus.planned || nextState === CallStatus.closed) {
            const stages = await this.stageRepository.find({ call: id }, false);
            if (nextState === CallStatus.planned && stages.length > 0) {
                throw new Error("Can not change the call to planned, stages already exist!");
            }
            if (nextState === CallStatus.closed) {
                //all must be closed the stages.
            }
        }
        const updated = await this.repository.update(dto.id, { status: nextState });
        return updated;
    }

    async delete(dto: DeleteDto) {
        const { id, userId } = dto;
        const callDoc = await this.repository.findById(id);
        if (!callDoc) throw new Error("Call not found");
        if (callDoc.status! = CallStatus.planned) {
            throw new Error("Only planned calls can be deleted.");
        }
        //await CacheService.validateOwnership(userId, callDoc.directorate);       
        return await this.repository.delete(id);
    }
}
