import mongoose from "mongoose";
import { CreateStudentDTO, ExistsStudentDTO, UpdateStudentDTO } from "./student.dto";
import Student, { IStudent } from "./student.model";

export interface IStudentRepository {
    findById(id: string): Promise<IStudent | null>;
    findAll(): Promise<Partial<IStudent>[]>;
    findByUser(userId: string): Promise<IStudent[]>;
    findByProgram(programId: string): Promise<IStudent[]>;
    create(data: CreateStudentDTO): Promise<IStudent>;
    update(id: string, data: UpdateStudentDTO["data"]): Promise<IStudent | null>;
    exists(filters: ExistsStudentDTO): Promise<boolean>;
    delete(id: string): Promise<IStudent | null>;
}


export class StudentRepository implements IStudentRepository {

    async findById(id: string): Promise<IStudent | null> {
        return Student.findById(new mongoose.Types.ObjectId(id))
            .lean<IStudent>()
            .exec();
    }

    async findAll(): Promise<Partial<IStudent>[]> {
        return Student.find({})
            .populate("calendar").populate("program").populate("user")
            .lean<IStudent[]>()
            .exec();
    }

    async findByUser(applicantId: string): Promise<IStudent[]> {
        return Student.find({
            user: new mongoose.Types.ObjectId(applicantId)
        }).populate("calendar").populate("program")
            .lean<IStudent[]>()
            .exec();
    }

    async findByProgram(programId: string): Promise<IStudent[]> {
        return Student.find({
            program: new mongoose.Types.ObjectId(programId)
        })
            .lean<IStudent[]>()
            .exec();
    }

    async create(dto: CreateStudentDTO): Promise<IStudent> {
        const data: Partial<IStudent> = {
            calendar: new mongoose.Types.ObjectId(dto.calendar),
            program: new mongoose.Types.ObjectId(dto.program),
            user: new mongoose.Types.ObjectId(dto.user),
        };

        return Student.create(data);
    }

    async update(id: string, dtoData: UpdateStudentDTO["data"]): Promise<IStudent | null> {

        const toUpdate: Partial<IStudent> = {};

        if (dtoData.calendar) {
            toUpdate.calendar = new mongoose.Types.ObjectId(dtoData.calendar);
        }

        if (dtoData.program) {
            toUpdate.program = new mongoose.Types.ObjectId(dtoData.program);
        }

        if (dtoData.user) {
            toUpdate.user = new mongoose.Types.ObjectId(dtoData.user);
        }

        return Student.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            { $set: toUpdate },
            { new: true }
        ).lean<IStudent>();
    }

    async exists(filters: ExistsStudentDTO): Promise<boolean> {
        const query: any = {};

        if (filters.calendar) {
            query.calendar = new mongoose.Types.ObjectId(filters.calendar);
        }

        if (filters.user) {
            query.applicant = new mongoose.Types.ObjectId(filters.user);
        }

        if (filters.program) {
            query.program = new mongoose.Types.ObjectId(filters.program);
        }

        const result = await Student.exists(query).exec();
        return result !== null;
    }


    async delete(id: string): Promise<IStudent | null> {
        return Student.findByIdAndDelete(
            new mongoose.Types.ObjectId(id)
        ).lean<IStudent>();
    }
}
