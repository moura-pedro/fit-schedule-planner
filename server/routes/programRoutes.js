const express = require('express');
const router = express.Router();
const cors = require('cors');
const { getAllPrograms, getProgramById } = require('../controllers/programController');

router.use(
    cors({
        credentials: true,
        origin: 'http://localhost:3000',
    })
);

// Test route to verify the route is working
router.get('/test-programs', (req, res) => {
    res.json({ message: 'Program routes are working' });
});

// Get all programs for dropdown
router.get('/programs', getAllPrograms);

// Get specific program by ID
router.get('/programs/:id', getProgramById);

module.exports = router;