import { Request, Response } from 'express';
import { Call } from './call.model';
import { errorResponse, successResponse } from '../../util/response';


const createCall = async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            directorate,
            calendar,
            title,
            dead_line,
            description,
            max_total_allocated_budget,
            status
        } = req.body;

        const call = new Call({
            directorate,
            calendar,
            title,
            dead_line,
            description,
            max_total_allocated_budget,
            status
        });

        await call.save();

        successResponse(res, 201, 'Call created successfully', call);
    } catch (error: any) {
        errorResponse(res, 500, 'Failed to create call', error.message);
    }
};

const getAllCalls = async (_req: Request, res: Response): Promise<void> => {
    try {
        const calls = await Call.find()
            .populate('directorate')
            .populate('calendar');

        successResponse(res, 200, 'Calls fetched successfully', calls);
    } catch (error) {
        errorResponse(res, 500, 'Server error', (error as Error).message);
    }
};

const updateCall = async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            directorate,
            calendar,
            title,
            dead_line,
            description,
            max_total_allocated_budget,
            status
        } = req.body;

        const updatedCall = await Call.findByIdAndUpdate(
            req.params.id,
            {
                directorate,
                calendar,
                title,
                dead_line,
                description,
                total_budget: max_total_allocated_budget,
                status
            },
            { new: true, runValidators: true }
        );

        if (!updatedCall) {
            errorResponse(res, 404, 'Call not found');
            return;
        }

        successResponse(res, 200, 'Call updated successfully', updatedCall);
    } catch (error: any) {
        errorResponse(res, 500, 'Failed to update call', error.message);
    }
};

const deleteCall = async (req: Request, res: Response): Promise<void> => {
    try {
        const deletedCall = await Call.findByIdAndDelete(req.params.id);

        if (!deletedCall) {
            errorResponse(res, 404, 'Call not found');
            return;
        }

        successResponse(res, 200, 'Call deleted successfully', true);
    } catch (error) {
        errorResponse(res, 500, 'Failed to delete call', (error as Error).message);
    }
};

const callController = {
    createCall,
    getAllCalls,
    updateCall,
    deleteCall,
};

export default callController;
