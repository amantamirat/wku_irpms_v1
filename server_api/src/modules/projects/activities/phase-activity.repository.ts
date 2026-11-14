
import mongoose from "mongoose";
import { FilterOptions } from "../../../common/dtos/filter.dto";
import { toObjectId } from "../../../common/utils/mongoose.utils";

import {
    CreatePhaseActivityDto,
    FilterPhaseActivities,
    UpdatePhaseActivityDto,
} from "./phase-activity.dto";

import {
    IPhaseActivity,
    PhaseActivity,
    PhaseActivityStatus,
} from "./phase-activity.model";

export type CreatePhaseActivityData =
    CreatePhaseActivityDto & {
        project: string;
    };


export interface UpdatePhaseActivityStatusDto {
    status: PhaseActivityStatus;
    reason?: string;
}

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
        data: CreatePhaseActivityData
    ): Promise<IPhaseActivity>;

    createMany(
        data: CreatePhaseActivityData[]
    ): Promise<IPhaseActivity[]>;

    update(
        id: string,
        data: UpdatePhaseActivityDto,
        userId: string
    ): Promise<IPhaseActivity | null>;

    updateStatus(
        id: string,
        data: UpdatePhaseActivityStatusDto,
        userId: string
    ): Promise<IPhaseActivity | null>;

    countByPhase(phaseId: string): Promise<number>;

    getProjectProgressAggregation(
        projectId: mongoose.Types.ObjectId
    ): Promise<any>;

    delete(id: string): Promise<IPhaseActivity | null>;

    deleteByPhase(phaseId: string): Promise<any>;
}

export class PhaseActivityRepository
    implements IPhaseActivityRepository {

    async findById(
        id: string,
        options?: FilterOptions
    ): Promise<IPhaseActivity | null> {
        let query = PhaseActivity.findById(toObjectId(id));

        if (options?.populate) {
            query = query
                .populate("project")
                .populate("phase")
                .populate({
                    path: "statusHistory.changedBy",
                    select: "_id name",
                });
        }

        return query.lean<IPhaseActivity>().exec();
    }

    async find(
        filters: FilterPhaseActivities,
        options?: FilterOptions
    ): Promise<IPhaseActivity[]> {
        const query: Record<string, unknown> = {};

        if (filters.project) {
            query.project = toObjectId(filters.project.toString());
        }

        if (filters.phase) {
            query.phase = toObjectId(filters.phase.toString());
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
            activityQuery = activityQuery
                .populate("project")
                .populate("phase")
                .populate({
                    path: "statusHistory.changedBy",
                    select: "_id name",
                });
        }

        return activityQuery.lean<IPhaseActivity[]>().exec();
    }

    async findOne(
        phaseId: string,
        title: string
    ): Promise<IPhaseActivity | null> {
        return PhaseActivity.findOne({
            phase: toObjectId(phaseId),
            title,
        })
            .lean<IPhaseActivity>()
            .exec();
    }

    async create(
        data: CreatePhaseActivityData
    ): Promise<IPhaseActivity> {
        const created = await PhaseActivity.create({
            ...data,
            project: toObjectId(data.project),
            phase: toObjectId(data.phase),
        });

        return created;
    }

    async createMany(
        data: CreatePhaseActivityData[]
    ): Promise<IPhaseActivity[]> {
        const activities = data.map(item => ({
            ...item,
            project: toObjectId(item.project),
            phase: toObjectId(item.phase),
        }));

        return await PhaseActivity.insertMany(activities, {
            ordered: true,
        }) as unknown as IPhaseActivity[];
    }

    /**
     * Updates activity fields and preserves existing detail data.
     * Status history is appended only when the status changes.
     */
    async update(
        id: string,
        data: UpdatePhaseActivityDto,
        userId: string
    ): Promise<IPhaseActivity | null> {
        const {
            kind,
            details,
            detailCost,
            ...rest
        } = data;

        const activity = await PhaseActivity.findById(
            toObjectId(id)
        );

        if (!activity) return null;

        // Update ordinary fields, including cost and dates.
        activity.set({
            ...rest,
            updatedBy: toObjectId(userId),
        });

        // Update activity kind and its corresponding details.
        if (kind !== undefined && kind !== activity.kind) {
            activity.set("kind", kind);
            activity.set("details", details ?? {});
        } else if (details !== undefined) {
            activity.set("details", {
                ...(activity.get("details") ?? {}),
                ...details,
            });
        }

        // Update detailed cost independently.
        if (detailCost !== undefined) {
            activity.set("detailCost", detailCost);
        }

        return activity.save();
    }


    async updateStatus(
        id: string,
        data: UpdatePhaseActivityStatusDto,
        userId: string
    ): Promise<IPhaseActivity | null> {

        const { status, reason } = data;

        const activity = await PhaseActivity.findById(
            toObjectId(id)
        );

        if (!activity) return null;

        // Avoid unnecessary history entries.
        if (activity.status === status) {
            return activity;
        }

        activity.status = status;

        activity.statusHistory.push({
            status,
            changedBy: toObjectId(userId),
            changedAt: new Date(),
            reason,
        });

        activity.set("updatedBy", toObjectId(userId));

        return activity.save();
    }


    async countByPhase(phaseId: string): Promise<number> {
        return PhaseActivity.countDocuments({
            phase: toObjectId(phaseId),
        }).exec();
    }

    async getProjectProgressAggregation(
        projectId: mongoose.Types.ObjectId
    ) {
        const results = await PhaseActivity.aggregate([
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

        return results[0] ?? {
            _id: null,
            total: 0,
            completed: 0,
            totalCost: 0,
            completedCost: 0,
        };
    }

    async delete(id: string): Promise<IPhaseActivity | null> {
        return PhaseActivity.findByIdAndDelete(
            toObjectId(id)
        ).exec();
    }

    async deleteByPhase(phaseId: string): Promise<any> {
        return PhaseActivity.deleteMany({
            phase: toObjectId(phaseId),
        }).exec();
    }
}
