import { Request, Response } from 'express';
import { AssignmentService, CreateAssignmentDto, GetAssignmentOptions, UpdateAssignmentDto } from './assignment.service';
import { errorResponse, successResponse } from '../../../../util/response';


export class AssignmentController {

    static async createAssignment(req: Request, res: Response) {
        try {
            const data: CreateAssignmentDto = {
                collaborator: req.body.collaborator,
                role: req.body.role,
                assignmentType: req.body.assignmentType,
                assignmentId: req.body.assignmentId,
            };
            const assignment = await AssignmentService.createAssignment(data);
            successResponse(res, 201, "Assignment created successfully", assignment);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async getAssignments(req: Request, res: Response) {
        try {
            const { collaborator, assignmentType, assignmentId } = req.query;
            const filter: GetAssignmentOptions = {
                collaborator: collaborator as string ?? undefined,
                assignmentType: assignmentType as any,
                assignmentId: assignmentId as string ?? undefined,
            };
            const assignments = await AssignmentService.getAssignments(filter);
            successResponse(res, 200, 'Assignments fetched successfully', assignments);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async findAssignment(req: Request, res: Response) {
        try {
            const { id, collaborator } = req.query;
            const filter: GetAssignmentOptions = {
                _id: id as string ?? undefined,
                collaborator: collaborator as string ?? undefined,
            };
            const assignment = await AssignmentService.findAssignment(filter);
            successResponse(res, 200, 'Assignment fetched successfully', assignment);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async updateAssignment(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const data: Partial<UpdateAssignmentDto> = {
                role: req.body.role
            };
            const updated = await AssignmentService.updateAssignment(id, data);
            successResponse(res, 201, "Assignment updated successfully", updated);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async deleteAssignment(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const deleted = await AssignmentService.deleteAssignment(id);
            successResponse(res, 201, "Assignment deleted successfully", deleted);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

}
