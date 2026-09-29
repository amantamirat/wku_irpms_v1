import mongoose from "mongoose";
import { IPhaseDocument, PhaseDocument } from "./phase.doc.model";
import { CreatePhaseDocDTO, FilterPhaseDocDTO } from "./phase.doc.dto";
import { FilterOptions } from "../../../../common/dtos/filter.dto";

export interface IPhaseDocumentRepository {
    findById(id: string, options?: FilterOptions): Promise<IPhaseDocument | null>;
    find(filters: FilterPhaseDocDTO, options?: FilterOptions): Promise<Partial<IPhaseDocument>[]>;
    create(dto: CreatePhaseDocDTO): Promise<IPhaseDocument>;
    delete(id: string): Promise<IPhaseDocument | null>;
}

export class PhaseDocumentRepository implements IPhaseDocumentRepository {

    async findById(id: string, options?: FilterOptions) {
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

    async find(filters: FilterPhaseDocDTO, options?: FilterOptions) {
        const query: any = {};

        if (filters.phase) {
            query.phase = new mongoose.Types.ObjectId(filters.phase);
        }

        const dbQuery = PhaseDocument.find(query);

        if (options?.populate) {
            query.populate("phase");
        }

        return dbQuery
            .lean<IPhaseDocument[]>()
            .exec();
    }

    async create(dto: CreatePhaseDocDTO) {
        const data: any = {
            ...dto,
            phase: new mongoose.Types.ObjectId(dto.phase),
        };

        return PhaseDocument.create(data);
    }

    async delete(id: string) {
        return PhaseDocument.findByIdAndDelete(
            new mongoose.Types.ObjectId(id)
        ).exec();
    }
}