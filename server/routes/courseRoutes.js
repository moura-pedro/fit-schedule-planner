const express = require('express');
const router = express.Router();
const cors = require('cors');
const { searchCourses, getCourses, getCourseById, createCourse, updateCourse, deleteCourse } = require('../controllers/courseController');

// middleware
router.use(
    cors({
        credentials: true,
        origin: 'http://localhost:3000',
    })
);


router.get('/search', searchCourses);


// Route to get all courses
router.get('/', getCourses);

// Route to get a specific course by ID
router.get('/:id', getCourseById);

// Route to create a new course (Admin or protected route ideally)
router.post('/', createCourse);

// Route to update a course by ID
router.put('/:id', updateCourse);

// Route to delete a course by ID
router.delete('/:id', deleteCourse);

module.exports = router;
