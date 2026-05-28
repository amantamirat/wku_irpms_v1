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
import { CreatePhaseDto, GetPhasesOptions, PhaseDto, UpdatePhaseDto } from "./phase.dto";
import { IPhaseRepository } from "./phase.repository";
import { IPhase, PhaseStatus } from "./phase.model";
import { IGrantAllocationRepository } from "../../grants/allocations/grant.allocation.repository";
import { IPhaseSynchronizer } from "./phase.synchronizer";
import { PROJECT_TRANSITIONS } from "../project.state-machine";
import { GrantAllocation } from "../../grants/allocations/grant.allocation.model";
import { GrantRepository, IGrantRepository } from "../../grants/grant.repository";
import { CallRepository, ICallRepository } from "../../calls/call.repository";

export class PhaseService {

    constructor(
        private readonly phaseRepo: IPhaseRepository,
        private readonly projRepo: IProjectRepository,
        private readonly allocRepo: IGrantAllocationRepository,
        private readonly projAuth: ProjectAuth,
        private readonly constValidator: ConstraintValidator,
        private readonly synchrnonizer?: IPhaseSynchronizer,
        private readonly grantRepo: IGrantRepository = new GrantRepository(),
        private readonly callRepo: ICallRepository = new CallRepository(),
    ) { }

