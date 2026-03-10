import { SYSTEM } from "../../../common/constants/system.constant";
import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { DeleteDto } from "../../../common/dtos/delete.dto";
import { TransitionRequestDto } from "../../../common/dtos/transition.dto";
import { IProjectRepository, ProjectRepository } from "../project.repository";
import { ProjectStatus } from "../project.status";
import { PhaseSynchronizer, ProjectSynchronizer } from "../project.synchronizer";
import { CreatePhaseDto, GetPhasesOptions, UpdatePhaseDto, UpdatePhaseStatusDto } from "./phase.dto";
import { IPhaseRepository, PhaseRepository } from "./phase.repository";
import { PhaseStateMachine } from "./phase.state-machine";
import { PhaseStatus } from "./phase.status";

export class PhaseService {

    private readonly projectSynchronizer: ProjectSynchronizer;
    constructor(
        private readonly repository: IPhaseRepository = new PhaseRepository(),
        private readonly projectRepository: IProjectRepository = new ProjectRepository()
    ) {
        this.projectSynchronizer = new PhaseSynchronizer(projectRepository, repository);
    }

    async validate(project: string, applicantId: string) {

        const projectDoc = await this.projectRepository.findById(project);
        if (!projectDoc) throw new Error(ERROR_CODES.PROJECT_NOT_FOUND);

        if (String(projectDoc.applicant) !== applicantId && SYSTEM.SU_USER !== applicantId)
            throw new AppError(ERROR_CODES.USER_NOT_LEAD_PI);

        if (projectDoc.status !== ProjectStatus.pending &&
            projectDoc.status !== ProjectStatus.negotiation) {
            throw new AppError(ERROR_CODES.INVALID_PROJECT_STATUS);
        }
    }

    async create(dto: CreatePhaseDto) {
        const { project, applicantId } = dto;
        this.validate(project ?? "", applicantId ?? "");
        try {
            const created = await this.repository.create(dto);
            await this.projectSynchronizer.sync(project);
            return created;
        }
        catch (err: any) {
            if (err?.code === 11000) {
                throw new AppError(ERROR_CODES.PHASE_ALREADY_EXISTS);
            }
            throw err;
        }

    }

    async getPhases(options: GetPhasesOptions) {
        return await this.repository.find(options);
    }

    async update(dto: UpdatePhaseDto) {
        const { id, data, applicantId } = dto;

        const phaseDoc = await this.repository.findById(id);
        if (!phaseDoc) throw new AppError(ERROR_CODES.PHASE_NOT_FOUND);
        const project = String(phaseDoc.project);

        await this.validate(project, applicantId);

        if (phaseDoc.status !== PhaseStatus.proposed)
            throw new AppError(ERROR_CODES.PHASE_NOT_PROPOSED);

        const updated = await this.repository.update(id, data);
        await this.projectSynchronizer.sync(project);
        return updated;
    }

    async delete(dto: DeleteDto) {
        const { id, applicantId } = dto;

        const phaseDoc = await this.repository.findById(id);
        if (!phaseDoc) throw new Error(ERROR_CODES.PHASE_NOT_FOUND);
        const project = String(phaseDoc.project);

        await this.validate(String(phaseDoc.project), applicantId);

        if (phaseDoc.status !== PhaseStatus.proposed)
            throw new AppError(ERROR_CODES.PHASE_NOT_PROPOSED);

        const deleted = await this.repository.delete(id);
        await this.projectSynchronizer.sync(project);
        return deleted;
    }
    // ---------------------------------------------------
    // UPDATE STATUS
    // ---------------------------------------------------
    async updateStatus(dto: TransitionRequestDto) {
        const { id, current, next, applicantId } = dto;

        const phaseDoc = await this.repository.findById(id);
        if (!phaseDoc) throw new AppError(ERROR_CODES.PHASE_NOT_FOUND);
        if (current !== phaseDoc.status)
            throw new AppError(ERROR_CODES.CURRENT_STATE_MISMATCH);

        const projectDoc = await this.projectRepository.findById(String(phaseDoc.project));
        if (!projectDoc) throw new AppError(ERROR_CODES.PROJECT_NOT_FOUND);
        const projectStatus = projectDoc.status;


        // --- State Machine Validation ---
        PhaseStateMachine.validateTransition(current, next as PhaseStatus);

        if (next === PhaseStatus.reviewed) {
            if (projectStatus !== ProjectStatus.negotiation)
                throw new AppError(ERROR_CODES.PROJECT_NOT_IN_NEGOTIATION);

            if (current === PhaseStatus.proposed) {
                if (String(projectDoc.applicant) !== applicantId && SYSTEM.SU_USER !== applicantId)
                    throw new AppError(ERROR_CODES.USER_NOT_LEAD_PI);
            }
        }

        if (next === PhaseStatus.active) {
            if (projectStatus !== ProjectStatus.granted)
                throw new AppError(ERROR_CODES.PROJECT_NOT_GRANTED);
        }

        const updated = await this.repository.update(id, { status: next as PhaseStatus });
        return updated;
    }


}
