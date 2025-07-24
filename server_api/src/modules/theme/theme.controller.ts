import { Request, Response } from 'express';
import * as themeService from './theme.service';
import { successResponse, errorResponse } from '../../util/response';

/**
 * Create Theme
 */
const createTheme = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await themeService.createTheme(req.body);
    if (!result.success) {
      errorResponse(res, result.status, result.message || '');
      return;
    }
    successResponse(res, result.status, 'Theme created successfully', result.data);
  } catch (err: any) {
    errorResponse(res, 500, 'Server error', err.message);
  }
};

/**
 * Get Themes by Parent
 */
const getThemesByParent = async (req: Request, res: Response): Promise<void> => {
  try {
    const parentId = req.params.parentId;
    const result = await themeService.getThemesByParent(parentId);
    successResponse(res, result.status, `Themes under parent ${parentId} fetched successfully`, result.data);
  } catch (err: any) {
    errorResponse(res, 500, err.message, err);
  }
};

/**
 * Get Themes by Directorate
 */
const getThemesByDirectorate = async (req: Request, res: Response): Promise<void> => {
  try {
    const directorateId = req.params.directorateId;
    const result = await themeService.getThemesByDirectorate(directorateId);
    successResponse(res, result.status, `Themes under directorate ${directorateId} fetched successfully`, result.data);
  } catch (err: any) {
    errorResponse(res, 500, err.message, err);
  }
};

/**
 * Update Theme
 */
const updateTheme = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await themeService.updateTheme(req.params.id, req.body);
    if (!result.success) {
      errorResponse(res, result.status, result.message || '');
      return;
    }
    successResponse(res, result.status, 'Theme updated successfully', result.data);
  } catch (err: any) {
    errorResponse(res, 500, err.message, err);
  }
};

/**
 * Delete Theme
 */
const deleteTheme = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await themeService.deleteTheme(req.params.id);
    if (!result.success) {
      errorResponse(res, result.status, result.message || '');
      return;
    }
    successResponse(res, result.status, result.message, result.success);
  } catch (err: any) {
    errorResponse(res, 500, err.message, err);
  }
};

const themeController = {
  createTheme,
  getThemesByParent,
  getThemesByDirectorate,
  updateTheme,
  deleteTheme,
};

export default themeController;
