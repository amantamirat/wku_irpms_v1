import { Request, Response } from 'express';
import { SubArea } from '../../models/theme/subArea.model';
import { PriorityArea } from '../../models/theme/priorityArea.model';
import { successResponse, errorResponse } from '../../util/response';

const createSubArea = async (req: Request, res: Response): Promise<void> => {
    try {
        const { priority: priorityArea, title } = req.body;

        const existingPriority = await PriorityArea.findById(priorityArea);
        if (!existingPriority) {
            errorResponse(res, 400, 'Referenced priority does not exist');
            return;
        }
        const subArea = new SubArea({ priorityArea, title });
        await subArea.save();
        successResponse(res, 201, 'SubArea created successfully', subArea);
    } catch (error: any) {
        console.log(error);
        if (error.code === 11000) {
            errorResponse(res, 400, 'SubArea name must be unique');
            return;
        }
        errorResponse(res, 500, error.message);
    }
};

const getAllSubAreas = async (req: Request, res: Response): Promise<void> => {
    try {
        const subAreas = await SubArea.find().populate('priorityArea');
        successResponse(res, 200, 'SubAreas fetched successfully', subAreas);
    } catch (error) {
        errorResponse(res, 500, 'Server error', (error as Error).message);
    }
};

const getSubAreasByPriorityArea = async (req: Request, res: Response): Promise<void> => {
    try {
        const { priorityArea } = req.params;
        const subAreas = await SubArea.find({ priorityArea });
        successResponse(res, 200, 'SubAreas fetched successfully', subAreas);
    } catch (error) {
        errorResponse(res, 500, 'Server error', (error as Error).message);
    }
};

const updateSubArea = async (req: Request, res: Response): Promise<void> => {
    try {
        const { priorityArea, title } = req.body;

        const existingSubArea = await SubArea.findById(req.params.id);
        if (!existingSubArea) {
            errorResponse(res, 404, 'SubArea not found');
            return;
        }

        const updatedSubArea = await SubArea.findByIdAndUpdate(
            req.params.id,
            { priorityArea, title },
            { new: true, runValidators: true }
        ).populate('priorityArea');

        successResponse(res, 200, 'SubArea updated successfully', updatedSubArea);
    } catch (error: any) {
        if (error.code === 11000) {
            errorResponse(res, 400, 'SubArea name must be unique');
            return;
        }
        errorResponse(res, 500, 'Server error', error.message);
    }
};

const deleteSubArea = async (req: Request, res: Response): Promise<void> => {
    try {
        const deletedSubArea = await SubArea.findByIdAndDelete(req.params.id);
        if (!deletedSubArea) {
            errorResponse(res, 404, 'SubArea not found');
            return;
        }
        successResponse(res, 200, 'SubArea deleted successfully', true);
    } catch (error) {
        errorResponse(res, 500, (error as Error).message, {});
    }
};

const subAreaController = {
    createSubArea,
    getAllSubAreas,
    getSubAreasByPriorityArea,
    updateSubArea,
    deleteSubArea,
};

export default subAreaController;
