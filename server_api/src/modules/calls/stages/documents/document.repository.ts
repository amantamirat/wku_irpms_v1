// project-stage.repository.ts
import mongoose, { HydratedDocument } from "mongoose";
import { ProjectDocument, IProjectDocument } from "./document.model";
import {
    CreateProjectDocumentDTO,
    GetProjectDocumentDTO,
    UpdateProjectDocumentDTO
} from "./document.dto";

export interface IDocumentRepository {
    findById(id: string): Promise<IProjectDocument | null>; // <-- allow POJO
    find(filters: GetProjectDocumentDTO, populate?: boolean): Promise<Partial<IProjectDocument>[]>;
    create(dto: CreateProjectDocumentDTO): Promise<IProjectDocument>;
    update(id: string, status: UpdateProjectDocumentDTO["data"]): Promise<IProjectDocument>;
    delete(id: string): Promise<IProjectDocument | null>;
}


// MongoDB implementation
export class DocumentRepository implements IDocumentRepository {

    async findById(id: string) {
        return ProjectDocument.findById(new mongoose.Types.ObjectId(id))
            //.populate("project")
            //.populate("stage")
            .lean<IProjectDocument>()
            .exec();
    }

    async find(filters: GetProjectDocumentDTO, populate: boolean = true) {
        const query: any = {};

        if (filters.project) {
            query.project = new mongoose.Types.ObjectId(filters.project);
        }

        if (filters.stage) {
            query.stage = new mongoose.Types.ObjectId(filters.stage);
        }

        if (filters.status) {
            query.status = filters.status;
        }
        if (!populate) {
            return ProjectDocument.find(query)
                .lean<IProjectDocument[]>()
                .exec();
        }
        return ProjectDocument.find(query)
            .populate("project")
            .populate("stage")
            //.skip(filters.skip ?? 0)
            //.limit(filters.limit ?? 0)
            .lean<IProjectDocument[]>()
            .exec();
    }

    async create(dto: CreateProjectDocumentDTO): Promise<HydratedDocument<IProjectDocument>> {
        const data: Partial<IProjectDocument> = {
            project: new mongoose.Types.ObjectId(dto.project),
            stage: new mongoose.Types.ObjectId(dto.stage),
            documentPath: dto.documentPath
        };

        return ProjectDocument.create(data);
    }

    async update(id: string, dtoData: UpdateProjectDocumentDTO["data"]): Promise<IProjectDocument> {
        const updateData: Partial<IProjectDocument> = {};

        if (dtoData.totalScore !== undefined) {
            updateData.totalScore = dtoData.totalScore;
        }

        if (dtoData.status !== undefined) {
            updateData.status = dtoData.status;
        }
        const updated = await ProjectDocument.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            { $set: updateData },
            { new: true }
        ).exec();

        if (!updated) throw new Error("ProjectStage not found");
        return updated;
    }

    async delete(id: string) {
        return await ProjectDocument.findByIdAndDelete(id).exec();
    }
}
