import { Request, Response } from 'express';
import { CalendarService } from './calendar.service';
import {
  CreateCalendarDTO,
  UpdateCalendarDTO,
  UpdateCalendarStatusDTO
} from './calendar.dto';
import { successResponse, errorResponse } from '../../common/helpers/response';
import { AuthenticatedRequest } from '../users/user.middleware';
// import { AuthenticatedRequest } from '../users/user.middleware';
// import { AppError } from '../../common/errors/app.error';
// import { ERROR_CODES } from '../../common/errors/error.codes';

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

  get = async (req: Request, res: Response) => {
    try {
      const calendars = await this.service.getAll();
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

  updateStatus = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const dto: UpdateCalendarStatusDTO = {
        id: String(id),
        status
      };
      const updated = await this.service.updateStatus(dto);
      successResponse(res, 200, `Calendar status changed to ${status}`, updated);
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
