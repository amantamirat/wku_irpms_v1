import { ApiClient } from "@/api/ApiClient";
import { EntityApi } from "@/api/EntityApi";
import { sanitize } from "@/utils/utils";
import { Enrollment, FilterEnrollments } from "../models/enrollment.model";

const end_point = "/enrollments";
export const EnrollmentApi: EntityApi<Enrollment, FilterEnrollments | undefined> = {

    async getAll(options) {
        return ApiClient.get(end_point, options);
    },

    async lookup(options) {
        return ApiClient.get(`${end_point}/lookup`, options);
    },

    async getById(id: string) {
        return ApiClient.get(`${end_point}/${id}`);
    },


    async create(enrollment) {
        const sanitized = sanitize(enrollment)
        return ApiClient.post('/enrollments/', sanitized)
    },

    async update(enrollment) {
        if (!enrollment._id) throw new Error("_id required")
        return ApiClient.put(`/enrollments/${enrollment._id}`, sanitize(enrollment))
    },

    /*
    async transitionState(id: string, dto: StateTransition): Promise<any> {
        const query = new URLSearchParams();
        query.append("id", id);
        const url = `/enrollments/${id}`;
        const updated = await ApiClient.patch(url, dto);
        return updated;
    },
*/
    async delete(enrollment) {
        if (!enrollment._id) throw new Error("_id required")
        return ApiClient.delete(`/enrollments/${enrollment._id}`)
    }
}