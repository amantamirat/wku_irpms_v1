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
import { FilterOptions } from "../../../../common/dtos/filter.dto";

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
        dto: CreatePhaseActivityDto
    ): Promise<IPhaseActivity>;

    createMany(
        dtos: CreatePhaseActivityDto[]
    ): Promise<IPhaseActivity[]>;

    update(
        id: string,
        data: UpdatePhaseActivityDto["data"]
    ): Promise<IPhaseActivity | null>;

    updateStatus(
        id: string,
        status: PhaseActivityStatus,
        userId: string
    ): Promise<IPhaseActivity | null>;

    countByPhase(
        phaseId: string
    ): Promise<number>;



    delete(
        id: string
    ): Promise<IPhaseActivity | null>;

    deleteByPhase(
        phaseId: string
    ): Promise<any>;
}


/**
 * Data accepted by the repository on create.
 * `duration` is computed by the service, never sent by the client.
 */
export interface CreatePhaseActivityData extends CreatePhaseActivityDto {
    duration: number;
}

/**
 * Data accepted by the repository on update.
 * `duration` is recomputed by the service whenever the update runs.
 */
export type UpdatePhaseActivityData =
    UpdatePhaseActivityDto["data"] & {
        duration?: number;
    };

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

        if (filters.phase) {
            query.phase = new mongoose.Types.ObjectId(
                filters.phase
            );
        }

        if (filters.status) {
            query.status = filters.status;
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

        const data = {
            ...dto,
            phase: new mongoose.Types.ObjectId(dto.phase),
        };

        const created = await PhaseActivity.create(data);

        return created;
    }

    async createMany(
        dtos: CreatePhaseActivityData[]
    ): Promise<IPhaseActivity[]> {

        const data = dtos.map(dto => ({
            ...dto,
            phase: new mongoose.Types.ObjectId(dto.phase),
        }));

        const results = await PhaseActivity.insertMany(
            data,
            {
                ordered: true,
            }
        );

        return results as unknown as IPhaseActivity[];
    }

    async update(
        id: string,
        data: UpdatePhaseActivityData
    ): Promise<IPhaseActivity | null> {

        return PhaseActivity.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            {
                $set: data,
            },
            {
                new: true,
                runValidators: true,
            }
        ).exec();
    }

    async updateStatus(
        id: string,
        status: PhaseActivityStatus,
        userId: string, reason?: string
    ): Promise<IPhaseActivity | null> {

        return PhaseActivity.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            {
                $set: {
                    status
                },
                $push: {
                    statusHistory: {
                        status,
                        changedBy: new mongoose.Types.ObjectId(userId),
                        changedAt: new Date()
                    }
                }
            },
            {
                new: true,
                runValidators: true
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