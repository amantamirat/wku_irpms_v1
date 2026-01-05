import mongoose from "mongoose";
import {
    CreatePublicationDTO,
    UpdatePublicationDTO,
    GetPublicationsOptions
} from "./publication.dto";
import { IPublication, Publication } from "./publication.model";


export interface IPublicationRepository {
    findById(id: string): Promise<IPublication | null>;
    findAll(): Promise<Partial<IPublication>[]>;
    findByApplicant(applicantId: string): Promise<IPublication[]>;
    findByType(type: string): Promise<IPublication[]>;
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

    async findAll(): Promise<Partial<IPublication>[]> {
        return Publication.find({})
            .populate("applicant")
            .lean<IPublication[]>()
            .exec();
    }

    async findByApplicant(applicantId: string): Promise<IPublication[]> {
        return Publication.find({
            applicant: new mongoose.Types.ObjectId(applicantId),
        })
            .lean<IPublication[]>()
            .exec();
    }

    async findByType(type: string): Promise<IPublication[]> {
        return Publication.find({ type })
            .populate("applicant")
            .lean<IPublication[]>()
            .exec();
    }

    async create(dto: CreatePublicationDTO): Promise<IPublication> {
        const data: Partial<IPublication> = {
            applicant: new mongoose.Types.ObjectId(dto.applicant),
            title: dto.title,
            type: dto.type,
            abstract: dto.abstract,
            publishedDate: dto.publishedDate
                ? new Date(dto.publishedDate)
                : undefined,
            doi: dto.doi,
            url: dto.url,
            publisher: dto.publisher,
            publicationId: dto.publicationId,
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
