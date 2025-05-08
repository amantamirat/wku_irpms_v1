import { Request, Response } from 'express';
import Program from '../models/program';
import { successResponse, errorResponse } from '../util/response';

const createProgram = async (req: Request, res: Response): Promise<void> => {
  try {
    const { department, program_name, academic_level, classification } = req.body;

    const program = new Program({ department, program_name, academic_level, classification });
    await program.save();

    successResponse(res, 201, 'Program created successfully', program);
  } catch (error: any) {
    if (error.code === 11000) {
      errorResponse(res, 400, 'Program already exists in this department');
      return;
    }
    errorResponse(res, 500, 'Server error', error.message);
  }
};

const getAllPrograms = async (req: Request, res: Response): Promise<void> => {
  try {
    const programs = await Program.find().populate('department');
    successResponse(res, 200, 'Programs fetched successfully', programs);
  } catch (error) {
    errorResponse(res, 500, 'Server error', (error as Error).message);
  }
};

const getProgramsByDepartment = async (req: Request, res: Response): Promise<void> => {
  try {
    const programs = await Program.find({ department: req.params.id });
    successResponse(res, 200, 'Programs fetched successfully', programs);
  } catch (error) {
    errorResponse(res, 500, 'Server error', (error as Error).message);
  }
};

const updateProgram = async (req: Request, res: Response): Promise<void> => {
  try {
    const { department, program_name, academic_level, classification } = req.body;

    const updatedProgram = await Program.findByIdAndUpdate(
      req.params.id,
      { department, program_name, academic_level, classification },
      { new: true, runValidators: true }
    );

    if (!updatedProgram) {
      errorResponse(res, 404, 'Program not found');
      return;
    }

    successResponse(res, 200, 'Program updated successfully', updatedProgram);
  } catch (error: any) {
    if (error.code === 11000) {
      errorResponse(res, 400, 'Program already exists in this department');
      return;
    }
    errorResponse(res, 500, 'Server error', error.message);
  }
};

const deleteProgram = async (req: Request, res: Response): Promise<void> => {
  try {
    const deletedProgram = await Program.findByIdAndDelete(req.params.id);
    if (!deletedProgram) {
      errorResponse(res, 404, 'Program not found');
      return;
    }
    successResponse(res, 200, 'Program deleted successfully', true);
  } catch (error) {
    errorResponse(res, 500, (error as Error).message, {});
  }
};

const programController = {
  createProgram,
  getAllPrograms,
  getProgramsByDepartment,
  updateProgram,
  deleteProgram,
};

export default programController;