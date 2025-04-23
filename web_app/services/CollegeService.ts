import { College } from "@/models/college";
import { MyService } from "./MyService";

const get_endpoint = '/colleges/';
const create_endpoint = '/colleges/create';
const update_endpoint = '/colleges/update';
const delete_endpoint = '/colleges/delete';


export const CollegeService = {

    async getColleges(): Promise<College[]> {
        const data = await MyService.get(get_endpoint);
        return data as College[];
    },

    async createCollege(college: Partial<College>): Promise<College> {
        const createdData = await MyService.post(create_endpoint, college);
        return createdData as College;
    },

    async updateCollege(college: Partial<College>): Promise<College> {
        if (!college._id) {
            throw new Error("_id required.");
        }
        const updatedCollege = await MyService.put(update_endpoint, college);
        return updatedCollege as College;
    },

    async deleteCollege(college: College): Promise<boolean> {
        if (!college._id) {
            throw new Error("_id required.");
        }
        const response = await MyService.delete(delete_endpoint);
        return response;
    },
};
