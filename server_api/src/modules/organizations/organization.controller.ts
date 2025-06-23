import { Request, Response } from 'express';
import { validateOrganization } from './organization.validator';
import Organization from './organization.model';
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
 * Get All Organizations
 */
const getAllOrganizations = async (_req: Request, res: Response): Promise<void> => {
  try {
    const organizations = await Organization.find().sort({ createdAt: -1 }).lean();
    successResponse(res, 200, 'Organizations fetched successfully', organizations);
  } catch (err: any) {
    errorResponse(res, 500, 'Server error', err.message);
  }
};

/**
 * Update Organization
 */
const updateOrganization = async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = validateOrganization(req.body);
    if (error) {
      errorResponse(res, 400, 'Validation failed', error.details.map(d => d.message));
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
    const org = await Organization.findByIdAndDelete(req.params.id);
    if (!org) {
      errorResponse(res, 404, 'Organization not found');
      return;
    }
    successResponse(res, 200, 'Organization deleted successfully', true);
  } catch (err: any) {
    errorResponse(res, 500, 'Server error', err.message);
  }
};

const organizationController = {
  createOrganization,
  getAllOrganizations,
  updateOrganization,
  deleteOrganization,
};

export default organizationController;
