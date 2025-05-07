import { Request, Response } from 'express';
import Specialization from '../models/specialization';
import { successResponse, errorResponse } from '../util/response';

const createSpecialization = async (req: Request, res: Response): Promise<void> => {
  try {
    const { department, specialization_name, academic_level } = req.body;

    const specialization = new Specialization({ department, specialization_name, academic_level });
    await specialization.save();

    successResponse(res, 201, 'Specialization created successfully', specialization);
  } catch (error: any) {
    if (error.code === 11000) {
      errorResponse(res, 400, 'Specialization already exists in this department');
      return;
    }
    errorResponse(res, 500, 'Server error', error.message);
  }
};

const getAllSpecializations = async (req: Request, res: Response): Promise<void> => {
  try {
    const specializations = await Specialization.find().populate('department');
    successResponse(res, 200, 'Specializations fetched successfully', specializations);
  } catch (error) {
    errorResponse(res, 500, 'Server error', (error as Error).message);
  }
};

const getSpecializationsByDepartment = async (req: Request, res: Response): Promise<void> => {
  try {
    const specializations = await Specialization.find({ department: req.params.id });
    successResponse(res, 200, 'Specializations fetched successfully', specializations);
  } catch (error) {
    errorResponse(res, 500, 'Server error', (error as Error).message);
  }
};

const updateSpecialization = async (req: Request, res: Response): Promise<void> => {
  try {
    const { department, specialization_name, academic_level } = req.body;

    const updatedSpecialization = await Specialization.findByIdAndUpdate(
      req.params.id,
      { department, specialization_name, academic_level },
      { new: true, runValidators: true }
    );

    if (!updatedSpecialization) {
      errorResponse(res, 404, 'Specialization not found');
      return;
    }

    successResponse(res, 200, 'Specialization updated successfully', updatedSpecialization);
  } catch (error: any) {
    if (error.code === 11000) {
      errorResponse(res, 400, 'Specialization already exists in this department');
      return;
    }
    errorResponse(res, 500, 'Server error', error.message);
  }
};

const deleteSpecialization = async (req: Request, res: Response): Promise<void> => {
  try {
    const deletedSpecialization = await Specialization.findByIdAndDelete(req.params.id);
    if (!deletedSpecialization) {
      errorResponse(res, 404, 'Specialization not found');
      return;
    }
    successResponse(res, 200, 'Specialization deleted successfully', true);
  } catch (error) {
    errorResponse(res, 500, (error as Error).message, {});
  }
};

const specializationController = {
  createSpecialization,
  getAllSpecializations,
  getSpecializationsByDepartment,
  updateSpecialization,
  deleteSpecialization,
};

export default specializationController;