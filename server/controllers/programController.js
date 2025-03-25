const mongoose = require('mongoose');

// Create a schema for programs
const programSchema = new mongoose.Schema({
    program_name: String,
    semesters: [{
        semester: String,
        courses: [String]
    }]
});

// Use the existing connection from your main app
const Program = mongoose.model('Program', programSchema, 'programs');

// Get all programs (just names and IDs)
const getAllPrograms = async (req, res) => {
    try {
        // console.log("Fetching all programs...");
        
        // Check if connection is established
        if (mongoose.connection.readyState !== 1) {
            // console.log("MongoDB connection not ready, waiting...");
            return res.status(500).json({ error: "Database connection not ready" });
        }
        
        // Get only program IDs and names for the dropdown
        const programs = await Program.find({}, '_id program_name');
        // console.log(`Found ${programs.length} programs`);
        
        res.json(programs);
    } catch (error) {
        console.error("Error fetching programs:", error);
        res.status(500).json({ error: "Failed to fetch programs", details: error.message });
    }
};

// Get specific program by ID with all details
const getProgramById = async (req, res) => {
    try {
        const programId = req.params.id;
        
        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(programId)) {
            return res.status(400).json({ error: "Invalid program ID format" });
        }
        
        const program = await Program.findById(programId);
        
        if (!program) {
            return res.status(404).json({ error: "Program not found" });
        }
        
        // console.log(`Found program: ${program.program_name}`);
        
        res.json(program);
    } catch (error) {
        console.error("Error fetching program details:", error);
        res.status(500).json({ error: "Failed to fetch program details", details: error.message });
    }
};

module.exports = {
    getAllPrograms,
    getProgramById
};