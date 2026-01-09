import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";
import { DeleteDto } from "../../util/delete.dto";
import { ICalendarReadRepository } from "../calendar/calendar.repository";
import { CalendarStatus } from "../calendar/calendar.status";
import { GrantRepository, IGrantRepository } from "../grants/grant.repository";
import { IOrganizationRepository, OrganizationRepository } from "../organization/organization.repository";
import { Unit } from "../organization/organization.type";
import { IThematicRepository, ThematicRepository } from "../thematics/thematic.repository";
import { CreateCallDTO, GetCallsOptions, UpdateCallDTO } from "./call.dto";
import { CallRepository } from "./call.repository";
import { CallStateMachine } from "./call.state-machine";
import { CallStatus } from "./call.status";
import { IStageRepository, StageRepository } from "./stages/stage.repository";

export class CallService {

    private organizationRepo: IOrganizationRepository;
    private grantRepo: IGrantRepository;
    private thematicsRepo: IThematicRepository;
    private stageRepository: IStageRepository;

    constructor(private readonly repository: CallRepository,
        private readonly calendarRepository: ICalendarReadRepository,
        thematicsRepo?: IThematicRepository
    ) {
        this.repository = repository;
        this.calendarRepository = calendarRepository;
        
        this.organizationRepo = new OrganizationRepository();

        this.thematicsRepo = thematicsRepo || new ThematicRepository();
        this.grantRepo = new GrantRepository();
        this.stageRepository = new StageRepository();
    }

    async create(dto: CreateCallDTO) {
        const calendarDoc = await this.calendarRepository.findById(dto.calendar);
        if (!calendarDoc) throw new AppError(ERROR_CODES.CALENDAR_NOT_FOUND);
        if (calendarDoc.status !== CalendarStatus.active) throw new AppError(ERROR_CODES.CALENDAR_NOT_ACTIVE);



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
        const created = await this.repository.create(dto);
        return created;
    }

    async getCalls(options: GetCallsOptions) {
        return await this.repository.find({ ...options, populate: true });
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
        const { id, applicantId: userId } = dto;
        const callDoc = await this.repository.findById(id);
        if (!callDoc) throw new Error("Call not found");
        if (callDoc.status !== CallStatus.planned) {
            throw new Error("Only planned calls can be deleted.");
        }
        return await this.repository.delete(id);
    }
}
