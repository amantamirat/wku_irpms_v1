import mongoose from "mongoose";
import { CreateReviewerDTO, ExistsReviewersDTO, GetReviewersDTO, UpdateReviewerDTO } from "./reviewer.dto";
import { IReviewer, Reviewer } from "./reviewer.model";
import { ReviewerStatus } from "./reviewer.state-machine";

export interface IReviewerRepository {
    findById(id: string): Promise<IReviewer | null>;
    find(options: GetReviewersDTO): Promise<Partial<IReviewer>[]>;
    create(dto: CreateReviewerDTO): Promise<IReviewer>;
    update(id: string, data: UpdateReviewerDTO["data"]): Promise<IReviewer | null>;
    updateStatus(id: string, newStatus: ReviewerStatus): Promise<IReviewer | null>;
    countByProjectStage(projectStageId: string, status?: ReviewerStatus): Promise<number>;
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

        if (options.projectApplication) {
            query.projectStage = new mongoose.Types.ObjectId(options.projectApplication);
        }

        if (options.reviewer) {
            query.reviewer = new mongoose.Types.ObjectId(options.reviewer);
        }

        // New Status Filtering Logic
        if (options.status) {
            if (Array.isArray(options.status)) {
                // Matches any status present in the array
                query.status = { $in: options.status };
            } else {
                // Matches a single status string
                query.status = options.status;
            }
        }

        let reviewerQuery = Reviewer.find(query);

        if (options.populate) {
            reviewerQuery = reviewerQuery.populate({
                path: 'reviewer'
            });
            reviewerQuery = reviewerQuery.populate({
                path: "projectApplication",
                populate: {
                    path: "grantStage project",
                },
            });
        }

        return reviewerQuery.exec();
    }


    async create(dto: CreateReviewerDTO) {
        const data: Partial<IReviewer> = {
            projectApplication: new mongoose.Types.ObjectId(dto.projectApplication),
            reviewer: new mongoose.Types.ObjectId(dto.reviewer),
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

    async countByProjectStage(
        projectStageId: string,
        status?: ReviewerStatus
    ) {
        return Reviewer.countDocuments({
            projectApplication: new mongoose.Types.ObjectId(projectStageId),
            ...(status !== undefined && { status }),
        });
    }
    async exist(filters: ExistsReviewersDTO): Promise<boolean> {
        const query: any = {};
        if (filters.reviewer) {
            query.applicant = new mongoose.Types.ObjectId(filters.reviewer);
        }
        if (filters.projectApplication) {
            query.projectApplication = new mongoose.Types.ObjectId(filters.projectApplication);
        }
        const result = await Reviewer.exists(query).exec();
        return result !== null;
    }

    async delete(id: string) {
        return Reviewer.findByIdAndDelete(new mongoose.Types.ObjectId(id)).exec();
    }
}
