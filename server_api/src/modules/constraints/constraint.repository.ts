import { FilterQuery } from "mongoose";
import { IConstraint, Constraint } from "./constraint.model";
import { CreateConstraintDTO, UpdateConstraintDTO } from "./constraint.dto";


export class ConstraintRepository {

    async create(dto: CreateConstraintDTO): Promise<IConstraint> {
        return await Constraint.create(dto);
    }


    async findById(id: string): Promise<IConstraint | null> {
        return await Constraint.findById(id);
    }


    async findOne(
        filter: FilterQuery<IConstraint>
    ): Promise<IConstraint | null> {
        return await Constraint.findOne(filter);
    }


    async findAll(
        filter: FilterQuery<IConstraint> = {}
    ): Promise<IConstraint[]> {
        return await Constraint.find(filter).sort({ name: 1 });
    }


    async exists(
        name: string,
        excludeId?: string
    ): Promise<boolean> {

        const query: FilterQuery<IConstraint> = { name };

        if (excludeId) {
            query._id = { $ne: excludeId };
        }

        return (await Constraint.exists(query)) !== null;
    }


    async update(
        id: string,
        dto: UpdateConstraintDTO
    ): Promise<IConstraint | null> {

        return await Constraint.findByIdAndUpdate(
            id,
            dto,
            {
                new: true,
                runValidators: true,
            }
        );
    }


    async delete(id: string): Promise<IConstraint | null> {
        return await Constraint.findByIdAndDelete(id);
    }


    async count(
        filter: FilterQuery<IConstraint> = {}
    ): Promise<number> {
        return await Constraint.countDocuments(filter);
    }

}