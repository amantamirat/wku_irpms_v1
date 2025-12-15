// reviewer.service.ts
import { CacheService } from "../../../../../util/cache/cache.service";
import { PERMISSIONS } from "../../../../../common/constants/permissions";
import Applicant from "../../../../applicants/applicant.model";
import { Criterion } from "../../../../evaluations/criteria/criterion.model";
import { Collaborator } from "../../../../projects/collaborators/collaborator.model";
import { Stage } from "../../stage.model";
import { ProjectDocStatus } from "../document.enum";
import { IDocumentRepository, DocumentRepository } from "../document.repository";
import { ProjectStageSynchronizer } from "../document.synchronizer";
import { IResultRepository, ResultRepository } from "./results/result.repository";
import { CreateReviewerDTO, DeleteReviewerDTO, GetReviewersDTO, UpdateReviewerDTO } from "./reviewer.dto";
import { ReviewerStatus } from "./reviewer.enum";
import { ReviewerPermission } from "./reviewer.permission";
import { IReviewerRepository, ReviewerRepository } from "./reviewer.repository";
import { ReviewerStateMachine } from "./reviewer.state-machine";

export class ReviewerService {

    private repository: IReviewerRepository;
    private resultRepo: IResultRepository;
    private projectStageRepo: IDocumentRepository;
    private projectStageSynchronizer: ProjectStageSynchronizer;
    private permission: ReviewerPermission;

    constructor(repository?: IReviewerRepository, resultRepo?: IResultRepository,
        projectStageRepo?: IDocumentRepository, projectStageSynchronizer?: ProjectStageSynchronizer
    ) {
        this.repository = repository || new ReviewerRepository();
        this.resultRepo = resultRepo || new ResultRepository();
        this.projectStageRepo = projectStageRepo || new DocumentRepository();
        this.projectStageSynchronizer = projectStageSynchronizer ||
            new ProjectStageSynchronizer(this.projectStageRepo, this.repository);
        this.permission = new ReviewerPermission(this.repository);
    }

    async createReviewer(dto: CreateReviewerDTO) {
        const { projectStageId, applicantId, weight } = dto;

        if (weight) {
            if (weight === 0 || weight < 0) {
                throw new Error("Invalid weight value");
            }
        }

        const projectStageDoc = await this.projectStageRepo.findById(projectStageId);
        if (!projectStageDoc) throw new Error("Project Stage not found");

        if ([ProjectDocStatus.reviewed, ProjectDocStatus.accepted, ProjectDocStatus.rejected].includes(projectStageDoc.status)) {
            throw new Error(`This project stage is already ${projectStageDoc.status} and cannot create reviewers.`);
        }

        ///////////////////////////will be modified//////////////////////////////////////////
        const applicantDoc = await Applicant.findById(applicantId).lean();
        if (!applicantDoc) throw new Error("Applicant not found");

        const collaborators = await Collaborator.find({ project: projectStageDoc.project }).lean();
        if (collaborators.find(c => String(c.applicant) === applicantId)) {
            throw new Error("Reviewer applicant is already a collaborator on the project");
        }
        /////////////////////////////////////////////////////////////

        const createdReviewer = await this.repository.create(dto);

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

    // --- Change reviewer status (activate, submit, approve) ---
    async changeReviewerStatus(dto: UpdateReviewerDTO) {
        const { id, data, userId } = dto;
        const reviewerDoc = await this.repository.findById(id);
        if (!reviewerDoc) throw new Error("Reviewer not found");

        const projectStageDoc = await this.projectStageRepo.findById(reviewerDoc.projectStage.toString());
        if (!projectStageDoc) throw new Error("Project Stage not found");

        const nextState = data.status;
        if (!nextState) throw new Error("Status is required");

        const current = reviewerDoc.status;

        // Cannot change status if stage is finalized
        if ([ProjectDocStatus.accepted, ProjectDocStatus.rejected].includes(projectStageDoc.status)) {
            throw new Error(`The project stage is already ${projectStageDoc.status} and cannot be modified.`);
        }

        // --- State Machine Validation ---
        ReviewerStateMachine.validateTransition(current, nextState);

        // Permissions
        const isActivationChange = current === ReviewerStatus.active || nextState === ReviewerStatus.active;
        const isApprovalChange = current === ReviewerStatus.approved || nextState === ReviewerStatus.approved;

        if (isActivationChange) {
            await this.permission.validateReviewerPermission(id, userId, reviewerDoc);
        }
        if (isApprovalChange) {
            await CacheService.validatePermission(userId, [PERMISSIONS.REVIEWER.APPROVE]);
        }

        // Submitted status validation
        if (current === ReviewerStatus.active && nextState === ReviewerStatus.submitted) {
            const stageDoc = await Stage.findById(projectStageDoc.stage).lean();
            if (!stageDoc) throw new Error("Stage not found");

            const criteriaCount = await Criterion.countDocuments({ evaluation: stageDoc.evaluation });
            const results = await this.resultRepo.findByReviewer(id);

            if (results.length !== criteriaCount) {
                throw new Error("Please complete all evaluation criteria before submitting.");
            }

            const reviewerScore = results.reduce((sum, r) => sum + (r.score ?? 0), 0);
            dto.data.score = reviewerScore; // weight can still be applied elsewhere if needed
        }

        // Reset score if reverting from submitted to active
        if (current === ReviewerStatus.submitted && nextState === ReviewerStatus.active) {
            dto.data.score = 0;
        }

        const updated = await this.repository.update(id, { status: nextState, score: dto.data.score });
        const syncedProjectStage = await this.projectStageSynchronizer.syncProjectStageStatus(reviewerDoc.projectStage.toString(), projectStageDoc);

        return {updated, syncedProjectStage};
    }    

    // --- Update reviewer data (weight, etc.) ---
    async updateReviewerData(dto: UpdateReviewerDTO) {
        const { id, data, userId } = dto;
        const reviewerDoc = await this.repository.findById(id);
        if (!reviewerDoc) throw new Error("Reviewer not found");

        const projectStageDoc = await this.projectStageRepo.findById(reviewerDoc.projectStage.toString());
        if (!projectStageDoc) throw new Error("Project Stage not found");

        // Cannot update data if stage is finalized
        if ([ProjectDocStatus.accepted, ProjectDocStatus.rejected].includes(projectStageDoc.status)) {
            throw new Error(`The project stage is already ${projectStageDoc.status} and cannot be modified.`);
        }

        const { weight } = data;
        if (weight !== undefined) {
            if (reviewerDoc.status === ReviewerStatus.approved) {
                throw new Error("Cannot update weight for approved reviewer!");
            }
            if (weight <= 0) {
                throw new Error("Invalid weight value");
            }
        }

        const updated = await this.repository.update(id, data);
        return updated;
    }

    async deleteReviewer(dto: DeleteReviewerDTO) {
        const reviewerDoc = await this.repository.findById(dto.id);
        if (!reviewerDoc) throw new Error("Reviewer not found");

        if (reviewerDoc.status === ReviewerStatus.approved) {
            throw new Error("Cannot delete approved reviewer");
        }
        //delete the result too
        const deleted = await this.repository.delete(dto.id);
        // don't forget to delete many results here (call repository that handles results if needed)        
        await this.projectStageSynchronizer.syncProjectStageStatus(reviewerDoc.projectStage.toString());
        return deleted
    }
}
