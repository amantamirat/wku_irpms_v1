import { Request, Response } from "express";
import { ConstraintService } from "./constraint.service";
import { errorResponse, successResponse } from "../../../util/response";
import { ConstraintType } from "./constraint-type.enum";
import { CreateProjectConstraintDTO, UpdateProjectConstraintDTO } from "./project/project-constraint.dto";
import { CreateApplicantConstraintDTO } from "./applicant/applicant-constaint.dto";

const service = new ConstraintService();
export class ConstraintController {
  //----------------------------------------
  // CREATE CONSTRAINT
  //----------------------------------------
  static async createConstraint(req: Request, res: Response) {
    try {
      const { type } = req.body;
      let created;
      if (type === ConstraintType.PROJECT) {
        const dto: CreateProjectConstraintDTO = req.body;
        created = await service.createProjectConstraint(dto);
      }
      else if (type === ConstraintType.APPLICANT) {
        const dto: CreateApplicantConstraintDTO = req.body;
        created = await service.createApplicantConstraint(dto);
      }
      successResponse(res, 201, "Constraint created successfully", created);
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  }  

  //----------------------------------------
  // GET CONSTRAINTS
  //----------------------------------------
  static async getConstraints(req: Request, res: Response) {
    try {
      const { grant, type } = req.query;
      const options = {
        grantId: grant ? grant as string : undefined,
        type: type ? (type as ConstraintType) : undefined,
      };
      const constraints = await service.getConstraints(options);
      successResponse(res, 200, "Constraints fetched successfully", constraints);
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  }

  //----------------------------------------
  // UPDATE PROJECT CONSTRAINT
  //----------------------------------------
  static async updateProjectConstraint(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const dto: UpdateProjectConstraintDTO = {
        id,
        data: req.body, // should only include min/max
      };
      const updated = await service.updateProjectConstraint(dto); // pass userId if needed
      successResponse(res, 200, "Project constraint updated successfully", updated);
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  }

  //----------------------------------------
  // DELETE CONSTRAINT
  //----------------------------------------
  static async deleteConstraint(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const deleted = await service.deleteConstraint(id); // pass userId if needed
      successResponse(res, 200, "Constraint deleted successfully", deleted);
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  }

}
