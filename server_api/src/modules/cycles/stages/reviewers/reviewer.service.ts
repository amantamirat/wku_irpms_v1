import { CacheService } from "../../../../util/cache/cache.service";
import { DeleteDto } from "../../../../util/delete.dto";
import { PERMISSIONS } from "../../../../util/permissions";
import Applicant from "../../../applicants/applicant.model";
import { Criterion } from "../../../evaluations/criteria/criterion.model";
import { Collaborator } from "../../../projects/collaborators/collaborator.model";
import { ProjectStageStatus } from "../projects/project.stage.enum";
import { ProjectStage } from "../projects/project.stage.model";
import { Result } from "./results/result.model";
import { CreateReviewerDto, GetReviewerOptions, UpdateReviewerDto } from "./reviewer.dto";
import { ReviewerStatus } from "./reviewer.enum";
import { Reviewer } from "./reviewer.model";



export class ReviewerService {

    private static async validateReviewer(reviewer: CreateReviewerDto) {
        const projectStage = await ProjectStage.findOne({ _id: reviewer.projectStage, status: ProjectStageStatus.submitted }).lean();
        if (!projectStage) throw new Error("Project Stage not found");
        const applicant = await Applicant.findById(reviewer.applicant).lean();
        if (!applicant) throw new Error("Applicant not found");
        const collaborators = await Collaborator.find({ project: projectStage.project }).lean();
        if (collaborators.find(c => c.applicant.toString() === reviewer.applicant.toString())) {
            throw new Error("Reviewer applicant is already a collaborator on the project");
        }
    }

    static async createReviewer(data: CreateReviewerDto) {
        await this.validateReviewer(data);
        const createdReviewer = await Reviewer.create({ ...data, status: ReviewerStatus.pending });
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

        if (next === ReviewerStatus.submitted) {

            const projectStageDoc = await ProjectStage.findById(
                reviewerDoc.projectStage,
                { stage: 1 }
            )
                .populate("stage", "evaluation")
                .lean();

            if (!projectStageDoc) throw new Error("Project Stage not found");

            const evaluationId = (projectStageDoc.stage as any).evaluation;

            const [resultsCount, criteriaCount] = await Promise.all([
                Result.countDocuments({ reviewer: reviewerDoc._id }),
                Criterion.countDocuments({ evaluation: evaluationId })
            ]);

            if (resultsCount !== criteriaCount) {
                throw new Error("Please complete all evaluation criteria before submitting.");
            }
        }

        Object.assign(reviewerDoc, data);
        return reviewerDoc.save();
    }

    static async deleteReviewer(dto: DeleteDto) {
        const { id } = dto;
        const reviewer = await Reviewer.findById(id);
        if (!reviewer) throw new Error("Reviewer not found");
        if (reviewer.status !== ReviewerStatus.pending) {
            throw new Error("Can Not Delete Non Pending Reviewer");
        }
        return await reviewer.deleteOne();
    }
}
