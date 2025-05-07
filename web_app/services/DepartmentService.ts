import { Department } from "@/models/department";
import { MyService } from "./MyService";

const end_point = '/departments/';


export const DepartmentService = {

    async getDepartments(): Promise<Department[]> {
        const data = await MyService.get(end_point);
        return data as Department[];
    },

    async createDepartment(department: Partial<Department>): Promise<Department> {
        const createdData = await MyService.post(end_point, department);
        return createdData as Department;
    },

    async updateDepartment(department: Partial<Department>): Promise<Department> {
        if (!department._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}${department._id}`;
        const updatedDepartment = await MyService.put(url, department);
        return updatedDepartment as Department;
    },

    async deleteDepartment(department: Partial<Department>): Promise<boolean> {
        if (!department._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}${department._id}`;
        const response = await MyService.delete(url);
        return response;
    },
};
