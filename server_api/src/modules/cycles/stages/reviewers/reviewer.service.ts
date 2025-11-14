import mongoose from "mongoose";
import { ReviewerStatus } from "./reviewer.enum";
import { Reviewer } from "./reviewer.model";
import { ProjectStage } from "../../../projects/stages/project.stage.model";
import { ProjectStageStatus } from "../../../projects/stages/project.stage.enum";
import Applicant from "../../../applicants/applicant.model";
import { Collaborator } from "../../../projects/collaborators/collaborator.model";
import { CreateReviewerDto, GetReviewerOptions, UpdateReviewerDto } from "./reviewer.dto";
import { DeleteDto } from "../../../../util/delete.dto";



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
        if (options.projectStage) filter.projectStage = options.projectStage;
        if (options.applicant) filter.applicant = options.applicant;
        const reviewers = await Reviewer.find(filter).populate("applicant").populate("projectStage").lean();
        return reviewers;
    }

    static async updateReviewer(dto: UpdateReviewerDto) {
        const { id, data, userId } = dto;
        
        const reviewerDoc = await Reviewer.findById(id);
        if (!reviewerDoc) throw new Error("Reviewer not found");
        
        const applicantDoc = await Applicant.findOne({ user: userId }).lean();
        if (!applicantDoc) throw new Error("Applicant not found");
        if (String(reviewerDoc.applicant) !== String(applicantDoc._id)) {
            throw new Error("You are not allowed to update this reviewer status.")
        }
        
        const current = reviewerDoc.status;
        const next = data.status;
        const transitions: Record<ReviewerStatus, ReviewerStatus[]> = {
            [ReviewerStatus.pending]: [ReviewerStatus.active],
            [ReviewerStatus.active]: [ReviewerStatus.pending, ReviewerStatus.submitted],
            [ReviewerStatus.submitted]: [ReviewerStatus.active],
            [ReviewerStatus.approved]: [ReviewerStatus.submitted]
        };
        
        const allowedNext = transitions[current];
        if (!allowedNext.includes(next!)) {
            throw new Error(`Invalid state transition: ${current} → ${next}`);
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
