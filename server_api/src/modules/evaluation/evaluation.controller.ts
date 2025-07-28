import { Request, Response } from 'express';
import * as evaluationService from './evaluation.service';
import { successResponse, errorResponse } from '../../util/response';

/**
 * Create Evaluation
 */
const createEvaluation = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await evaluationService.createEvaluation(req.body);
    if (!result.success) {
      errorResponse(res, result.status, result.message || '');
      return;
    }
    successResponse(res, result.status, 'Evaluation created successfully', result.data);
  } catch (err: any) {
    errorResponse(res, 500, 'Server error', err.message);
  }
};

/**
 * Get Evaluations by Parent
 */
const getEvaluationsByParent = async (req: Request, res: Response): Promise<void> => {
  try {
    const parentId = req.params.parent;
    const result = await evaluationService.getEvaluationsByParent(parentId);
    successResponse(res, result.status, `Evaluations under parent ${parentId} fetched successfully`, result.data);
  } catch (err: any) {
    errorResponse(res, 500, err.message, err);
  }
};

/**
 * Get Evaluations by Directorate
 */
const getEvaluationsByDirectorate = async (req: Request, res: Response): Promise<void> => {
  try {
    const directorateId = req.params.directorate;
    const result = await evaluationService.getEvaluationsByDirectorate(directorateId);
    successResponse(res, result.status, `Evaluations under directorate ${directorateId} fetched successfully`, result.data);
  } catch (err: any) {
    errorResponse(res, 500, err.message, err);
  }
};

/**
 * Update Evaluation
 */
const updateEvaluation = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await evaluationService.updateEvaluation(req.params.id, req.body);
    if (!result.success) {
      errorResponse(res, result.status, result.message || '');
      return;
    }
    successResponse(res, result.status, 'Evaluation updated successfully', result.data);
  } catch (err: any) {
    errorResponse(res, 500, err.message, err);
  }
};

/**
 * Delete Evaluation
 */
const deleteEvaluation = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await evaluationService.deleteEvaluation(req.params.id);
    if (!result.success) {
      errorResponse(res, result.status, result.message || '');
      return;
    }
    successResponse(res, result.status, result.message, result.success);
  } catch (err: any) {
    errorResponse(res, 500, err.message, err);
  }
};

const evaluationController = {
  createEvaluation,
  getEvaluationsByParent,
  getEvaluationsByDirectorate,
  updateEvaluation,
  deleteEvaluation,
};

export default evaluationController;
