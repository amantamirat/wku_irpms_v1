import { Request, Response } from 'express';
import { errorResponse, successResponse } from '../../util/response';
import { CalendarService, CreateCalendarDto, GetCalendarOptions } from './calendar.service';
import { CalendarStatus } from './calendar.enum';

export class CalendarController {

  static async createCalendar(req: Request, res: Response) {
    try {
      const data: CreateCalendarDto = req.body;
      const calendar = await CalendarService.createCalendar(data);
      successResponse(res, 201, "Calendar created successfully", calendar);
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  }

  static async getCalendars(req: Request, res: Response) {
    try {
      const { status } = req.query;
      const options: GetCalendarOptions = {
        status: status as CalendarStatus ?? undefined
      }
      const calendars = await CalendarService.getCalendars(options);
      successResponse(res, 200, 'Calendars fetched successfully', calendars);
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  }

  static async updateCalendar(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data: Partial<CreateCalendarDto> = req.body;
      const updated = await CalendarService.updateCalendar(id, data);
      successResponse(res, 201, "Calendar updated successfully", updated);
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  }

  static async deleteCalendar(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const deleted = await CalendarService.deleteCalendar(id);
      successResponse(res, 201, "Calendar deleted successfully", deleted);
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  }

}


