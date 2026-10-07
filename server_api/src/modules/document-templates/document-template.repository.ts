import mongoose, { FilterQuery } from "mongoose";
import {
    DocumentTemplate,
    DocumentTemplateStatus,
    IDocumentTemplate,
} from "./document-template.model";
import {
    CreateDocumentTemplateDTO,
    UpdateDocumentTemplateDTO,
    FilterDocumentTemplateDTO,
} from "./document-template.dto";

export class DocumentTemplateRepository {

    async create(
        dto: CreateDocumentTemplateDTO & { createdBy?: string }
    ): Promise<IDocumentTemplate> {
        return await DocumentTemplate.create(dto);
    }

    async findById(
        id: string
    ): Promise<IDocumentTemplate | null> {
        return await DocumentTemplate.findById(id);
    }

    async findOne(
        filter: FilterQuery<IDocumentTemplate>
    ): Promise<IDocumentTemplate | null> {
        return await DocumentTemplate.findOne(filter);
    }

    async findAll(
    ): Promise<IDocumentTemplate[]> {

        const data = await DocumentTemplate
            .find({})
            .lean()
            .exec();

        return data as any[];
    }

    async latestVersion(name: string): Promise<number> {
        const template = await DocumentTemplate
            .findOne({ name })
            .sort({ version: -1 })
            .select({ version: 1 })
            .lean()
            .exec();

        return template?.version ?? 0;
    }

    async update(
        id: string,
        dto: UpdateDocumentTemplateDTO & { updatedBy?: string }
    ): Promise<IDocumentTemplate | null> {
        return await DocumentTemplate.findByIdAndUpdate(
            id,
            dto,
            {
                new: true,
                runValidators: true,
            }
        );
    }

    async updateStatus(
        id: string,
        newStatus: DocumentTemplateStatus
    ): Promise<IDocumentTemplate | null> {
        return await DocumentTemplate.findByIdAndUpdate(
            id,
            { $set: { status: newStatus } },
            {
                new: true,
                runValidators: true,
            }
        ).exec();
    }

    async delete(
        id: string
    ): Promise<IDocumentTemplate | null> {
        return await DocumentTemplate.findByIdAndDelete(id);
    }
}