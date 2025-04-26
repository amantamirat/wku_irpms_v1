import { College } from "@/models/college";
import { MyService } from "./MyService";

const end_point = '/colleges/';


export const CollegeService = {

    async getColleges(): Promise<College[]> {
        const data = await MyService.get(end_point);
        return data as College[];
    },

    async createCollege(college: Partial<College>): Promise<College> {
        const createdData = await MyService.post(end_point, college);
        return createdData as College;
    },

    async updateCollege(college: Partial<College>): Promise<College> {
        if (!college._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}${college._id}`;
        const updatedCollege = await MyService.put(url, college);
        return updatedCollege as College;
    },

    async deleteCollege(college: College): Promise<boolean> {
        if (!college._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}${college._id}`;
        const response = await MyService.delete(url);
        return response;
    },
};
