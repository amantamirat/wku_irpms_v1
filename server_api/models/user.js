const mongoose = require('mongoose');
const UserSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true
        },
        password: {
            type: String,
            required: true
        },
        email: {
            type: String,
            unique: true,
            match: [
                /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
                'Please add a valid email'
            ],
            sparse: true,  // Allow multiple nulls
            set: v => v === "" ? null : v // Convert empty string to null
        },
        roles: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Role'
        }],
        status: {
            type: String,
            enum: ['Pending', 'Activated', 'Suspended'],
            default: 'Pending',
            required: true
        },
        statusHistory: [{
            status: String,
            changedAt: { type: Date, default: Date.now },
            changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
        }],
    }
);
const User = mongoose.model('User', UserSchema);
module.exports = User;