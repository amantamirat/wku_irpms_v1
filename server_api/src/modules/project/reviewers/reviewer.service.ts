import mongoose from "mongoose";
import { ReviewerStatus } from "./reviewer.enum";
import { Reviewer } from "./reviewer.model";
import { ProjectStage } from "../stages/stage.model";
import { ProjectStageStatus } from "../stages/stage.enum";
import Applicant from "../../applicants/applicant.model";
import { Collaborator } from "../collaborators/collaborator.model";

export interface GetReviewerOptions {
    projectStage?: mongoose.Types.ObjectId;
    applicant?: mongoose.Types.ObjectId;
}

export interface CreateReviewerDto {
    projectStage: mongoose.Types.ObjectId;
    applicant: mongoose.Types.ObjectId;
    status?: ReviewerStatus;
}

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
        const createdReviewer = await Reviewer.create({ ...data, status: data.status ?? ReviewerStatus.pending });
        return createdReviewer;
    }

    static async getReviewers(options: GetReviewerOptions) {
        const filter: any = {};
        if (options.projectStage) filter.projectStage = options.projectStage;
        if (options.applicant) filter.applicant = options.applicant;
        const reviewers = await Reviewer.find(filter).populate("applicant").lean();
        return reviewers;
    }

    static async updateReviewer(id: string, data: Partial<CreateReviewerDto>) {
        const reviewer = await Reviewer.findById(id);
        if (!reviewer) throw new Error("Reviewer not found");
        Object.assign(reviewer, data);
        return reviewer.save();
    }

    static async deleteReviewer(id: string) {
        const reviewer = await Reviewer.findById(id);
        if (!reviewer) throw new Error("Reviewer not found");
        if (reviewer.status !== ReviewerStatus.pending) {
            throw new Error("Can Not Delete Non Pending Reviewer");
        }
        return await reviewer.deleteOne();
    }
}
