import { Request, Response } from 'express';
import { ConstraintService, CreateConstraintDto, GetConstraintOptions } from './constraint.service';
import { errorResponse, successResponse } from '../../../util/response';
import mongoose from 'mongoose';
import { BaseConstraintType } from './constraint.enum';



export class ConstraintController {

  static async createConstraint(req: Request, res: Response) {
    try {
      const { grant, type, constraint, min, max, mode, value, item } = req.body;
      const data: CreateConstraintDto = {
        type: type,
        grant: grant,
        constraint: constraint,
        min: type !== BaseConstraintType.APPLICANT ? min : undefined,
        max: type !== BaseConstraintType.APPLICANT ? max : undefined,
        mode: type === BaseConstraintType.APPLICANT ? mode : undefined,
        value: value ?? undefined,
        item: item ?? undefined,
      };
      const created = await ConstraintService.createConstraint(data);
      successResponse(res, 201, "Constraint created successfully", created);
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  }

  static async getConstraints(req: Request, res: Response) {
    try {
      const { grant, type, parent} = req.query;
      const options: GetConstraintOptions = {
        grant: new mongoose.Types.ObjectId(grant as string),
        type: type as BaseConstraintType,
        parent: new mongoose.Types.ObjectId(parent as string),
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
      const { type, constraint, min, max, mode, value, item } = req.body;
      const data: Partial<CreateConstraintDto> = {
        constraint: constraint ?? undefined,
        min: min ?? undefined,
        max: max ?? undefined,
        mode: mode ?? undefined,
        value: value ?? undefined,
        item: item ?? undefined,
      };
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


