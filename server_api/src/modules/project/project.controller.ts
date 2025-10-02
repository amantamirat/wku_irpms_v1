import { Request, Response } from 'express';
import { errorResponse, successResponse } from '../../util/response';
import { ProjectService, CreateProjectDto } from './project.service';
import { AuthenticatedRequest } from '../users/auth/auth.middleware';
import mongoose from 'mongoose';

export class ProjectController {

  static async createProject(req: AuthenticatedRequest, res: Response) {
    try {
      const { call, title, summary } = req.body;
      const data: CreateProjectDto = {
        call: new mongoose.Types.ObjectId(call as string),
        title: title,
        summary: summary,
        createdBy: new mongoose.Types.ObjectId(req.user!.id),
      };
      const created = await ProjectService.createProject(data);
      successResponse(res, 201, "Project created successfully", created);
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  }


  static async submitProject(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.file) {
        return errorResponse(res, 400, "Document required");
      }
      const project = JSON.parse(req.body.project);
      const data: CreateProjectDto = {
        ...project,
        createdBy: new mongoose.Types.ObjectId(req.user!.id),
      };
      successResponse(res, 201, "Project submitted successfully.");
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
      const { call, title, summary } = req.body;
      const data: Partial<CreateProjectDto> = {
        call: new mongoose.Types.ObjectId(call as string),
        title: title,
        summary: summary
      };
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
