import { Request, Response } from 'express';
import Directorate from '../models/directorate';
import { successResponse, errorResponse } from '../util/response';


const createDirectorate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { directorate_name } = req.body;

    const directorate = new Directorate({ directorate_name });
    await directorate.save();

    successResponse(res, 201, 'Directorate created successfully', directorate);
  } catch (error: any) {
    if (error.code === 11000) {
      errorResponse(res, 400, 'Directorate name must be unique');
      return;
    }
    errorResponse(res, 500, 'Server error', error.message);
  }
};


const getAllDirectorates = async (req: Request, res: Response): Promise<void> => {
  try {
    const directorates = await Directorate.find();
    successResponse(res, 200, 'Directorates fetched successfully', directorates);
  } catch (error) {
    errorResponse(res, 500, 'Server error', (error as Error).message);
  }
};


const getDirectorateById = async (req: Request, res: Response): Promise<void> => {
  try {
    const directorate = await Directorate.findById(req.params.id);
    if (!directorate) {
      errorResponse(res, 404, 'Directorate not found');
      return;
    }
    successResponse(res, 200, 'Directorate fetched successfully', directorate);
  } catch (error) {
    errorResponse(res, 500, (error as Error).message, {});
  }
};


const updateDirectorate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { directorate_name } = req.body;

    const updatedDirectorate = await Directorate.findByIdAndUpdate(
      req.params.id,
      { directorate_name },
      { new: true, runValidators: true }
    );

    if (!updatedDirectorate) {
      errorResponse(res, 404, 'Directorate not found');
      return;
    }

    successResponse(res, 200, 'Directorate updated successfully', updatedDirectorate);
  } catch (error: any) {
    if (error.code === 11000) {
      errorResponse(res, 400, 'Directorate name must be unique');
      return;
    }
    errorResponse(res, 500, 'Server error', error.message);
  }
};


const deleteDirectorate = async (req: Request, res: Response): Promise<void> => {
  try {
    const deletedDirectorate = await Directorate.findByIdAndDelete(req.params.id);
    if (!deletedDirectorate) {
      errorResponse(res, 404, 'Directorate not found');
      return;
    }

    successResponse(res, 200, 'Directorate deleted successfully', true);
  } catch (error) {
    errorResponse(res, 500, (error as Error).message, false);
  }
};

const directorateController = {
  createDirectorate,
  getAllDirectorates,
  getDirectorateById,
  updateDirectorate,
  deleteDirectorate,
};

export default directorateController;
