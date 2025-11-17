import { CacheService } from "../../../../util/cache/cache.service";
import { DeleteDto } from "../../../../util/delete.dto";
import { PERMISSIONS } from "../../../../util/permissions";
import Applicant from "../../../applicants/applicant.model";
import { Criterion } from "../../../evaluations/criteria/criterion.model";
import { Collaborator } from "../../../projects/collaborators/collaborator.model";
import { ProjectStageStatus } from "../projects/project.stage.enum";
import { ProjectStage } from "../projects/project.stage.model";
import { Stage } from "../stage.model";
import { Result } from "./results/result.model";
import { CreateReviewerDto, GetReviewerOptions, UpdateReviewerDto } from "./reviewer.dto";
import { ReviewerStatus } from "./reviewer.enum";
import { Reviewer } from "./reviewer.model";



export class ReviewerService {

    static async createReviewer(dto: CreateReviewerDto) {
        const { projectStage, applicant } = dto;
        const projectStageDoc = await ProjectStage.findById(projectStage);
        if (!projectStageDoc) throw new Error("Project Stage not found");
        const currentProjectStageStatus = projectStageDoc.status;
        if (currentProjectStageStatus === ProjectStageStatus.accepted ||
            currentProjectStageStatus === ProjectStageStatus.rejected) {
            throw new Error(`This project stage is already ${currentProjectStageStatus} and cannot be modified.`);
        }
        const applicantDoc = await Applicant.findById(applicant).lean();
        if (!applicantDoc) throw new Error("Applicant not found");
        const collaborators = await Collaborator.find({ project: projectStageDoc.project }).lean();
        if (collaborators.find(c => c.applicant.toString() === applicant.toString())) {
            throw new Error("Reviewer applicant is already a collaborator on the project");
        }
        const createdReviewer = await Reviewer.create({ ...dto, status: ReviewerStatus.pending });
        if (currentProjectStageStatus === ProjectStageStatus.submitted) {
            projectStageDoc.status = ProjectStageStatus.on_review;
            await projectStageDoc.save();
        }
        return createdReviewer;
    }

    static async getReviewers(options: GetReviewerOptions) {
        const filter: any = {};
        if (options.applicant) filter.applicant = options.applicant;
        if (options.projectStage) filter.projectStage = options.projectStage;
        let query = Reviewer.find(filter);
        if (options.applicant && !options.projectStage) {
            query = query.populate({
                path: "projectStage",
                populate: {
                    path: "project",
                },
            });
        }
        if (options.projectStage && !options.applicant) {
            query = query.populate("applicant");
        }
        // const reviewers = await Reviewer.find(filter).populate("applicant").populate("projectStage").lean();
        //  return reviewers;
        return query.lean();
    }

    static async updateReviewer(dto: UpdateReviewerDto) {
        const { id, data, userId } = dto;

        const reviewerDoc = await Reviewer.findById(id);
        if (!reviewerDoc) throw new Error("Reviewer not found");

        const current = reviewerDoc.status;
        const next = data.status;

        const isApprovalTransition =
            current === ReviewerStatus.approved || next === ReviewerStatus.approved;

        if (isApprovalTransition) {
            const hasPermission = await CacheService.hasPermissions(userId, [PERMISSIONS.REVIEWER.APPROVE]);
            if (!hasPermission) {
                throw new Error("You do not have permission to approve reviewer status.");
            }

        } else {
            const applicantDoc = await Applicant.findOne({ user: userId }).lean();
            if (!applicantDoc) throw new Error("Applicant not found");
            if (String(reviewerDoc.applicant) !== String(applicantDoc._id)) {
                throw new Error(`You are not allowed to ${current} this reviewer status.`);
            }
        }

        const transitions: Record<ReviewerStatus, ReviewerStatus[]> = {
            [ReviewerStatus.pending]: [ReviewerStatus.active],
            [ReviewerStatus.active]: [ReviewerStatus.pending, ReviewerStatus.submitted],
            [ReviewerStatus.submitted]: [ReviewerStatus.active, ReviewerStatus.approved],
            [ReviewerStatus.approved]: [ReviewerStatus.submitted]
        };

        const allowedNext = transitions[current];
        if (!allowedNext.includes(next!)) {
            throw new Error(`Invalid state transition: ${current} → ${next}`);
        }

        const projectStageDoc = await ProjectStage.findById(reviewerDoc.projectStage);
        if (!projectStageDoc) throw new Error("Project Stage not found");

        if (next === ReviewerStatus.pending) {
            const resultsCount = await Result.countDocuments({ reviewer: reviewerDoc._id });
            if (resultsCount > 0) {
                throw new Error("Cannot revert to pending status after starting the review.");
            }
        }
        else if (next === ReviewerStatus.active) {
            /*
            if (projectStageDoc.status === ProjectStageStatus.submitted) {
                projectStageDoc.status = ProjectStageStatus.on_review;
                await projectStageDoc.save();
            }
            */
        }
        else if (next === ReviewerStatus.submitted) {
            const stageDoc = await Stage.findById(projectStageDoc.stage).lean();
            if (!stageDoc) throw new Error("Stage not found");
            const evaluationId = stageDoc.evaluation;
            const [resultsCount, criteriaCount] = await Promise.all([
                Result.countDocuments({ reviewer: reviewerDoc._id }),
                Criterion.countDocuments({ evaluation: evaluationId })
            ]);
            if (resultsCount !== criteriaCount) {
                throw new Error("Please complete all evaluation criteria before submitting.");
            }
        }
        reviewerDoc.status = next!;
        const savedReviewer = await reviewerDoc.save();
        return savedReviewer;
    }


    static async deleteReviewer(dto: DeleteDto) {
        const { id } = dto;
        const reviewer = await Reviewer.findById(id);
        if (!reviewer) throw new Error("Reviewer not found");
        if (reviewer.status !== ReviewerStatus.pending) {
            throw new Error("Can Not Delete Non Pending Reviewer");
        }
        const deletedReviewer = await reviewer.deleteOne();
        const activeReviewers = await Reviewer.countDocuments({
            projectStage: reviewer.projectStage,
            status: ReviewerStatus.active
        });
        if (activeReviewers === 0) {
            await ProjectStage.findByIdAndUpdate(reviewer.projectStage, {
                status: ProjectStageStatus.submitted
            });
        }
        return deletedReviewer;
    }
}
