import { Request, Response } from 'express';
import { validateOrganization } from './organization.validator';
import * as organizationService from './organization.service';
import { successResponse, errorResponse } from '../../util/response';
import Organization from './organization.model';
import { Unit } from './enums/unit.enum';

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
// Get Organization by Id
const getDirectorateById = async (req: Request, res: Response): Promise<void> => {
  try {
    const directorate = await Organization.findOne({ _id: req.params.id, type: Unit.Directorate }).lean();
    if (!directorate) {
      errorResponse(res, 404, 'Directorate not found');
      return;
    }
    successResponse(res, 200, 'Directorate fetched successfully', directorate);
  } catch (error) {
    errorResponse(res, 500, (error as Error).message, {});
  }
};
/**
 * Get Organizations By Type and ID
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
 * Get Organizations By Parent
 */
const getOrganizationsByParent = async (req: Request, res: Response): Promise<void> => {
  try {
    const parent = req.params.parent;
    const result = await organizationService.getOrganizationsByParent(parent);
    successResponse(res, result.status, `Organizations of type ${parent} fetched successfully`, result.data);
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
    errorResponse(res, 500, err.message, err);
  }
};

const organizationController = {
  createOrganization,
  getDirectorateById,
  getOrganizationsByType,
  getOrganizationsByParent,
  updateOrganization,
  deleteOrganization,
};

export default organizationController;
