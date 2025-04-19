const mongoose = require('mongoose');

const RoleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    permissions: [String]  // Array of permissions for this role
});


module.exports = mongoose.model('Role', RoleSchema);