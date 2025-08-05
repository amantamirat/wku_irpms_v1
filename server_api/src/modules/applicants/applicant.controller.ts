import { Request, Response } from 'express';
import * as applicantService from './applicant.service';
import { successResponse, errorResponse } from '../../util/response';


const createApplicant = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await applicantService.createApplicant(req.body);
    if (!result.success) {
      errorResponse(res, result.status, result.message || '');
      return;
    }
    successResponse(res, result.status, 'Applicant created successfully', result.data);
  } catch (err: any) {
    errorResponse(res, 500, 'Server error', err.message);
  }
};

const updateApplicant = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await applicantService.updateApplicant(req.params.id, req.body);
    if (!result.success) {
      errorResponse(res, result.status, result.message || '');
      return;
    }
    successResponse(res, result.status, 'Applicant updated successfully', result.data);
  } catch (err: any) {
    errorResponse(res, 500, 'Server error', err.message);
  }
};

const getApplicants = async (req: Request, res: Response): Promise<void> => {
  try {
    const scope  = req.params.scope;
    const result = await applicantService.getApplicants(scope);
    successResponse(res, result.status, 'Applicants fetched successfully', result.data);
  } catch (err: any) {    
    console.log(err);
    errorResponse(res, 500, err.message, err);
  }
};

const deleteApplicant = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await applicantService.deleteApplicant(req.params.id);
    if (!result.success) {
      errorResponse(res, result.status, result.message || '');
      return;
    }
    successResponse(res, result.status, result.message, result.success);
  } catch (err: any) {
    errorResponse(res, 500, 'Server error', err.message);
  }
};

const applicantController = {
  createApplicant,
  updateApplicant,
  getApplicants,
  deleteApplicant,
};

export default applicantController;
