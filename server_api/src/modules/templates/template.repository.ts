import { FilterQuery } from "mongoose";
import { ITemplate, Template } from "./template.model";
import { CreateTemplateDTO, UpdateTemplateDTO } from "./template.dto";


export class TemplateRepository {

    async create(dto: CreateTemplateDTO): Promise<ITemplate> {
        return await Template.create(dto);
    }

    async findById(id: string): Promise<ITemplate | null> {
        return await Template.findById(id);
    }

    async findOne(filter: FilterQuery<ITemplate>): Promise<ITemplate | null> {
        return await Template.findOne(filter);
    }

    async findAll(filter: FilterQuery<ITemplate> = {}): Promise<ITemplate[]> {
        return await Template.find(filter).sort({ name: 1 });
    }

    async exists(name: string, excludeId?: string): Promise<boolean> {
        const query: FilterQuery<ITemplate> = { name };

        if (excludeId) {
            query._id = { $ne: excludeId };
        }

        return (await Template.exists(query)) !== null;
    }

    async update(id: string, dto: UpdateTemplateDTO): Promise<ITemplate | null> {
        return await Template.findByIdAndUpdate(
            id,
            dto,
            {
                new: true,
                runValidators: true,
            }
        );
    }

    async delete(id: string): Promise<ITemplate | null> {
        return await Template.findByIdAndDelete(id);
    }

    async count(filter: FilterQuery<ITemplate> = {}): Promise<number> {
        return await Template.countDocuments(filter);
    }

}