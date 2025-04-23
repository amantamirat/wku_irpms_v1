const College = require('../models/college'); // Adjust the path as needed

// Create a new college
exports.createCollege = async (req, res) => {
    try {
        const { college_name } = req.body;

        const college = new College({ college_name });
        await college.save();

        res.status(201).json({ message: 'College created successfully', college });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'College name must be unique' });
        }
        res.status(500).json({ message: 'Server error', error });
    }
};

// Get all colleges
exports.getAllColleges = async (req, res) => {
    try {
        const colleges = await College.find();
        res.status(200).json(colleges);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Get college by ID
exports.getCollegeById = async (req, res) => {
    try {
        const college = await College.findById(req.params.id);
        if (!college) return res.status(404).json({ message: 'College not found' });
        res.status(200).json(college);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Update college by ID
exports.updateCollege = async (req, res) => {
    try {
        const { college_name } = req.body;

        const updatedCollege = await College.findByIdAndUpdate(
            req.params.id,
            { college_name },
            { new: true, runValidators: true }
        );

        if (!updatedCollege) return res.status(404).json({ message: 'College not found' });

        res.status(200).json({ message: 'College updated successfully', college: updatedCollege });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'College name must be unique' });
        }
        res.status(500).json({ message: 'Server error', error });
    }
};

// Delete college by ID
exports.deleteCollege = async (req, res) => {
    try {
        const deletedCollege = await College.findByIdAndDelete(req.params.id);
        if (!deletedCollege) return res.status(404).json({ message: 'College not found' });

        res.status(200).json({ message: 'College deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
