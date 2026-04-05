import mongoose from "mongoose";
import { Reviewer, IReviewer } from "./reviewer.model";
import { CreateReviewerDTO, ExistsReviewersDTO, GetReviewersDTO, UpdateReviewerDTO } from "./reviewer.dto";
import { ReviewerStatus } from "./reviewer.status";

export interface IReviewerRepository {
    findById(id: string): Promise<IReviewer | null>;
    find(options: GetReviewersDTO): Promise<Partial<IReviewer>[]>;
    create(dto: CreateReviewerDTO): Promise<IReviewer>;
    update(id: string, data: UpdateReviewerDTO["data"]): Promise<IReviewer | null>;
    updateStatus(id: string, newStatus: ReviewerStatus): Promise<IReviewer | null>;
    exist(filters: ExistsReviewersDTO): Promise<boolean>;
    delete(id: string): Promise<IReviewer | null>;
}

// MongoDB implementation
export class ReviewerRepository implements IReviewerRepository {

    async findById(id: string) {
        return Reviewer.findById(new mongoose.Types.ObjectId(id)).exec();
    }

    async find(options: GetReviewersDTO) {
        const query: any = {};

        if (options.projectStage) {
            query.projectStage = new mongoose.Types.ObjectId(options.projectStage);
        }

        if (options.applicant) {
            query.applicant = new mongoose.Types.ObjectId(options.applicant);
        }

        let reviewerQuery = Reviewer.find(query);

        if (options.populate && options.projectStage) {
            reviewerQuery = reviewerQuery.populate({
                path: 'applicant',
                populate: { path: 'workspace' }
            });
        }
        if (options.populate && options.applicant) {
            reviewerQuery = reviewerQuery.populate({
                path: "projectStage",
                populate: {
                    path: "stage project",
                },
            });
        }

        return reviewerQuery.exec();
    }


    async create(dto: CreateReviewerDTO) {
        const data: Partial<IReviewer> = {
            projectStage: new mongoose.Types.ObjectId(dto.projectStage),
            applicant: new mongoose.Types.ObjectId(dto.applicant),
        };
        return Reviewer.create(data);
    }

    async update(id: string, dtoData: UpdateReviewerDTO["data"]): Promise<IReviewer | null> {
        const updateData: Partial<IReviewer> = {};
        if (dtoData.score !== undefined) {
            updateData.score = dtoData.score;
        }
        if (dtoData.weight !== undefined) {
            updateData.weight = dtoData.weight;
        }
        return Reviewer.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true }
        ).exec();
        // return updated;
    }

    async updateStatus(id: string, newStatus: ReviewerStatus) {
        return Reviewer.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            { $set: { status: newStatus } },
            { new: true }
        ).exec();
    }
    async exist(filters: ExistsReviewersDTO): Promise<boolean> {
        const query: any = {};
        if (filters.applicant) {
            query.applicant = new mongoose.Types.ObjectId(filters.applicant);
        }
        if (filters.projectStage) {
            query.projectStage = new mongoose.Types.ObjectId(filters.projectStage);
        }
        const result = await Reviewer.exists(query).exec();
        return result !== null;
    }

    async delete(id: string) {
        return Reviewer.findByIdAndDelete(new mongoose.Types.ObjectId(id)).exec();
    }
}
