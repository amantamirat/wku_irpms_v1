const mongoose = require('mongoose');

const CollegeSchema = new mongoose.Schema({
    college_name: {
        type: String,
        required: true,
        index: { unique: true }
    }
});

const College = mongoose.model('College', CollegeSchema);
module.exports = College;