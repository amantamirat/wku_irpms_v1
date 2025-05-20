import { Request, Response } from 'express';
import { CriterionOption } from '../../models/evaluation/criterionOption.model';
import { Weight } from '../../models/evaluation/weight.model';
import { successResponse, errorResponse } from '../../util/response';

const createCriterionOption = async (req: Request, res: Response): Promise<void> => {
    try {
        const { weight, label, value } = req.body;

        const existingPriority = await Weight.findById(weight);
        if (!existingPriority) {
            errorResponse(res, 400, 'Referenced priority does not exist');
            return;
        }
        const criterionOption = new CriterionOption({ weight, label, value });
        await criterionOption.save();
        successResponse(res, 201, 'CriterionOption created successfully', criterionOption);
    } catch (error: any) {
        console.log(error);
        if (error.code === 11000) {
            errorResponse(res, 400, 'CriterionOption name must be unique');
            return;
        }
        errorResponse(res, 500, error.message);
    }
};

const getAllCriterionOptions = async (req: Request, res: Response): Promise<void> => {
    try {
        const criterionOptions = await CriterionOption.find().populate('weight');
        successResponse(res, 200, 'CriterionOptions fetched successfully', criterionOptions);
    } catch (error) {
        errorResponse(res, 500, 'Server error', (error as Error).message);
    }
};

const getCriterionOptionsByWeight = async (req: Request, res: Response): Promise<void> => {
    try {
        const { weight } = req.params;
        const criterionOptions = await CriterionOption.find({ weight });
        successResponse(res, 200, 'CriterionOptions fetched successfully', criterionOptions);
    } catch (error) {
        errorResponse(res, 500, 'Server error', (error as Error).message);
    }
};

const updateCriterionOption = async (req: Request, res: Response): Promise<void> => {
    try {
        const { weight, label, value } = req.body;

        const existingCriterionOption = await CriterionOption.findById(req.params.id);
        if (!existingCriterionOption) {
            errorResponse(res, 404, 'CriterionOption not found');
            return;
        }

        const updatedCriterionOption = await CriterionOption.findByIdAndUpdate(
            req.params.id,
            { weight, label, value },
            { new: true, runValidators: true }
        ).populate('weight');

        successResponse(res, 200, 'CriterionOption updated successfully', updatedCriterionOption);
    } catch (error: any) {
        if (error.code === 11000) {
            errorResponse(res, 400, 'CriterionOption name must be unique');
            return;
        }
        errorResponse(res, 500, 'Server error', error.message);
    }
};

const deleteCriterionOption = async (req: Request, res: Response): Promise<void> => {
    try {
        const deletedCriterionOption = await CriterionOption.findByIdAndDelete(req.params.id);
        if (!deletedCriterionOption) {
            errorResponse(res, 404, 'CriterionOption not found');
            return;
        }
        successResponse(res, 200, 'CriterionOption deleted successfully', true);
    } catch (error) {
        errorResponse(res, 500, (error as Error).message, {});
    }
};

const criterionOptionController = {
    createCriterionOption,
    getAllCriterionOptions,
    getCriterionOptionsByWeight,
    updateCriterionOption,
    deleteCriterionOption,
};

export default criterionOptionController;
