import { Request, Response } from 'express';
import Calendar from '../models/calendar';
import { successResponse, errorResponse } from '../util/response';



const createCalendar = async (req: Request, res: Response): Promise<void> => {
  try {
    const { year, start_date, end_date, status } = req.body;

    if (start_date && end_date && new Date(start_date) >= new Date(end_date)) {
      errorResponse(res, 400, 'Start date must be before end date');
      return;
    }

    const calendar = new Calendar({ year, start_date, end_date, status });
    await calendar.save();

    successResponse(res, 201, 'Academic calendar created successfully', calendar);
  } catch (error: any) {
    if (error.code === 11000) {
      errorResponse(res, 400, 'Year must be unique');
      return;
    }
    errorResponse(res, 500, 'Server error', error.message);
  }
};


const getAllCalendars = async (_req: Request, res: Response): Promise<void> => {
  try {
    const calendars = await Calendar.find().sort({ year: -1 });
    successResponse(res, 200, 'Academic calendars fetched successfully', calendars);
  } catch (error) {
    errorResponse(res, 500, 'Server error', (error as Error).message);
  }
};


const updateCalendar = async (req: Request, res: Response): Promise<void> => {
  try {
    const { year, start_date, end_date, status } = req.body;

    if (start_date && end_date && new Date(start_date) >= new Date(end_date)) {
      errorResponse(res, 400, 'Start date must be before end date');
      return;
    }

    const updatedCalendar = await Calendar.findByIdAndUpdate(
      req.params.id,
      { year, start_date, end_date, status },
      { new: true, runValidators: true }
    );

    if (!updatedCalendar) {
      errorResponse(res, 404, 'Academic calendar not found');
      return;
    }

    successResponse(res, 200, 'Academic calendar updated successfully', updatedCalendar);
  } catch (error: any) {
    if (error.code === 11000) {
      errorResponse(res, 400, 'Year must be unique');
      return;
    }
    errorResponse(res, 500, 'Server error', error.message);
  }
};


const deleteCalendar = async (req: Request, res: Response): Promise<void> => {
  try {
    const deletedCalendar = await Calendar.findByIdAndDelete(req.params.id);
    if (!deletedCalendar) {
      errorResponse(res, 404, 'Academic calendar not found');
      return;
    }
    successResponse(res, 200, 'Academic calendar deleted successfully', true);
  } catch (error) {
    errorResponse(res, 500, (error as Error).message, {});
  }
};

const calendarController = {
  createCalendar,
  getAllCalendars,
  updateCalendar,
  deleteCalendar,
};

export default calendarController;
