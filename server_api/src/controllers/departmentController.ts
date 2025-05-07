import { Request, Response } from 'express';
import Department from '../models/department';
import College from '../models/college';
import { successResponse, errorResponse } from '../util/response';

const createDepartment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { college, department_name } = req.body;

    const existingCollege = await College.findById(college);
    if (!existingCollege) {
      errorResponse(res, 400, 'Referenced college does not exist');
      return;
    }

    const department = new Department({ college, department_name });
    await department.save();
    successResponse(res, 201, 'Department created successfully', department);
  } catch (error: any) {
    if (error.code === 11000) {
      errorResponse(res, 400, 'Department name must be unique');
      return;
    }
    errorResponse(res, 500, 'Server error', error.message);
  }
};

const getAllDepartments = async (req: Request, res: Response): Promise<void> => {
  try {
    const departments = await Department.find().populate('college');
    successResponse(res, 200, 'Departments fetched successfully', departments);
  } catch (error) {
    errorResponse(res, 500, 'Server error', (error as Error).message);
  }
};



const updateDepartment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { college, department_name } = req.body;

    const existingDepartment = await Department.findById(req.params.id);
    if (!existingDepartment) {
      errorResponse(res, 404, 'Department not found');
      return;
    }  

    const updatedDepartment = await Department.findByIdAndUpdate(
      req.params.id,
      { college, department_name },
      { new: true, runValidators: true }
    ).populate('college');

    successResponse(res, 200, 'Department updated successfully', updatedDepartment);
  } catch (error: any) {
    if (error.code === 11000) {
      errorResponse(res, 400, 'Department name must be unique');
      return;
    }
    errorResponse(res, 500, 'Server error', error.message);
  }
};

const deleteDepartment = async (req: Request, res: Response): Promise<void> => {
  try {
    const deletedDepartment = await Department.findByIdAndDelete(req.params.id);
    if (!deletedDepartment) {
      errorResponse(res, 404, 'Department not found');
      return;
    }
    successResponse(res, 200, 'Department deleted successfully', true);
  } catch (error) {
    errorResponse(res, 500, 'Server error', (error as Error).message);
  }
};

const departmentController = {
  createDepartment,
  getAllDepartments,
  updateDepartment,
  deleteDepartment,
};

export default departmentController;
