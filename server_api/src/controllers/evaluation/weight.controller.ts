import { Request, Response } from 'express';
import { Weight } from '../../models/evaluation/weight.model';
import { Stage } from '../../models/evaluation/stage.model';
import { successResponse, errorResponse } from '../../util/response';

const createWeight = async (req: Request, res: Response): Promise<void> => {
    try {
        const { stage, title, weight_value} = req.body;

        const existingPriority = await Stage.findById(stage);
        if (!existingPriority) {
            errorResponse(res, 400, 'Referenced priority does not exist');
            return;
        }
        const weight = new Weight({ stage, title });
        await weight.save();
        successResponse(res, 201, 'Weight created successfully', weight);
    } catch (error: any) {
        console.log(error);
        if (error.code === 11000) {
            errorResponse(res, 400, 'Weight name must be unique');
            return;
        }
        errorResponse(res, 500, error.message);
    }
};

const getAllWeights = async (req: Request, res: Response): Promise<void> => {
    try {
        const weights = await Weight.find().populate('stage');
        successResponse(res, 200, 'Weights fetched successfully', weights);
    } catch (error) {
        errorResponse(res, 500, 'Server error', (error as Error).message);
    }
};

const getWeightsByStage = async (req: Request, res: Response): Promise<void> => {
    try {
        const { stage } = req.params;
        const weights = await Weight.find({ stage });
        successResponse(res, 200, 'Weights fetched successfully', weights);
    } catch (error) {
        errorResponse(res, 500, 'Server error', (error as Error).message);
    }
};

const updateWeight = async (req: Request, res: Response): Promise<void> => {
    try {
        const { stage, title, weight_value } = req.body;

        const existingWeight = await Weight.findById(req.params.id);
        if (!existingWeight) {
            errorResponse(res, 404, 'Weight not found');
            return;
        }

        const updatedWeight = await Weight.findByIdAndUpdate(
            req.params.id,
            { stage, title, weight_value },
            { new: true, runValidators: true }
        ).populate('stage');

        successResponse(res, 200, 'Weight updated successfully', updatedWeight);
    } catch (error: any) {
        if (error.code === 11000) {
            errorResponse(res, 400, 'Weight name must be unique');
            return;
        }
        errorResponse(res, 500, 'Server error', error.message);
    }
};

const deleteWeight = async (req: Request, res: Response): Promise<void> => {
    try {
        const deletedWeight = await Weight.findByIdAndDelete(req.params.id);
        if (!deletedWeight) {
            errorResponse(res, 404, 'Weight not found');
            return;
        }
        successResponse(res, 200, 'Weight deleted successfully', true);
    } catch (error) {
        errorResponse(res, 500, (error as Error).message, {});
    }
};

const weightController = {
    createWeight,
    getAllWeights,
    getWeightsByStage,
    updateWeight,
    deleteWeight,
};

export default weightController;
