// reviewer.service.ts
import { IReviewerRepository, ReviewerRepository } from "./reviewer.repository";
import { CreateReviewerDTO, DeleteReviewerDTO, GetReviewersDTO, UpdateReviewerDTO } from "./reviewer.dto";
import { ReviewerStatus } from "./reviewer.enum";
import { ReviewerStateMachine } from "./reviewer.state-machine";
import Applicant from "../../../applicants/applicant.model";
import { Collaborator } from "../../../projects/collaborators/collaborator.model";
import { Criterion } from "../../../evaluations/criteria/criterion.model";
import { Stage } from "../stage.model";
import { ProjectStageStatus } from "../projects/project-stage.enum";
import { ProjectStage } from "../projects/project-stage.model";
import { IResultRepository, ResultRepository } from "./results/result.repository";

export class ReviewerService {
    private repository: IReviewerRepository;
    private resultRepo: IResultRepository;

    constructor(repository?: IReviewerRepository, resultRepo?: IResultRepository) {
        this.repository = repository || new ReviewerRepository();
        this.resultRepo = resultRepo || new ResultRepository();
    }

    async createReviewer(dto: CreateReviewerDTO) {
        const { projectStageId, applicantId } = dto;

        const projectStageDoc = await ProjectStage.findById(projectStageId);
        if (!projectStageDoc) throw new Error("Project Stage not found");

        if ([ProjectStageStatus.accepted, ProjectStageStatus.rejected].includes(projectStageDoc.status)) {
            throw new Error(`This project stage is already ${projectStageDoc.status} and cannot be modified.`);
        }

        const applicantDoc = await Applicant.findById(applicantId).lean();
        if (!applicantDoc) throw new Error("Applicant not found");

        const collaborators = await Collaborator.find({ project: projectStageDoc.project }).lean();
        if (collaborators.find(c => String(c.applicant) === applicantId)) {
            throw new Error("Reviewer applicant is already a collaborator on the project");
        }

        const createdReviewer = await this.repository.create({
            projectStageId,
            applicantId,
            userId: dto.userId
        });

        if (projectStageDoc.status === ProjectStageStatus.submitted) {
            projectStageDoc.status = ProjectStageStatus.on_review;
            await projectStageDoc.save();
        }

        return createdReviewer;
    }

    async getReviewers(options: GetReviewersDTO) {
        if (options.projectStageId) {
            return this.repository.findByProjectStage(options.projectStageId);
        } else if (options.applicantId) {
            return this.repository.findByApplicant(options.applicantId);
        }
        throw new Error("At least one of projectStage or applicant is required");;
    }

    async updateReviewer(dto: UpdateReviewerDTO) {
        const { id, data, userId } = dto;

        const reviewerDoc = await this.repository.findById(id);
        if (!reviewerDoc) throw new Error("Reviewer not found");

        const current = reviewerDoc.status;
        const next = data.status;
        if (!next) throw new Error("Next status is required");

        // --- Use State Machine ---
        ReviewerStateMachine.validateTransition(current, next);

        // Permission check for approval
        const isApprovalTransition = current === ReviewerStatus.approved || next === ReviewerStatus.approved;
        if (isApprovalTransition) {
            // TODO: check user permissions via cache or auth service
        } else {
            const applicantDoc = await Applicant.findOne({ user: userId }).lean();
            if (!applicantDoc) throw new Error("Applicant not found");
            if (String(reviewerDoc.applicant) !== String(applicantDoc._id)) {
                throw new Error(`You are not allowed to ${current} this reviewer status.`);
            }
        }

        // Validation if status is submitted
        if (next === ReviewerStatus.submitted) {
            const projectStageDoc = await ProjectStage.findById(reviewerDoc.projectStage);
            if (!projectStageDoc) throw new Error("Project Stage not found");

            const stageDoc = await Stage.findById(projectStageDoc.stage).lean();
            if (!stageDoc) throw new Error("Stage not found");

            const evaluationId = stageDoc.evaluation;

            const [resultsCount, criteriaCount] = await Promise.all([
                this.resultRepo.countByReviewer(id),
                Criterion.countDocuments({ evaluation: evaluationId })
            ]);

            if (resultsCount !== criteriaCount) {
                throw new Error("Please complete all evaluation criteria before submitting.");
            }
        }

        reviewerDoc.status = next;
        return this.repository.update(id, { status: next });
    }

    async deleteReviewer(dto: DeleteReviewerDTO) {
        const reviewerDoc = await this.repository.findById(dto.id);
        if (!reviewerDoc) throw new Error("Reviewer not found");

        if (reviewerDoc.status !== ReviewerStatus.pending) {
            throw new Error("Cannot delete non-pending reviewer");
        }

        return this.repository.delete(dto.id);
    }
}
