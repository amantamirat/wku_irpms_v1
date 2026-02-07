// project-stage.repository.ts
import mongoose, { HydratedDocument } from "mongoose";
import { ProjectDocument, IProjectDocument } from "./document.model";
import {
    CreateDocumentDTO,
    GetDocumentDTO,
    UpdateDocumentDTO
} from "./document.dto";

export interface IDocumentRepository {
    findById(id: string): Promise<IProjectDocument | null>;
    find(filters: GetDocumentDTO): Promise<Partial<IProjectDocument>[]>;
    create(dto: CreateDocumentDTO): Promise<IProjectDocument>;
    update(id: string, status: UpdateDocumentDTO["data"]): Promise<IProjectDocument | null>;
    delete(id: string): Promise<IProjectDocument | null>;
}


// MongoDB implementation
export class DocumentRepository implements IDocumentRepository {

    async findById(id: string) {
        return ProjectDocument.findById(new mongoose.Types.ObjectId(id))
            .lean<IProjectDocument>()
            .exec();
    }

    async find(options: GetDocumentDTO) {
        const query: any = {};

        if (options.project) {
            query.project = new mongoose.Types.ObjectId(options.project);
        }

        if (options.stage) {
            query.stage = new mongoose.Types.ObjectId(options.stage);
        }

        if (options.status) {
            query.status = options.status;
        }

        const dbQuery = ProjectDocument.find(query);

        if (options.populate) {
            dbQuery
                .populate("project")
                .populate("stage");
        }

        return dbQuery
            .lean<IProjectDocument[]>()
            .exec();
    }


    /*
    async findByProject(stage: string) {
        return ProjectDocument.find({ stage: new mongoose.Types.ObjectId(stage) })
            .populate({
                path: "project",
                populate: { path: "applicant", populate: { path: "workspace" } }
            })
            .lean<IProjectDocument[]>()
            .exec();
    }
            */

    async create(dto: CreateDocumentDTO): Promise<HydratedDocument<IProjectDocument>> {
        const data: Partial<IProjectDocument> = {
            project: new mongoose.Types.ObjectId(dto.project),
            stage: new mongoose.Types.ObjectId(dto.stage),
            documentPath: dto.documentPath
        };

        return ProjectDocument.create(data);
    }

    async update(id: string, dtoData: UpdateDocumentDTO["data"]): Promise<IProjectDocument | null> {
        const updateData: Partial<IProjectDocument> = {};

        if (dtoData.totalScore !== undefined) {
            updateData.totalScore = dtoData.totalScore;
        }

        if (dtoData.status !== undefined) {
            updateData.status = dtoData.status;
        }
        return ProjectDocument.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            { $set: updateData },
            { new: true }
        ).exec();

    }

    async delete(id: string) {
        return await ProjectDocument.findByIdAndDelete(id).exec();
    }
}
