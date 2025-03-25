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

const registerForCourses = async (req, res) => {
  try {
    const { sections, userId } = req.body; // Add userId parameter
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Update each section's enrollment
    const updatePromises = sections.map(async (crn) => {
      const course = await Course.findOne({ 'Sections.CRN': crn });
      if (!course) {
        throw new Error(`Section ${crn} not found`);
      }

      const section = course.Sections.find(s => s.CRN === crn);
      
      // Check if capacity is in format "current/max"
      let currentEnrollment = section.CurrentEnrollment || 0;
      let capacity;
      
      if (section.Capacity.includes('/')) {
        // Parse capacity string like "13/16"
        const [enrolled, max] = section.Capacity.split('/').map(Number);
        capacity = max;
      } else {
        capacity = parseInt(section.Capacity);
      }

      if (currentEnrollment >= capacity) {
        throw new Error(`Section ${crn} is full`);
      }

      // Check if user is already registered for this section
      // We'll use a field to track registered users for each section
      if (section.registeredUsers && section.registeredUsers.includes(userId)) {
        throw new Error(`You are already registered for section ${crn}`);
      }

      // Add user to registered users and increment enrollment
      return Course.updateOne(
        { 'Sections.CRN': crn },
        { 
          $inc: { 'Sections.$.CurrentEnrollment': 1 },
          $addToSet: { 'Sections.$.registeredUsers': userId }
        }
      );
    });

    await Promise.all(updatePromises);
    res.json({ message: 'Registration successful' });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
    searchCourses,
    getPrerequisites,
    registerForCourses
};

