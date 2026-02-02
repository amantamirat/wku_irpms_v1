// reviewer.repository.ts
import mongoose from "mongoose";
import { Reviewer, IReviewer } from "./reviewer.model";
import { CreateReviewerDTO, GetReviewersDTO, UpdateReviewerDTO } from "./reviewer.dto";

export interface IReviewerRepository {
    findById(id: string): Promise<IReviewer | null>;
    find(options: GetReviewersDTO): Promise<Partial<IReviewer>[]>;
    //findByProjectStage(projectStageId: string): Promise<Partial<IReviewer>[]>;
    //findByApplicant(applicantId: string): Promise<Partial<IReviewer>[]>;
    create(dto: CreateReviewerDTO): Promise<IReviewer>;
    update(id: string, data: UpdateReviewerDTO["data"]): Promise<IReviewer | null>;
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
        if (dtoData.status !== undefined) {
            updateData.status = dtoData.status;
        }
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

    async delete(id: string) {
        return Reviewer.findByIdAndDelete(new mongoose.Types.ObjectId(id)).exec();
    }
}
