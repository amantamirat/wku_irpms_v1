import { Request, Response } from 'express';
import Position, { Category } from '../models/position';
import { successResponse, errorResponse } from '../util/response';


const createPosition = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, position_title } = req.body;
    const position = new Position({ category, position_title });
    await position.save();    
    successResponse(res, 201, 'Position created successfully', position);
  } catch (error: any) {
    if (error.code === 11000) {
      errorResponse(res, 400, 'Position title must be unique');
      return;
    }
    errorResponse(res, 500, 'Server error', error.message);
  }
};


const getAllPositions = async (_req: Request, res: Response): Promise<void> => {
  try {
    const positions = await Position.find();
    successResponse(res, 200, 'Positions fetched successfully', positions);
  } catch (error) {
    errorResponse(res, 500, 'Server error', (error as Error).message);
  }
};


const updatePosition = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, position_title } = req.body;

    const updatedPosition = await Position.findByIdAndUpdate(
      req.params.id,
      { category, position_title },
      { new: true, runValidators: true }
    );

    if (!updatedPosition) {
      errorResponse(res, 404, 'Position not found');
      return;
    }

    successResponse(res, 200, 'Position updated successfully', updatedPosition);
  } catch (error: any) {
    if (error.code === 11000) {
      errorResponse(res, 400, 'Position title must be unique');
      return;
    }
    errorResponse(res, 500, 'Server error', error.message);
  }
};


const deletePosition = async (req: Request, res: Response): Promise<void> => {
  try {
    const deletedPosition = await Position.findByIdAndDelete(req.params.id);
    if (!deletedPosition) {
      errorResponse(res, 404, 'Position not found');
      return;
    }
    successResponse(res, 200, 'Position deleted successfully', true);
  } catch (error) {
    errorResponse(res, 500, (error as Error).message, {});
  }
};

const positionController = {
  createPosition,
  getAllPositions,
  updatePosition,
  deletePosition,
};

export default positionController;
