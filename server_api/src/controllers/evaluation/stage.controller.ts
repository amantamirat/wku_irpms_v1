import { Request, Response } from 'express';
import { Stage } from '../../models/evaluation/stage.model';
import { Evaluation } from '../../models/evaluation/evaluation.model';
import { successResponse, errorResponse } from '../../util/response';

const createStage = async (req: Request, res: Response): Promise<void> => {
    try {
        const { evaluation, title, level, total_weight } = req.body;

        const existingEvaluation = await Evaluation.findById(evaluation);
        if (!existingEvaluation) {
            errorResponse(res, 400, 'Referenced evaluation does not exist');
            return;
        }
        const stage = new Stage({ evaluation, title, level, total_weight });
        await stage.save();
        successResponse(res, 201, 'Stage created successfully', stage);
    } catch (error: any) {
        console.log(error);
        if (error.code === 11000) {
            errorResponse(res, 400, 'Stage name must be unique');
            return;
        }
        errorResponse(res, 500, error.message);
    }
};

const getAllStages = async (req: Request, res: Response): Promise<void> => {
    try {
        const stages = await Stage.find().populate('evaluation');
        successResponse(res, 200, 'Stages fetched successfully', stages);
    } catch (error) {
        errorResponse(res, 500, 'Server error', (error as Error).message);
    }
};

const getStagesByEvaluation = async (req: Request, res: Response): Promise<void> => {
    try {
        const { evaluation } = req.params;
        const stages = await Stage.find({ evaluation });
        successResponse(res, 200, 'Stages fetched successfully', stages);
    } catch (error) {
        errorResponse(res, 500, 'Server error', (error as Error).message);
    }
};

const updateStage = async (req: Request, res: Response): Promise<void> => {
    try {
        const { evaluation, title , level, total_weight} = req.body;

        const existingStage = await Stage.findById(req.params.id);
        if (!existingStage) {
            errorResponse(res, 404, 'Stage not found');
            return;
        }

        const updatedStage = await Stage.findByIdAndUpdate(
            req.params.id,
            { evaluation, title, level, total_weight },
            { new: true, runValidators: true }
        ).populate('evaluation');

        successResponse(res, 200, 'Stage updated successfully', updatedStage);
    } catch (error: any) {
        if (error.code === 11000) {
            errorResponse(res, 400, 'Stage name must be unique');
            return;
        }
        errorResponse(res, 500, 'Server error', error.message);
    }
};

const deleteStage = async (req: Request, res: Response): Promise<void> => {
    try {
        const deletedStage = await Stage.findByIdAndDelete(req.params.id);
        if (!deletedStage) {
            errorResponse(res, 404, 'Stage not found');
            return;
        }
        successResponse(res, 200, 'Stage deleted successfully', true);
    } catch (error) {
        errorResponse(res, 500, (error as Error).message, {});
    }
};

const stageController = {
    createStage,
    getAllStages,
    getStagesByEvaluation,
    updateStage,
    deleteStage,
};

export default stageController;
