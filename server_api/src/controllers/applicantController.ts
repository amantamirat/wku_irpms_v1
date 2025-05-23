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
      scope,
      department
    } = req.body;

    const applicant = new Applicant({
      first_name,
      middle_name,
      last_name,
      birth_date,
      gender,
      department,
      scope
    });

    await applicant.save();
    successResponse(res, 201, 'Applicant created successfully', applicant);
  } catch (error: any) {
    console.log(error);
    errorResponse(res, 500, error.message,);
  }
};

// Get All Applicants
const getAllApplicants = async (_req: Request, res: Response): Promise<void> => {
  try {
    const applicants = await Applicant.find()
      .populate('department');

    successResponse(res, 200, 'Applicants fetched successfully', applicants);
  } catch (error) {
    console.log(error);
    errorResponse(res, 500, (error as Error).message, 'Server error');
  }
};

const getAllApplicantsByScope = async (req: Request, res: Response): Promise<void> => {
  try {
    const { scope } = req.params;
    const applicants = await Applicant.find({ scope }).populate('department');
    successResponse(res, 200, 'Applicants fetched successfully', applicants);
  } catch (error) {
    console.log(error);
    errorResponse(res, 500, (error as Error).message, 'Server error');
  }
};


const getApplicantsByCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category } = req.params;
    const applicants = await Applicant.aggregate([
      {
        $lookup: {
          from: 'ranks',
          localField: 'rank',
          foreignField: '_id',
          as: 'rank'
        }
      },
      { $unwind: '$rank' },
      {
        $lookup: {
          from: 'positions',
          localField: 'rank.position',
          foreignField: '_id',
          as: 'rank.position'
        }
      },
      { $unwind: '$rank.position' },
      {
        $match: {
          'rank.position.category': category
        }
      },
      {
        $lookup: {
          from: 'departments',
          localField: 'department',
          foreignField: '_id',
          as: 'department'
        }
      },
      { $unwind: { path: '$department', preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: 'institutes',
          localField: 'institute',
          foreignField: '_id',
          as: 'institute'
        }
      },
      { $unwind: { path: '$institute', preserveNullAndEmptyArrays: true } },

      {
        $project: {
          first_name: 1,
          last_name: 1,
          gender: 1,
          birth_date: 1,
          'rank._id': 1,
          'rank.position._id': 1,
          'rank.position.position_title': 1,
          'rank.position.category': 1,
          'rank.rank_title': 1,
          'rank.createdAt': 1,
          'rank.updatedAt': 1,
          department: 1,
          institute: 1,
          hire_date: 1,
          createdAt: 1,
          updatedAt: 1
        }
      }
    ]);

    successResponse(res, 200, 'Applicants fetched successfully', applicants);
  } catch (error) {
    console.log(error);
    errorResponse(res, 500, (error as Error).message, 'Server error');
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
      scope,
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
        scope
      },
      { new: true, runValidators: true }
    )
      .populate('department');

    if (!updatedApplicant) {
      errorResponse(res, 404, 'Applicant not found');
      return;
    }

    successResponse(res, 200, 'Applicant updated successfully', updatedApplicant);
  } catch (error: any) {
    console.log(error);
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
    console.log(error);
    errorResponse(res, 500, (error as Error).message, {});
  }
};

const applicantController = {
  createApplicant,
  getAllApplicants,
  getApplicantsByCategory,
  updateApplicant,
  deleteApplicant,
};

export default applicantController;
