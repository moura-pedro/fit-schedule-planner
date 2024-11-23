// client/src/components/TranscriptViewer/TranscriptViewer.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './TranscriptViewer.css';

const TranscriptViewer = () => {
    const [transcript, setTranscript] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('courses');

    useEffect(() => {
        fetchTranscript();
    }, []);

    const fetchTranscript = async () => {
        try {
            const response = await axios.get('http://localhost:8000/api/transcript', {
                withCredentials: true
            });
            
            if (response.data.transcript) {
                // Ensure overallTotals exists with default values
                const transcriptData = {
                    ...response.data.transcript,
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

    const { studentInfo = {}, courses = [] } = transcript;
    const stats = calculateOverallStats(courses);

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
            </div>

            {activeTab === 'courses' && (
                <div className="courses-section">
                    <h3>Course History</h3>
                    <div className="courses-table-container">
                        <table className="courses-table">
                            <thead>
                                <tr>
                                    <th>Term</th>
                                    <th>Course</th>
                                    <th>Title</th>
                                    <th>Credits</th>
                                    <th>Grade</th>
                                    <th>Points</th>
                                </tr>
                            </thead>
                            <tbody>
                                {courses
                                    .sort((a, b) => (a.term || '').localeCompare(b.term || ''))
                                    .map((course, index) => (
                                    <tr key={index} className={course.status === 'in-progress' ? 'in-progress' : ''}>
                                        <td>{course.term || 'N/A'}</td>
                                        <td>{course.subject} {course.courseCode}</td>
                                        <td>{course.title || 'N/A'}</td>
                                        <td>{(course.creditHours || 0).toFixed(3)}</td>
                                        <td>
                                            <span 
                                                className="grade-pill"
                                                style={{ backgroundColor: getGradeColor(course.grade) }}
                                            >
                                                {course.grade || 'IP'}
                                            </span>
                                        </td>
                                        <td>{course.qualityPoints ? course.qualityPoints.toFixed(2) : '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
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
        </div>
    );
};

export default TranscriptViewer;