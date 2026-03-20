import mongoose from "mongoose";
import { CreateCallDTO, ExistsCallDTO, GetCallsOptions, UpdateCallDTO } from "./call.dto";
import { Call, ICall } from "./call.model";

export interface ICallRepository {
    findById(id: string): Promise<ICall | null>;
    find(filters: GetCallsOptions): Promise<Partial<ICall>[]>;
    create(dto: CreateCallDTO): Promise<ICall>;
    update(id: string, data: UpdateCallDTO["data"]): Promise<ICall | null>;
    exists(filters: ExistsCallDTO): Promise<boolean>;
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

        if (filters.calendar) {
            query.calendar = new mongoose.Types.ObjectId(filters.calendar);
        }

        if (filters.grant) {
            query.grant = new mongoose.Types.ObjectId(filters.grant);
        }

        if (filters.directorate) {
            query.directorate = new mongoose.Types.ObjectId(filters.directorate);
        }

        if (filters.status) {
            query.status = filters.status;
        }

        let dbQuery = Call.find(query);

        if (filters.populate) {
            dbQuery = dbQuery
                .populate('calendar')
                //.populate('directorate')
                .populate('grant')
            //.populate('thematic');
        }

        return dbQuery.lean<ICall[]>().exec();
    }


    async create(dto: CreateCallDTO) {
        return Call.create({
            ...dto,
            // directorate: new mongoose.Types.ObjectId(dto.directorate),
            calendar: new mongoose.Types.ObjectId(dto.calendar),
            grant: new mongoose.Types.ObjectId(dto.grant),
            // thematic: new mongoose.Types.ObjectId(dto.thematic),
        });
    }

    async update(id: string, dtoData: UpdateCallDTO["data"]): Promise<ICall | null> {
        const updateData: Partial<ICall> = {};

        if (dtoData.title) updateData.title = dtoData.title;
        if (dtoData.description) updateData.description = dtoData.description;
        if (dtoData.status) updateData.status = dtoData.status;

        return Call.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            { $set: updateData },
            { new: true }
        ).exec();
    }

    async exists(filters: ExistsCallDTO): Promise<boolean> {
        const query: any = {};
        const { grant, calendar, //directorate, thematic 

        } = filters;
        if (grant) {
            query.grant = new mongoose.Types.ObjectId(grant);
        }
        if (calendar) {
            query.calendar = new mongoose.Types.ObjectId(calendar);
        }
        

        const result = await Call.exists(query).exec();
        return result !== null;
    }

    async delete(id: string) {
        return await Call.findByIdAndDelete(id).exec();
    }
}