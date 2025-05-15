import { Request, Response } from 'express';
import { createUserAccount } from '../services/userService';
import { User } from '../models/user';
import { errorResponse, successResponse } from '../util/response';


const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { user_name, email, password } = req.body;
    const user = await createUserAccount({
      user_name, email, password
    });
    successResponse(res, 201, 'User created successfully', user);
  } catch (err: any) {
    errorResponse(res, 500, 'Server error', err.message);
  }
};


const getUsers = async (_req: Request, res: Response): Promise<void> => {
  try {
    const users = await User.find();
    successResponse(res, 200, 'Users fetched successfully', users);
  } catch (err) {
    errorResponse(res, 500, 'Server error', (err as Error).message);
  }
};

// Get a single user by ID
const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id);
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
    const { user_name, email } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id, { user_name, email },
      { new: true, runValidators: true }
    );
    if (!updatedUser) {
      errorResponse(res, 404, 'User not found');
      return;
    }
    successResponse(res, 200, 'User updated successfully', updateUser);
  } catch (err) {
    console.log(err);
    errorResponse(res, 500, (err as Error).message);
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
    errorResponse(res, 500, (err as Error).message);
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
