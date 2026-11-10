import fs from "fs";
import path from "path";
import { Response } from "express";
import { errorResponse, successResponse } from "../../common/helpers/response";
import { AuthenticatedRequest } from "../auth/auth.middleware";
import { ProjectService } from "./project.service";
import { DeleteDto } from "../../common/dtos/delete.dto";
import { ERROR_CODES } from "../../common/errors/error.codes";
import { TransitionRequestDto } from "../../common/dtos/transition.dto";
import { ProjectStatus } from "./project.model";
import {
  ApplyProjectDTO,
  CreateOLDProjectDTO,
  FilterProjectsDTO,
  UpdateProjectDTO
} from "./project.dto";
import { ProjectProgressService } from "./project-progress-service";
import { toObjectId } from "../../common/utils/mongoose.utils";
import { CreateProjectDto } from "./project.dto";
import { AppError } from "../../common/errors/app.error";


const buildProjectFilter = (
  query: AuthenticatedRequest["query"]
): FilterProjectsDTO => {
  const {
    grant,
    calendar,
    leadPI,
    call,
    title,
    status
  } = query;

  return {
    grant: grant ? String(grant) : undefined,
    calendar: calendar ? String(calendar) : undefined,
    leadPI: leadPI ? String(leadPI) : undefined,
    call: call ? String(call) : undefined,
    title: title ? String(title) : undefined,
    status: status ? String(status) as ProjectStatus : undefined,
  };
};

export class ProjectController {

  constructor(private readonly service: ProjectService,
    private readonly progressService: ProjectProgressService
  ) { }

  // -----------------------
  // Create
  // -----------------------

  create = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.auth) {
        throw new Error(ERROR_CODES.UNAUTHORIZED);
      }

      const {
        grant,
        calendar,
        //leadPI,
        call,
        title,
        objectives,
        summary,
        themes,
        keywords,
        totalBudget,
        totalDuration
      } = req.body;

      const dto: CreateProjectDto = {
        grant,
        calendar,
        //leadPI,
        call,
        title,
        objectives,
        summary,
        themes: themes || [],
        keywords: keywords || [],
        totalBudget: Number(totalBudget),
        totalDuration: Number(totalDuration)
      };

      const created = await this.service.create(dto, req.auth.userId);

      successResponse(
        res,
        201,
        "Project created successfully",
        created
      );
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  };




  apply = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.auth) {
        throw new AppError(ERROR_CODES.UNAUTHORIZED);
      }

      if (!req.file) {
        throw new AppError(ERROR_CODES.FILE_NOT_FOUND);
      }

      const { id } = req.params;

      // Parse application project data
      const parsedProject = JSON.parse(
        req.body.project,
      ) as ApplyProjectDTO;

      const dto: ApplyProjectDTO = {
        title: parsedProject.title,
        objectives: parsedProject.objectives,
        summary: parsedProject.summary,

        themes: parsedProject.themes ?? [],
        keywords: parsedProject.keywords ?? [],

        totalBudget: parsedProject.totalBudget ?? 0,
        totalDuration: parsedProject.totalDuration ?? 0,

        collaborators: parsedProject.collaborators ?? [],
        phases: parsedProject.phases ?? [],
        components: parsedProject.components ?? [],
        activities: parsedProject.activities ?? [],
        equipments: parsedProject.equipments ?? [],
      };

      const submitted = await this.service.apply(
        id,
        dto,
        req.auth.userId,
        req.file,
      );

      successResponse(
        res,
        201,
        "Project submitted successfully",
        submitted,
      );
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  };

  // -----------------------
  // Fetch / Query
  // -----------------------

  get = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.auth) {
        return
      }
      const filters = buildProjectFilter(req.query);
      const projects = await this.service.readProjects(filters, req.auth.userId, req.auth.scope, { populate: true });
      successResponse(
        res,
        200,
        "Projects fetched successfully",
        projects
      );
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  };


  lookup = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const filters = buildProjectFilter(req.query);
      const projects = await this.service.lookup(filters);
      successResponse(
        res,
        200,
        "Projects fetched successfully",
        projects
      );
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  };

  getById = async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    try {
      const { id } = req.params;
      const project = await this.service.getById(id, { populate: true });
      successResponse(
        res,
        200,
        "Project fetched successfully",
        project
      );
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  };

  
  getMyProjects = async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    try {
      if (!req.auth) {
        throw new Error(ERROR_CODES.UNAUTHORIZED);
      }

      const filters = buildProjectFilter(req.query);

      const projects = await this.service.getMyProjects(
        req.auth.userId, filters,
      );

      successResponse(
        res,
        200,
        "My projects fetched successfully",
        projects
      );
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  };

 



  // -----------------------
  // Progress
  // -----------------------

  getProgress = async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    try {
      if (!req.auth) {
        throw new Error(ERROR_CODES.UNAUTHORIZED);
      }

      const { id } = req.params;

      const progress =
        await this.progressService.getProjectProgress(
          toObjectId(id)
        );

      successResponse(
        res,
        200,
        "Project progress fetched successfully",
        progress
      );
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  };

  // -----------------------
  // Update
  // -----------------------

  update = async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    try {
      if (!req.auth) {
        throw new Error(ERROR_CODES.UNAUTHORIZED);
      }

      const { id } = req.params;

      const {
        title,
        summary,
        themes,
        objectives,
        totalBudget,
        totalDuration
      } = req.body;

      const dto: UpdateProjectDTO = {
        title,
        summary,
        themes,
        objectives,
        totalBudget,
        totalDuration
      };

      const updated = await this.service.update(
        id,
        dto,
        req.auth.userId
      );

      successResponse(
        res,
        200,
        "Project updated successfully",
        updated
      );
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  };

  // -----------------------
  // Transition
  // -----------------------

  transitionState = async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    try {
      if (!req.auth) {
        throw new Error(ERROR_CODES.UNAUTHORIZED);
      }

      const { id } = req.params;
      const { current, next, reason } = req.body;

      const dto: TransitionRequestDto = {
        id,
        current,
        next,
        reason
      };

      const updated = await this.service.transitionState(dto, req.auth.userId);

      successResponse(
        res,
        200,
        "Project status updated successfully",
        updated
      );
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  };

  // -----------------------
  // Delete
  // -----------------------

  delete = async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    try {
      if (!req.auth) {
        throw new Error(ERROR_CODES.UNAUTHORIZED);
      }

      const { id } = req.params;

      const dto: DeleteDto = {
        id,
      };

      const deleted = await this.service.delete(dto, req.auth.userId);

      successResponse(
        res,
        200,
        "Project deleted successfully",
        deleted
      );
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  };
}