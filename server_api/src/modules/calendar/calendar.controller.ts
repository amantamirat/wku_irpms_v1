import { Request, Response } from 'express';
import { TransitionRequestDto } from '../../common/dtos/transition.dto';
import { ERROR_CODES } from '../../common/errors/error.codes';
import { errorResponse, successResponse } from '../../common/helpers/response';
import { AuthenticatedRequest } from '../auth/auth.middleware';
import {
  CreateCalendarDTO,
  UpdateCalendarDTO,
} from './calendar.dto';
import { CalendarService } from './calendar.service';
import { CalendarStatus } from './calendar.state-machine';


export class CalendarController {

  private service: CalendarService;

  constructor(service: CalendarService) {
    this.service = service;
  }

  create = async (req: Request, res: Response) => {
    try {
      const dto: CreateCalendarDTO = req.body;
      const calendar = await this.service.create(dto);
      successResponse(res, 201, 'Calendar created successfully', calendar);
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  };

  getById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const calendar = await this.service.getById(id);
      successResponse(res, 200, 'Calendars fetched successfully', calendar);
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  };

  get = async (req: Request, res: Response) => {
    try {
      const { status } = req.query;
      const calendars = await this.service.get(
        { status: status ? status as CalendarStatus : undefined }
      );
      successResponse(res, 200, 'Calendars fetched successfully', calendars);
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  };

  update = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { year, startDate, endDate } = req.body;

      const dto: UpdateCalendarDTO = {
        id,
        data: {
          year,
          startDate,
          endDate,
        },
      };

      const updated = await this.service.update(dto);
      successResponse(res, 200, 'Calendar updated successfully', updated);
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
      successResponse(res, 200, "Calendar status updated successfully", updated);
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  };

  

  delete = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const deleted = await this.service.delete(id);
      successResponse(res, 200, 'Calendar deleted successfully', deleted);
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  };
}
