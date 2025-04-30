import { Request, Response } from 'express';
import { prepareHash } from '../services/userService';
import { User } from '../models/user';
import dotenv from 'dotenv';
import { errorResponse, successResponse } from '../util/response';

dotenv.config();




// Create a new user
const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { user_name, email, password } = req.body;
    const hashedPassword = await prepareHash(password);
    const user = new User({
      user_name,      
      email,
      password: hashedPassword
    });
    await user.save();
    successResponse(res, 201, 'User created successfully', user);
  } catch (err: any) {
    errorResponse(res, 500, 'Server error', err.message);
  }
};

// Get all users
const getUsers = async (_req: Request, res: Response): Promise<void> => {
  try {
    const users = await User.find().populate('roles');
    successResponse(res, 200, 'Users fetched successfully', users);
  } catch (err) {
    errorResponse(res, 500, 'Server error', (err as Error).message);
  }
};

// Get a single user by ID
const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id).populate('roles');
    if (!user) {
      errorResponse(res, 404, 'User not found');
      return;
    }
    successResponse(res, 200, 'Users fetched successfully', user);
  } catch (err) {
    errorResponse(res, 500, 'Server error', (err as Error).message);
  }
};

// Update user
const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedUser) {
      errorResponse(res, 404, 'User not found');
      return;
    }
    successResponse(res, 200, 'User updated successfully', updateUser);
  } catch (err) {
    errorResponse(res, 500, 'Server error', (err as Error).message);
  }
};

// Delete user
const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) {
      errorResponse(res, 404, 'User not found');
      return;
    }
    successResponse(res, 200, 'User deleted successfully', true);
  } catch (err) {
    errorResponse(res, 500, 'Server error', (err as Error).message);
  }
};

const userController = {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
};

export default userController;
