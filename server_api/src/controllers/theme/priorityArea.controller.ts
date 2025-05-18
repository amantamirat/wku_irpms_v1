import { Request, Response } from 'express';
import { PriorityArea } from '../../models/theme/priorityArea.model';
import {Theme} from '../../models/theme/theme.model';
import { successResponse, errorResponse } from '../../util/response';

const createPriorityArea = async (req: Request, res: Response): Promise<void> => {
    try {
        const { theme, title } = req.body;

        const existingTheme = await Theme.findById(theme);
        if (!existingTheme) {
            errorResponse(res, 400, 'Referenced theme does not exist');
            return;
        }
        const priorityArea = new PriorityArea({ theme, title });
        await priorityArea.save();
        successResponse(res, 201, 'PriorityArea created successfully', priorityArea);
    } catch (error: any) {
        console.log(error);
        if (error.code === 11000) {
            errorResponse(res, 400, 'PriorityArea name must be unique');
            return;
        }
        errorResponse(res, 500, error.message);
    }
};

const getAllPriorityAreas = async (req: Request, res: Response): Promise<void> => {
    try {
        const priorityAreas = await PriorityArea.find().populate('theme');
        successResponse(res, 200, 'PriorityAreas fetched successfully', priorityAreas);
    } catch (error) {
        errorResponse(res, 500, 'Server error', (error as Error).message);
    }
};

const getPriorityAreasByTheme = async (req: Request, res: Response): Promise<void> => {
    try {
        const { theme } = req.params;
        const priorityAreas = await PriorityArea.find({ theme });
        successResponse(res, 200, 'PriorityAreas fetched successfully', priorityAreas);
    } catch (error) {
        errorResponse(res, 500, 'Server error', (error as Error).message);
    }
};

const updatePriorityArea = async (req: Request, res: Response): Promise<void> => {
    try {
        const { theme, title } = req.body;

        const existingPriorityArea = await PriorityArea.findById(req.params.id);
        if (!existingPriorityArea) {
            errorResponse(res, 404, 'PriorityArea not found');
            return;
        }

        const updatedPriorityArea = await PriorityArea.findByIdAndUpdate(
            req.params.id,
            { theme, title },
            { new: true, runValidators: true }
        ).populate('theme');

        successResponse(res, 200, 'PriorityArea updated successfully', updatedPriorityArea);
    } catch (error: any) {
        if (error.code === 11000) {
            errorResponse(res, 400, 'PriorityArea name must be unique');
            return;
        }
        errorResponse(res, 500, 'Server error', error.message);
    }
};

const deletePriorityArea = async (req: Request, res: Response): Promise<void> => {
    try {
        const deletedPriorityArea = await PriorityArea.findByIdAndDelete(req.params.id);
        if (!deletedPriorityArea) {
            errorResponse(res, 404, 'PriorityArea not found');
            return;
        }
        successResponse(res, 200, 'PriorityArea deleted successfully', true);
    } catch (error) {
        errorResponse(res, 500, (error as Error).message, {});
    }
};

const priorityAreaController = {
    createPriorityArea,
    getAllPriorityAreas,
    getPriorityAreasByTheme,
    updatePriorityArea,
    deletePriorityArea,
};

export default priorityAreaController;
