import fs from "fs";
import { Response } from "express";
import { errorResponse, successResponse } from "../../common/helpers/response";
import { AuthenticatedRequest } from "../users/auth/auth.middleware";
import { ProjectService } from "./project.service";
import { ApplyProjectDTO, CreateProjectDTO, UpdateProjectDTO } from "./project.dto";
import { DeleteDto } from "../../common/dtos/delete.dto";
import { ERROR_CODES } from "../../common/errors/error.codes";
import { TransitionRequestDto } from "../../common/dtos/transition.dto";

export class ProjectController {


  constructor(private readonly service: ProjectService) { }
  // -----------------------
  // Create
  // -----------------------
  create = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) throw new Error(ERROR_CODES.UNAUTHORIZED);

      const { grantAllocation, title, summary, themes } = req.body;

      const dto: CreateProjectDTO = {
        grantAllocation: grantAllocation,
        title,
        summary,
        applicant: req.user.applicantId,
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
      if (!req.user) throw new Error(ERROR_CODES.UNAUTHORIZED);
      if (!req.file) throw new Error(ERROR_CODES.FILE_NOT_FOUND);

      let project;
      try {
        project = JSON.parse(req.body.project);
      } catch {
        throw new Error("Invalid project format");
      }

      const dto: ApplyProjectDTO = {
        call: project.call,
        title: project.title,
        summary: project.summary,
        applicant: req.user.applicantId,
        collaborators: project.collaborators || [],
        themes: project.themes || [],
        phases: project.phases || [],
        docPath: `uploads/${req.file.filename}`,
      };
      const submitted = await this.service.apply(dto);
      successResponse(res, 201, "Project submitted successfully", submitted);
    } catch (err: any) {
      if (req.file) {
        fs.unlink(`uploads/${req.file.filename}`, () => { });
      }
      errorResponse(res, 400, err.message, err);
    }
  };

  // -----------------------
  // Fetch / Query
  // -----------------------
  get = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { grantAllocation, applicant, grant, calendar, workspace, populate } = req.query;

      const projects = await this.service.getProjects({
        grantAllocation: grantAllocation ? grantAllocation as string : undefined,
        applicant: applicant ? applicant as string : undefined,
        grant: grant ? grant as string : undefined,
        calendar: calendar ? calendar as string : undefined,
        workspace: workspace ? workspace as string : undefined,
        ...(populate !== undefined && { populate: populate === "true" })
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

      const { id } = req.params;
      const { title, summary, themes } = req.body;

      const dto: UpdateProjectDTO = {
        id: id as string,
        data: { title, summary, themes },
        applicantId: req.user.applicantId,
      };

      const updated = await this.service.update(dto);
      successResponse(res, 200, "Project updated successfully", updated);
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  };

  transitionState = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) throw new Error(ERROR_CODES.UNAUTHORIZED);
      const { id } = req.params;
      const { current, next } = req.body;
      const dto: TransitionRequestDto = {
        id: String(id),
        current: current,
        next: next,
        applicantId: req.user.applicantId,
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
