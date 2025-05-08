import { Program } from "@/models/program";
import { MyService } from "./MyService";
import { Department } from "@/models/department";

const end_point = '/programs/';


export const ProgramService = {

    async getPrograms(): Promise<Program[]> {
        const data = await MyService.get(end_point);
        return data as Program[];
    },

    async getProgramsByDepartment(department: Department): Promise<Program[]> {
        if (!department._id) {
            throw new Error("_id required.");
        }
        const data = await MyService.get(`${end_point}${department._id}`);
        return data as Program[];
    },

    async createProgram(program: Partial<Program>): Promise<Program> {
        const createdData = await MyService.post(end_point, program);
        return createdData as Program;
    },

    async updateProgram(program: Partial<Program>): Promise<Program> {
        if (!program._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}${program._id}`;
        const updatedProgram = await MyService.put(url, program);
        return updatedProgram as Program;
    },

    async deleteProgram(program: Partial<Program>): Promise<boolean> {
        if (!program._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}${program._id}`;
        const response = await MyService.delete(url);
        return response;
    },
};
