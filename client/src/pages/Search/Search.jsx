import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './Search.css';

const Search = () => {
  // Existing state variables for core functionality
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedSections, setSelectedSections] = useState([]);
  const [modal, setModal] = useState(null);
  const [sectionColors, setSectionColors] = useState(new Map());

  // State variables for filters
  const [subject, setSubject] = useState('');
  const [professor, setProfessor] = useState('');
  const [courseLevel, setCourseLevel] = useState('');
  const [credits, setCredits] = useState('');
  const [includeDays, setIncludeDays] = useState([]);
  const [excludeDays, setExcludeDays] = useState([]);
  const [showIncludeDaysDropdown, setShowIncludeDaysDropdown] = useState(false);
  const [showExcludeDaysDropdown, setShowExcludeDaysDropdown] = useState(false);

  // Time block state variables
  const [showTimeBlockModal, setShowTimeBlockModal] = useState(false);
  const [timeBlockName, setTimeBlockName] = useState('');
  const [timeBlockDays, setTimeBlockDays] = useState([]);
  const [timeBlockStart, setTimeBlockStart] = useState('');
  const [timeBlockEnd, setTimeBlockEnd] = useState('');

  const searchFormRef = useRef(null);

  // Filter options
  const subjects = ['CSE', 'MTH', 'PHY', 'CHM', 'BIO', 'ENG', 'HIS', 'PSY'];
  const courseLevels = ['1000+', '2000+', '3000+', '4000+', '5000+'];
  const creditOptions = ['1', '2', '3', '4', '5'];
  const daysOptions = [
    { value: 'M', label: 'Monday' },
    { value: 'T', label: 'Tuesday' },
    { value: 'W', label: 'Wednesday' },
    { value: 'R', label: 'Thursday' },
    { value: 'F', label: 'Friday' }
  ];

  // Time slots and days arrays for schedule display
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

  // Color generation for schedule blocks
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
        backgroundColor: section.isPersonalBlock ? '#e2e8f0' : `hsl(${hue}, ${saturation}%, ${lightness}%)`,
        borderColor: section.isPersonalBlock ? '#4a5568' : `hsl(${hue}, ${saturation}%, ${lightness - 20}%)`,
        textColor: section.isPersonalBlock ? '#2d3748' : (hue > 200 && lightness > 85 ? '#333' : '#fff')
      });
    });

    return colorMap;
  };

  // Effect for generating colors when sections change
  useEffect(() => {
    if (selectedSections.length > 0) {
      const newColors = generateUniqueColors(selectedSections);
      setSectionColors(newColors);
    }
  }, [selectedSections]);

  // Time block handlers
  const handleAddTimeBlock = (e) => {
    e.preventDefault();
    
    // Validate inputs
    if (!timeBlockName || timeBlockDays.length === 0 || !timeBlockStart || !timeBlockEnd) {
      setModal({
        type: 'error',
        message: 'Please fill in all fields for the time block.',
      });
      return;
    }

    // Convert HH:MM format to military time
    const convertToMilitaryTime = (time) => {
      const [hours, minutes] = time.split(':');
      return `${hours.padStart(2, '0')}${minutes}`;
    };
    
    const newTimeBlock = {
      CRN: `TB-${Date.now()}`,
      Section: 'Personal',
      Days: timeBlockDays.join(''),
      Times: `${convertToMilitaryTime(timeBlockStart)}-${convertToMilitaryTime(timeBlockEnd)}`,
      Place: '',
      Instructor: '',
      Capacity: '',
      courseCode: '',
      courseTitle: timeBlockName,
      isPersonalBlock: true
    };

    // Check for time conflicts
    const hasConflict = selectedSections.some(
      selectedSection => hasTimeConflict(newTimeBlock, selectedSection)
    );

    if (hasConflict) {
      setModal({
        type: 'error',
        message: 'This time block conflicts with another course or time block in your schedule.',
      });
      return;
    }

    setSelectedSections([...selectedSections, newTimeBlock]);
    setShowTimeBlockModal(false);
    resetTimeBlockForm();
  };

  const resetTimeBlockForm = () => {
    setTimeBlockName('');
    setTimeBlockDays([]);
    setTimeBlockStart('');
    setTimeBlockEnd('');
  };

  // Time formatting helpers
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

  // Time conflict checking
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

  // Days filter handler
  const handleDayToggle = (day, type) => {
    if (type === 'include') {
      if (includeDays.includes(day)) {
        setIncludeDays(includeDays.filter(d => d !== day));
      } else {
        setIncludeDays([...includeDays, day]);
      }
    } else {
      if (excludeDays.includes(day)) {
        setExcludeDays(excludeDays.filter(d => d !== day));
      } else {
        setExcludeDays([...excludeDays, day]);
      }
    }
  };

  // Main search handler
  const handleSearch = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.get('http://localhost:8000/api/courses/search', {
        params: {
          query,
          subject,
          professor,
          courseLevel: courseLevel ? parseInt(courseLevel) : null,
          credits: credits ? parseInt(credits) : null,
          includeDays: includeDays.join(','),
          excludeDays: excludeDays.join(','),
        },
      });
      
      // Filter results based on all criteria
      const filteredResults = data.filter(course => {
        // Subject filter
        if (subject && !course.Course.startsWith(subject)) return false;
        
        // Course level filter
        if (courseLevel) {
          const courseNumber = parseInt(course.Course.match(/\d+/)[0]);
          if (courseNumber < parseInt(courseLevel)) return false;
        }
        
        // Credits filter
        if (credits && course.Credits !== parseInt(credits)) return false;
        
        // Professor and days filters (check if any section matches)
        const hasMatchingSection = course.Sections.some(section => {
          // Professor filter
          if (professor && !section.Instructor.toLowerCase().includes(professor.toLowerCase())) {
            return false;
          }
          
          // Days filters
          const sectionDays = section.Days.split('\n').join('').split('');
          
          // Include days filter
          if (includeDays.length > 0 && !includeDays.every(day => sectionDays.includes(day))) {
            return false;
          }
          
          // Exclude days filter
          if (excludeDays.length > 0 && excludeDays.some(day => sectionDays.includes(day))) {
            return false;
          }
          
          return true;
        });
        
        return hasMatchingSection;
      });
      
      setResults(filteredResults);
      setSelectedCourse(null);
    } catch (error) {
      console.error('Error fetching search results:', error);
    }
  };

  // Section management handlers
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
        message: 'This section conflicts with another course or time block in your schedule.',
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

  // Schedule display helpers
  const getBlockStyle = (timeString, sectionCRN, isLab = false) => {
    const timeRange = parseTimeRange(timeString);
    if (!timeRange) return null;

    const { start, end } = timeRange;
    const startPosition = ((start.hours - 7) * 60 + start.minutes) / 60;
    const duration = ((end.hours - start.hours) * 60 + (end.minutes - start.minutes)) / 60;

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
    if (!times || !days) return { displayTime: 'TBA', displayPlace: 'TBA' };

    const timesList = times.split('\n');
    const daysList = days.split('\n');
    const placesList = place ? place.split('\n') : [];

    let displayTime = formatTimeToStandard(timesList[0]);
    let displayPlace = placesList[0] || '';

    if (timesList.length > 1) {
      displayTime += ` (Lab ${formatTimeToStandard(timesList[1])})`;
      displayPlace += placesList[1] ? ` (Lab ${placesList[1]})` : '';
    }

    return { displayTime, displayPlace };
  };

  const formatSingleTime = (time) => {
    if (!time) return '';
    const hour = parseInt(time.substring(0, 2));
    const minutes = time.substring(2);
    const period = hour >= 12 ? 'PM' : 'AM';
    const standardHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
    return `${standardHour}:${minutes} ${period}`;
  };

  // Time Block Modal Component
  const TimeBlockModal = () => {
    if (!showTimeBlockModal) return null;

    return (
      <div className="modal-overlay">
        <div className="modal-content time-block-modal">
          <h2>Add Personal Time Block</h2>
          <form onSubmit={handleAddTimeBlock}>
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                value={timeBlockName}
                onChange={(e) => setTimeBlockName(e.target.value)}
                placeholder="e.g., Basketball Practice"
                className="filter-select"
                autoFocus
              />
            </div>

            <div className="form-group">
              <label>Days</label>
              <div className="days-selected">
                {daysOptions.map(day => (
                  <label key={day.value} className="day-checkbox">
                    <input
                      type="checkbox"
                      checked={timeBlockDays.includes(day.value)}
                      onChange={() => {
                        if (timeBlockDays.includes(day.value)) {
                          setTimeBlockDays(timeBlockDays.filter(d => d !== day.value));
                        } else {
                          setTimeBlockDays([...timeBlockDays, day.value]);
                        }
                      }}
                    />
                    {day.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group time-selects">
              <div>
                <label>Start Time</label>
                <input
                  type="time"
                  value={timeBlockStart}
                  onChange={(e) => setTimeBlockStart(e.target.value)}
                  className="filter-select"
                  min="07:00"
                  max="21:00"
                />
              </div>

              <div>
                <label>End Time</label>
                <input
                  type="time"
                  value={timeBlockEnd}
                  onChange={(e) => setTimeBlockEnd(e.target.value)}
                  className="filter-select"
                  min="07:00"
                  max="21:00"
                />
              </div>
            </div>

            <div className="modal-buttons">
              <button type="submit" className="add-button">Add Time Block</button>
              <button
                type="button"
                className="cancel-button"
                onClick={() => {
                  setShowTimeBlockModal(false);
                  resetTimeBlockForm();
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Error/Confirmation Modal Component
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
      <form onSubmit={handleSearch} ref={searchFormRef} className="search-form">
        <div className="search-bar">
          <input
            type="text"
            className="search-input"
            placeholder="Search by course title or number"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        
        <div className="filters-grid">
          <div className="filter-group">
            <label>Subject</label>
            <select
              className="filter-select"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            >
              <option value="">All Subjects</option>
              {subjects.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Professor</label>
            <input
              type="text"
              className="filter-select"
              placeholder="Enter professor name"
              value={professor}
              onChange={(e) => setProfessor(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Course Level</label>
            <select
              className="filter-select"
              value={courseLevel}
              onChange={(e) => setCourseLevel(e.target.value)}
            >
              <option value="">All Levels</option>
              {courseLevels.map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Credits</label>
            <select
              className="filter-select"
              value={credits}
              onChange={(e) => setCredits(e.target.value)}
            >
              <option value="">All Credits</option>
              {creditOptions.map(credit => (
                <option key={credit} value={credit}>{credit}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="days-filters">
          <div className="days-filter-section">
            <label>Include Days</label>
            <div className="days-multiselect">
              <div 
                className="days-selected"
                onClick={() => setShowIncludeDaysDropdown(!showIncludeDaysDropdown)}
              >
                {includeDays.map(day => (
                  <span key={day} className="day-chip">
                    {daysOptions.find(d => d.value === day).label}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDayToggle(day, 'include');
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              {showIncludeDaysDropdown && (
                <div className="days-dropdown">
                  {daysOptions.map(day => (
                    <label key={day.value}>
                      <input
                        type="checkbox"
                        checked={includeDays.includes(day.value)}
                        onChange={() => handleDayToggle(day.value, 'include')}
                      />
                      {day.label}
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="days-filter-section">
            <label>Exclude Days</label>
            <div className="days-multiselect">
              <div 
                className="days-selected"
                onClick={() => setShowExcludeDaysDropdown(!showExcludeDaysDropdown)}
              >
                {excludeDays.map(day => (
                  <span key={day} className="day-chip">
                    {daysOptions.find(d => d.value === day).label}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDayToggle(day, 'exclude');
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              {showExcludeDaysDropdown && (
                <div className="days-dropdown">
                  {daysOptions.map(day => (
                    <label key={day.value}>
                      <input
                        type="checkbox"
                        checked={excludeDays.includes(day.value)}
                        onChange={() => handleDayToggle(day.value, 'exclude')}
                      />
                      {day.label}
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="add-timeblock-button-container">
          <button
            type="button"
            className="add-timeblock-button"
            onClick={() => setShowTimeBlockModal(true)}
          >
            Add Personal Time Block
          </button>
        </div>

        <button type="submit" className="search-button">Search</button>
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
                    <h4>{section.isPersonalBlock ? section.courseTitle : `${section.courseCode}: ${section.courseTitle}`}</h4>
                    <p>Days: {section.Days.replace('\n', ' ')}</p>
                    <p>Time: {displayTime}</p>
                    {!section.isPersonalBlock && (
                      <>
                        <p>Place: {displayPlace}</p>
                        <p>Instructor: {section.Instructor}</p>
                        <p>CRN: {section.CRN}</p>
                      </>
                    )}
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
                            className={`course-block ${isLab ? 'lab-block' : ''} ${section.isPersonalBlock ? 'personal-block' : ''}`}
                            style={blockStyle}
                          >
                            <div className="course-block-content">
                              <div className="course-block-title">
                                <strong>{section.isPersonalBlock ? section.courseTitle : section.courseCode}</strong>
                                {isLab && <span className="lab-indicator"> (Lab)</span>}
                              </div>
                              <div className="course-block-details">
                                <span>{formatTimeToStandard(allTimes[index])}</span>
                                {!section.isPersonalBlock && <span className="location">{allPlaces[index]}</span>}
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
      <TimeBlockModal />
    </div>
  );
}

export default Search;