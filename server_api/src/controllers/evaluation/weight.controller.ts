import { Request, Response } from 'express';
import { ResponseType, Weight } from '../../models/evaluation/weight.model';
import { Stage } from '../../models/evaluation/stage.model';
import { successResponse, errorResponse } from '../../util/response';
import { CriterionOption } from '../../models/evaluation/criterionOption.model';

const createWeight = async (req: Request, res: Response): Promise<void> => {
    try {
        const { stage, title, weight_value } = req.body;

        const existingPriority = await Stage.findById(stage);
        if (!existingPriority) {
            errorResponse(res, 400, 'Referenced priority does not exist');
            return;
        }
        const weight = new Weight({ stage, title, weight_value });
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

const createWeightWithCriterionOptions = async (req: Request, res: Response): Promise<void> => {
    try {
        const { weight, criterionOptions } = req.body;
        // Validate weight fields
        const { stage, title, weight_value, response_type } = weight || {};
        if (!stage || !title || weight_value === undefined || response_type === undefined) {
            return errorResponse(res, 400, 'Missing weight fields');
        }

        // Validate referenced stage
        const existingStage = await Stage.findById(stage);
        if (!existingStage) {
            return errorResponse(res, 400, 'Referenced stage does not exist');
        }

        // If response type is Closed, ensure valid criterion options
        if (response_type === ResponseType.Closed) {
            if (!Array.isArray(criterionOptions) || criterionOptions.length < 2) {
                return errorResponse(res, 400, 'At least 2 options are required');
            }
            // Ensure each value is less than weight_value
            for (const option of criterionOptions) {
                if (typeof option.value !== 'number' || option.value > weight_value) {
                    return errorResponse(res, 400, 'Each option value must be a number less than weight value');
                }
            }
        }
        // Save the weight
        const newWeight = new Weight(weight);
        const savedWeight = await newWeight.save();
        // Save criterion options if applicable
        if (response_type === ResponseType.Closed) {
            const optionsToSave = criterionOptions.map((option: any) => {
                const { _id, ...rest } = option;
                return new CriterionOption({ ...rest, weight: savedWeight._id }).save();
            });
            await Promise.all(optionsToSave);
        }
        //console.log("create", savedWeight);
        successResponse(res, 201, 'Weight and criterion options created successfully', savedWeight);

    } catch (error: any) {
        console.error(error);
        if (error.code === 11000) {
            return errorResponse(res, 400, 'Weight title must be unique');
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
    createWeightWithCriterionOptions,
    getAllWeights,
    getWeightsByStage,
    updateWeight,
    deleteWeight,
};

export default weightController;
