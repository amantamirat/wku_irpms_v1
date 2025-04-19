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
            sparse: true,  // Allow multiple nulls
            set: v => v === "" ? null : v // Convert empty string to null
        },
        roles: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Role'
        }]
    }
);
const User = mongoose.model('User', UserSchema);
module.exports = User;