import mongoose from "mongoose";
import { FilterOptions } from "../../../../common/dtos/filter.dto";
import { FilterPhaseDocDTO } from "./phase.doc.dto";
import {
    IPhaseDocument,
    PhaseDocument,
    PhaseDocumentType
} from "./phase.doc.model";

export interface CreatePhaseDocData {
    phase: string;
    type: PhaseDocumentType;
    description: string;
    documentPath: string;
}

export interface IPhaseDocumentRepository {

    findById(
        id: string,
        options?: FilterOptions
    ): Promise<IPhaseDocument | null>;

    find(
        filters: FilterPhaseDocDTO,
        options?: FilterOptions
    ): Promise<Partial<IPhaseDocument>[]>;

    exists(
        filter: FilterPhaseDocDTO
    ): Promise<boolean>;

    create(
        dto: CreatePhaseDocData
    ): Promise<IPhaseDocument>;

    delete(
        id: string
    ): Promise<IPhaseDocument | null>;
}

export class PhaseDocumentRepository
    implements IPhaseDocumentRepository {

    async findById(
        id: string,
        options?: FilterOptions
    ) {
        const query = PhaseDocument.findById(
            new mongoose.Types.ObjectId(id)
        );

        if (options?.populate) {
            query.populate("phase");
        }

        return query
            .lean<IPhaseDocument>()
            .exec();
    }

    async find(
        filters: FilterPhaseDocDTO,
        options?: FilterOptions
    ) {
        const query: Record<string, any> = {};

        if (filters.phase) {
            query.phase = new mongoose.Types.ObjectId(
                filters.phase
            );
        }

        if (filters.type) {
            query.type = filters.type;
        }

        const dbQuery = PhaseDocument.find(query);

        if (options?.populate) {
            dbQuery.populate("phase");
        }

        return dbQuery
            .lean<IPhaseDocument[]>()
            .exec();
    }

    async exists(
        filters: FilterPhaseDocDTO
    ): Promise<boolean> {
        const query: Record<string, any> = {};

        if (filters.phase) {
            query.phase = new mongoose.Types.ObjectId(filters.phase);
        }

        if (filters.type) {
            query.type = filters.type;
        }

        const exists = await PhaseDocument.exists(query);

        return !!exists;
    }

    async create(
        dto: CreatePhaseDocData
    ) {
        return PhaseDocument.create({
            ...dto,
            phase: new mongoose.Types.ObjectId(dto.phase)
        });
    }

    async delete(id: string) {
        return PhaseDocument.findByIdAndDelete(
            new mongoose.Types.ObjectId(id)
        ).exec();
    }
}