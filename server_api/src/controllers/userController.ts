import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { prepareHash } from '../services/userService';
import { User } from '../models/user';
import dotenv from 'dotenv';

dotenv.config();


const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, password }: { name: string; password: string } = req.body;

    const user = await User.findOne({
      $or: [{ email: name }, { user_name: name }]
    }).populate('roles');

    if (!user) {
      res.status(401).json({ message: "Invalid credentials." });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ message: "Invalid credentials." });
      return;
    }

    const token = jwt.sign(
      { _id: user._id, email: user.email, name: user.user_name },
      process.env.KEY as string,
      { expiresIn: '2h' }
    );

    res.status(200).json({
      token,
      user: {
        _id: user._id,
        name: user.user_name,
        email: user.email,
        //roles: user.roles,
        status: user.status
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: (error as Error).message });
  }
};

// Create a new user
const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { user_name, password, email, roles, status } = req.body;

    const hashedPassword = await prepareHash(password);

    const user = new User({
      user_name,
      password: hashedPassword,
      email,
      //roles,
      status
    });

    await user.save();
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
};

// Get all users
const getUsers = async (_req: Request, res: Response): Promise<void> => {
  try {
    const users = await User.find().populate('roles');
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

// Get a single user by ID
const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id).populate('roles');
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
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
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.status(200).json(updatedUser);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
};

// Delete user
const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

const userController = {
  loginUser,
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
};

export default userController;
