import { Request, Response } from 'express';
import { Theme } from '../models/theme.model';
import Directorate from '../models/directorate';
import { successResponse, errorResponse } from '../util/response';

const createTheme = async (req: Request, res: Response): Promise<void> => {
    try {
        const { directorate, title } = req.body;

        const existingDirectorate = await Directorate.findById(directorate);
        if (!existingDirectorate) {
            errorResponse(res, 400, 'Referenced directorate does not exist');
            return;
        }
        const theme = new Theme({ directorate, title });
        await theme.save();
        successResponse(res, 201, 'Theme created successfully', theme);
    } catch (error: any) {
        if (error.code === 11000) {
            errorResponse(res, 400, 'Theme name must be unique');
            return;
        }
        errorResponse(res, 500, 'Server error', error.message);
    }
};

const getAllThemes = async (req: Request, res: Response): Promise<void> => {
    try {
        const themes = await Theme.find().populate('directorate');
        successResponse(res, 200, 'Themes fetched successfully', themes);
    } catch (error) {
        errorResponse(res, 500, 'Server error', (error as Error).message);
    }
};



const updateTheme = async (req: Request, res: Response): Promise<void> => {
    try {
        const { directorate, title } = req.body;

        const existingTheme = await Theme.findById(req.params.id);
        if (!existingTheme) {
            errorResponse(res, 404, 'Theme not found');
            return;
        }

        const updatedTheme = await Theme.findByIdAndUpdate(
            req.params.id,
            { directorate, title },
            { new: true, runValidators: true }
        ).populate('directorate');

        successResponse(res, 200, 'Theme updated successfully', updatedTheme);
    } catch (error: any) {
        if (error.code === 11000) {
            errorResponse(res, 400, 'Theme name must be unique');
            return;
        }
        errorResponse(res, 500, 'Server error', error.message);
    }
};

const deleteTheme = async (req: Request, res: Response): Promise<void> => {
    try {
        const deletedTheme = await Theme.findByIdAndDelete(req.params.id);
        if (!deletedTheme) {
            errorResponse(res, 404, 'Theme not found');
            return;
        }
        successResponse(res, 200, 'Theme deleted successfully', true);
    } catch (error) {
        errorResponse(res, 500, (error as Error).message, {});
    }
};

const themeController = {
    createTheme,
    getAllThemes,
    updateTheme,
    deleteTheme,
};

export default themeController;
