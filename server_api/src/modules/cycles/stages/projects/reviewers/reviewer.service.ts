// reviewer.service.ts
import { IReviewerRepository, ReviewerRepository } from "./reviewer.repository";
import { CreateReviewerDTO, DeleteReviewerDTO, GetReviewersDTO, UpdateReviewerDTO } from "./reviewer.dto";
import { ReviewerStatus } from "./reviewer.enum";
import { ReviewerStateMachine } from "./reviewer.state-machine";
import Applicant from "../../../../applicants/applicant.model";
import { Collaborator } from "../../../../projects/collaborators/collaborator.model";
import { Criterion } from "../../../../evaluations/criteria/criterion.model";
import { Stage } from "../../stage.model";
import { ProjectStageStatus } from "../project-stage.enum";
import { IResultRepository, ResultRepository } from "./results/result.repository";
import { IProjectStageRepository, ProjectStageRepository } from "../project-stage.repository";
import { ProjectStageSynchronizer } from "../project-stage.synchronizer";
import { FormType } from "../../../../evaluations/criteria/criterion.enum";

export class ReviewerService {

    private repository: IReviewerRepository;
    private resultRepo: IResultRepository;
    private projectStageRepo: IProjectStageRepository;
    private projectStageSynchronizer: ProjectStageSynchronizer;

    constructor(repository?: IReviewerRepository, resultRepo?: IResultRepository,
        projectStageRepo?: IProjectStageRepository, projectStageSynchronizer?: ProjectStageSynchronizer
    ) {
        this.repository = repository || new ReviewerRepository();
        this.resultRepo = resultRepo || new ResultRepository();
        this.projectStageRepo = projectStageRepo || new ProjectStageRepository();
        this.projectStageSynchronizer = projectStageSynchronizer ||
            new ProjectStageSynchronizer(this.projectStageRepo, this.repository);
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

        const isReviewerTransistion =
            current === ReviewerStatus.active || next === ReviewerStatus.active;
        if (isReviewerTransistion) {
            const applicantDoc = await Applicant.findOne({ user: userId }).lean();
            if (!applicantDoc) throw new Error("Applicant not found");
            if (String(reviewerDoc.applicant) !== String(applicantDoc._id)) {
                throw new Error(`You are not allowed to ${current} this reviewer status.`);
            }
        }

        // Validation if status is submitted
        let totalScore;
        if (current === ReviewerStatus.active && next === ReviewerStatus.submitted) {
            const projectStageDoc = await this.projectStageRepo.findById(reviewerDoc.projectStage.toString());
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

            const results = await this.resultRepo.findByReviewer(id);
            totalScore = 0;
            for (const r of results) {
                if (r.criterion.form_type === FormType.closed) {
                    // Closed criterion → use selectedOption score
                    if (!r.selectedOption) throw new Error(`Selected option missing for criterion ${r.criterion._id}`);
                    totalScore += r.selectedOption.score;
                } else {
                    // Open criterion → use result.score directly
                    totalScore += r.score || 0;
                }
            }
        }
        reviewerDoc.status = next;
        const updated = await this.repository.update(id, { status: next, totalScore });
        await this.projectStageSynchronizer.syncProjectStageStatus(reviewerDoc.projectStage.toString());

        return updated;
    }

    async deleteReviewer(dto: DeleteReviewerDTO) {
        const reviewerDoc = await this.repository.findById(dto.id);
        if (!reviewerDoc) throw new Error("Reviewer not found");

        if (reviewerDoc.status !== ReviewerStatus.pending) {
            throw new Error("Cannot delete non-pending reviewer");
        }

        const deleted = await this.repository.delete(dto.id);
        await this.projectStageSynchronizer.syncProjectStageStatus(reviewerDoc.projectStage.toString());
        return deleted
    }
}
