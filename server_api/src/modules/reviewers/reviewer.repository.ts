import mongoose from "mongoose";
import { IReviewer, Reviewer, ReviewerTargetType } from "./reviewer.model";
import { ReviewerStatus } from "./reviewer.state-machine";
import { FindOptions } from "../../common/dtos/filter.dto";
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
        options?: FindOptions
    ): Promise<IReviewer | null>;

    find(
        filter?: FilterReviewersDto,
        options?: FindOptions
    ): Promise<IReviewer[]>;

    findByApplication(
        applicationId: string,
        options?: FindOptions
    ): Promise<IReviewer[]>;

    findByVerification(
        verificationId: string,
        options?: FindOptions
    ): Promise<IReviewer[]>;

    countByApplication(
        applicationId: string
    ): Promise<number>;

    countByVerification(
        verificationId: string
    ): Promise<number>;

    update(
        id: string,
        data: Partial<IReviewer>
    ): Promise<IReviewer | null>;

    exists(existFilter: ExistsReviewersDTO): Promise<boolean>;

    updateStatus(
        id: string,
        status: ReviewerStatus
    ): Promise<IReviewer | null>;

    delete(
        id: string
    ): Promise<IReviewer | null>;
}


export class ReviewerRepository
    implements IReviewerRepository {


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
        options?: FindOptions
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
        options?: FindOptions
    ): Promise<IReviewer[]> {

        const filter: any = {};

        if (reviewerFilter.application) {
            filter.application =
                new mongoose.Types.ObjectId(
                    reviewerFilter.application
                );
        }

        if (reviewerFilter.verification) {
            filter.verification =
                new mongoose.Types.ObjectId(
                    reviewerFilter.verification
                );
        }

        if (reviewerFilter.reviewer) {
            filter.reviewer =
                new mongoose.Types.ObjectId(
                    reviewerFilter.reviewer
                );
        }

        if (reviewerFilter.status) {
            filter.status =
                reviewerFilter.status;
        }

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
    // FIND BY APPLICATION
    // --------------------------------------------------

    async findByApplication(
        applicationId: string,
        options?: FindOptions
    ): Promise<IReviewer[]> {

        const query =
            Reviewer
                .find({
                    application:
                        new mongoose.Types.ObjectId(
                            applicationId
                        )
                })
                .sort({
                    createdAt: -1
                });

        if (options?.populate) {
            query
                .populate("reviewer")
                .populate("application");
        }

        return query;
    }


    // --------------------------------------------------
    // FIND BY VERIFICATION
    // --------------------------------------------------

    async findByVerification(
        verificationId: string,
        options?: FindOptions
    ): Promise<IReviewer[]> {

        const query =
            Reviewer
                .find({
                    verification:
                        new mongoose.Types.ObjectId(
                            verificationId
                        )
                })
                .sort({
                    createdAt: -1
                });

        if (options?.populate) {
            query
                .populate("reviewer")
                .populate("verification");
        }

        return query;
    }


    // --------------------------------------------------
    // COUNT APPLICATION REVIEWERS
    // --------------------------------------------------

    async countByApplication(
        applicationId: string
    ): Promise<number> {

        return Reviewer.countDocuments({
            application:
                new mongoose.Types.ObjectId(
                    applicationId
                )
        });
    }


    // --------------------------------------------------
    // COUNT VERIFICATION REVIEWERS
    // --------------------------------------------------

    async countByVerification(
        verificationId: string
    ): Promise<number> {

        return Reviewer.countDocuments({
            verification:
                new mongoose.Types.ObjectId(
                    verificationId
                )
        });
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


    async exists(filters: ExistsReviewersDTO): Promise<boolean> {
        const query: any = {};
        const { reviewer, application, verification } = filters;

        if (!reviewer && !application && !verification) {
            return false;
        }

        if (reviewer) {
            query.reviewer = new mongoose.Types.ObjectId(reviewer);
        }
        if (application) {
            query.application = new mongoose.Types.ObjectId(application);
        }
        if (verification) {
            query.verification = new mongoose.Types.ObjectId(verification);
        }

        const result = await Reviewer.exists(query).exec();
        return result !== null;
    }


    // --------------------------------------------------
    // UPDATE STATUS
    // --------------------------------------------------

    async updateStatus(
        id: string,
        status: ReviewerStatus
    ): Promise<IReviewer | null> {

        return Reviewer.findByIdAndUpdate(
            id,
            {
                $set: {
                    status
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

        return Reviewer.findByIdAndDelete(id);
    }
}