const User = require('../models/User');
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { prepareHash } = require('../services/userService');
require('dotenv').config();

// Login User
exports.loginUser = async (req, res) => {
    try {
        const { name, password } = req.body;
        const user = await User.findOne({
            $or: [{ email: name }, { name: name }]
        }).populate('roles');
        if (!user) return res.status(401).json({ message: "Invalid credentials." });
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: "Invalid credentials." });

        const token = jwt.sign({ _id: user._id, email: user.email, name: user.name }, process.env.KEY, { expiresIn: "2h" });
        res.status(200).json({
            token: token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                roles: user.roles,
                status: user.status
            }
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }

};

// Create a new user
exports.createUser = async (req, res) => {
    try {
        const { name, password, email, roles, status } = req.body;
        const hashedPassword = await prepareHash(password);
        const user = new User({
            name, password: hashedPassword, email, roles, status
        });
        await user.save();
        res.status(201).json(user);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Get all users
exports.getUsers = async (req, res) => {
    try {
        const users = await User.find().populate('roles');
        res.status(200).json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get a single user by ID
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).populate('roles');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update user
exports.updateUser = async (req, res) => {
    try {
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!updatedUser) return res.status(404).json({ message: 'User not found' });
        res.status(200).json(updatedUser);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Delete user
exports.deleteUser = async (req, res) => {
    try {
        const deletedUser = await User.findByIdAndDelete(req.params.id);
        if (!deletedUser) return res.status(404).json({ message: 'User not found' });
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
