const express = require('express');
const router = express.Router();
const collegeController = require('../controllers/collegeController'); // adjust path if needed

// CREATE a new college
router.post('/', collegeController.createCollege);

// READ all colleges
router.get('/', collegeController.getAllColleges);

// READ one college by ID
router.get('/:id', collegeController.getCollegeById);

// UPDATE a college by ID
router.put('/:id', collegeController.updateCollege);

// DELETE a college by ID
router.delete('/:id', collegeController.deleteCollege);

module.exports = router;
