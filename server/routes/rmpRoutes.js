const express = require('express');
const router = express.Router();
const { getRatingByProfessor } = require('../controllers/rmpController');
const cors = require('cors');

router.use(
    cors({
        credentials: true,
        origin: 'http://localhost:3000',
    })
);

// Endpoint to get professor ratings
router.get('/professor', getRatingByProfessor);

module.exports = router;
