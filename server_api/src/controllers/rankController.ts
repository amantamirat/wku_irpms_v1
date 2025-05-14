import { Request, Response } from 'express';
import Rank from '../models/rank';
import Position from '../models/position';
import { successResponse, errorResponse } from '../util/response';


const createRank = async (req: Request, res: Response): Promise<void> => {
  try {
    const { position, rank_title } = req.body;
    const positionExists = await Position.findById(position);
    if (!positionExists) {
      errorResponse(res, 400, 'Provided position does not exist');
      return;
    }

    const rank = new Rank({ position, rank_title });
    await rank.save();

    successResponse(res, 201, 'Rank created successfully', rank);
  } catch (error: any) {
    if (error.code === 11000) {
      errorResponse(res, 400, 'Rank title must be unique');
      return;
    }
    errorResponse(res, 500, 'Server error', error.message);
  }
};


const getAllRanks = async (_req: Request, res: Response): Promise<void> => {
  try {
    const ranks = await Rank.find().populate('position');
    successResponse(res, 200, 'Ranks fetched successfully', ranks);
  } catch (error) {
    errorResponse(res, 500, 'Server error', (error as Error).message);
  }
};


const getRankByCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category } = req.params;
    const ranks = await Rank.aggregate([
      {
        $lookup: {
          from: 'positions',
          localField: 'position',
          foreignField: '_id',
          as: 'position'
        }
      },
      {
        $unwind: '$position'
      },
      {
        $match: {
          'position.category': category
        }
      },
      {
        $project: {
          _id: 1,
          rank_title: 1,
          createdAt: 1,
          updatedAt: 1,
          position: 1
        }
      }
    ]);
    successResponse(res, 200, 'Ranks fetched successfully', ranks);
  } catch (error) {
    errorResponse(res, 500, 'Server error', (error as Error).message);
  }
};



const updateRank = async (req: Request, res: Response): Promise<void> => {
  try {
    const { position, rank_title } = req.body;

    const updatedRank = await Rank.findByIdAndUpdate(
      req.params.id,
      { position, rank_title },
      { new: true, runValidators: true }
    ).populate('position');

    if (!updatedRank) {
      errorResponse(res, 404, 'Rank not found');
      return;
    }

    successResponse(res, 200, 'Rank updated successfully', updatedRank);
  } catch (error: any) {
    if (error.code === 11000) {
      errorResponse(res, 400, 'Rank title must be unique');
      return;
    }
    errorResponse(res, 500, 'Server error', error.message);
  }
};


const deleteRank = async (req: Request, res: Response): Promise<void> => {
  try {
    const deletedRank = await Rank.findByIdAndDelete(req.params.id);
    if (!deletedRank) {
      errorResponse(res, 404, 'Rank not found');
      return;
    }
    successResponse(res, 200, 'Rank deleted successfully', true);
  } catch (error) {
    errorResponse(res, 500, (error as Error).message, {});
  }
};

const rankController = {
  createRank,
  getAllRanks,
  getRankByCategory,
  updateRank,
  deleteRank,
};

export default rankController;
