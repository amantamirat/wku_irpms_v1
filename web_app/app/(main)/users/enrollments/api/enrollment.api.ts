import { ApiClient } from "@/api/ApiClient";
import { GetEnrollmentsOptions, Enrollment, sanitizeStudent as sanitizeEnrollment } from "../models/enrollment.model";
import { EntityApi } from "@/api/EntityApi";

const endPoint = '/enrollments';

export const EnrollmentApi: EntityApi<Enrollment, GetEnrollmentsOptions | undefined> = {

    async getAll(options?: GetEnrollmentsOptions): Promise<Enrollment[]> {
        const query = new URLSearchParams();
        if (options) {
            const sanitized = sanitizeEnrollment(options);
            if (sanitized.student) query.append("student", sanitized.student as string);
        }
        const data = await ApiClient.get(`${endPoint}?${query.toString()}`);
        return data as Enrollment[];
    },

    async create(student: Partial<Enrollment>): Promise<Enrollment> {
        const sanitized = sanitizeEnrollment(student);
        const createdData = await ApiClient.post(endPoint, sanitized);
        return createdData as Enrollment;
    },

    async update(student: Partial<Enrollment>): Promise<Enrollment> {
        if (!student._id) throw new Error("_id required.");
        const url = `${endPoint}/${student._id}`;
        const sanitized = sanitizeEnrollment(student);
        const updatedStudent = await ApiClient.put(url, sanitized);
        return updatedStudent as Enrollment;
    },

    async delete(student: Enrollment): Promise<boolean> {
        if (!student._id) throw new Error("_id required.");
        const url = `${endPoint}/${student._id}`;
        const response = await ApiClient.delete(url);
        return response;
    },
};
