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
            const response = await axios.get('http://localhost:8000/api/transcript');
            setTranscript(response.data.transcript);
            setError(null);
        } catch (err) {
            setError('Failed to load transcript data');
            console.error('Error fetching transcript:', err);
        } finally {
            setLoading(false);
        }
    };

    const calculateGPA = (courses) => {
        const completedCourses = courses.filter(course => course.status === 'completed' && course.grade !== 'W' && course.grade !== 'P');
        const totalPoints = completedCourses.reduce((sum, course) => sum + course.qualityPoints, 0);
        const totalHours = completedCourses.reduce((sum, course) => sum + course.creditHours, 0);
        return totalHours === 0 ? 0 : (totalPoints / totalHours).toFixed(2);
    };

    const getGradeColor = (grade) => {
        const gradeColors = {
            'A': '#4CAF50',
            'B': '#8BC34A',
            'C': '#FFC107',
            'D': '#FF9800',
            'F': '#f44336',
            'W': '#9E9E9E',
            'P': '#2196F3'
        };
        return gradeColors[grade?.charAt(0)] || '#000000';
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

    return (
        <div className="transcript-container">
            <div className="student-info">
                <h2>Student Information</h2>
                <div className="info-grid">
                    <div className="info-item">
                        <label>Name:</label>
                        <span>{transcript.studentInfo.name}</span>
                    </div>
                    <div className="info-item">
                        <label>Program:</label>
                        <span>{transcript.studentInfo.program}</span>
                    </div>
                    <div className="info-item">
                        <label>Major:</label>
                        <span>{transcript.studentInfo.major}</span>
                    </div>
                    <div className="info-item">
                        <label>College:</label>
                        <span>{transcript.studentInfo.college}</span>
                    </div>
                    <div className="info-item">
                        <label>Cumulative GPA:</label>
                        <span>{calculateGPA(transcript.courses)}</span>
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
                                {transcript.courses.map((course, index) => (
                                    <tr key={index} className={course.status === 'in-progress' ? 'in-progress' : ''}>
                                        <td>{course.term}</td>
                                        <td>{course.subject} {course.courseCode}</td>
                                        <td>{course.title}</td>
                                        <td>{course.creditHours}</td>
                                        <td>
                                            <span 
                                                className="grade-pill"
                                                style={{ backgroundColor: getGradeColor(course.grade) }}
                                            >
                                                {course.grade || 'IP'}
                                            </span>
                                        </td>
                                        <td>{course.qualityPoints || '-'}</td>
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
                    <div className="term-totals">
                        {transcript.termTotals.map((term, index) => (
                            <div key={index} className="term-total-card">
                                <h4>Term {index + 1}</h4>
                                <div className="term-stats">
                                    <div className="stat-item">
                                        <label>Attempted Hours:</label>
                                        <span>{term.attemptHours}</span>
                                    </div>
                                    <div className="stat-item">
                                        <label>Earned Hours:</label>
                                        <span>{term.earnedHours}</span>
                                    </div>
                                    <div className="stat-item">
                                        <label>GPA Hours:</label>
                                        <span>{term.gpaHours}</span>
                                    </div>
                                    <div className="stat-item">
                                        <label>Term GPA:</label>
                                        <span>{term.gpa}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TranscriptViewer;