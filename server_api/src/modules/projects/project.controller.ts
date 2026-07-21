import fs from "fs";
import path from "path";
import { Response } from "express";
import { errorResponse, successResponse } from "../../common/helpers/response";
import { AuthenticatedRequest } from "../auth/auth.middleware";
import { ProjectService } from "./project.service";
import { ApplyProjectDTO, CreateGrantProjectDTO, CreateProjectDTO, UpdateProjectDTO } from "./project.dto";
import { DeleteDto } from "../../common/dtos/delete.dto";
import { ERROR_CODES } from "../../common/errors/error.codes";
import { TransitionRequestDto } from "../../common/dtos/transition.dto";
import { ProjectStatus } from "./project.model";

export class ProjectController {


  constructor(private readonly service: ProjectService) { }

  createFromGrant = async (req: AuthenticatedRequest, res: Response) => {
    try {
      // 1. Authentication Guard
      if (!req.auth) throw new Error(ERROR_CODES.UNAUTHORIZED);

      const { calendar, grant, title, summary, themes, collaborators, phases } = req.body;

      // 2. Construct the DTO using the authenticated user's ID as the applicant
      const dto: CreateGrantProjectDTO = {
        calendar,
        grant,
        title,
        summary,
        applicant: req.auth.userId,
        themes: themes || [],
        collaborators: collaborators || [],
        phases: phases || []
      };

      // 3. Delegate execution to the new service method
      const created = await this.service.createFromGrant(dto);
      // 4. Send clean success framework response
      successResponse(res, 201, "Grant project created successfully", created);
    } catch (err: any) {
      // 5. Catch validations or database transaction rollbacks safely
      errorResponse(res, 400, err.message, err);
    }
  };
  // -----------------------
  // Create
  // -----------------------
  create = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.auth) throw new Error(ERROR_CODES.UNAUTHORIZED);

      const { grant, title, summary, themes } = req.body;

      const dto: CreateProjectDTO = {
        grant: grant,
        title,
        summary,
        applicant: req.auth.userId,
        themes: themes
      };
      const created = await this.service.create(dto);
      successResponse(res, 201, "Project created successfully", created);
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  };

  apply = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.auth) throw new Error(ERROR_CODES.UNAUTHORIZED);
      if (!req.file) throw new Error(ERROR_CODES.FILE_NOT_FOUND);

      let project;
      try {
        project = JSON.parse(req.body.project);
      } catch {
        throw new Error("Invalid project format");
      }
      // Convert absolute system path to a clean relative path for your DB entry
      // e.g., "uploads/projects/1715623-28392.pdf"     
      const relativeDocPath = path.relative(process.cwd(), req.file.path).replace(/\\/g, '/');
      const dto: ApplyProjectDTO = {
        call: project.call,
        title: project.title,
        summary: project.summary,
        applicant: req.auth.userId,
        collaborators: project.collaborators || [],
        themes: project.themes || [],
        phases: project.phases || [],
        docPath: relativeDocPath, // Saved cleanly to your DB
      };
      const submitted = await this.service.apply(dto);
      successResponse(res, 201, "Project submitted successfully", submitted);

    } catch (err: any) {
      // If the service/validation layer fails, delete the file from the exact spot it landed
      if (req.file && req.file.path) {
        fs.unlink(req.file.path, (unlinkErr) => {
          if (unlinkErr) console.error(`Failed to delete orphaned file at ${req.file?.path}:`, unlinkErr);
        });
      }
      errorResponse(res, 400, err.message, err);
    }
  };

  // -----------------------
  // Fetch / Query
  // -----------------------
  get = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { applicant, grant, call, status, populate } = req.query;

      const projects = await this.service.getProjects({
        applicant: applicant ? String(applicant) : undefined,
        grant: grant ? String(grant) : undefined,
        call: call ? String(call) : undefined,
        status: status ? (status as ProjectStatus) : undefined,

        options: populate === "true"
          ? {
            populate: {
              applicant: true,
              grant: true,
              currentStage: true
            }
          }
          : undefined
      });

      successResponse(res, 200, "Projects fetched successfully", projects);
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  };

  getById = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const project = await this.service.getById(id);
      successResponse(res, 200, 'Project fetched successfully', project);
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  };

  // -----------------------
  // Update
  // -----------------------
  update = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.auth) throw new Error(ERROR_CODES.UNAUTHORIZED);

      const { id } = req.params;
      const { title, summary, themes } = req.body;

      const dto: UpdateProjectDTO = {
        id: id as string,
        data: { title, summary, themes },
        applicantId: req.auth.userId,
      };

      const updated = await this.service.update(dto);
      successResponse(res, 200, "Project updated successfully", updated);
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  };

  transitionState = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.auth) throw new Error(ERROR_CODES.UNAUTHORIZED);
      const { id } = req.params;
      const { current, next } = req.body;
      const dto: TransitionRequestDto = {
        id: String(id),
        current: current,
        next: next,
        applicantId: req.auth.userId,
      };
      const updated = await this.service.transitionState(dto);
      successResponse(res, 200, "Project status updated successfully", updated);
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  };

  // -----------------------
  // Delete
  // -----------------------
  delete = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.auth) throw new Error("User not found!");

      const { id } = req.params;

      const dto: DeleteDto = {
        id,
        userId: req.auth.userId,
      };
      const deleted = await this.service.delete(dto);
      successResponse(res, 200, "Project deleted successfully", deleted);
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  };
}
