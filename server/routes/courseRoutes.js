const express = require('express');
const router = express.Router();
const cors = require('cors');
const { searchCourses, getPrerequisites } = require('../controllers/courseController');

router.use(
    cors({
        credentials: true,
        origin: 'http://localhost:3000',
    })
);

router.get('/search', searchCourses);
router.get('/prerequisites', getPrerequisites);

module.exports = router;
