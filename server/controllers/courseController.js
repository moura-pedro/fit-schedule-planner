const Course = require('../models/course');


const searchCourses = async (req, res) => {
    try {
      const { query } = req.query;
      const courses = await Course.find({
        $or: [
          { Title: { $regex: query, $options: 'i' } }, // case-insensitive search by title
          { Prerequisites: { $regex: query, $options: 'i' } }, // case-insensitive search by prerequisites
        ],
      }).sort({ Course: 1, Title: 1 });;
      res.json(courses);
    } catch (error) {
      res.status(500).json({ message: 'Server Error' });
    }
  };


// Get all courses
const getCourses = async (req, res) => {
  try {
    const courses = await Course.find();
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// Get a course by ID
const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// Create a new course
const createCourse = async (req, res) => {
  try {
    const newCourse = new Course(req.body);
    await newCourse.save();
    res.status(201).json(newCourse);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create course' });
  }
};

// Update a course
const updateCourse = async (req, res) => {
  try {
    const updatedCourse = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedCourse) {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.json(updatedCourse);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update course' });
  }
};

// Delete a course
const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete course' });
  }
};

module.exports = {
    searchCourses,
    getCourses,
    getCourseById,
    createCourse,
    updateCourse,
    deleteCourse,
};
