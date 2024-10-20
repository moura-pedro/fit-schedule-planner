const Course = require('../models/course');

const searchCourses = async (req, res) => {
    try {
      const { query, filter_day } = req.query;
  
      // Create the query object for MongoDB
      const searchCriteria = {
        $or: [
            { Course: { $regex: query, $options: 'i' } }, // Case-insensitive search by Course
            { Title: { $regex: query, $options: 'i' } }, // Case-insensitive search by Title
         
        ],
      };
  
      // Add a condition for filtering by day if a day is selected
      if (filter_day) {
        searchCriteria['sections.Days'] = { $regex: filter_day, $options: 'i' };
      }
  
      const courses = await Course.find(searchCriteria).sort({ Course: 1, Title: 1 });
      res.json(courses);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server Error' });
    }
  };
  

module.exports = {
    searchCourses,
};
