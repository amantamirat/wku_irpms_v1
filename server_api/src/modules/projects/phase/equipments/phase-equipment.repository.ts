import mongoose from "mongoose";
import {
    PhaseEquipment,
    IPhaseEquipment,
    PhaseEquipmentStatus,
} from "./phase-equipment.model"
import {
    CreatePhaseEquipmentDto,
    FilterPhaseEquipments,
    UpdatePhaseEquipmentDto,
} from "./phase-equipment.dto";
import { FilterOptions } from "../../../../common/dtos/filter.dto";

export interface IPhaseEquipmentRepository {
    findById(
        id: string,
        options?: FilterOptions
    ): Promise<IPhaseEquipment | null>;

    find(
        filters: FilterPhaseEquipments,
        options?: FilterOptions
    ): Promise<IPhaseEquipment[]>;

    findOne(
        phaseId: string,
        description: string
    ): Promise<IPhaseEquipment | null>;

    create(
        dto: CreatePhaseEquipmentDto
    ): Promise<IPhaseEquipment>;

    createMany(
        dtos: CreatePhaseEquipmentDto[]
    ): Promise<IPhaseEquipment[]>;

    update(
        id: string,
        data: UpdatePhaseEquipmentDto["data"]
    ): Promise<IPhaseEquipment | null>;

    updateStatus(
        id: string,
        status: PhaseEquipmentStatus,
        userId: string,
        reason?: string
    ): Promise<IPhaseEquipment | null>;

    countByPhase(
        phaseId: string
    ): Promise<number>;

    delete(
        id: string
    ): Promise<IPhaseEquipment | null>;

    deleteByPhase(
        phaseId: string
    ): Promise<any>;
}

export class PhaseEquipmentRepository
    implements IPhaseEquipmentRepository {

    async findById(
        id: string,
        options?: FilterOptions
    ): Promise<IPhaseEquipment | null> {

        let query = PhaseEquipment.findById(
            new mongoose.Types.ObjectId(id)
        );

        if (options?.populate) {
            query = query.populate({
                path: "phase",
            });
        }

        return query
            .lean<IPhaseEquipment>()
            .exec();
    }

    async find(
        filters: FilterPhaseEquipments,
        options?: FilterOptions
    ): Promise<IPhaseEquipment[]> {

        const query: Record<string, unknown> = {};

        if (filters.phase) {
            query.phase = new mongoose.Types.ObjectId(
                filters.phase
            );
        }

        if (filters.status) {
            query.status = filters.status;
        }

        let equipmentQuery = PhaseEquipment.find(query)
            .sort({ createdAt: 1 });

        if (options?.populate) {
            equipmentQuery = equipmentQuery.populate({
                path: "phase",
            });
        }

        return equipmentQuery
            .lean<IPhaseEquipment[]>()
            .exec();
    }

    async findOne(
        phaseId: string,
        description: string
    ): Promise<IPhaseEquipment | null> {

        return PhaseEquipment.findOne({
            phase: new mongoose.Types.ObjectId(phaseId),
            description,
        })
            .lean<IPhaseEquipment>()
            .exec();
    }

    async create(
        dto: CreatePhaseEquipmentDto
    ): Promise<IPhaseEquipment> {

        const data = {
            ...dto,
            phase: new mongoose.Types.ObjectId(dto.phase),
        };

        const created = await PhaseEquipment.create(data);

        return created;
    }

    async createMany(
        dtos: CreatePhaseEquipmentDto[]
    ): Promise<IPhaseEquipment[]> {

        const data = dtos.map(dto => ({
            ...dto,
            phase: new mongoose.Types.ObjectId(dto.phase),
        }));

        const results = await PhaseEquipment.insertMany(
            data,
            {
                ordered: true,
            }
        );

        return results as unknown as IPhaseEquipment[];
    }

    async update(
        id: string,
        data: UpdatePhaseEquipmentDto["data"]
    ): Promise<IPhaseEquipment | null> {

        return PhaseEquipment.findByIdAndUpdate(
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
        status: PhaseEquipmentStatus,
        userId: string,
        reason?: string
    ): Promise<IPhaseEquipment | null> {

        return PhaseEquipment.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            {
                $set: {
                    status,
                    updatedBy: new mongoose.Types.ObjectId(userId),
                },
                $push: {
                    statusHistory: {
                        status,
                        changedBy: new mongoose.Types.ObjectId(userId),
                        changedAt: new Date(),
                        ...(reason ? { reason } : {}),
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

        return PhaseEquipment.countDocuments({
            phase: new mongoose.Types.ObjectId(phaseId),
        }).exec();
    }

    async delete(
        id: string
    ): Promise<IPhaseEquipment | null> {

        return PhaseEquipment.findByIdAndDelete(
            new mongoose.Types.ObjectId(id)
        ).exec();
    }

    async deleteByPhase(
        phaseId: string
    ): Promise<any> {

        return PhaseEquipment.deleteMany({
            phase: new mongoose.Types.ObjectId(phaseId),
        }).exec();
    }
}