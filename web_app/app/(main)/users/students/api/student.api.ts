import { ApiClient } from "@/api/ApiClient";
import { GetStudentsOptions, Student, sanitizeStudent } from "../models/student.model";
import { EntityApi } from "@/api/EntityApi";

const endPoint = '/students';

export const StudentApi: EntityApi<Student, GetStudentsOptions | undefined> = {

    async getAll(options?: GetStudentsOptions): Promise<Student[]> {
        const query = new URLSearchParams();
        if (options) {
            const sanitized = sanitizeStudent(options);
            if (sanitized.user) query.append("user", sanitized.user as string);
        }
        const data = await ApiClient.get(`${endPoint}?${query.toString()}`);
        return data as Student[];
    },

    async create(student: Partial<Student>): Promise<Student> {
        const sanitized = sanitizeStudent(student);
        const createdData = await ApiClient.post(endPoint, sanitized);
        return createdData as Student;
    },

    async update(student: Partial<Student>): Promise<Student> {
        if (!student._id) throw new Error("_id required.");
        const url = `${endPoint}/${student._id}`;
        const sanitized = sanitizeStudent(student);
        const updatedStudent = await ApiClient.put(url, sanitized);
        return updatedStudent as Student;
    },

    async delete(student: Student): Promise<boolean> {
        if (!student._id) throw new Error("_id required.");
        const url = `${endPoint}/${student._id}`;
        const response = await ApiClient.delete(url);
        return response;
    },
};