    async validateProject(project: string, applicant: string, session?: ClientSession) {
        const projectDoc = await this.projAuth.authProject(project, applicant, session);
        if (
            projectDoc.status !== ProjectStatus.draft &&
            projectDoc.status !== ProjectStatus.accepted
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
        if (!options?.skipValidation) {
            const projectDoc = await this.validateProject(project, applicantId ?? "", session);
            const grantId = String(projectDoc.grant);
            const existingPhases = await this.phaseRepo.find({ project }, session);
            const proposedPhases = [...existingPhases, dto];
            await this.constValidator.validatePhases(grantId, proposedPhases, { skipMin: true })
        }
        try {
            const count = await this.phaseRepo.countByProject(project, session);
            const order = count + 1;
            const created = await this.phaseRepo.create({ ...dto, order }, session);
            // ✅ Increment totals
            await this.projRepo.incrementTotals(project, {
                duration: created.duration ?? 0,
                budget: created.budget ?? 0
            }, session);

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
        const { id, data, userId } = dto;
        const phaseDoc = await this.phaseRepo.findById(id);
        if (!phaseDoc)
            throw new AppError(ERROR_CODES.PHASE_NOT_FOUND);
        if (phaseDoc.status !== PhaseStatus.proposed)
            throw new AppError(ERROR_CODES.PHASE_NOT_PROPOSED);

        const projectId = String(phaseDoc.project);

        const projectDoc = await this.validateProject(projectId, userId);
        const grantId = String(projectDoc.grant);

        const updatedPhase = { ...phaseDoc, ...data };
        await this.constValidator.validateIndividualPhase(grantId, [updatedPhase]);
        const existingPhases = await this.phaseRepo.find({ project: projectId });

        const updatedPhases = existingPhases.map(p => String(p._id) === id ? updatedPhase : p);
        await this.constValidator.validatePhases(grantId, updatedPhases);

        const oldDuration = phaseDoc.duration ?? 0;
        const oldBudget = phaseDoc.budget ?? 0;

        const updated = await this.phaseRepo.update(id, data);

        const newDuration = updated?.duration ?? 0;
        const newBudget = updated?.budget ?? 0;

        // Adjust totals (delta)
        await this.projRepo.incrementTotals(
            projectId,
            {
                duration: newDuration - oldDuration,
                budget: newBudget - oldBudget
            }
        );

        return updated;
    }

    // ---------------------------------------------------
    // TRANSITION
    // ---------------------------------------------------
    async transitionState(dto: TransitionRequestDto) {

        const { id, next, current } = dto;

        const currentPhaseDoc = await this.phaseRepo.findById(id);

        if (!currentPhaseDoc)
            throw new AppError(ERROR_CODES.PHASE_NOT_FOUND);

        const from = currentPhaseDoc.status as PhaseStatus;
        const to = next as PhaseStatus;

        if (current && current !== from)
            throw new AppError(ERROR_CODES.STATE_OUT_OF_SYNC);

        TransitionHelper.validateTransition(
            from,
            to,
            PHASE_TRANSITIONS
        );

        const projectId = String(currentPhaseDoc.project);

        const projectDoc = await this.projRepo.findById(projectId);

        if (!projectDoc)
            throw new AppError(ERROR_CODES.PROJECT_NOT_FOUND);

        const projectStatus = projectDoc.status;

        const countPhases = await this.phaseRepo.countByProject(projectId);

        const isFirstOrder = currentPhaseDoc.order === 1;
        const isLastOrder = currentPhaseDoc.order === countPhases;

        let prevPhase: IPhase | null = null;
        let nextPhase: IPhase | null = null;

        if (!isFirstOrder) {

            prevPhase = await this.phaseRepo.findOne(
                projectId,
                currentPhaseDoc.order - 1
            );

            if (!prevPhase)
                throw new AppError(ERROR_CODES.PREVIOUS_PHASE_NOT_FOUND);
        }

        if (!isLastOrder) {

            nextPhase = await this.phaseRepo.findOne(
                projectId,
                currentPhaseDoc.order + 1
            );

            if (!nextPhase)
                throw new AppError(ERROR_CODES.NEXT_PHASE_NOT_FOUND);
        }

        let newProjectStatus = projectStatus;

        /**
         * PROPOSED <-> APPROVED
         */
        if (
            (from === PhaseStatus.approved && to === PhaseStatus.proposed) ||
            (from === PhaseStatus.proposed && to === PhaseStatus.approved)
        ) {

            if (projectStatus !== ProjectStatus.accepted)
                throw new AppError(ERROR_CODES.PROJECT_NOT_ACCEPTED);

            if (
                prevPhase &&
                prevPhase.status !== PhaseStatus.approved
            ) {
                throw new AppError(ERROR_CODES.PREVIOUS_PHASE_NOT_APPROVED);
            }

            if (
                nextPhase &&
                nextPhase.status !== PhaseStatus.proposed
            ) {
                throw new AppError(ERROR_CODES.NEXT_PHASE_NOT_PROPSED);
            }

        }

        /**
         * ACTIVE / COMPLETED / TERMINATED FLOW
         */
        else {

            /**
             * TERMINATION
             */
            if (to === PhaseStatus.terminated) {

                if (projectStatus !== ProjectStatus.active)
                    throw new AppError(ERROR_CODES.PROJECT_NOT_ACTIVATED);

                if (from !== PhaseStatus.active)
                    throw new AppError(ERROR_CODES.INVALID_STATE_TRANSITION, "Invalid Phase Transition");

                newProjectStatus = ProjectStatus.terminated;
            }

            /**
             * REOPEN TERMINATED
             */
            else if (
                from === PhaseStatus.terminated &&
                to === PhaseStatus.active
            ) {

                if (projectStatus !== ProjectStatus.terminated)
                    throw new AppError(ERROR_CODES.PROJECT_NOT_TERMINATED);

                newProjectStatus = ProjectStatus.active;
            }

            /**
             * NORMAL FLOW VALIDATION
             */
            else {

                if (
                    prevPhase &&
                    prevPhase.status !== PhaseStatus.completed
                ) {
                    throw new AppError(ERROR_CODES.PREVIOUS_PHASE_NOT_COMPLETED);
                }

                if (
                    nextPhase &&
                    nextPhase.status !== PhaseStatus.approved
                ) {
                    throw new AppError(ERROR_CODES.NEXT_PHASE_NOT_APPROVED);
                }

                /**
                 * PROJECT STATUS SYNC
                 */

                // first phase activates project
                if (
                    isFirstOrder &&
                    from === PhaseStatus.approved &&
                    to === PhaseStatus.active
                ) {

                    if (projectStatus !== ProjectStatus.granted)
                        throw new AppError(ERROR_CODES.PROJECT_NOT_GRANTED);

                    newProjectStatus = ProjectStatus.active;
                }

                // rollback first phase
                else if (
                    isFirstOrder &&
                    from === PhaseStatus.active &&
                    to === PhaseStatus.approved
                ) {

                    if (projectStatus !== ProjectStatus.active)
                        throw new AppError(ERROR_CODES.PROJECT_NOT_ACTIVATED);

                    newProjectStatus = ProjectStatus.granted;
                }

                // last phase completes project
                if (
                    isLastOrder &&
                    from === PhaseStatus.active &&
                    to === PhaseStatus.completed
                ) {

                    if (projectStatus !== ProjectStatus.active)
                        throw new AppError(ERROR_CODES.PROJECT_NOT_ACTIVATED);

                    newProjectStatus = ProjectStatus.completed;
                }

                // rollback completion
                else if (
                    isLastOrder &&
                    from === PhaseStatus.completed &&
                    to === PhaseStatus.active
                ) {

                    if (projectStatus !== ProjectStatus.completed)
                        throw new AppError(ERROR_CODES.PROJECT_NOT_COMPLETED);

                    newProjectStatus = ProjectStatus.active;
                }

                /**
                 * BUDGET SYNC
                 */

                if (
                    from === PhaseStatus.approved &&
                    to === PhaseStatus.active
                ) {

                    await this.grantRepo.consumeBudget(
                        projectDoc.grant.toString(),
                        currentPhaseDoc.budget
                    );

                    if (projectDoc.call) {
                        await this.callRepo.consumeBudget(
                            String(projectDoc.call),
                            currentPhaseDoc.budget
                        );
                    }

                }

                else if (
                    from === PhaseStatus.active &&
                    to === PhaseStatus.approved
                ) {
                    await this.grantRepo.reverseConsumedBudget(
                        projectDoc.grant.toString(),
                        currentPhaseDoc.budget
                    );

                    if (projectDoc.call) {
                        await this.callRepo.reverseConsumedBudget(
                            String(projectDoc.call),
                            currentPhaseDoc.budget
                        );
                    }

                }
            }
        }

        /**
         * UPDATE PHASE
         */

        const updated = await this.phaseRepo.updateStatus(
            id,
            to
        );

        /**
         * UPDATE PROJECT STATUS
         */

        if (
            updated &&
            newProjectStatus !== projectStatus
        ) {

            TransitionHelper.validateTransition(
                projectStatus,
                newProjectStatus,
                PROJECT_TRANSITIONS
            );

            await this.projRepo.updateStatus(
                projectId,
                newProjectStatus
            );
        }

        return updated;
    }
    // ---------------------------------------------------
    // DELETE
    // ---------------------------------------------------
    async delete(dto: DeleteDto) {
        const { id, userId: applicantId } = dto;
        const phaseDoc = await this.phaseRepo.findById(id);
        if (!phaseDoc) throw new AppError(ERROR_CODES.PHASE_NOT_FOUND);
        if (phaseDoc.status !== PhaseStatus.proposed)
            throw new AppError(ERROR_CODES.PHASE_NOT_PROPOSED);

        const projectId = String(phaseDoc.project);
        const projectDoc = await this.validateProject(projectId, applicantId ?? "");
        const grantId = String((projectDoc.grant as any).grant);

        const allPhases = await this.phaseRepo.find({ project: projectId });
        const proposedPhases = allPhases.filter(p => String(p._id) !== id);
        //   await this.validator.validateProjectTotals(grantId, proposedPhases);
        // await this.validator.validatePhaseCount(grantId, proposedPhases);

        // ✅ Decrement totals BEFORE delete
        await this.projRepo.incrementTotals(projectId, {
            duration: -(phaseDoc.duration ?? 0),
            budget: -(phaseDoc.budget ?? 0)
        });
        const deleted = await this.phaseRepo.delete(id);
        const order = phaseDoc.order;
        // Re-arrange orders of remaining phases
        if (deleted) {
            await this.phaseRepo.updateMany(
                {
                    projectId,
                    order: { $gt: order }
                },
                {
                    $inc: { order: -1 }
                }
            );
        }
        return deleted;
    }
}

export const PHASE_TRANSITIONS: Record<PhaseStatus, PhaseStatus[]> = {
    [PhaseStatus.proposed]: [
        PhaseStatus.approved
    ],

    [PhaseStatus.approved]: [
        PhaseStatus.active,
        PhaseStatus.proposed
    ],

    [PhaseStatus.active]: [
        PhaseStatus.completed,
        PhaseStatus.terminated,
        PhaseStatus.approved
    ],

    [PhaseStatus.completed]: [
        PhaseStatus.active
    ],

    [PhaseStatus.terminated]: [
        PhaseStatus.active
    ]
};