// collaborator.service.ts
import { SYSTEM } from "../../../common/constants/system.constant";
import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { DeleteDto } from "../../../util/delete.dto";
import { IApplicantRepository } from "../../applicants/applicant.repository";
import { IProjectRepository } from "../project.repository";
import { ProjectStatus } from "../project.status";
import {
    CreateCollaboratorDto,
    GetCollaboratorsOptions,
    UpdateCollabStatusDTO,
} from "./collaborator.dto";
import { ICollaboratorRepository } from "./collaborator.repository";
import { CollaboratorStateMachine } from "./collaborator.state-machine";
import { CollaboratorStatus } from "./collaborator.status";


export class CollaboratorService {

    constructor(
        private readonly repository: ICollaboratorRepository,
        private readonly projectRepository: IProjectRepository,
        private readonly appRepository: IApplicantRepository) {
        this.repository = repository;
        this.projectRepository = projectRepository;
        this.appRepository = appRepository;
    }

    async create(dto: CreateCollaboratorDto) {
        const { applicant, project, applicantId } = dto;

        const projectDoc = await this.projectRepository.findById(project);
        if (!projectDoc) throw new Error(ERROR_CODES.PROJECT_NOT_FOUND);

        if (String(projectDoc.leadPI) !== applicantId && SYSTEM.SU_USER !== applicantId)
            throw new AppError(ERROR_CODES.USER_NOT_LEAD_PI);

        if (projectDoc.status !== ProjectStatus.pending &&
            projectDoc.status !== ProjectStatus.negotiation) {
            throw new AppError(ERROR_CODES.INVALID_PROJECT_STATUS);
        }

        const appDoc = await this.appRepository.findById(applicant);
        if (!appDoc) throw new Error(ERROR_CODES.APPLICANT_NOT_FOUND);

        try {
            return await this.repository.create(dto);
        } catch (err: any) {
            if (err?.code === 11000) {
                throw new AppError(ERROR_CODES.COLLABORATOR_ALREADY_EXISTS);
            }
            throw err;
        }
    }

    async get(options: GetCollaboratorsOptions) {
        const collaborators = await this.repository.find(options);
        return collaborators;
    }

    /*
    async updateCollaborator(dto: UpdateCollaboratorDto) {
        const updated = await this.repository.update(dto.id, dto.data);
        return updated;
    }
    */

    async updateStatus(dto: UpdateCollabStatusDTO) {
        const { id, status, applicantId } = dto;
        const nextStatus = status;

        const collabDoc = await this.repository.findById(id);
        if (!collabDoc) throw new AppError(ERROR_CODES.COLLABORATOR_NOT_FOUND);
        if (String(collabDoc.applicant) !== applicantId) throw new AppError(ERROR_CODES.USER_NOT_COLLABORATOR);

        const current = collabDoc.status;
        // --- State Machine Validation ---
        CollaboratorStateMachine.validateTransition(current, nextStatus);
        if (nextStatus === CollaboratorStatus.pending) {

            const projectDoc = await this.projectRepository.findById(String(collabDoc.project));
            if (!projectDoc) throw new Error(ERROR_CODES.PROJECT_NOT_FOUND);
            const projectStatus = projectDoc.status;

            if (projectStatus !== ProjectStatus.pending &&
                projectStatus !== ProjectStatus.submitted &&
                projectStatus !== ProjectStatus.accepted &&
                projectStatus !== ProjectStatus.negotiation
            ) {
                throw new AppError(ERROR_CODES.INVALID_PROJECT_STATUS);
            }
        }
        const updated = await this.repository.update(dto.id, { status: nextStatus });
        return updated;
    }

    async delete(dto: DeleteDto) {
        const { id, applicantId } = dto;

        const collaboratorDoc = await this.repository.findById(id);
        if (!collaboratorDoc) throw new Error(ERROR_CODES.COLLABORATOR_NOT_FOUND);

        if (collaboratorDoc.status !== CollaboratorStatus.pending)
            throw new AppError(ERROR_CODES.COLLABORATOR_NOT_PENDING);

        const projectDoc = await this.projectRepository.findById(String(collaboratorDoc.project));
        if (!projectDoc) throw new AppError(ERROR_CODES.PROJECT_NOT_FOUND);

        if (String(projectDoc.leadPI) !== applicantId && SYSTEM.SU_USER !== applicantId)
            throw new AppError(ERROR_CODES.USER_NOT_LEAD_PI);

        if (projectDoc.status !== ProjectStatus.pending &&
            projectDoc.status !== ProjectStatus.negotiation) {
            throw new AppError(ERROR_CODES.INVALID_PROJECT_STATUS);
        }

        return await this.repository.delete(id);
    }
}