import { DeleteDto } from "../../util/delete.dto";
import { CalendarStatus } from "../calendar/calendar.enum";
import { CalendarRepository, ICalendarRepository } from "../calendar/calendar.repository";
import { IOrganizationRepository, OrganizationRepository } from "../organization/organization.repository";
import { IThematicRepository, ThematicRepository } from "../thematics/thematic.repository";
import { GrantRepository, IGrantRepository } from "../grants/grant.repository";
import { IStageRepository, StageRepository } from "./stages/stage.repository";
import { Unit } from "../organization/organization.enum";
import { CreateCallDTO, GetCallsOptions, UpdateCallDTO } from "./call.dto";
import { CallStatus } from "./call.status";
import { CallRepository, ICallRepository } from "./call.repository";
import { CallStateMachine } from "./call.state-machine";

export class CallService {

    private repository: ICallRepository;
    private calendarRepo: ICalendarRepository;
    private organizationRepo: IOrganizationRepository;
    private grantRepo: IGrantRepository;
    private thematicsRepo: IThematicRepository;
    private stageRepository: IStageRepository;

    constructor(repository?: ICallRepository, calendarRepo?: ICalendarRepository,
        thematicsRepo?: IThematicRepository
    ) {
        this.repository = repository || new CallRepository();
        this.organizationRepo = new OrganizationRepository();
        this.calendarRepo = calendarRepo || new CalendarRepository();
        this.thematicsRepo = thematicsRepo || new ThematicRepository();
        this.grantRepo = new GrantRepository();
        this.stageRepository = new StageRepository();
    }

    async create(dto: CreateCallDTO) {
        const calendarDoc = await this.calendarRepo.findById(dto.calendar);
        if (!calendarDoc || calendarDoc.status !== CalendarStatus.active) {
            throw new Error("Calendar Not Found!");
        }
        const directorateDoc = await this.organizationRepo.findById(dto.directorate);
        if (!directorateDoc || directorateDoc.type !== Unit.Directorate) {
            throw new Error("Directorate Not Found!");
        }
        const grantDoc = await this.grantRepo.findById(dto.grant);
        if (!grantDoc) {
            throw new Error("Grant Not Found!");
        }
        if (dto.thematic) {
            const thematicsDoc = await this.thematicsRepo.findById(dto.thematic);
            if (!thematicsDoc) {
                throw new Error("Thematics Not Found!");
            }
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
        return await this.repository.update(id, data);
    }

    async updateStatus(dto: UpdateCallDTO) {
        const { id, data } = dto;
        const nextState = data.status;
        if (!nextState) throw new Error("Status not found");
        const callDoc = await this.repository.findById(id);
        if (!callDoc) throw new Error("Call not found");
        const current = callDoc.status;
        // --- State Machine Validation ---
        CallStateMachine.validateTransition(current, nextState);
        if (nextState === CallStatus.planned) {
            const stages = await this.stageRepository.find({ call: id }, false);
            if (stages.length > 0) {
                throw new Error("Can not change the call to planned, stages already exist!");
            }
        }
        const updated = await this.repository.update(dto.id, { status: nextState });
        return updated;
    }

    async delete(dto: DeleteDto) {
        const { id, userId } = dto;
        const callDoc = await this.repository.findById(id);
        if (!callDoc) throw new Error("Call not found");
        if (callDoc.status !== CallStatus.planned) {
            throw new Error("Only planned calls can be deleted.");
        }
        return await this.repository.delete(id);
    }
}
