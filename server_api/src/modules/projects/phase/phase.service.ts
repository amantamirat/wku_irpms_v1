import { ClientSession } from "mongoose";
import { DeleteDto } from "../../../common/dtos/delete.dto";
import { TransitionRequestDto } from "../../../common/dtos/transition.dto";
import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { TransitionHelper } from "../../../common/helpers/transition.helper";
import { ConstraintValidator } from "../../grants/constraints/constraint.validator";
import { ProjectAuth } from "../project.auth";
import { IProjectRepository } from "../project.repository";
import { ProjectStatus } from "../project.model";
import { CreatePhaseDto, GetPhasesOptions, UpdatePhaseDto } from "./phase.dto";
import { IPhaseRepository } from "./phase.repository";
import { PHASE_TRANSITIONS } from "./phase.state-machine";
import { PhaseStatus } from "./phase.status";

export class PhaseService {
    constructor(
        private readonly phaseRepo: IPhaseRepository,
        private readonly projRepo: IProjectRepository,
        private readonly projAuth: ProjectAuth,
        private readonly validator: ConstraintValidator,
    ) { }

    async validateProject(project: string, applicant: string) {
        const projectDoc = await this.projAuth.authProject(project, applicant);
        if (
            projectDoc.status !== ProjectStatus.draft &&
            projectDoc.status !== ProjectStatus.negotiation
        ) {
            throw new AppError(ERROR_CODES.INVALID_PROJECT_STATUS);
        }
        return projectDoc;
    }

    // ---------------------------------------------------
    // CREATE
    // ---------------------------------------------------
    async create(dto: CreatePhaseDto, options?: { skipValidation?: boolean }, session?: ClientSession) {
        const { project, applicantId } = dto;

        const projectDoc = await this.validateProject(project, applicantId ?? "");
        const grantId = String((projectDoc.grantAllocation as any).grant);

        // 1. Get existing phases + new phase to check totals
        const existingPhases = await this.phaseRepo.find({ project });
        const proposedPhases = [...existingPhases, dto];

        // 2. Validate against Grant constraints
        await this.validator.validatePhases(grantId, proposedPhases);


        try {
            const created = await this.phaseRepo.create(dto);

            // ✅ Increment totals
            await this.projRepo.incrementTotals(project, {
                duration: created.duration ?? 0,
                budget: created.budget ?? 0
            });

            return created;
        } catch (err: any) {
            if (err?.code === 11000) {
                throw new AppError(ERROR_CODES.PHASE_ALREADY_EXISTS);
            }
            throw err;
        }
    }

    // ---------------------------------------------------
    // GET
    // ---------------------------------------------------
    async getPhases(options: GetPhasesOptions) {
        return await this.phaseRepo.find(options);
    }

    // ---------------------------------------------------
    // UPDATE
    // ---------------------------------------------------
    async update(dto: UpdatePhaseDto) {
        const { id, data, applicantId } = dto;

        const phaseDoc = await this.phaseRepo.findById(id);
        if (!phaseDoc) throw new AppError(ERROR_CODES.PHASE_NOT_FOUND);

        const projectId = String(phaseDoc.project);
        const projectDoc = await this.validateProject(projectId, applicantId);
        const grantId = String((projectDoc.grantAllocation as any).grant);

        if (phaseDoc.status !== PhaseStatus.proposed)
            throw new AppError(ERROR_CODES.PHASE_NOT_PROPOSED);

        const allPhases = await this.phaseRepo.find({ project: projectId });
        const proposedPhases = allPhases.map(p =>
            String(p._id) === id ? { ...p.toObject(), ...data } : p
        );

        // 2. Validate
        await this.validator.validatePhases(grantId, proposedPhases);

        const oldDuration = phaseDoc.duration ?? 0;
        const oldBudget = phaseDoc.budget ?? 0;

        const updated = await this.phaseRepo.update(id, data);

        const newDuration = updated?.duration ?? 0;
        const newBudget = updated?.budget ?? 0;

        // ✅ Adjust totals (delta)
        await this.projRepo.incrementTotals(projectId, {
            duration: newDuration - oldDuration,
            budget: newBudget - oldBudget
        });

        return updated;
    }

    // ---------------------------------------------------
    // TRANSITION
    // ---------------------------------------------------
    async transitionState(dto: TransitionRequestDto) {
        const { id, next, applicantId, current } = dto;

        const phaseDoc = await this.phaseRepo.findById(id);
        if (!phaseDoc) throw new AppError(ERROR_CODES.PHASE_NOT_FOUND);

        const from = phaseDoc.status as PhaseStatus;
        const to = next as PhaseStatus;

        if (current && current !== from)
            throw new AppError(ERROR_CODES.STATE_OUT_OF_SYNC);

        TransitionHelper.validateTransition(from, to, PHASE_TRANSITIONS);

        const projectDoc = await this.projRepo.findById(String(phaseDoc.project));
        if (!projectDoc) throw new AppError(ERROR_CODES.PROJECT_NOT_FOUND);

        const projectStatus = projectDoc.status;

        if (to === PhaseStatus.reviewed) {
            if (projectStatus !== ProjectStatus.negotiation)
                throw new AppError(ERROR_CODES.PROJECT_NOT_IN_NEGOTIATION);

            if (String(projectDoc.applicant) !== applicantId)
                throw new AppError(ERROR_CODES.UNAUTHORIZED);
        }

        if (to === PhaseStatus.active) {
            if (projectStatus !== ProjectStatus.granted)
                throw new AppError(ERROR_CODES.PROJECT_NOT_GRANTED);
        }

        return await this.phaseRepo.updateStatus(id, to);
    }

    // ---------------------------------------------------
    // DELETE
    // ---------------------------------------------------
    async delete(dto: DeleteDto) {
        const { id, applicantId } = dto;
        const phaseDoc = await this.phaseRepo.findById(id);
        if (!phaseDoc) throw new AppError(ERROR_CODES.PHASE_NOT_FOUND);

        const projectId = String(phaseDoc.project);

        const projectDoc = await this.validateProject(projectId, applicantId ?? "");
        const grantId = String((projectDoc.grantAllocation as any).grant);

        if (phaseDoc.status !== PhaseStatus.proposed)
            throw new AppError(ERROR_CODES.PHASE_NOT_PROPOSED);

        // 1. Simulate list after deletion
        const allPhases = await this.phaseRepo.find({ project: projectId });
        const proposedPhases = allPhases.filter(p => String(p._id) !== id);

        // 2. Validate (e.g., checks if we fell below min phase count)
        await this.validator.validatePhases(grantId, proposedPhases);

        // ✅ Decrement totals BEFORE delete
        await this.projRepo.incrementTotals(projectId, {
            duration: -(phaseDoc.duration ?? 0),
            budget: -(phaseDoc.budget ?? 0)
        });

        return await this.phaseRepo.delete(id);
    }
}