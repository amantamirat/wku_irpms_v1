import { Response } from "express";
import { errorResponse, successResponse } from "../../common/helpers/response";
import { AuthenticatedRequest } from "../users/auth/auth.middleware";
import { ProjectService } from "./project.service";
import { CreateProjectDTO, UpdateProjectDTO, UpdateStatusDTO } from "./project.dto";
import { DeleteDto } from "../../common/dtos/delete.dto";
import { ProjectStatus } from "./project.status";
import { ERROR_CODES } from "../../common/errors/error.codes";

export class ProjectController {

  private service: ProjectService;

  constructor(service?: ProjectService) {
    this.service = service || new ProjectService();
  }
  // -----------------------
  // Create
  // -----------------------
  create = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) throw new Error("User not found!");

      const { call, title, summary } = req.body;

      const dto: CreateProjectDTO = {
        call,
        title,
        summary,
        applicant: req.user.applicantId,
      };

      const created = await this.service.create(dto);
      successResponse(res, 201, "Project created successfully", created);
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  };

  // -----------------------
  // Fetch / Query
  // -----------------------
  get = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { call, applicant, workspace } = req.query;

      const projects = await this.service.getProjects({
        call: call ? call as string : undefined,
        applicant: applicant ? applicant as string : undefined,
        workspace: workspace ? workspace as string : undefined,
      });

      successResponse(res, 200, "Projects fetched successfully", projects);
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  };

  // -----------------------
  // Update
  // -----------------------
  update = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) throw new Error(ERROR_CODES.UNAUTHORIZED);

      const { id } = req.query;
      const { title, summary } = req.body;

      const dto: UpdateProjectDTO = {
        id: id as string,
        data: { title, summary },
        applicantId: req.user.applicantId,
      };

      const updated = await this.service.update(dto);
      successResponse(res, 200, "Project updated successfully", updated);
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  };

  // ---------------------------------------------------
  // Update Status
  // ---------------------------------------------------
  updateStatus = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) throw new Error("User not found!");

      const { id } = req.query;
      const { status } = req.params;

      const dto: UpdateStatusDTO = {
        data: {
          id: id as string,
          status: status as ProjectStatus
        },
        //userId: userId,
      };
      const updated = await this.service.updateStatus(dto);
      successResponse(res, 200, "Stage status updated successfully", updated);
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  };

  // -----------------------
  // Delete
  // -----------------------
  delete = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) throw new Error("User not found!");

      const { id } = req.params;

      const dto: DeleteDto = {
        id,
        applicantId: req.user.applicantId,
      };
      const deleted = await this.service.delete(dto);
      successResponse(res, 200, "Project deleted successfully", deleted);
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  };
}
