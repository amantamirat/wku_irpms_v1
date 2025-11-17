// reviewer.repository.ts
import mongoose from "mongoose";
import { Reviewer, IReviewer } from "./reviewer.model";
import { CreateReviewerDTO, UpdateReviewerDTO } from "./reviewer.dto";
import { ReviewerStatus } from "./reviewer.enum";

export interface IReviewerRepository {
    findById(id: string): Promise<IReviewer | null>;
    findByProjectStage(projectStageId: string): Promise<Partial<IReviewer>[]>;
    findByApplicant(applicantId: string): Promise<Partial<IReviewer>[]>;
    existsActiveByProjectStage(projectStageId: string): Promise<boolean>;
    create(dto: CreateReviewerDTO): Promise<IReviewer>;
    update(id: string, data: UpdateReviewerDTO["data"]): Promise<IReviewer>;
    delete(id: string): Promise<void>;
}

// MongoDB implementation
export class ReviewerRepository implements IReviewerRepository {

    async findById(id: string) {
        return Reviewer.findById(new mongoose.Types.ObjectId(id)).exec();
    }

    async findByProjectStage(projectStageId: string) {
        return Reviewer.find({ projectStage: new mongoose.Types.ObjectId(projectStageId) })
            .populate("applicant")
            .exec();
    }

    async findByApplicant(applicantId: string) {
        return Reviewer.find({ applicant: new mongoose.Types.ObjectId(applicantId) })
            .populate({
                path: "projectStage",
                populate: {
                    path: "project",
                },
            })
            .exec();
    }

    async create(dto: CreateReviewerDTO) {
        const data: Partial<IReviewer> = {
            projectStage: new mongoose.Types.ObjectId(dto.projectStageId),
            applicant: new mongoose.Types.ObjectId(dto.applicantId),
        };
        return Reviewer.create(data);
    }

    async update(id: string, dtoData: UpdateReviewerDTO["data"]): Promise<IReviewer> {
        const updateData: Partial<IReviewer> = {};

        if (dtoData.status !== undefined) {
            updateData.status = dtoData.status;
        }

        const updatedReviewer = await Reviewer.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true }
        ).exec(); // <--- converts Query to Promise

        if (!updatedReviewer) throw new Error("Reviewer not found");

        return updatedReviewer;
    }

    async existsActiveByProjectStage(projectStageId: string): Promise<boolean> {
        const doc = await Reviewer.exists({
            projectStage: new mongoose.Types.ObjectId(projectStageId),
            status: ReviewerStatus.active
        });
        return !!doc;
    }



    async delete(id: string) {
        await Reviewer.findByIdAndDelete(new mongoose.Types.ObjectId(id)).exec();
    }
}
