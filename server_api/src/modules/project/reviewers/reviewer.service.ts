import mongoose from "mongoose";
import { ReviewerStatus } from "./reviewer.enum";
import { Reviewer } from "./reviewer.model";

export interface GetReviewerOptions {
    projectStage?: mongoose.Types.ObjectId;
    applicant?: mongoose.Types.ObjectId;
}

export interface CreateReviewerDto {
    project: mongoose.Types.ObjectId;
    applicant: mongoose.Types.ObjectId;
    status?: ReviewerStatus;
}

export class ReviewerService {   

    static async createReviewer(data: CreateReviewerDto) {        
        const createdReviewer = await Reviewer.create({ ...data, status: data.status ?? ReviewerStatus.pending });
        return createdReviewer;
    }

    static async getReviewers(options: GetReviewerOptions) {
        const filter: any = {};
        if (options.projectStage) filter.projectStatus = options.projectStage;
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
