import { Request, Response } from 'express';
import { Evaluation } from '../../models/evaluation/evaluation.model';
import Directorate from '../../models/directorate';
import { successResponse, errorResponse } from '../../util/response';

const createEvaluation = async (req: Request, res: Response): Promise<void> => {
    try {
        const { directorate, title } = req.body;
        const existingDirectorate = await Directorate.findById(directorate);
        if (!existingDirectorate) {
            errorResponse(res, 400, 'Referenced directorate does not exist');
            return;
        }
        const evaluation = new Evaluation({ directorate, title });
        await evaluation.save();
        successResponse(res, 201, 'Evaluation created successfully', evaluation);
    } catch (error: any) {
        console.log(error);
        if (error.code === 11000) {
            errorResponse(res, 400, 'Evaluation name must be unique');
            return;
        }
        errorResponse(res, 500, error.message);
    }
};

const getAllEvaluations = async (req: Request, res: Response): Promise<void> => {
    try {
        const evaluations = await Evaluation.find().populate('directorate');
        successResponse(res, 200, 'Evaluations fetched successfully', evaluations);
    } catch (error) {
        errorResponse(res, 500, 'Server error', (error as Error).message);
    }
};

const getEvaluationsByDirectorate = async (req: Request, res: Response): Promise<void> => {
    try {
        const { directorate } = req.params;
        const evaluations = await Evaluation.find({ directorate });
        successResponse(res, 200, 'Evaluations fetched successfully', evaluations);
    } catch (error) {
        errorResponse(res, 500, 'Server error', (error as Error).message);
    }
};

const updateEvaluation = async (req: Request, res: Response): Promise<void> => {
    try {
        const { directorate, title } = req.body;

        const existingEvaluation = await Evaluation.findById(req.params.id);
        if (!existingEvaluation) {
            errorResponse(res, 404, 'Evaluation not found');
            return;
        }

        const updatedEvaluation = await Evaluation.findByIdAndUpdate(
            req.params.id,
            { directorate, title },
            { new: true, runValidators: true }
        ).populate('directorate');

        successResponse(res, 200, 'Evaluation updated successfully', updatedEvaluation);
    } catch (error: any) {
        if (error.code === 11000) {
            errorResponse(res, 400, 'Evaluation name must be unique');
            return;
        }
        errorResponse(res, 500, 'Server error', error.message);
    }
};

const deleteEvaluation = async (req: Request, res: Response): Promise<void> => {
    try {
        const deletedEvaluation = await Evaluation.findByIdAndDelete(req.params.id);
        if (!deletedEvaluation) {
            errorResponse(res, 404, 'Evaluation not found');
            return;
        }
        successResponse(res, 200, 'Evaluation deleted successfully', true);
    } catch (error) {
        errorResponse(res, 500, (error as Error).message, {});
    }
};

const evaluationController = {
    createEvaluation,
    getAllEvaluations,
    getEvaluationsByDirectorate,
    updateEvaluation,
    deleteEvaluation,
};

export default evaluationController;
