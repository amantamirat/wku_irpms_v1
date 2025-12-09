import { Response } from "express";
import mongoose from "mongoose";
import { errorResponse, successResponse } from "../../common/helpers/response";
import { AuthenticatedRequest } from "../users/user.middleware";
import { ProjectService } from "./project.service";
import { CreateProjectDTO, UpdateProjectDTO } from "./project.dto";
import { DeleteDto } from "../../util/delete.dto";


const projectService = new ProjectService();

export class ProjectController {


  static async createProject(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) throw new Error("User not found!");
      const { cycle, title, summary } = req.body;

      const dto: CreateProjectDTO = {
        cycleId: cycle,
        title,
        summary: summary,
        userId: req.user._id,
      };

      const created = await projectService.createProject(dto);
      successResponse(res, 201, "Project created successfully", created);
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  }


  // -----------------------
  // Submit (file upload)
  // -----------------------
  // NOTE: service currently uses the same create flow. documentPath is not
  // persisted in the project schema today; this endpoint forwards the
  // project payload and ignores the file path unless the model/schema is
  // extended to store it.
  /*
  static async submitProject(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) throw new Error("User not found!");
      if (!req.file) return errorResponse(res, 400, "Document required");

      const documentPath = `uploads/${req.file.filename}`;
      const project = JSON.parse(req.body.project);

      const dto: CreateProjectDTO = {
        cycleId: new mongoose.Types.ObjectId(project.cycle as string),
        title: project.title,
        summary: project.summary ?? undefined,
        status: project.status,
        userId: req.user._id,
      };

      //const submitted = await ProjectService.createProject(dto);
      successResponse(res, 201, "Project submitted successfully", dto);
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  }
    */
  // -----------------------
  // Fetch / Query
  // -----------------------
  static async getProjects(req: AuthenticatedRequest, res: Response) {
    try {
      const { cycle, status, user } = req.query;

      /*

      const filter: GetProjectsOptions = {
        userId: user && req.user ? req.user._id : undefined,
        cycle: cycle ? new mongoose.Types.ObjectId(cycle as string) : undefined,
        status: status as any,
      };

      */

      const projects = await projectService.getProjects({});
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
        userId: req.user._id,
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
      const dto: DeleteDto = { id, userId: req.user._id };

      const deleted = await projectService.deleteProject(dto);
      successResponse(res, 200, "Project deleted successfully", deleted);
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  }

}
