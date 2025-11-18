// reviewer.service.ts
import { CacheService } from "../../../../../util/cache/cache.service";
import { PERMISSIONS } from "../../../../../util/permissions";
import Applicant from "../../../../applicants/applicant.model";
import { Criterion } from "../../../../evaluations/criteria/criterion.model";
import { Collaborator } from "../../../../projects/collaborators/collaborator.model";
import { Stage } from "../../stage.model";
import { ProjectStageStatus } from "../project-stage.enum";
import { IProjectStageRepository, ProjectStageRepository } from "../project-stage.repository";
import { ProjectStageSynchronizer } from "../project-stage.synchronizer";
import { IResultRepository, ResultRepository } from "./results/result.repository";
import { CreateReviewerDTO, DeleteReviewerDTO, GetReviewersDTO, UpdateReviewerDTO } from "./reviewer.dto";
import { ReviewerStatus } from "./reviewer.enum";
import { ReviewerPermission } from "./reviewer.permission";
import { IReviewerRepository, ReviewerRepository } from "./reviewer.repository";
import { ReviewerStateMachine } from "./reviewer.state-machine";

export class ReviewerService {

    private repository: IReviewerRepository;
    private resultRepo: IResultRepository;
    private projectStageRepo: IProjectStageRepository;
    private projectStageSynchronizer: ProjectStageSynchronizer;
    private permission: ReviewerPermission;

    constructor(repository?: IReviewerRepository, resultRepo?: IResultRepository,
        projectStageRepo?: IProjectStageRepository, projectStageSynchronizer?: ProjectStageSynchronizer
    ) {
        this.repository = repository || new ReviewerRepository();
        this.resultRepo = resultRepo || new ResultRepository();
        this.projectStageRepo = projectStageRepo || new ProjectStageRepository();
        this.projectStageSynchronizer = projectStageSynchronizer ||
            new ProjectStageSynchronizer(this.projectStageRepo, this.repository);
        this.permission = new ReviewerPermission(this.repository);
    }

    async createReviewer(dto: CreateReviewerDTO) {
        const { projectStageId, applicantId } = dto;

        const projectStageDoc = await this.projectStageRepo.findById(projectStageId);
        if (!projectStageDoc) throw new Error("Project Stage not found");

        if ([ProjectStageStatus.accepted, ProjectStageStatus.rejected].includes(projectStageDoc.status)) {
            throw new Error(`This project stage is already ${projectStageDoc.status} and cannot be modified.`);
        }

        ///////////////////////////will be modified//////////////////////////////////////////
        const applicantDoc = await Applicant.findById(applicantId).lean();
        if (!applicantDoc) throw new Error("Applicant not found");

        const collaborators = await Collaborator.find({ project: projectStageDoc.project }).lean();
        if (collaborators.find(c => String(c.applicant) === applicantId)) {
            throw new Error("Reviewer applicant is already a collaborator on the project");
        }
        /////////////////////////////////////////////////////////////

        const createdReviewer = await this.repository.create({
            projectStageId,
            applicantId,
            userId: dto.userId
        });

        await this.projectStageSynchronizer.syncProjectStageStatus(projectStageId, projectStageDoc);
        return createdReviewer;
    }

    async getReviewers(options: GetReviewersDTO) {
        if (!options.projectStageId && !options.applicantId) {
            throw new Error("Project-Stage or Applicant is required");
        }
        if (options.projectStageId) {
            return this.repository.findByProjectStage(options.projectStageId);
        }
        if (options.applicantId) {
            return this.repository.findByApplicant(options.applicantId);
        }
    }

    async updateReviewer(dto: UpdateReviewerDTO) {
        const { id, data, userId } = dto;
        const reviewerDoc = await this.repository.findById(id);
        if (!reviewerDoc) throw new Error("Reviewer not found");
        let projectStageDoc;
        const nextState = data.status;
        if (nextState) {
            const current = reviewerDoc.status;
            // --- Use State Machine ---
            ReviewerStateMachine.validateTransition(current, nextState);

            const isActivationChange =
                current === ReviewerStatus.active || nextState === ReviewerStatus.active;

            if (isActivationChange) {
                await this.permission.validateReviewerPermission(id, userId, reviewerDoc);
            }
            const isApprovalChange =
                current === ReviewerStatus.approved || nextState === ReviewerStatus.approved;

            if (isApprovalChange) {
                await CacheService.validatePermission(userId, [PERMISSIONS.REVIEWER.APPROVE]);
            }
            // Validation of if status is submitted
            if (current === ReviewerStatus.active && nextState === ReviewerStatus.submitted) {
                projectStageDoc = await this.projectStageRepo.findById(reviewerDoc.projectStage.toString());
                if (!projectStageDoc) throw new Error("Project Stage not found");

                const stageDoc = await Stage.findById(projectStageDoc.stage).lean();
                if (!stageDoc) throw new Error("Stage not found");

                const criteriaCount = await Criterion.countDocuments({ evaluation: stageDoc.evaluation })
                const results = await this.resultRepo.findByReviewer(id);

                if (results.length !== criteriaCount) {
                    throw new Error("Please complete all evaluation criteria before submitting.");
                }

                const totalScore = results.reduce((sum, r) => sum + (r.score ?? 0), 0);
                dto.data.totalScore = totalScore * (reviewerDoc.weight ?? 1);
            }
            if (current === ReviewerStatus.submitted && nextState === ReviewerStatus.active) {
                dto.data.totalScore = 0;
            }
        }
        const updated = await this.repository.update(id, dto.data);
        await this.projectStageSynchronizer.syncProjectStageStatus(reviewerDoc.projectStage.toString(), projectStageDoc);
        return updated;

    }

    async deleteReviewer(dto: DeleteReviewerDTO) {
        const reviewerDoc = await this.repository.findById(dto.id);
        if (!reviewerDoc) throw new Error("Reviewer not found");

        if (reviewerDoc.status !== ReviewerStatus.pending) {
            throw new Error("Cannot delete non-pending reviewer");
        }
        //delete the result too
        const deleted = await this.repository.delete(dto.id);
        await this.projectStageSynchronizer.syncProjectStageStatus(reviewerDoc.projectStage.toString());
        return deleted
    }
}
