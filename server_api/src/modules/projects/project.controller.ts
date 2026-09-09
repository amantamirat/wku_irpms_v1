import { Response } from "express";
import { errorResponse, successResponse } from "../../common/helpers/response";
import { AuthenticatedRequest } from "../auth/auth.middleware";
import { ProjectService } from "./project.service";
import { DeleteDto } from "../../common/dtos/delete.dto";
import { ERROR_CODES } from "../../common/errors/error.codes";
import { TransitionRequestDto } from "../../common/dtos/transition.dto";
import { ProjectStatus } from "./project.model";
import {
  CreateProjectDTO,
  FilterProjectsDTO,
  UpdateProjectDTO
} from "./project.dto";


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

  constructor(private readonly service: ProjectService) { }

  // -----------------------
  // Create
  // -----------------------

  create = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.auth) {
        throw new Error(ERROR_CODES.UNAUTHORIZED);
      }

      const {
        calendar,
        grant,
        leadPI,
        title,
        summary,
        themes,
        collaborators,
        phases
      } = req.body;

      const dto: CreateProjectDTO = {
        calendar,
        grant,
        title,
        summary,
        leadPI,
        themes: themes || [],
        collaborators: collaborators || [],
        phases: phases || []
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

  // -----------------------
  // Fetch / Query
  // -----------------------

  get = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const filters = buildProjectFilter(req.query);
      const projects = await this.service.getProjects(filters, { populate: true });
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
      const projects = await this.service.getProjects(filters);
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
      const { title, summary, themes } = req.body;

      const dto: UpdateProjectDTO = {
        id,
        data: {
          title,
          summary,
          themes
        },
        userId: req.auth.userId,
      };

      const updated = await this.service.update(dto);

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
      const { current, next } = req.body;

      const dto: TransitionRequestDto = {
        id,
        current,
        next,
        userId: req.auth.userId,
      };

      const updated = await this.service.transitionState(dto);

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
        userId: req.auth.userId,
      };

      const deleted = await this.service.delete(dto);

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