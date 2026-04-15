import { ITemplate, TemplateModel, TemplateStatus } from "./template.model";
import {
    CreateTemplateDTO,
    GetTemplatesDTO,
    UpdateTemplateDTO
} from "./template.dto";
import mongoose from "mongoose";

export interface ITemplateRepository {
    findById(id: string): Promise<ITemplate | null>;
    find(filters: GetTemplatesDTO): Promise<Partial<ITemplate>[]>;
    create(dto: CreateTemplateDTO): Promise<ITemplate>;
    update(id: string, data: UpdateTemplateDTO["data"]): Promise<ITemplate | null>;
    delete(id: string): Promise<ITemplate | null>;
}


export class TemplateRepository implements ITemplateRepository {

    async findById(id: string) {
        return TemplateModel.findById(new mongoose.Types.ObjectId(id))
            .lean<ITemplate>()
            .exec();
    }

    async find(filters: GetTemplatesDTO) {
        const query: any = {};

        if (filters.status) {
            query.status = filters.status;
        }

        if (filters.name) {
            query.name = { $regex: filters.name, $options: "i" };
        }

        return TemplateModel.find(query)
            .lean<ITemplate[]>()
            .exec();
    }

    async create(dto: CreateTemplateDTO) {

        const data: Partial<ITemplate> = {
            name: dto.name,
            description: dto.description ?? '',
            status: dto.status || TemplateStatus.draft,

            sections: dto.sections.map(section => ({
                title: section.title,
                description: section.description ?? '',
                order: section.order,
                isRequired: section.isRequired ?? true, // ✅ fix here

                fields: section.fields.map(field => ({
                    label: field.label,
                    fieldType: field.fieldType,
                    order: field.order,
                    isRequired: field.isRequired ?? false, // ✅ fix
                    placeholder: field.placeholder ?? ''
                }))
            }))
        };

        return TemplateModel.create(data);
    }

    async update(
        id: string,
        dtoData: UpdateTemplateDTO["data"]
    ): Promise<ITemplate | null> {

        const updateData: any = {};

        if (dtoData.name) updateData.name = dtoData.name;
        if (dtoData.description) updateData.description = dtoData.description;
        if (dtoData.status) updateData.status = dtoData.status;

        // ⚠️ Important: sections handling (simple version)
        if (dtoData.sections) {
            updateData.sections = dtoData.sections;
        }

        return TemplateModel.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            { $set: updateData },
            { new: true }
        ).exec();
    }

    async delete(id: string) {
        return TemplateModel.findByIdAndDelete(
            new mongoose.Types.ObjectId(id)
        ).exec();
    }
}