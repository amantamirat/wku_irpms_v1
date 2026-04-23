import mongoose from "mongoose";
import {
    CreateConstraintDTO,
    ExistsConstraintDTO,
    GetConstraintOptions,
    UpdateConstraintDTO
} from "./constraint.dto";
import { Constraint, ConstraintType, IConstraint } from "./constraint.model";

export interface IConstraintRepository {
    find(filters: GetConstraintOptions): Promise<IConstraint[]>;
    findById(id: string): Promise<IConstraint | null>;
    findOne(grantId: string, constraintType: ConstraintType): Promise<IConstraint | null>;
    create(dto: CreateConstraintDTO): Promise<IConstraint>;
    update(dto: UpdateConstraintDTO): Promise<IConstraint | null>;
    exists(filters: ExistsConstraintDTO): Promise<boolean>;
    delete(id: string): Promise<IConstraint | null>;
}

export class ConstraintRepository implements IConstraintRepository {

    // =====================================================
    // HELPERS
    // =====================================================
    private toObjectId(id?: string) {
        return id ? new mongoose.Types.ObjectId(id) : undefined;
    }

    // =====================================================
    // FIND
    // =====================================================
    async find(filters: GetConstraintOptions): Promise<IConstraint[]> {
        const query: any = {};

        if (filters.grant) {
            query.grant = this.toObjectId(filters.grant);
        }

        // ✅ Support multiple constraint types (important for validator)
        if (filters.constraints?.length) {
            query.constraint = { $in: filters.constraints };
        }

        return Constraint.find(query).lean<IConstraint[]>().exec();
    }

    async findById(id: string): Promise<IConstraint | null> {
        return Constraint.findById(this.toObjectId(id))
            .lean<IConstraint>()
            .exec();
    }

    async findOne(grantId: string, constraintType: ConstraintType) {
        return Constraint.findOne({ grant: grantId, constraint: constraintType })
            .lean<IConstraint>()
            .exec();
    }

    // =====================================================
    // CREATE
    // =====================================================
    async create(dto: CreateConstraintDTO): Promise<IConstraint> {
        const data: Partial<IConstraint> = {
            ...dto,
            grant: this.toObjectId(dto.grant)
        };

        const created = await Constraint.create(data);
        return created.toObject(); // ✅ keep consistency with lean()
    }

    // =====================================================
    // UPDATE
    // =====================================================
    async update(dto: UpdateConstraintDTO): Promise<IConstraint | null> {
        const { id, data } = dto;

        return Constraint.findByIdAndUpdate(
            this.toObjectId(id),
            data,
            { new: true }
        )
            .lean<IConstraint>()
            .exec();
    }

    // =====================================================
    // EXISTS
    // =====================================================
    async exists(filters: ExistsConstraintDTO): Promise<boolean> {
        const query: any = {};

        if (filters.grant) {
            query.grant = this.toObjectId(filters.grant);
        }

        if (filters.constraint) {
            query.constraint = filters.constraint;
        }

        const result = await Constraint.exists(query).exec();
        return !!result;
    }

    // =====================================================
    // DELETE
    // =====================================================
    async delete(id: string): Promise<IConstraint | null> {
        return Constraint.findByIdAndDelete(this.toObjectId(id))
            .lean<IConstraint>()
            .exec();
    }
}