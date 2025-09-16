import { Request, Response } from 'express';
import { errorResponse, successResponse } from '../../util/response';
import { ProjectService, CreateProjectDto } from './project.service';
import { AuthenticatedRequest } from '../users/auth/auth.middleware';

export class ProjectController {

  static async createProject(req: AuthenticatedRequest, res: Response) {
    try {
      const data: CreateProjectDto = {
        ...req.body,
        createdBy: req.user!.id,
      };
      const theme = await ProjectService.createProject(data);
      successResponse(res, 201, "Project created successfully", theme);
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  }

  static async getProjects(req: Request, res: Response) {
    try {
      const projects = await ProjectService.getProjects();
      successResponse(res, 200, 'Projects fetched successfully', projects);
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  }

  static async updateProject(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data: Partial<CreateProjectDto> = req.body;
      const updated = await ProjectService.updateProject(id, data);
      successResponse(res, 201, "Project updated successfully", updated);
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  }

  static async deleteProject(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const deleted = await ProjectService.deleteProject(id);
      successResponse(res, 201, "Project deleted successfully", deleted);
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  }

}
