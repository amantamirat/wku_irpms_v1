import { Request, Response } from 'express';
import { validateOrganization } from './organization.validator';
import * as organizationService from './organization.service';
import { successResponse, errorResponse } from '../../util/response';

/**
 * Create Organization
 */
const createOrganization = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await organizationService.createOrganization(req.body);
    if (!result.success) {
      errorResponse(res, result.status, result.message || '');
      return;
    }
    successResponse(res, result.status, 'Organization created successfully', result.data);
  } catch (err: any) {
    errorResponse(res, 500, 'Server error', err.message);
  }
};

/**
 * Get Organizations By Type
 */
const getOrganizationsByType = async (req: Request, res: Response): Promise<void> => {
  try {
    const type = req.params.type;
    const result = await organizationService.getOrganizationsByType(type);
    successResponse(res, result.status, `Organizations of type ${type} fetched successfully`, result.data);
  } catch (err: any) {
    errorResponse(res, 500, err.message, err);
  }
};

/**
 * Update Organization
 */
const updateOrganization = async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = validateOrganization(req.body);
    if (error) {
      errorResponse(res, 400, error.details.map(d => d.message).toString(), error);
      return;
    }
    const result = await organizationService.updateOrganization(req.params.id, value);
    if (!result.success) {
      errorResponse(res, result.status, result.message || '');
      return;
    }
    successResponse(res, result.status, 'Organization updated successfully', result.data);
  } catch (err: any) {
    errorResponse(res, 500, 'Server error', err.message);
  }
};

/**
 * Delete Organization
 */
const deleteOrganization = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await organizationService.deleteOrganization(req.params.id);
    if (!result.success) {
      errorResponse(res, result.status, result.message || '');
      return;
    }
    successResponse(res, result.status, result.message, result.success);
  } catch (err: any) {
    errorResponse(res, 500, 'Server error', err.message);
  }
};

const organizationController = {
  createOrganization,
  getOrganizationsByType,
  updateOrganization,
  deleteOrganization,
};

export default organizationController;
