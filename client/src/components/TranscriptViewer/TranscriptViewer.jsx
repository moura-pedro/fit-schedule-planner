// client/src/components/TranscriptViewer/TranscriptViewer.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './TranscriptViewer.css';

const TranscriptViewer = () => {
    const [transcript, setTranscript] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('courses');
    const [programs, setPrograms] = useState([]);
    const [selectedProgram, setSelectedProgram] = useState(null);
    const [programRequirements, setProgramRequirements] = useState([]);
    const [checkedCourses, setCheckedCourses] = useState({});
    const [loadingPrograms, setLoadingPrograms] = useState(false);

    useEffect(() => {
        fetchTranscript();
        fetchPrograms();
    }, []);  // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (selectedProgram) {
            fetchProgramDetails(selectedProgram);
        }
    }, [selectedProgram]);  // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        // When transcript or program requirements change, update checked courses
        if (transcript && programRequirements.length > 0) {
            updateCheckedCoursesFromTranscript();
        }
    }, [transcript, programRequirements]);  // eslint-disable-line react-hooks/exhaustive-deps

    const fetchTranscript = async () => {
        try {
            const response = await axios.get('http://localhost:8000/api/transcript', {
                withCredentials: true
            });
            
            if (response.data.transcript) {
                // Ensure courses array exists before organizing
                const courses = response.data.transcript.courses || [];
                const transcriptData = {
                    ...response.data.transcript,
                    coursesByTerm: organizeCoursesByTerm(courses),
                    overallTotals: response.data.transcript.overallTotals || {
                        attemptHours: 0,
                        passedHours: 0,
                        earnedHours: 0,
                        gpaHours: 0,
                        qualityPoints: 0,
                        gpa: 0
                    }
                };
                setTranscript(transcriptData);
                setError(null);
            } else {
                setError('No transcript data available');
            }
        } catch (err) {
            console.error('Error fetching transcript:', err);
            setError(err.response?.data?.error || 'Failed to load transcript data');
        } finally {
            setLoading(false);
        }
    };

    const fetchPrograms = async () => {
        setLoadingPrograms(true);
        try {
            console.log("Fetching programs...");
            const response = await axios.get('http://localhost:8000/api/programs');
            console.log("Programs response:", response.data);
            
            if (response.data && Array.isArray(response.data) && response.data.length > 0) {
                setPrograms(response.data);
            } else {
                console.warn("No programs returned from the API, using fallback data");
                // Fallback data for testing
                setPrograms([
                    { _id: "fallback1", program_name: "Aeronautical Science - Flight, B.S." },
                    { _id: "fallback2", program_name: "Computer Science, B.S." },
                    { _id: "fallback3", program_name: "Mechanical Engineering, B.S." }
                ]);
            }
        } catch (err) {
            console.error('Error fetching programs:', err);
            console.warn("Using fallback program data due to API error");
            // Fallback data for testing
            setPrograms([
                { _id: "fallback1", program_name: "Aeronautical Science - Flight, B.S." },
                { _id: "fallback2", program_name: "Computer Science, B.S." },
                { _id: "fallback3", program_name: "Mechanical Engineering, B.S." }
            ]);
        } finally {
            setLoadingPrograms(false);
        }
    };

    const fetchProgramDetails = async (programId) => {
        try {
            // Check if we're using a fallback program
            if (programId.startsWith('fallback')) {
                console.log("Using fallback program details");
                // Provide fallback program details for testing
                const fallbackProgram = {
                    _id: programId,
                    program_name: programId === "fallback1" ? "Aeronautical Science - Flight, B.S." : 
                                 programId === "fallback2" ? "Computer Science, B.S." : "Mechanical Engineering, B.S.",
                    semesters: [
                        {
                            semester: "Fall (16 credit hours)",
                            courses: ["AVF 1001 Flight 1", "AVT 1001 Aeronautics 1", "COM 1101 Composition and Rhetoric", 
                                     "MTH 1000 College Mathematics", "PSY 1411 Introduction to Psychology", "CSE 1001 Introduction to Computer Science"]
                        },
                        {
                            semester: "Spring (17 credit hours)",
                            courses: ["AVF 1002 Flight 2", "AVT 1002 Aeronautics 2", "AVT 1200 Introduction to Aircraft Systems", 
                                     "COM 1102 Writing About Literature", "CSE 1301 Introduction to Computer Applications", 
                                     "MTH 1603 Applied Calculus and Statistics"]
                        }
                    ]
                };
                
                // Process program requirements into a flat list of courses
                const flatRequirements = processProgramRequirements(fallbackProgram);
                setProgramRequirements(flatRequirements);
                
                // Initialize checked courses object
                const initialCheckedState = {};
                flatRequirements.forEach(req => {
                    initialCheckedState[req.id] = false;
                });
                
                setCheckedCourses(initialCheckedState);
                
                // If transcript is loaded, update checked courses
                if (transcript) {
                    updateCheckedCoursesFromTranscript();
                }
                
                return;
            }
            
            console.log("Fetching program details for ID:", programId);
            const response = await axios.get(`http://localhost:8000/api/programs/${programId}`);
            console.log("Program details response:", response.data);
            
            // Process program requirements into a flat list of courses
            const flatRequirements = processProgramRequirements(response.data);
            setProgramRequirements(flatRequirements);
            
            // Initialize checked courses object
            const initialCheckedState = {};
            flatRequirements.forEach(req => {
                initialCheckedState[req.id] = false;
            });
            
            setCheckedCourses(initialCheckedState);
            
            // If transcript is loaded, update checked courses
            if (transcript) {
                updateCheckedCoursesFromTranscript();
            }
        } catch (err) {
            console.error('Error fetching program details:', err);
            // Use minimal fallback data if there's an error
            const fallbackProgram = {
                semesters: [
                    {
                        semester: "Error Loading Program",
                        courses: ["Unable to load program details. Please try again later."]
                    }
                ]
            };
            
            const flatRequirements = processProgramRequirements(fallbackProgram);
            setProgramRequirements(flatRequirements);
        }
    };

    // Process program requirements into a flat array suitable for a checklist
    const processProgramRequirements = (program) => {
        const requirements = [];
        let idCounter = 0;
        
        if (program && program.semesters) {
            program.semesters.forEach((semester, semesterIndex) => {
                const semesterCourses = [];
                
                if (semester.courses) {
                    let i = 0;
                    while (i < semester.courses.length) {
                        // Check if this is an "or" option
                        if (i + 2 < semester.courses.length && semester.courses[i + 1] === "or") {
                            // This is an OR group
                            const option1 = semester.courses[i];
                            const option2 = semester.courses[i + 2];
                            semesterCourses.push({
                                id: `or-${semesterIndex}-${idCounter++}`,
                                type: 'or',
                                options: [option1, option2],
                                semester: semester.semester
                            });
                            i += 3; // Skip past both options and the "or"
                        } else if (semester.courses[i] && semester.courses[i].trim() !== "") {
                            // Regular course
                            semesterCourses.push({
                                id: `course-${semesterIndex}-${idCounter++}`,
                                type: 'course',
                                course: semester.courses[i],
                                semester: semester.semester
                            });
                            i++;
                        } else {
                            // Skip empty entries
                            i++;
                        }
                    }
                }
                
                requirements.push(...semesterCourses);
            });
        }
        
        return requirements;
    };

    // Update checked courses based on the loaded transcript
    const updateCheckedCoursesFromTranscript = () => {
        if (!transcript || !transcript.courses || transcript.courses.length === 0) {
            return;
        }

        const completedCourses = transcript.courses.filter(
            course => course.grade && ['A', 'B', 'C', 'D'].includes(course.grade.charAt(0))
        );

        const newCheckedState = { ...checkedCourses };

        programRequirements.forEach(req => {
            if (req.type === 'course') {
                // Extract course code and subject from the requirement string
                const reqParts = req.course.split(' ');
                if (reqParts.length >= 2) {
                    const reqSubject = reqParts[0];
                    const reqCode = reqParts[1];
                    
                    // Check if this course has been completed
                    const completed = completedCourses.some(
                        course => course.subject === reqSubject && course.courseCode === reqCode
                    );
                    
                    if (completed) {
                        newCheckedState[req.id] = true;
                    }
                }
            } else if (req.type === 'or') {
                // For an "or" requirement, check if either option has been completed
                const option1Parts = req.options[0].split(' ');
                const option2Parts = req.options[1].split(' ');
                
                let option1Completed = false;
                let option2Completed = false;
                
                if (option1Parts.length >= 2) {
                    const option1Subject = option1Parts[0];
                    const option1Code = option1Parts[1];
                    option1Completed = completedCourses.some(
                        course => course.subject === option1Subject && course.courseCode === option1Code
                    );
                }
                
                if (option2Parts.length >= 2) {
                    const option2Subject = option2Parts[0];
                    const option2Code = option2Parts[1];
                    option2Completed = completedCourses.some(
                        course => course.subject === option2Subject && course.courseCode === option2Code
                    );
                }
                
                if (option1Completed || option2Completed) {
                    newCheckedState[req.id] = true;
                }
            }
        });
        
        setCheckedCourses(newCheckedState);
    };

    // Handle manual check/uncheck of a course
    const handleCheckboxChange = (reqId) => {
        setCheckedCourses(prev => ({
            ...prev,
            [reqId]: !prev[reqId]
        }));
    };

    // Calculate program completion percentage
    const calculateCompletionPercentage = () => {
        if (!programRequirements.length) return 0;
        
        const totalRequirements = programRequirements.length;
        const completedRequirements = Object.values(checkedCourses).filter(Boolean).length;
        
        return Math.round((completedRequirements / totalRequirements) * 100);
    };

    // Helper function to organize courses by term
    const organizeCoursesByTerm = (courses) => {
        // Sort terms chronologically
        const termOrder = {
            'Spring': 1,
            'Summer': 2,
            'Fall': 3
        };

        const coursesByTerm = courses.reduce((acc, course) => {
            if (!acc[course.term]) {
                acc[course.term] = [];
            }
            acc[course.term].push(course);
            return acc;
        }, {});

        // Sort terms by year and semester
        return Object.entries(coursesByTerm)
            .sort(([termA], [termB]) => {
                const [semA, yearA] = termA.split(' ');
                const [semB, yearB] = termB.split(' ');
                
                if (yearA !== yearB) {
                    return parseInt(yearA) - parseInt(yearB);
                }
                return termOrder[semA] - termOrder[semB];
            })
            .reduce((acc, [term, courses]) => {
                acc[term] = courses;
                return acc;
            }, {});
    };

    const getGradeColor = (grade) => {
        const colors = {
            'A': '#4CAF50',
            'B': '#8BC34A',
            'C': '#FFC107',
            'D': '#FF9800',
            'F': '#f44336',
            'W': '#9E9E9E',
            'P': '#2196F3',
            'IP': '#673AB7'
        };
        return colors[grade?.charAt(0)] || '#000000';
    };

    const calculateOverallStats = (courses) => {
        const completedCourses = courses.filter(course => 
            course.status === 'completed' && 
            course.grade !== 'W' && 
            course.grade !== 'P'
        );

        return {
            attemptHours: courses.reduce((sum, course) => sum + (course.creditHours || 0), 0),
            passedHours: completedCourses.reduce((sum, course) => sum + (course.creditHours || 0), 0),
            earnedHours: completedCourses.reduce((sum, course) => sum + (course.creditHours || 0), 0),
            gpaHours: completedCourses.reduce((sum, course) => sum + (course.creditHours || 0), 0),
            qualityPoints: completedCourses.reduce((sum, course) => sum + (course.qualityPoints || 0), 0),
            gpa: completedCourses.length ? 
                (completedCourses.reduce((sum, course) => sum + (course.qualityPoints || 0), 0) / 
                completedCourses.reduce((sum, course) => sum + (course.creditHours || 0), 0)) : 0
        };
    };

    if (loading) {
        return <div className="transcript-loader">Loading transcript data...</div>;
    }

    if (error) {
        return <div className="transcript-error">{error}</div>;
    }

    if (!transcript) {
        return <div className="transcript-empty">No transcript data available</div>;
    }

    const { studentInfo = {}, coursesByTerm } = transcript;
    const stats = calculateOverallStats(transcript.courses);

    // Group program requirements by semester for display
    const requirementsBySemester = programRequirements.reduce((acc, req) => {
        if (!acc[req.semester]) {
            acc[req.semester] = [];
        }
        acc[req.semester].push(req);
        return acc;
    }, {});

    return (
        <div className="transcript-container">
            <div className="student-info">
                <h2>Student Information</h2>
                <div className="info-grid">
                    <div className="info-item">
                        <label>Name:</label>
                        <span>{studentInfo.name || 'N/A'}</span>
                    </div>
                    <div className="info-item">
                        <label>Student ID:</label>
                        <span>{studentInfo.studentId || 'N/A'}</span>
                    </div>
                    <div className="info-item">
                        <label>Program:</label>
                        <span>{studentInfo.program || 'N/A'}</span>
                    </div>
                    <div className="info-item">
                        <label>Major:</label>
                        <span>{studentInfo.major || 'N/A'}</span>
                    </div>
                    <div className="info-item">
                        <label>College:</label>
                        <span>{studentInfo.college || 'N/A'}</span>
                    </div>
                    <div className="info-item">
                        <label>Cumulative GPA:</label>
                        <span>{(studentInfo.cumulativeGPA || stats.gpa || 0).toFixed(2)}</span>
                    </div>
                </div>
            </div>

            <div className="transcript-tabs">
                <button 
                    className={`tab-button ${activeTab === 'courses' ? 'active' : ''}`}
                    onClick={() => setActiveTab('courses')}
                >
                    Course History
                </button>
                <button 
                    className={`tab-button ${activeTab === 'progress' ? 'active' : ''}`}
                    onClick={() => setActiveTab('progress')}
                >
                    Current Progress
                </button>
                <button 
                    className={`tab-button ${activeTab === 'programs' ? 'active' : ''}`}
                    onClick={() => setActiveTab('programs')}
                >
                    Programs
                </button>
            </div>

            {activeTab === 'courses' && (
                <div className="courses-section">
                    <h3>Course History</h3>
                    {Object.entries(coursesByTerm).map(([term, courses]) => (
                        <div key={term} className="term-section">
                            <h4>{term}</h4>
                            <div className="courses-table-container">
                                <table className="courses-table">
                                    <thead>
                                        <tr>
                                            <th>Course</th>
                                            <th>Title</th>
                                            <th>Grade</th>
                                            <th>Credits</th>
                                            <th>Points</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {courses.map((course, index) => (
                                            <tr key={index} className={course.status === 'in-progress' ? 'in-progress' : ''}>
                                                <td>{course.subject} {course.courseCode}</td>
                                                <td>{course.title || 'N/A'}</td>
                                                <td>
                                                    <span 
                                                        className="grade-pill"
                                                        style={{ backgroundColor: getGradeColor(course.grade) }}
                                                    >
                                                        {course.grade || 'IP'}
                                                    </span>
                                                </td>
                                                <td>{(course.creditHours || 0).toFixed(3)}</td>
                                                <td>{course.qualityPoints ? course.qualityPoints.toFixed(2) : '-'}</td>
                                                <td>{course.status}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr>
                                            <td colSpan="6">
                                                Term GPA: {calculateTermGPA(courses).toFixed(2)}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'progress' && (
                <div className="progress-section">
                    <h3>Academic Progress</h3>
                    <div className="progress-stats">
                        <div className="stat-card">
                            <h4>Total Hours</h4>
                            <div className="stat-grid">
                                <div className="stat-item">
                                    <label>Attempted:</label>
                                    <span>{stats.attemptHours.toFixed(1)}</span>
                                </div>
                                <div className="stat-item">
                                    <label>Passed:</label>
                                    <span>{stats.passedHours.toFixed(1)}</span>
                                </div>
                                <div className="stat-item">
                                    <label>Earned:</label>
                                    <span>{stats.earnedHours.toFixed(1)}</span>
                                </div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <h4>Overall GPA</h4>
                            <div className="gpa-display">
                                {stats.gpa.toFixed(2)}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {activeTab === 'programs' && (
                <div className="programs-section">
                    <h3>Program Requirements</h3>
                    
                    <div className="program-selector">
                        <label htmlFor="program-dropdown">Select a Program:</label>
                        <select 
                            id="program-dropdown" 
                            value={selectedProgram || ''}
                            onChange={(e) => setSelectedProgram(e.target.value)}
                            disabled={loadingPrograms}
                        >
                            <option value="">-- Select Program --</option>
                            {programs.map(program => (
                                <option key={program._id} value={program._id}>
                                    {program.program_name}
                                </option>
                            ))}
                        </select>
                    </div>
                    
                    {loadingPrograms && <div className="loading-programs">Loading programs...</div>}
                    
                    {selectedProgram && (
                        <div className="program-details">
                            <div className="program-completion-bar">
                                <div className="completion-label">Program Completion: {calculateCompletionPercentage()}%</div>
                                <div className="progress-bar-container">
                                    <div 
                                        className="progress-bar" 
                                        style={{ width: `${calculateCompletionPercentage()}%` }}
                                    ></div>
                                </div>
                            </div>
                            
                            <div className="program-requirements-list">
                                {Object.entries(requirementsBySemester).map(([semester, requirements]) => (
                                    <div key={semester} className="semester-requirements">
                                        <h4>{semester}</h4>
                                        <ul className="requirements-checklist">
                                            {requirements.map(req => (
                                                <li key={req.id} className="requirement-item">
                                                    <label className="checkbox-container">
                                                        <input
                                                            type="checkbox"
                                                            checked={checkedCourses[req.id] || false}
                                                            onChange={() => handleCheckboxChange(req.id)}
                                                        />
                                                        <span className="checkmark"></span>
                                                        {req.type === 'course' ? (
                                                            <span>{req.course}</span>
                                                        ) : (
                                                            <span>{req.options[0]} or {req.options[1]}</span>
                                                        )}
                                                    </label>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {!selectedProgram && !loadingPrograms && (
                        <div className="select-program-prompt">
                            Please select a program to view requirements.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// Helper function to calculate term GPA
const calculateTermGPA = (courses) => {
    const completedCourses = courses.filter(course => course.status === 'completed');
    if (completedCourses.length === 0) return 0;

    const totalPoints = completedCourses.reduce((sum, course) => sum + course.qualityPoints, 0);
    const totalHours = completedCourses.reduce((sum, course) => sum + course.creditHours, 0);
    return totalPoints / totalHours;
};

export default TranscriptViewer;