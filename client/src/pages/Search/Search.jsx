import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './Search.css';

const Search = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedSections, setSelectedSections] = useState([]);
  const [modal, setModal] = useState(null);
  const [sectionColors, setSectionColors] = useState(new Map());

  const searchFormRef = useRef(null);

  const generateUniqueColors = (sections) => {
    const colorMap = new Map();

    sections.forEach((section) => {
      const hash = section.CRN.split('').reduce(
        (acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0
      );

      const hue = Math.abs(hash % 360);
      const saturation = 70 + (hash % 20);
      const lightness = 80 + (hash % 10);

      colorMap.set(section.CRN, {
        backgroundColor: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
        borderColor: `hsl(${hue}, ${saturation}%, ${lightness - 20}%)`,
        textColor: hue > 200 && lightness > 85 ? '#333' : '#fff'
      });
    });

    return colorMap;
  };

  useEffect(() => {
    if (selectedSections.length > 0) {
      const newColors = generateUniqueColors(selectedSections);
      setSectionColors(newColors);
    }
  }, [selectedSections]);

  const formatTimeToStandard = (militaryTime) => {
    if (!militaryTime) return 'TBA';
    const [start, end] = militaryTime.split('-');
    return `${formatSingleTime(start)} - ${formatSingleTime(end)}`;
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
    if (!section1.Times || !section2.Times || section1.Times === 'TBA' || section2.Times === 'TBA') return false;

    const time1 = parseTimeRange(section1.Times);
    const time2 = parseTimeRange(section2.Times);

    const days1 = section1.Days.split('\n').join('').split('');
    const days2 = section2.Days.split('\n').join('').split('');
    const sharedDays = days1.some(day => days2.includes(day));

    if (!sharedDays) return false;

    const start1 = time1.start.hours * 60 + time1.start.minutes;
    const end1 = time1.end.hours * 60 + time1.end.minutes;
    const start2 = time2.start.hours * 60 + time2.start.minutes;
    const end2 = time2.end.hours * 60 + time2.end.minutes;

    return (start1 < end2 && start2 < end1);
  };

  const timeSlots = Array.from({ length: 15 }, (_, i) => {
    const hour = i + 7; // Start at 7 AM
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
      const { data } = await axios.get('http://localhost:8000/api/courses/search', {
        params: {
          query: query,
          filter_day: selectedDay,
        },
      });
      setResults(data);
      setSelectedCourse(null);
    } catch (error) {
      console.error('Error fetching search results:', error);
    }
  };

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

    const [enrolled, maxCapacity] = section.Capacity.split('/').map(Number);
    if (enrolled >= maxCapacity) {
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
    if (selectedCourse.Prerequisites) {
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

  const getBlockStyle = (timeString, sectionCRN, isLab = false) => {
    const timeRange = parseTimeRange(timeString);
    if (!timeRange) return null;

    const { start, end } = timeRange;
    const startPosition = ((start.hours - 7) * 60 + start.minutes) / 60;
    const duration = ((end.hours - start.hours) * 60 + (end.minutes - start.minutes)) / 60;

    // Get the pre-generated colors for this section
    const colors = sectionColors.get(sectionCRN) || {
      backgroundColor: '#e2e8f0',
      borderColor: '#cbd5e1',
      textColor: '#333'
    };

    return {
      top: `${startPosition * 60}px`,
      height: `${duration * 60}px`,
      backgroundColor: colors.backgroundColor,
      color: colors.textColor,
      borderLeft: isLab ? `4px solid ${colors.borderColor}` : `2px solid ${colors.borderColor}`,
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      transition: 'transform 0.2s, box-shadow 0.2s',
    };
  };

  const formatDisplayTimeAndPlace = (times, days, place) => {
    if (!times || !days || !place) return { displayTime: 'TBA', displayPlace: 'TBA' };

    const timesList = times.split('\n');
    const daysList = days.split('\n');
    const placesList = place.split('\n');

    let displayTime = formatTimeToStandard(timesList[0]);
    let displayPlace = placesList[0];

    if (timesList.length > 1) {
      displayTime += ` (Lab ${formatTimeToStandard(timesList[1])})`;
      displayPlace += ` (Lab ${placesList[1]})`;
    }

    return { displayTime, displayPlace };
  };

  const formatSingleTime = (time) => {
    const hour = parseInt(time.substring(0, 2));
    const minutes = time.substring(2);
    const period = hour >= 12 ? 'PM' : 'AM';
    const standardHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
    return `${standardHour}:${minutes} ${period}`;
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
          {results.length > 0 ? (
            results.map((course) => (
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
                {selectedCourse.Sections?.map((section) => {
                  const { displayTime, displayPlace } = formatDisplayTimeAndPlace(
                    section.Times,
                    section.Days,
                    section.Place
                  );

                  return (
                    <div
                      key={section.CRN}
                      className={`section-card ${selectedSections.some(s => s.CRN === section.CRN) ? 'selected' : ''}`}
                      onClick={() => handleAddSection(section)}
                    >
                      <h4>Section {section.Section}</h4>
                      <p>Days: {section.Days.replace('\n', ' ')}</p>
                      <p>Time: {displayTime}</p>
                      <p>Place: {displayPlace}</p>
                      <p>Instructor: {section.Instructor}</p>
                      <p>Capacity: {section.Capacity}</p>
                      <p>CRN: {section.CRN}</p>
                    </div>
                  );
                })}
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
            {selectedSections.map((section) => {
              const { displayTime, displayPlace } = formatDisplayTimeAndPlace(
                section.Times,
                section.Days,
                section.Place
              );

              return (
                <div key={section.CRN} className="selected-section-card">
                  <div className="selected-section-info">
                    <h4>{section.courseCode}: {section.courseTitle}</h4>
                    <p>Section {section.Section} | {section.Days.replace('\n', ' ')}</p>
                    <p>Time: {displayTime}</p>
                    <p>Place: {displayPlace}</p>
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
              );
            })}
          </div>
        </div>
      )}

      {selectedSections.length > 0 && (
        <div className="schedule-container">
          <h2>Weekly Schedule</h2>
          <div className="schedule-grid">
            <div className="time-column">
              <div className="day-header">Hours</div>
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
                    const allDays = section.Days.split('\n');
                    const allTimes = section.Times.split('\n');
                    const allPlaces = section.Place.split('\n');

                    return allDays.map((dayString, index) => {
                      if (dayString.includes(day) && allTimes[index] !== 'TBA') {
                        const isLab = index === 1;
                        const blockStyle = getBlockStyle(allTimes[index], section.CRN, isLab);

                        return blockStyle && (
                          <div
                            key={`${section.CRN}-${day}-${index}`}
                            className={`course-block ${isLab ? 'lab-block' : ''}`}
                            style={blockStyle}
                          >
                            <div className="course-block-content">
                              <div className="course-block-title">
                                <strong>{section.courseCode}</strong>
                                {isLab && <span className="lab-indicator"> (Lab)</span>}
                              </div>
                              <div className="course-block-details">
                                <span>{formatTimeToStandard(allTimes[index])}</span>
                                <span className="location">{allPlaces[index]}</span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    });
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
}

export default Search;
