import mongoose from "mongoose";
import { IPhaseDocument, PhaseDocument } from "./phase.doc.model";
import { CreatePhaseDocDTO, GetPhaseDocDTO } from "./phase.doc.dto";

export interface IPhaseDocumentRepository {
    findById(id: string): Promise<IPhaseDocument | null>;
    find(filters: GetPhaseDocDTO): Promise<Partial<IPhaseDocument>[]>;
    create(dto: CreatePhaseDocDTO): Promise<IPhaseDocument>;
    delete(id: string): Promise<IPhaseDocument | null>;
}

export class PhaseDocumentRepository implements IPhaseDocumentRepository {

    async findById(id: string) {
        return PhaseDocument.findById(new mongoose.Types.ObjectId(id))
            .lean<IPhaseDocument>()
            .exec();
    }

    async find(filters: GetPhaseDocDTO) {
        const query: any = {};
        if (filters.phase) {
            query.phase = new mongoose.Types.ObjectId(filters.phase);
        }
        return PhaseDocument.find(query)
            //.populate("phase")
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
        return PhaseDocument.findByIdAndDelete(new mongoose.Types.ObjectId(id)).exec();
    }
}
