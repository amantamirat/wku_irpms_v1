// reviewer.service.ts
import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";
import { IUserRepository } from "../users/user.repository";
import { ICollaboratorRepository } from "../projects/collaborators/collaborator.repository";
import { IProjectStageRepository } from "../projects/stages/project.stage.repository";
import { ProjectStageStatus } from "../projects/stages/project.stage.status";
import { CreateReviewerDTO, GetReviewersDTO, UpdateReviewerDTO } from "./reviewer.dto";
import { IReviewerRepository } from "./reviewer.repository";

import { TransitionRequestDto } from "../../common/dtos/transition.dto";
import { TransitionHelper } from "../../common/helpers/transition.helper";
import { REVIEWER_TRANSITIONS } from "./reviewer.state-machine";
import { ReviewerStatus } from "./reviewer.state-machine";
import { IResultRepository } from "./results/result.repository";
import { ICriterionRepository } from "../evaluations/criteria/criterion.repository";
import { FormType } from "../evaluations/criteria/criterion.model";
import { IGrantStage } from "../grants/stages/grant.stage.model";
import { IProject } from "../projects/project.model";
import { IProjectStageSynchronizer } from "./reviewer.synchronizer";
import { NotificationService } from "../notifications/notification.service";

export class ReviewerService {

    constructor(
        private readonly repository: IReviewerRepository,
        private readonly projectStageRepo: IProjectStageRepository,
        private readonly applicantRepo: IUserRepository,
        private readonly collaboratorRepo: ICollaboratorRepository,
        private readonly resultRepo: IResultRepository,
        private readonly criterionRepo: ICriterionRepository,
        private readonly synchronizer: IProjectStageSynchronizer,
        private readonly notificationService: NotificationService,
    ) {
    }

    async create(dto: CreateReviewerDTO) {
        const { projectStage, applicant, weight } = dto;

        const projectStageDoc = await this.projectStageRepo.findById(projectStage, true);
        if (!projectStageDoc) throw new AppError(ERROR_CODES.PROJECT_STAGE_NOT_FOUND);

        const projectStageStatus = projectStageDoc.status;
        if (projectStageStatus !== ProjectStageStatus.selected)
            throw new AppError(ERROR_CODES.INVALID_DOC_STATUS);

        const grantStageDoc = projectStageDoc.grantStage as unknown as IGrantStage;
        const countReviewers = await this.repository.countByProjectStage(projectStage);
        const maxReviewers = grantStageDoc.maxReviewers;
        if (maxReviewers !== undefined && countReviewers >= maxReviewers) {
            throw new AppError(ERROR_CODES.REVIEWER_LIMIT_REACHED, `Reviewer limit reached. Maximum allowed is ${maxReviewers}.`);
        }
        const applicantDoc = await this.applicantRepo.findById(applicant);
        if (!applicantDoc) throw new Error(ERROR_CODES.USER_NOT_FOUND);

        const projectDoc = projectStageDoc.project as unknown as IProject;
        const collaborators = await this.collaboratorRepo.find({ project: String(projectDoc._id) });
        if (collaborators.find(c => String(c.applicant) === applicant)) {
            throw new AppError(ERROR_CODES.INVALID_REVIEWER);
        }
        try {
            const created = await this.repository.create(dto);
            await this.notificationService.notifyReviewerAssigned(
                applicant, projectDoc.title, grantStageDoc.name
            );
            await this.synchronizer.sync(projectStage);
            return created;
        } catch (err: any) {
            if (err?.code === 11000) {
                throw new AppError(ERROR_CODES.REVIEWER_ALREADY_EXISTS);
            }
            throw err;
        }
    }

    async getReviewers(options: GetReviewersDTO) {
        return this.repository.find(options);
    }

    // --- Update reviewer data (weight) ---
    async update(dto: UpdateReviewerDTO) {
        const { id, data, applicantId } = dto;
        const { weight } = data;
        const reviewerDoc = await this.repository.findById(id);
        if (!reviewerDoc) throw new Error(ERROR_CODES.REVIEWER_NOT_FOUND);
        if (reviewerDoc.status !== ReviewerStatus.pending) {
            throw new Error(ERROR_CODES.REVIEWER_NOT_PENDING);
        }
        if (!weight || (weight === 0 || weight < 0))
            throw new Error(ERROR_CODES.INVALID_REVIEWER_WEIGHT);

        const updated = await this.repository.update(id, { weight });
        return updated;
    }

    async transitionState(dto: TransitionRequestDto) {
        const { id, current, next, applicantId } = dto;
        if (!applicantId) return;

        const reviewerDoc = await this.repository.findById(id);
        if (!reviewerDoc) {
            throw new AppError(ERROR_CODES.REVIEWER_NOT_FOUND);
        }
        const from = reviewerDoc.status as ReviewerStatus;
        const to = next as ReviewerStatus;

        if (current && current !== from) {
            throw new AppError(ERROR_CODES.STATE_OUT_OF_SYNC);
        }

        TransitionHelper.validateTransition(
            from,
            to,
            REVIEWER_TRANSITIONS
        );


        if (from === ReviewerStatus.accepted && to === ReviewerStatus.submitted) {
            if (String(reviewerDoc.applicant) !== applicantId)
                throw new AppError(ERROR_CODES.UNAUTHORIZED);

            const results = await this.resultRepo.find({ reviewer: id, populate: true });
            const incomplete = results.some(r => {
                const type = (r.criterion as any)?.formType;
                if (type === FormType.OPEN) return false;
                return r.score === null || r.score === undefined;
            });
            if (incomplete) {
                throw new AppError(ERROR_CODES.INCOMPELTE_CRITERIA);
            }
            let score = results.reduce((sum, r) => sum + (r.score ?? 0), 0);
            await this.repository.update(id, { score });
        }

        const projectStageId = String(reviewerDoc.projectStage);

        if (to === ReviewerStatus.accepted) {
            if (String(reviewerDoc.applicant) !== applicantId)
                throw new AppError(ERROR_CODES.UNAUTHORIZED);

            const existingResults = await this.resultRepo.find({ reviewer: id });
            if (existingResults.length === 0) {

                const projectStageDoc = await this.projectStageRepo.findById(projectStageId, true);
                if (!projectStageDoc) throw new AppError(ERROR_CODES.PROJECT_STAGE_NOT_FOUND);
                const grantStageDoc = projectStageDoc.grantStage as any;

                const criteria = await this.criterionRepo.find({ evaluation: String(grantStageDoc.evaluation) });
                await this.resultRepo.insertMany(
                    criteria.map(c => ({
                        reviewer: id,
                        criterion: String(c._id),
                        score: null
                    }))
                );
            }
        }

        const updated = await this.repository.updateStatus(id, to);
        await this.synchronizer.sync(projectStageId);
        return updated;
    }

    async delete(id: string) {
        const reviewerDoc = await this.repository.findById(id);
        if (!reviewerDoc) throw new AppError(ERROR_CODES.REVIEWER_NOT_FOUND);
        if (reviewerDoc.status !== ReviewerStatus.pending)
            throw new AppError(ERROR_CODES.REVIEWER_NOT_PENDING);
        const deleted = await this.repository.delete(id);
        
        await this.resultRepo.deleteByReviewer(id);
        
        await this.synchronizer.sync(String(reviewerDoc.projectStage));
        return deleted
    }
}
