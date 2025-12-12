import mongoose from "mongoose";
import { CreateCallDTO, GetCallsOptions, UpdateCallDTO } from "./call.dto";
import { Call, ICall } from "./call.model";

export interface ICallRepository {
    findById(id: string): Promise<ICall | null>;
    find(filters: GetCallsOptions): Promise<Partial<ICall>[]>;
    create(dto: CreateCallDTO): Promise<ICall>;
    update(id: string, data: UpdateCallDTO["data"]): Promise<ICall>;
    delete(id: string): Promise<ICall | null>;
}

// MongoDB implementation
export class CallRepository implements ICallRepository {

    async findById(id: string) {
        return Call.findById(new mongoose.Types.ObjectId(id))
            .lean<ICall>()
            .exec();
    }

    async find(filters: GetCallsOptions) {
        const query: any = {};

        if (filters.directorate) {
            query.directorate = new mongoose.Types.ObjectId(filters.directorate);
        }

        return Call.find(query)
            .populate("calendar")
            .populate("directorate")
            .populate("grant")
            .populate("thematic")
            .lean<ICall[]>()
            .exec();
    }

    async create(dto: CreateCallDTO) {
        return Call.create({ ...dto, directorate: new mongoose.Types.ObjectId(dto.directorate) });
    }

    async update(id: string, dtoData: UpdateCallDTO["data"]): Promise<ICall> {
        const updateData: Partial<ICall> = {};

        if (dtoData.title) updateData.title = dtoData.title;

        const updated = await Call.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            { $set: updateData },
            { new: true }
        ).exec();

        if (!updated) throw new Error("Call not found");
        return updated;
    }

    async delete(id: string) {
        return await Call.findByIdAndDelete(id).exec();
    }
}