const express = require('express');
const router = express.Router();
const cors = require('cors');
const { searchCourses } = require('../controllers/courseController');

// middleware
router.use(
    cors({
        credentials: true,
        origin: 'http://localhost:3000',
    })
);

router.get('/search', searchCourses);


module.exports = router;
