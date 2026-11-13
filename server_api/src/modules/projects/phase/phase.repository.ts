import mongoose from "mongoose";
import { FilterOptions } from "../../../common/dtos/filter.dto";
import { toObjectId } from "../../../common/utils/mongoose.utils";
import {
    FilterPhases,
    PhaseDto,
    UpdatePhaseDto
} from "./phase.dto";
import { IPhase, Phase, PhaseStatus } from "./phase.model";
import { IStatusHistory } from "../../../common/types/status-history";

export interface CreatePhaseData extends PhaseDto {
    project: string;
    order: number;
    status?: PhaseStatus;
}

export interface UpdatePhaseData extends UpdatePhaseDto {
    status?: PhaseStatus;
    statusHistory?: IStatusHistory<PhaseStatus>;
}

export interface IPhaseRepository {
    findById(id: string): Promise<IPhase | null>;
    find(filters: FilterPhases, options?: FilterOptions): Promise<IPhase[]>;

    findOne(projectId: string, order: number): Promise<IPhase | null>;

    findLastPhase(projectId: string): Promise<IPhase | null>;


    create(data: CreatePhaseData): Promise<IPhase>;

    update(
        id: string,
        data: UpdatePhaseData,
        userId: string,
    ): Promise<IPhase | null>;

    countByProject(projectId: string): Promise<number>;

    updateMany(filter: any, update: any): Promise<any>;


    getProjectProgressAggregation(projectId: mongoose.Types.ObjectId): any;

    delete(id: string): Promise<IPhase | null>;
    deleteByProject(projectId: string): Promise<any>;
}

export class PhaseRepository implements IPhaseRepository {

    async findById(id: string): Promise<IPhase | null> {
        return Phase.findById(new mongoose.Types.ObjectId(id))
            .lean<IPhase>()
            .exec();
    }

    async find(
        filters: FilterPhases,
        options?: FilterOptions
    ): Promise<IPhase[]> {
        const query: Record<string, unknown> = {};

        if (filters.project) {
            query.project = new mongoose.Types.ObjectId(filters.project);
        }

        let phaseQuery = Phase.find(query)
            .sort({ order: 1 });

        if (options?.populate) {
            phaseQuery = phaseQuery
                .populate({
                    path: "project",
                })
                .populate({
                    path: "statusHistory.changedBy",
                    select: "_id name",
                });
        }

        return phaseQuery
            .lean<IPhase[]>()
            .exec();
    }

    async findOne(
        projectId: string,
        order: number
    ): Promise<IPhase | null> {
        return Phase.findOne({
            project: new mongoose.Types.ObjectId(projectId),
            order,
        })
            .lean<IPhase>()
            .exec();
    }
    /**
     * Returns the last phase of a project.
     * Last = highest order.
     */
    async findLastPhase(
        projectId: string
    ): Promise<IPhase | null> {
        return Phase.findOne({
            project: new mongoose.Types.ObjectId(projectId),
        })
            .sort({ order: -1 })
            .lean<IPhase>()
            .exec();
    }

    async create(data: CreatePhaseData): Promise<IPhase> {
        const created = await Phase.create({
            ...data,
            project: toObjectId(data.project),
        });
        return created;
    }

    /**
 * Update phase.
 */
    async update(
        id: string,
        data: Partial<UpdatePhaseData>,
        userId?: string,
        reason?: string,
    ): Promise<IPhase | null> {

        const { status, ...rest } = data;

        return Phase.findByIdAndUpdate(
            toObjectId(id),
            {
                $set: {
                    ...rest,
                    ...(status !== undefined && { status }),
                },
                ...(status !== undefined && {
                    $push: {
                        statusHistory: {
                            status,
                            ...(userId && {
                                changedBy: toObjectId(userId),
                            }),
                            changedAt: new Date(),
                            reason,
                        },
                    },
                }),
            },
            {
                new: true,
                runValidators: true,
            }
        ).exec();
    }

    async updateMany(
        filter: any,
        update: any
    ): Promise<any> {
        return Phase.updateMany(filter, update).exec();
    }

    async countByProject(
        projectId: string
    ): Promise<number> {
        return Phase.countDocuments({
            project: new mongoose.Types.ObjectId(projectId),
        }).exec();
    }

    async getProjectProgressAggregation(projectId: mongoose.Types.ObjectId) {
        return await Phase.aggregate([
            {
                $match: {
                    project: projectId,

                    status: {
                        $nin: [
                            PhaseStatus.cancelled,
                            PhaseStatus.refused,
                        ],
                    },
                },
            },

            {
                $group: {
                    _id: null,

                    total: {
                        $sum: 1,
                    },

                    completed: {
                        $sum: {
                            $cond: [
                                {
                                    $eq: [
                                        '$status',
                                        PhaseStatus.completed,
                                    ],
                                },
                                1,
                                0,
                            ],
                        },
                    },
                },
            },
        ]);
    }

    async delete(id: string): Promise<IPhase | null> {
        return Phase.findByIdAndDelete(
            new mongoose.Types.ObjectId(id)
        ).exec();
    }



    async deleteByProject(projectId: string): Promise<any> {
        return Phase.deleteMany({
            project: new mongoose.Types.ObjectId(projectId),
        }).exec();
    }
}