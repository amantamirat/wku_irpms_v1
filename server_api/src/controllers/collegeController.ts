import { Request, Response, NextFunction } from 'express';
import College from '../models/college'; 

// Create a new college
 const createCollege = async (req: Request, res: Response): Promise<void> => {
  try {
    const { college_name } = req.body;

    const college = new College({ college_name });
    await college.save();

    res.status(201).json({ message: 'College created successfully', college });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'College name must be unique' });
      return;
    }
    res.status(500).json({ message: 'Server error', error });
  }
};

// Get all colleges
 const getAllColleges = async (req: Request, res: Response): Promise<void> => {
  try {
    const colleges = await College.find();
    res.status(200).json(colleges);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Get college by ID
 const getCollegeById = async (req: Request, res: Response): Promise<void> => {
  try {
    const college = await College.findById(req.params.id);
    if (!college) {
      res.status(404).json({ message: 'College not found' });
      return;
    }
    res.status(200).json(college);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Update college by ID
 const updateCollege = async (req: Request, res: Response): Promise<void> => {
  try {
    const { college_name } = req.body;

    const updatedCollege = await College.findByIdAndUpdate(
      req.params.id,
      { college_name },
      { new: true, runValidators: true }
    );

    if (!updatedCollege) {
      res.status(404).json({ message: 'College not found' });
      return;
    }

    res.status(200).json({ message: 'College updated successfully', college: updatedCollege });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'College name must be unique' });
      return;
    }
    res.status(500).json({ message: 'Server error', error });
  }
};

// Delete college by ID
 const deleteCollege = async (req: Request, res: Response): Promise<void> => {
  try {
    const deletedCollege = await College.findByIdAndDelete(req.params.id);
    if (!deletedCollege) {
      res.status(404).json({ message: 'College not found' });
      return;
    }

    res.status(200).json({ message: 'College deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

const collegeController = {
  createCollege,
  getAllColleges,
  getCollegeById,
  updateCollege,
  deleteCollege,
};

export default collegeController;
