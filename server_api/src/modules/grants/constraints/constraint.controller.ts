import { Request, Response } from "express";
import { ConstraintService } from "./constraint.service";
import { successResponse, errorResponse } from "../../../common/helpers/response";
import { CreateConstraintDTO, UpdateConstraintDTO } from "./constraint.dto";

export class ConstraintController {

  private service: ConstraintService;

  constructor(service: ConstraintService) {
    this.service = service;
  }

  //----------------------------------------
  // CREATE CONSTRAINT
  //----------------------------------------
  create = async (req: Request, res: Response) => {
    try {      
      const data: CreateConstraintDTO = {
        ...req.body,
      };
      const constaint = await this.service.create(data);
      successResponse(res, 201, "Constraint created successfully", constaint);
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  }

  //----------------------------------------
  // GET CONSTRAINTS
  //----------------------------------------
  get = async (req: Request, res: Response) => {
    try {
      const { grant, type } = req.query;

      const options = {
        grant: grant ? String(grant) : undefined,
      };

      const constraints = await this.service.getConstraints(options);
      successResponse(res, 200, "Constraints fetched successfully", constraints);
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  }

  //----------------------------------------
  // UPDATE CONSTRAINT
  //----------------------------------------
  update = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const dto: UpdateConstraintDTO = {
        id,
        data: req.body
      };

      const updated = await this.service.update(dto);
      successResponse(res, 200, "Project constraint updated successfully", updated);
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  }

  //----------------------------------------
  // DELETE CONSTRAINT
  //----------------------------------------
  delete = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const deleted = await this.service.delete(id);
      successResponse(res, 200, "Constraint deleted successfully", deleted);
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  }
}
