import mongoose from "mongoose";
import {
    CreatePublicationDTO,
    UpdatePublicationDTO,
    GetPublicationsOptions
} from "./publication.dto";
import { IPublication, Publication } from "./publication.model";


export interface IPublicationRepository {
    findById(id: string): Promise<IPublication | null>;
    find(filters: GetPublicationsOptions): Promise<Partial<IPublication>[]>;
    create(data: CreatePublicationDTO): Promise<IPublication>;
    update(id: string, data: UpdatePublicationDTO["data"]): Promise<IPublication | null>;
    delete(id: string): Promise<IPublication | null>;
}

export class PublicationRepository implements IPublicationRepository {

    async findById(id: string): Promise<IPublication | null> {
        return Publication.findById(new mongoose.Types.ObjectId(id))
            .lean<IPublication>()
            .exec();
    }

    async find(filters: GetPublicationsOptions = {}): Promise<Partial<IPublication>[]> {
        const query: any = {};

        // Filter by applicant if provided
        if (filters.author) {
            query.applicant = new mongoose.Types.ObjectId(filters.author);
        }

        // Filter by type if provided
        if (filters.type) {
            query.type = filters.type;
        }

        let dbQuery = Publication.find(query);

        // Populate applicant only if requested
        if (filters.populate) {
            dbQuery = dbQuery.populate("applicant");
        }

        return dbQuery
            .lean<IPublication[]>()
            .exec();
    }


    async create(dto: CreatePublicationDTO): Promise<IPublication> {
        const data: Partial<IPublication> = {
            ...dto,
            author: new mongoose.Types.ObjectId(dto.author),            
            publishedDate: dto.publishedDate
                ? new Date(dto.publishedDate)
                : undefined,            
        };

        return Publication.create(data);
    }

    async update(
        id: string,
        dtoData: UpdatePublicationDTO["data"]
    ): Promise<IPublication | null> {

        const toUpdate: Partial<IPublication> = {};

        if (dtoData.title) toUpdate.title = dtoData.title;
        if (dtoData.abstract) toUpdate.abstract = dtoData.abstract;
        if (dtoData.publishedDate)
            toUpdate.publishedDate = new Date(dtoData.publishedDate);
        if (dtoData.doi) toUpdate.doi = dtoData.doi;
        if (dtoData.url) toUpdate.url = dtoData.url;
        if (dtoData.publisher) toUpdate.publisher = dtoData.publisher;
        if (dtoData.publicationId) toUpdate.publicationId = dtoData.publicationId;

        return Publication.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            { $set: toUpdate },
            { new: true }
        )
            .lean<IPublication>();
    }

    async delete(id: string): Promise<IPublication | null> {
        return Publication.findByIdAndDelete(
            new mongoose.Types.ObjectId(id)
        )
            .lean<IPublication>();
    }
}
