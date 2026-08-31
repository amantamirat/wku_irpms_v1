import mongoose from "mongoose";
import {
    IReviewer,
    Reviewer,
    ReviewerTargetType
} from "./reviewer.model";
import { ReviewerStatus } from "./reviewer.state-machine";
import { FilterOptions } from "../../common/dtos/filter.dto";
import { FilterReviewersDto } from "./reviewer.dto";


export interface CreateReviewerData {
    targetType: ReviewerTargetType;
    reviewer: string;
    project: string;
    application?: string;
    verification?: string;

    evaluation: string;

    score?: number;

    weight?: number;

    status?: ReviewerStatus;
}


export interface ExistsReviewersDTO {
    reviewer?: string;

    application?: string;

    verification?: string;
}


export interface IReviewerRepository {

    create(
        data: CreateReviewerData
    ): Promise<IReviewer>;

    findById(
        id: string,
        options?: FilterOptions
    ): Promise<IReviewer | null>;

    find(
        filter?: FilterReviewersDto,
        options?: FilterOptions
    ): Promise<IReviewer[]>;

    count(
        filter?: FilterReviewersDto
    ): Promise<number>;

    update(
        id: string,
        data: Partial<IReviewer>
    ): Promise<IReviewer | null>;

    exists(
        filter: ExistsReviewersDTO
    ): Promise<boolean>;

    updateStatus(
        id: string,
        status: ReviewerStatus,
        changedBy: string
    ): Promise<IReviewer | null>;

    delete(
        id: string
    ): Promise<IReviewer | null>;
}


export class ReviewerRepository
    implements IReviewerRepository {


    // --------------------------------------------------
    // BUILD FILTER
    // --------------------------------------------------

    private buildFilter(
        reviewerFilter: FilterReviewersDto = {}
    ): Record<string, any> {

        const filter: Record<string, any> = {};


        // Application
        if (reviewerFilter.application) {

            filter.application =
                new mongoose.Types.ObjectId(
                    reviewerFilter.application
                );
        }


        // Verification
        if (reviewerFilter.verification) {

            filter.verification =
                new mongoose.Types.ObjectId(
                    reviewerFilter.verification
                );
        }


        // Reviewer
        if (reviewerFilter.reviewer) {

            filter.reviewer =
                new mongoose.Types.ObjectId(
                    reviewerFilter.reviewer
                );
        }


        // Status
        if (reviewerFilter.status) {

            filter.status =
                reviewerFilter.status;
        }


        return filter;
    }


    // --------------------------------------------------
    // CREATE
    // --------------------------------------------------

    async create(
        data: CreateReviewerData
    ): Promise<IReviewer> {

        return Reviewer.create({

            targetType:
                data.targetType,

            reviewer:
                new mongoose.Types.ObjectId(
                    data.reviewer
                ),

            project:
                new mongoose.Types.ObjectId(
                    data.project
                ),

            application:
                data.application
                    ? new mongoose.Types.ObjectId(
                        data.application
                    )
                    : undefined,

            verification:
                data.verification
                    ? new mongoose.Types.ObjectId(
                        data.verification
                    )
                    : undefined,

            evaluation:
                new mongoose.Types.ObjectId(
                    data.evaluation
                ),

            score:
                data.score,

            weight:
                data.weight,

            status:
                data.status
        });
    }


    // --------------------------------------------------
    // FIND BY ID
    // --------------------------------------------------

    async findById(
        id: string,
        options?: FilterOptions
    ): Promise<IReviewer | null> {

        const query =
            Reviewer.findById(id);


        if (options?.populate) {

            query
                .populate("reviewer")
                .populate("project")
                .populate("application")
                .populate("verification");
        }


        return query;
    }


    // --------------------------------------------------
    // FIND
    // --------------------------------------------------

    async find(
        reviewerFilter: FilterReviewersDto = {},
        options?: FilterOptions
    ): Promise<IReviewer[]> {

        const filter =
            this.buildFilter(
                reviewerFilter
            );


        const query =
            Reviewer
                .find(filter)
                .sort({
                    createdAt: -1
                });


        if (options?.populate) {

            query
                .populate("reviewer")
                .populate("project")
                .populate({
                    path: "application",
                    populate: {
                        path: "stage"
                    }
                })
                .populate("verification");
        }


        return query;
    }


    // --------------------------------------------------
    // COUNT
    // --------------------------------------------------

    async count(
        reviewerFilter: FilterReviewersDto = {}
    ): Promise<number> {

        const filter =
            this.buildFilter(
                reviewerFilter
            );


        return Reviewer.countDocuments(
            filter
        );
    }


    // --------------------------------------------------
    // UPDATE
    // --------------------------------------------------

    async update(
        id: string,
        data: Partial<IReviewer>
    ): Promise<IReviewer | null> {

        return Reviewer.findByIdAndUpdate(
            id,
            {
                $set: data
            },
            {
                new: true,
                runValidators: true
            }
        );
    }


    // --------------------------------------------------
    // EXISTS
    // --------------------------------------------------

    async exists(
        filters: ExistsReviewersDTO
    ): Promise<boolean> {

        const query: Record<string, any> = {};


        const {
            reviewer,
            application,
            verification
        } = filters;


        // No filter
        if (
            !reviewer &&
            !application &&
            !verification
        ) {
            return false;
        }


        // Reviewer
        if (reviewer) {

            query.reviewer =
                new mongoose.Types.ObjectId(
                    reviewer
                );
        }


        // Application
        if (application) {

            query.application =
                new mongoose.Types.ObjectId(
                    application
                );
        }


        // Verification
        if (verification) {

            query.verification =
                new mongoose.Types.ObjectId(
                    verification
                );
        }


        const result =
            await Reviewer
                .exists(query)
                .exec();


        return result !== null;
    }


    // --------------------------------------------------
    // UPDATE STATUS
    // --------------------------------------------------

    async updateStatus(
        id: string,
        status: ReviewerStatus,
        changedBy: string
    ): Promise<IReviewer | null> {

        return Reviewer.findByIdAndUpdate(
            id,
            {
                $set: {
                    status
                },
                $push: {
                    statusHistory: {
                        status,
                        changedBy: new mongoose.Types.ObjectId(changedBy),
                        changedAt: new Date()
                    }
                }
            },
            {
                new: true,
                runValidators: true
            }
        );
    }


    // --------------------------------------------------
    // DELETE
    // --------------------------------------------------

    async delete(
        id: string
    ): Promise<IReviewer | null> {
        return Reviewer.findByIdAndDelete(
            id
        );
    }
}