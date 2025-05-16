import { Request, Response } from 'express';
import { Role } from '../models/role.model';
import { successResponse, errorResponse } from '../util/response';

const createRole = async (req: Request, res: Response): Promise<void> => {
    try {
        const { role_name, permissions } = req.body;

        const role = new Role({ role_name, permissions });
        await role.save();

        successResponse(res, 201, 'Role created successfully', role);
    } catch (error: any) {
        if (error.code === 11000) {
            errorResponse(res, 400, 'Role name must be unique');
            return;
        }
        errorResponse(res, 500, error.message);
    }
};

const getAllRoles = async (_req: Request, res: Response): Promise<void> => {
    try {
        const roles = await Role.find().populate('permissions');
        successResponse(res, 200, 'Roles fetched successfully', roles);
    } catch (error) {
        errorResponse(res, 500, 'Server error', (error as Error).message);
    }
};

const updateRole = async (req: Request, res: Response): Promise<void> => {
    try {
        const { role_name, permissions } = req.body;

        const updatedRole = await Role.findByIdAndUpdate(
            req.params.id,
            { role_name, permissions },
            { new: true, runValidators: true }
        );

        if (!updatedRole) {
            errorResponse(res, 404, 'Role not found');
            return;
        }

        successResponse(res, 200, 'Role updated successfully', updatedRole);
    } catch (error: any) {
        if (error.code === 11000) {
            errorResponse(res, 400, 'Role name must be unique');
            return;
        }
        errorResponse(res, 500, 'Server error', error.message);
    }
};

const deleteRole = async (req: Request, res: Response): Promise<void> => {
    try {
        const deletedRole = await Role.findByIdAndDelete(req.params.id);
        if (!deletedRole) {
            errorResponse(res, 404, 'Role not found');
            return;
        }
        successResponse(res, 200, 'Role deleted successfully', true);
    } catch (error) {
        errorResponse(res, 500, 'Server error', (error as Error).message);
    }
};

const roleController = {
    createRole,
    getAllRoles,
    updateRole,
    deleteRole,
};

export default roleController;
