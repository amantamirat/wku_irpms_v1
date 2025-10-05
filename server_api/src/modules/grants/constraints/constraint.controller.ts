import { Request, Response } from 'express';
import { ConstraintService, CreateConstraintDto, GetConstraintOptions } from './constraint.service';
import { errorResponse, successResponse } from '../../../util/response';


export class ConstraintController {

  static async createConstraint(req: Request, res: Response) {
    try {
      const data: CreateConstraintDto = req.body;
      const constraint = await ConstraintService.createConstraint(data);
      successResponse(res, 201, "Constraint created successfully", constraint);
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  }

  static async getConstraints(req: Request, res: Response) {
    try {
      const { status } = req.query;
      const options: GetConstraintOptions = {
        
      }
      const constraints = await ConstraintService.getConstraints(options);
      successResponse(res, 200, 'Constraints fetched successfully', constraints);
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  }

  static async updateConstraint(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data: Partial<CreateConstraintDto> = req.body;
      const updated = await ConstraintService.updateConstraint(id, data);
      successResponse(res, 201, "Constraint updated successfully", updated);
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  }

  static async deleteConstraint(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const deleted = await ConstraintService.deleteConstraint(id);
      successResponse(res, 201, "Constraint deleted successfully", deleted);
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  }

}


