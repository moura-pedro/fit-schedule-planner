import React, { useState, useRef } from 'react';
import axios from 'axios';
import './Search.css';

const Search = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedSections, setSelectedSections] = useState([]);
  const [modal, setModal] = useState(null);
  
  const searchFormRef = useRef(null);

  const formatTimeToStandard = (militaryTime) => {
    const hour = parseInt(militaryTime.substring(0, 2));
    const minutes = militaryTime.substring(2);
    const period = hour >= 12 ? 'PM' : 'AM';
    const standardHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
    return `${standardHour}:${minutes} ${period}`;
  };

  const parseMilitaryTime = (timeString) => {
    const hours = parseInt(timeString.substring(0, 2));
    const minutes = parseInt(timeString.substring(2));
    return { hours, minutes };
  };

  const parseTimeRange = (timeString) => {
    if (!timeString || timeString === 'TBA') return null;
    const [start, end] = timeString.split('-');
    return {
      start: parseMilitaryTime(start),
      end: parseMilitaryTime(end)
    };
  };

  const hasTimeConflict = (section1, section2) => {
    if (section1.Times === 'TBA' || section2.Times === 'TBA') return false;

    const time1 = parseTimeRange(section1.Times);
    const time2 = parseTimeRange(section2.Times);

    const days1 = section1.Days.split('');
    const days2 = section2.Days.split('');
    const sharedDays = days1.some(day => days2.includes(day));

    if (!sharedDays) return false;

    const start1 = time1.start.hours * 60 + time1.start.minutes;
    const end1 = time1.end.hours * 60 + time1.end.minutes;
    const start2 = time2.start.hours * 60 + time2.start.minutes;
    const end2 = time2.end.hours * 60 + time2.end.minutes;

    return (start1 < end2 && start2 < end1);
  };

  const timeSlots = Array.from({ length: 16 }, (_, i) => {
    const hour = i + 7;
    return {
      label: `${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`,
      hour
    };
  });

  const days = ['M', 'T', 'W', 'R', 'F'];
  const dayLabels = {
    'M': 'Monday',
    'T': 'Tuesday',
    'W': 'Wednesday',
    'R': 'Thursday',
    'F': 'Friday'
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    try {
      console.log('Searching for:', query, 'on day:', selectedDay);
      const { data } = await axios.get('http://localhost:8000/api/courses/search', {
        params: {
          query: query,
          filter_day: selectedDay,
        },
      });
      console.log('Search results:', data);
      setResults(data);
      setSelectedCourse(null);
    } catch (error) {
      console.error('Error fetching search results:', error);
    }
  };

  const sortedResults = results.sort((a, b) => {
    if (a.Course === b.Course) {
      return a.Title.localeCompare(b.Title);
    }
    return a.Course.localeCompare(b.Course);
  });

  const handleAddSection = async (section) => {
    const courseExists = selectedSections.some(
      selected => selected.courseCode === selectedCourse.Course
    );
    if (courseExists) {
      setModal({
        type: 'error',
        message: 'You already have this course in your schedule.',
      });
      return;
    }

    const hasConflict = selectedSections.some(
      selectedSection => hasTimeConflict(section, selectedSection)
    );
    if (hasConflict) {
      setModal({
        type: 'error',
        message: 'This section conflicts with another course in your schedule.',
      });
      return;
    }

    if (section.Enrolled >= section["Max Capacity"]) {
      setModal({
        type: 'confirm',
        message: 'This section is full. Do you still want to add it?',
        onConfirm: () => checkPrerequisites(section),
        onCancel: () => setModal(null),
      });
      return;
    }

    checkPrerequisites(section);
  };

  const checkPrerequisites = (section) => {
    if (selectedCourse.Prerequisites && selectedCourse.Prerequisites !== 'None') {
      setModal({
        type: 'confirm',
        message: `This course has prerequisites: ${selectedCourse.Prerequisites}. Do you still want to add it?`,
        onConfirm: () => addSectionToSchedule(section),
        onCancel: () => setModal(null),
      });
      return;
    }

    addSectionToSchedule(section);
  };

  const addSectionToSchedule = (section) => {
    setSelectedSections([...selectedSections, {
      ...section,
      courseCode: selectedCourse.Course,
      courseTitle: selectedCourse.Title
    }]);
    setModal(null);
  };

  const handleRemoveSection = (crn) => {
    setSelectedSections(selectedSections.filter(section => section.CRN !== crn));
  };

  const getBlockStyle = (timeString, courseCode) => {
    const timeRange = parseTimeRange(timeString);
    if (!timeRange) return null;
    
    const { start, end } = timeRange;
    const startPosition = (start.hours - 7) + (start.minutes / 60);
    const duration = (end.hours - start.hours) + ((end.minutes - start.minutes) / 60);
    
    return {
      top: `${startPosition * 60}px`,
      height: `${duration * 60}px`,
      backgroundColor: `hsl(${Math.abs(courseCode.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % 360}, 70%, 85%)`,
    };
  };

  const formatDisplayTime = (timeString) => {
    if (!timeString || timeString === 'TBA') return 'TBA';
    const [start, end] = timeString.split('-');
    return `${formatTimeToStandard(start)} - ${formatTimeToStandard(end)}`;
  };

  const Modal = () => {
    if (!modal) return null;

    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <p>{modal.message}</p>
          {modal.type === 'confirm' ? (
            <div className="modal-buttons">
              <button onClick={modal.onConfirm}>Yes</button>
              <button onClick={modal.onCancel}>No</button>
            </div>
          ) : (
            <button onClick={() => setModal(null)}>OK</button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="search-container">
      <h1>Search Courses</h1>
      <form onSubmit={handleSearch} ref={searchFormRef}>
        <input
          type="text"
          placeholder="Search by course title or number"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select value={selectedDay} onChange={(e) => setSelectedDay(e.target.value)}>
          <option value="">All Days</option>
          <option value="M">Monday</option>
          <option value="T">Tuesday</option>
          <option value="W">Wednesday</option>
          <option value="R">Thursday</option>
          <option value="F">Friday</option>
        </select>
        <button type="submit">Search</button>
      </form>

      <div className="split-view">
        <div className="courses-list">
          {sortedResults.length > 0 ? (
            sortedResults.map((course) => (
              <div 
                key={course._id} 
                className={`course-card ${selectedCourse?._id === course._id ? 'selected' : ''}`}
                onClick={() => setSelectedCourse(course)}
              >
                <h3 className="course-title">{course.Course}: {course.Title}</h3>
                <div className="course-details">
                  <p>Credits: {course.Credits}</p>
                  <p>Prerequisites: {course.Prerequisites || 'None'}</p>
                </div>
              </div>
            ))
          ) : (
            <p>No results found.</p>
          )}
        </div>

        <div className="sections-view">
          {selectedCourse ? (
            <>
              <h2 className="sections-title">Sections for {selectedCourse.Course}</h2>
              <div className="sections-list">
                {selectedCourse.sections.map((section) => (
                  <div 
                    key={section.CRN} 
                    className={`section-card ${
                      selectedSections.some(s => s.CRN === section.CRN) ? 'selected' : ''
                    }`}
                    onClick={() => handleAddSection(section)}
                  >
                    <h4>Section {section.Section}</h4>
                    <p>Days: {section.Days}</p>
                    <p>Time: {formatDisplayTime(section.Times)}</p>
                    <p>Instructor: {section.Instructor}</p>
                    <p>Enrollment: {section.Enrolled}/{section["Max Capacity"]}</p>
                    <p>CRN: {section.CRN}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="no-section-selected">
              <p>Select a course to view available sections</p>
            </div>
          )}
        </div>
      </div>

      {selectedSections.length > 0 && (
        <div className="selected-sections">
          <h2>Selected Sections</h2>
          <div className="selected-sections-list">
            {selectedSections.map((section) => (
              <div key={section.CRN} className="selected-section-card">
                <div className="selected-section-info">
                  <h4>{section.courseCode}: {section.courseTitle}</h4>
                  <p>Section {section.Section} | {section.Days} at {formatDisplayTime(section.Times)}</p>
                  <p>Instructor: {section.Instructor}</p>
                  <p>CRN: {section.CRN}</p>
                </div>
                <button 
                  className="remove-section" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveSection(section.CRN);
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedSections.length > 0 && (
        <div className="schedule-container">
          <h2>Weekly Schedule</h2>
          <div className="schedule-grid">
            <div className="time-column">
              {timeSlots.map((slot) => (
                <div key={slot.hour} className="time-slot">
                  {slot.label}
                </div>
              ))}
            </div>
            {days.map((day) => (
              <div key={day} className="day-column">
                <div className="day-header">{dayLabels[day]}</div>
                <div className="day-slots">
                  {selectedSections.map((section) => {
                    if (section.Days.includes(day) && section.Times !== 'TBA') {
                      const blockStyle = getBlockStyle(section.Times, section.courseCode);
                      return blockStyle && (
                        <div
                          key={`${section.CRN}-${day}`}
                          className="course-block"
                          style={blockStyle}
                        >
                          <div className="course-block-content">
                            <strong>{section.courseCode}</strong>
                            <div className="course-block-details">
                              <span>Section {section.Section}</span>
                              <span>{formatDisplayTime(section.Times)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <Modal />
    </div>
  );
};

export default Search;
