import mongoose from "mongoose";
import { CreateConstraintDTO, ExistsConstraintDTO, GetConstraintOptions, UpdateConstraintDTO } from "./constraint.dto";
import { Constraint, IConstraint } from "./constraint.model";


export interface IConstraintRepository {
    find(filters: GetConstraintOptions): Promise<IConstraint[]>;
    findById(id: string): Promise<IConstraint | null>;
    create(dto: CreateConstraintDTO): Promise<IConstraint>;
    update(dto: UpdateConstraintDTO): Promise<IConstraint | null>;
    exists(filters: ExistsConstraintDTO): Promise<boolean>;
    delete(id: string): Promise<IConstraint | null>;
}


export class ConstraintRepository implements IConstraintRepository {

    async find(filters: GetConstraintOptions): Promise<IConstraint[]> {
        const query: any = {};

        if (filters.grant) query.grant = filters.grant;

        return Constraint.find(query).exec();
    }

    async findById(id: string): Promise<IConstraint | null> {
        return Constraint.findById(id).lean<IConstraint>().exec();
    }

    async create(dto: CreateConstraintDTO): Promise<IConstraint> {
        const data: Partial<IConstraint> = {
            ...dto,
            grant: new mongoose.Types.ObjectId(dto.grant)
        };
         return Constraint.create(data);
    }

    async update(dto: UpdateConstraintDTO): Promise<IConstraint | null> {
        const { id, data } = dto;

        return Constraint.findByIdAndUpdate(
            id,
            data,
            { new: true }
        ).exec();
    }

    async exists(filters: ExistsConstraintDTO): Promise<boolean> {
        const query: any = {};

        if (filters.grant) {
            query.grant = new mongoose.Types.ObjectId(filters.grant);
        }

        if (filters.constraint) {
            query.constraint = filters.constraint;
        }

        const result = await Constraint.exists(query).exec();
        return result !== null;
    }

    async delete(id: string): Promise<IConstraint | null> {
        return await Constraint.findByIdAndDelete(id).exec();
    }
}