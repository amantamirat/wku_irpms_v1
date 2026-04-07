// reviewer.service.ts
import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";
import { IApplicantRepository } from "../applicants/applicant.repository";
import { ICollaboratorRepository } from "../projects/collaborators/collaborator.repository";
import { IProjectStageRepository } from "../projects/stages/project.stage.repository";
import { ProjectStageStatus } from "../projects/stages/project.stage.status";
import { CreateReviewerDTO, GetReviewersDTO, UpdateReviewerDTO } from "./reviewer.dto";
import { IReviewerRepository } from "./reviewer.repository";

import { TransitionRequestDto } from "../../common/dtos/transition.dto";
import { TransitionHelper } from "../../common/helpers/transition.helper";
import { REVIEWER_TRANSITIONS } from "./reviewer.state-machine";
import { ReviewerStatus } from "./reviewer.status";
import { NotificationService } from "../users/notifications/notification.service";
import { IResultRepository } from "./results/result.repository";
import { ICriterionRepository } from "../evaluations/criteria/criterion.repository";

export class ReviewerService {

    constructor(
        private readonly repository: IReviewerRepository,
        private readonly projectStageRepo: IProjectStageRepository,
        private readonly applicantRepo: IApplicantRepository,
        private readonly collaboratorRepo: ICollaboratorRepository,
        private readonly resultRepo: IResultRepository,
        private readonly criterionRepo: ICriterionRepository,
        private readonly notificationService: NotificationService,
    ) {
        /*
        private docSynchronizer: ProjectStageSynchronizer;
        this.docSynchronizer =
            new ProjectStageSynchronizer(this.projectStageRepo, this.repository);
            */
    }

    async create(dto: CreateReviewerDTO) {
        const { projectStage, applicant, weight } = dto;

        const projectStageDoc = await this.projectStageRepo.findById(projectStage, true);
        if (!projectStageDoc) throw new AppError(ERROR_CODES.PROJECT_STAGE_NOT_FOUND);

        const projectStageStatus = projectStageDoc.status;
        if (projectStageStatus !== ProjectStageStatus.selected)
            throw new AppError(ERROR_CODES.INVALID_DOC_STATUS);

        const applicantDoc = await this.applicantRepo.findById(applicant);
        if (!applicantDoc) throw new Error(ERROR_CODES.APPLICANT_NOT_FOUND);

        const projectData = projectStageDoc.project as any;
        const collaborators = await this.collaboratorRepo.find({ project: String(projectData._id) });
        if (collaborators.find(c => String(c.applicant) === applicant)) {
            throw new AppError(ERROR_CODES.INVALID_REVIEWER);
        }
        try {
            const created = await this.repository.create(dto);
            // await this.docSynchronizer.sync(projectStage);

            const projectData = projectStageDoc.project as any;
            const stageData = projectStageDoc.grantStage as any;
            await this.notificationService.notifyReviewerAssigned(
                applicant, projectData.title, stageData.name
            );
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

    /*
    // --- Change reviewer status (activate, submit, approve) ---
    async updateStatus(dto: UpdateReviewerStatusDTO) {
        const { id, status: next, applicantId } = dto;
        const reviewerDoc = await this.repository.findById(id);
        if (!reviewerDoc) throw new AppError(ERROR_CODES.REVIEWER_NOT_FOUND);
        const current = reviewerDoc.status;

        // --- State Machine Validation ---
        ReviewerStateMachine.validateTransition(current, next);

        const projectStageDoc = await this.documentRepository.findById(String(reviewerDoc.projectStage));
        if (!projectStageDoc) throw new AppError(ERROR_CODES.PROJECT_STAGE_NOT_FOUND);

        if ([ProjectStageStatus.accepted, ProjectStageStatus.rejected].includes(projectStageDoc.status)) {
            throw new AppError(ERROR_CODES.INVALID_DOC_STATUS);
        }

        let score: number | undefined = undefined;

        const stage = String(projectStageDoc.grantStage);
        const stageDoc = await this.stageRepository.findById(stage);
        if (!stageDoc) throw new AppError(ERROR_CODES.STAGE_NOT_FOUND);
        //const evaluation = String(stageDoc.evaluation);
        const evaluation = "";
        if (next === ReviewerStatus.accepted) {
            const existingResults = await this.resultRepository.find({ reviewer: id });
            if (existingResults.length === 0) {
                const criteria = await this.criterionRepository.find({ evaluation });
                await this.resultRepository.insertMany(
                    criteria.map(c => ({
                        reviewer: id,
                        criterion: String(c._id),
                        score: null
                    }))
                );
            }
        }

        if (current === ReviewerStatus.accepted && next === ReviewerStatus.submitted) {
            if (String(reviewerDoc.applicant) !== applicantId && SYSTEM.SU_USER !== applicantId)
                throw new AppError(ERROR_CODES.USER_NOT_REVIEWER);
            const results = await this.resultRepository.find({ reviewer: id });
            const incomplete = results.some(r => r.score === null || r.score === undefined);
            if (incomplete) {
                throw new AppError(ERROR_CODES.INCOMPELTE_CRITERIA);
            }
            score = results.reduce((sum, r) => sum + (r.score ?? 0), 0);
        }

        const updateData: any = { status: next };
        if (score !== undefined) {
            updateData.score = score;
        }
        const updated = await this.repository.update(id, updateData);
        await this.docSynchronizer.sync(reviewerDoc.projectStage.toString());
        return updated;

    }
    */

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

        if (to !== ReviewerStatus.approved) {
            if (String(reviewerDoc.applicant) !== applicantId)
                throw new AppError(ERROR_CODES.UNAUTHORIZED);

            if (to === ReviewerStatus.accepted) {
                const existingResults = await this.resultRepo.find({ reviewer: id });
                if (existingResults.length === 0) {
                    const projectStage = String(reviewerDoc.projectStage);
                    const projectStageDoc = await this.projectStageRepo.findById(projectStage, true);
                    if (!projectStageDoc) throw new AppError(ERROR_CODES.PROJECT_STAGE_NOT_FOUND);
                    const grantStageDoc = projectStageDoc.grantStage as any;
                    const evaluation = String(grantStageDoc.evaluation);
                    const criteria = await this.criterionRepo.find({ evaluation });
                    await this.resultRepo.insertMany(
                        criteria.map(c => ({
                            reviewer: id,
                            criterion: String(c._id),
                            score: null
                        }))
                    );
                }
            }
            if (to === ReviewerStatus.submitted) {

            }
        }


        return await this.repository.updateStatus(id, to);
    }

    async delete(id: string) {
        const reviewerDoc = await this.repository.findById(id);
        if (!reviewerDoc) throw new AppError(ERROR_CODES.REVIEWER_NOT_FOUND);
        if (reviewerDoc.status !== ReviewerStatus.pending)
            throw new AppError(ERROR_CODES.REVIEWER_NOT_PENDING);
        const deleted = await this.repository.delete(id);
        /*
        if (deleted) {
            await this.resultRepository.deleteByReviewer(id);
            await this.docSynchronizer.sync(reviewerDoc.projectStage.toString());
        }
        */
        return deleted
    }
}
