import { Request, Response } from 'express';
import { errorResponse, successResponse } from '../../common/helpers/response';
import { CalendarService } from './calendar.service';
import { CreateCalendarDTO, UpdateCalendarDTO } from './calendar.dto';

const service = new CalendarService();
export class CalendarController {

  static async create(req: Request, res: Response) {
    try {
      const data: CreateCalendarDTO = req.body;
      const calendar = await service.create(data);
      successResponse(res, 201, "Calendar created successfully", calendar);
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  }

  static async get(req: Request, res: Response) {
    try {
      const calendars = await service.getAll();
      successResponse(res, 200, 'Calendars fetched successfully', calendars);
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { year, startDate, endDate } = req.body;
      const dto: UpdateCalendarDTO = {
        id,
        data: {
          year,
          startDate,
          endDate
        },
        // userId: req.user._id,
      };
      const updated = await service.update(dto);
      successResponse(res, 201, "Calendar updated successfully", updated);
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const deleted = await service.delete(id);
      successResponse(res, 201, "Calendar deleted successfully", deleted);
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  }

}


