import mongoose from "mongoose";
import {
    PhaseActivity,
    IPhaseActivity,
    PhaseActivityStatus,
} from "./phase-activity.model";
import {
    CreatePhaseActivityDto,
    FilterPhaseActivities,
    UpdatePhaseActivityDto,
} from "./phase-activity.dto";
import { FilterOptions } from "../../../common/dtos/filter.dto";

export interface IPhaseActivityRepository {
    findById(
        id: string,
        options?: FilterOptions
    ): Promise<IPhaseActivity | null>;

    find(
        filters: FilterPhaseActivities,
        options?: FilterOptions
    ): Promise<IPhaseActivity[]>;

    findOne(
        phaseId: string,
        title: string
    ): Promise<IPhaseActivity | null>;

    create(
        dto: CreatePhaseActivityData
    ): Promise<IPhaseActivity>;

    createMany(
        dtos: CreatePhaseActivityData[]
    ): Promise<IPhaseActivity[]>;

    update(
        id: string,
        data: UpdatePhaseActivityData,
        userId: string
    ): Promise<IPhaseActivity | null>;

    updateStatus(
        id: string,
        status: PhaseActivityStatus,
        userId: string,
        reason?: string,
    ): Promise<IPhaseActivity | null>;

    countByPhase(
        phaseId: string
    ): Promise<number>;

    getProjectProgressAggregation(projectId: mongoose.Types.ObjectId): any;

    delete(
        id: string
    ): Promise<IPhaseActivity | null>;

    deleteByPhase(
        phaseId: string
    ): Promise<any>;
}


export type CreatePhaseActivityData = CreatePhaseActivityDto;
export type UpdatePhaseActivityData = UpdatePhaseActivityDto["data"];


export class PhaseActivityRepository
    implements IPhaseActivityRepository {

    async findById(
        id: string,
        options?: FilterOptions
    ): Promise<IPhaseActivity | null> {

        let query = PhaseActivity.findById(
            new mongoose.Types.ObjectId(id)
        );

        if (options?.populate) {
            query = query.populate({
                path: "phase",
            });
        }

        return query
            .lean<IPhaseActivity>()
            .exec();
    }

    async find(
        filters: FilterPhaseActivities,
        options?: FilterOptions
    ): Promise<IPhaseActivity[]> {

        const query: Record<string, unknown> = {};

        if (filters.project) {
            query.project = new mongoose.Types.ObjectId(
                filters.project
            );
        }

        if (filters.phase) {
            query.phase = new mongoose.Types.ObjectId(
                filters.phase
            );
        }

        if (filters.status) {
            query.status = filters.status;
        }

        if (filters.kind) {
            query.kind = filters.kind;
        }

        let activityQuery = PhaseActivity.find(query)
            .sort({ createdAt: 1 });

        if (options?.populate) {
            activityQuery = activityQuery.populate({
                path: "phase",
            });
        }

        return activityQuery
            .lean<IPhaseActivity[]>()
            .exec();
    }

    async findOne(
        phaseId: string,
        title: string
    ): Promise<IPhaseActivity | null> {

        return PhaseActivity.findOne({
            phase: new mongoose.Types.ObjectId(phaseId),
            title,
        })
            .lean<IPhaseActivity>()
            .exec();
    }

    async create(
        dto: CreatePhaseActivityData
    ): Promise<IPhaseActivity> {

        const { phase, ...rest } = dto as any;

        const data = {
            ...rest,
            ...(phase ? { phase: new mongoose.Types.ObjectId(phase) } : {}),
        };

        return PhaseActivity.create(data);
    }

    async createMany(
        dtos: CreatePhaseActivityData[]
    ): Promise<IPhaseActivity[]> {

        const data = dtos.map(dto => {
            const { phase, ...rest } = dto as any;

            return {
                ...rest,
                ...(phase ? { phase: new mongoose.Types.ObjectId(phase) } : {}),
            };
        });

        const results = await PhaseActivity.create(data, { ordered: true });

        return results as unknown as IPhaseActivity[];
    }

    
    async update(
        id: string,
        data: UpdatePhaseActivityData,
        userId: string
    ): Promise<IPhaseActivity | null> {

        const activity = await PhaseActivity.findById(id);

        if (!activity) return null;

        const { kind, details, ...rest } = data as any;

        activity.set({
            ...rest,
            updatedBy: userId,
        });

        const kindChanged =
            kind !== undefined && kind !== activity.kind;

        if (kindChanged) {
            activity.set("kind", kind);
            activity.set("details", details ?? {});
        } else if (details !== undefined) {
            const existingDetails =
                activity.get("details") ?? {};

            activity.set("details", {
                ...existingDetails,
                ...details,
            });
        }

        return activity.save();
    }

    async updateStatus(
        id: string,
        status: PhaseActivityStatus,
        userId: string,
        reason?: string
    ): Promise<IPhaseActivity | null> {

        // Only touches status/statusHistory, so no details validation needed
        return PhaseActivity.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            {
                $set: {
                    status,
                },
                $push: {
                    statusHistory: {
                        status,
                        changedBy: new mongoose.Types.ObjectId(userId),
                        changedAt: new Date(),
                        reason,
                    },
                },
            },
            {
                new: true,
                runValidators: true,
            }
        ).exec();
    }

    async countByPhase(
        phaseId: string
    ): Promise<number> {

        return PhaseActivity.countDocuments({
            phase: new mongoose.Types.ObjectId(phaseId),
        }).exec();
    }

    async getProjectProgressAggregation(projectId: mongoose.Types.ObjectId) {
        return await PhaseActivity.aggregate([
            {
                $match: {
                    project: projectId,
                    status: {
                        $nin: [
                            PhaseActivityStatus.cancelled,
                            PhaseActivityStatus.refused,
                        ],
                    },
                },
            },
            {
                $group: {
                    _id: null,

                    total: { $sum: 1 },

                    completed: {
                        $sum: {
                            $cond: [
                                { $eq: ["$status", PhaseActivityStatus.completed] },
                                1,
                                0,
                            ],
                        },
                    },

                    totalCost: {
                        $sum: { $ifNull: ["$cost", 0] },
                    },

                    completedCost: {
                        $sum: {
                            $cond: [
                                { $eq: ["$status", PhaseActivityStatus.completed] },
                                { $ifNull: ["$cost", 0] },
                                0,
                            ],
                        },
                    },
                },
            },
        ]);
    }

    async delete(
        id: string
    ): Promise<IPhaseActivity | null> {

        return PhaseActivity.findByIdAndDelete(
            new mongoose.Types.ObjectId(id)
        ).exec();
    }

    async deleteByPhase(
        phaseId: string
    ): Promise<any> {

        return PhaseActivity.deleteMany({
            phase: new mongoose.Types.ObjectId(phaseId),
        }).exec();
    }
}