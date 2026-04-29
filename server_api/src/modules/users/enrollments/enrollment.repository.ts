import mongoose from "mongoose";
import { CreateEnrollmentDTO, ExistsEnrollmentDTO, UpdateEnrollmentDTO } from "./enrollment.dto";
import Enrollment, { IEnrollment } from "./enrollment.model";

export interface IEnrollmentRepository {
    findById(id: string): Promise<IEnrollment | null>;
    findAll(): Promise<Partial<IEnrollment>[]>;
    findByStudent(studentId: string): Promise<IEnrollment[]>;
    findByProgram(programId: string): Promise<IEnrollment[]>;
    create(data: CreateEnrollmentDTO): Promise<IEnrollment>;
    update(id: string, data: UpdateEnrollmentDTO["data"]): Promise<IEnrollment | null>;
    exists(filters: ExistsEnrollmentDTO): Promise<boolean>;
    delete(id: string): Promise<IEnrollment | null>;
}


export class EnrollmentRepository implements IEnrollmentRepository {

    async findById(id: string): Promise<IEnrollment | null> {
        return Enrollment.findById(new mongoose.Types.ObjectId(id))
            .lean<IEnrollment>()
            .exec();
    }

    async findAll(): Promise<Partial<IEnrollment>[]> {
        return Enrollment.find({})
            .populate("calendar").populate("program").populate("student")
            .lean<IEnrollment[]>()
            .exec();
    }

    async findByStudent(applicantId: string): Promise<IEnrollment[]> {
        return Enrollment.find({
            student: new mongoose.Types.ObjectId(applicantId)
        }).populate("calendar").populate("program")
            .lean<IEnrollment[]>()
            .exec();
    }

    async findByProgram(programId: string): Promise<IEnrollment[]> {
        return Enrollment.find({
            program: new mongoose.Types.ObjectId(programId)
        })
            .lean<IEnrollment[]>()
            .exec();
    }

    async create(dto: CreateEnrollmentDTO): Promise<IEnrollment> {
        const data: Partial<IEnrollment> = {
            calendar: new mongoose.Types.ObjectId(dto.calendar),
            program: new mongoose.Types.ObjectId(dto.program),
            student: new mongoose.Types.ObjectId(dto.student),
        };

        return Enrollment.create(data);
    }

    async update(id: string, dtoData: UpdateEnrollmentDTO["data"]): Promise<IEnrollment | null> {

        const toUpdate: Partial<IEnrollment> = {};

        if (dtoData.calendar) {
            toUpdate.calendar = new mongoose.Types.ObjectId(dtoData.calendar);
        }

        if (dtoData.program) {
            toUpdate.program = new mongoose.Types.ObjectId(dtoData.program);
        }

        if (dtoData.student) {
            toUpdate.student = new mongoose.Types.ObjectId(dtoData.student);
        }

        return Enrollment.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            { $set: toUpdate },
            { new: true }
        ).lean<IEnrollment>();
    }

    async exists(filters: ExistsEnrollmentDTO): Promise<boolean> {
        const query: any = {};

        if (filters.calendar) {
            query.calendar = new mongoose.Types.ObjectId(filters.calendar);
        }

        if (filters.student) {
            query.applicant = new mongoose.Types.ObjectId(filters.student);
        }

        if (filters.program) {
            query.program = new mongoose.Types.ObjectId(filters.program);
        }

        const result = await Enrollment.exists(query).exec();
        return result !== null;
    }


    async delete(id: string): Promise<IEnrollment | null> {
        return Enrollment.findByIdAndDelete(
            new mongoose.Types.ObjectId(id)
        ).lean<IEnrollment>();
    }
}
