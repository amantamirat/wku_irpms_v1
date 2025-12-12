import { Response } from "express";
import { errorResponse, successResponse } from "../../common/helpers/response";
import { AuthenticatedRequest } from "../users/user.middleware";
import { ProjectService } from "./project.service";
import { CreateProjectDTO, UpdateProjectDTO } from "./project.dto";
import { DeleteDto } from "../../util/delete.dto";


const projectService = new ProjectService();

export class ProjectController {
  // -----------------------
  // Create
  // -----------------------
  static async createProject(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) throw new Error("User not found!");
      const { call, title, summary } = req.body;

      const dto: CreateProjectDTO = {
        call,
        title,
        summary: summary,
        leadPI: req.user.applicantId,
      };
      const created = await projectService.createProject(dto);
      successResponse(res, 201, "Project created successfully", created);
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  }
  // -----------------------
  // Fetch / Query
  // -----------------------
  static async getProjects(req: AuthenticatedRequest, res: Response) {
    try {
      const { call, leadPI } = req.query;
      const projects = await projectService.getProjects({
        call: call as string,
        leadPI: leadPI as string
      });
      successResponse(res, 200, "Projects fetched successfully", projects);
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  }
  // -----------------------
  // Update
  // -----------------------
  static async updateProject(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) throw new Error("User not found!");

      const { id } = req.params;
      const { title, summary } = req.body;

      const dto: UpdateProjectDTO = {
        id,
        data: { title, summary },
        userId: req.user.applicantId,
      };

      const updated = await projectService.updateProject(dto);
      successResponse(res, 200, "Project updated successfully", updated);
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  }


  // -----------------------
  // Delete
  // -----------------------
  static async deleteProject(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) throw new Error("User not found!");

      const { id } = req.params;
      const dto: DeleteDto = { id, userId: req.user.applicantId };
      const deleted = await projectService.deleteProject(dto);
      successResponse(res, 200, "Project deleted successfully", deleted);
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  }

}
