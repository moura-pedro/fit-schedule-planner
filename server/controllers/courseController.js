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

  const getPrerequisites = async (req, res) => {
    try {
        const { courseCode } = req.query;
        
        // Create a Set to keep track of processed courses to avoid infinite loops
        const processedCourses = new Set();
        
        async function findPrerequisitesRecursively(code) {
            // Avoid processing the same course twice
            if (processedCourses.has(code)) {
                return null;
            }
            
            const course = await Course.findOne({ Course: code });
            if (!course) {
                return {
                    Course: code,
                    Title: "Not Found",
                    Prerequisites: null
                };
            }
            
            processedCourses.add(code);
            
            if (!course.Prerequisites) {
                return course;
            }
            
            const prereqCodes = course.Prerequisites.split(', ');
            const prereqDetails = await Promise.all(
                prereqCodes.map(prereq => findPrerequisitesRecursively(prereq))
            );
            
            return {
                ...course.toObject(),
                prerequisiteDetails: prereqDetails.filter(Boolean)
            };
        }
        
        const result = await findPrerequisitesRecursively(courseCode);
        res.json(result);
        
    } catch (error) {
        console.error('Error fetching prerequisites:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    searchCourses,
    getPrerequisites
};

