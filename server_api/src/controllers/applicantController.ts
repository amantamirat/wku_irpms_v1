import { Request, Response } from 'express';
import Applicant from '../models/applicant';
import { successResponse, errorResponse } from '../util/response';

// Create Applicant
const createApplicant = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      first_name,
      middle_name,
      last_name,
      birth_date,
      gender,
      department,
      position,
      rank,
      hire_date,
      institute
    } = req.body;

    const applicant = new Applicant({
      first_name,
      middle_name,
      last_name,
      birth_date,
      gender,
      department,
      position,
      rank,
      hire_date,
      institute
    });

    await applicant.save();
    successResponse(res, 201, 'Applicant created successfully', applicant);
  } catch (error: any) {
    errorResponse(res, 500, 'Server error', error.message);
  }
};

// Get All Applicants
const getAllApplicants = async (_req: Request, res: Response): Promise<void> => {
  try {
    const applicants = await Applicant.find()
      .populate('department')
      .populate('position')
      .populate('rank')
      .populate('institute');

    successResponse(res, 200, 'Applicants fetched successfully', applicants);
  } catch (error) {
    errorResponse(res, 500, 'Server error', (error as Error).message);
  }
};

// Update Applicant
const updateApplicant = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      first_name,
      middle_name,
      last_name,
      birth_date,
      gender,
      department,
      position,
      rank,
      hire_date,
      institute,
    } = req.body;

    const updatedApplicant = await Applicant.findByIdAndUpdate(
      req.params.id,
      {
        first_name,
        middle_name,
        last_name,
        birth_date,
        gender,
        department,
        position,
        rank,
        hire_date,
        institute
      },
      { new: true, runValidators: true }
    )
      .populate('department')
      .populate('position')
      .populate('rank')
      .populate('institute');

    if (!updatedApplicant) {
      errorResponse(res, 404, 'Applicant not found');
      return;
    }

    successResponse(res, 200, 'Applicant updated successfully', updatedApplicant);
  } catch (error: any) {
    errorResponse(res, 500, 'Server error', error.message);
  }
};

// Delete Applicant
const deleteApplicant = async (req: Request, res: Response): Promise<void> => {
  try {
    const deletedApplicant = await Applicant.findByIdAndDelete(req.params.id);
    if (!deletedApplicant) {
      errorResponse(res, 404, 'Applicant not found');
      return;
    }
    successResponse(res, 200, 'Applicant deleted successfully', true);
  } catch (error) {
    errorResponse(res, 500, (error as Error).message, {});
  }
};

const applicantController = {
  createApplicant,
  getAllApplicants,
  updateApplicant,
  deleteApplicant,
};

export default applicantController;
