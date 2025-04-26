import { Request, Response } from 'express';
import College from '../models/college';
import { successResponse, errorResponse } from '../util/response';


const createCollege = async (req: Request, res: Response): Promise<void> => {
  try {
    const { college_name } = req.body;

    const college = new College({ college_name });
    await college.save();

    successResponse(res, 201, 'College created successfully', college);
  } catch (error: any) {
    if (error.code === 11000) {
      errorResponse(res, 400, 'College name must be unique');
      return;
    }
    errorResponse(res, 500, 'Server error', error.message);
  }
};


const getAllColleges = async (req: Request, res: Response): Promise<void> => {
  try {
    const colleges = await College.find();
    successResponse(res, 200, 'Colleges fetched successfully', colleges);
  } catch (error) {
    errorResponse(res, 500, 'Server error', (error as Error).message);
  }
};


const getCollegeById = async (req: Request, res: Response): Promise<void> => {
  try {
    const college = await College.findById(req.params.id);
    if (!college) {
      errorResponse(res, 404, 'College not found');
      return;
    }
    successResponse(res, 200, 'College fetched successfully', college);
  } catch (error) {
    errorResponse(res, 500, 'Server error', (error as Error).message);
  }
};


const updateCollege = async (req: Request, res: Response): Promise<void> => {
  try {
    const { college_name } = req.body;

    const updatedCollege = await College.findByIdAndUpdate(
      req.params.id,
      { college_name },
      { new: true, runValidators: true }
    );

    if (!updatedCollege) {
      errorResponse(res, 404, 'College not found');
      return;
    }

    successResponse(res, 200, 'College updated successfully', updatedCollege);
  } catch (error: any) {
    if (error.code === 11000) {
      errorResponse(res, 400, 'College name must be unique');
      return;
    }
    errorResponse(res, 500, 'Server error', error.message);
  }
};


const deleteCollege = async (req: Request, res: Response): Promise<void> => {
  try {
    const deletedCollege = await College.findByIdAndDelete(req.params.id);
    if (!deletedCollege) {
      errorResponse(res, 404, 'College not found');
      return;
    }

    successResponse(res, 200, 'College deleted successfully', true);
  } catch (error) {
    errorResponse(res, 500, 'Server error', (error as Error).message);
  }
};

const collegeController = {
  createCollege,
  getAllColleges,
  getCollegeById,
  updateCollege,
  deleteCollege,
};

export default collegeController;
