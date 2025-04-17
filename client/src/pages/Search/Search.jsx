import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './Search.css';
import Navbar from '../../components/Navbar/Navbar'

const Search = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedSections, setSelectedSections] = useState([]);
  const [modal, setModal] = useState(null);
  const [sectionColors, setSectionColors] = useState(new Map());

  const [registrationStatus, setRegistrationStatus] = useState(null);

  const [showRMP, setShowRMP] = useState(false);
  const [professorRatings, setProfessorRatings] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  
  // Advanced filter states
  const [filters, setFilters] = useState({
    subject: '',
    days: {
      M: { selected: false, include: true },
      T: { selected: false, include: true },
      W: { selected: false, include: true },
      R: { selected: false, include: true },
      F: { selected: false, include: true }
    },
    credits: '',
    professor: '',
    courseLevel: 'any' // 'any', '3000+', or '5000+'
  });
  
  // Personal time blocks
  const [timeBlocks, setTimeBlocks] = useState([]);
  const [timeBlockForm, setTimeBlockForm] = useState({
    name: '',
    days: '',
    startTime: '',
    endTime: ''
  });
  const [showTimeBlockForm, setShowTimeBlockForm] = useState(false);

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

  // Generate colors for time blocks separately
  const generateTimeBlockColors = (timeBlock) => {
    const hash = timeBlock.name.split('').reduce(
      (acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0
    );

    const hue = Math.abs(hash % 360);
    
    return {
      backgroundColor: `hsl(${hue}, 60%, 90%)`,
      borderColor: `hsl(${hue}, 70%, 70%)`,
      textColor: '#333'
    };
  };

  useEffect(() => {
    if (selectedSections.length > 0) {
      const newColors = generateUniqueColors(selectedSections);
      setSectionColors(newColors);
    }
  }, [selectedSections]);
  
  // Function to fetch RateMyProfessor ratings
  const fetchProfessorRatings = async (professorName) => {
    if (!showRMP || professorRatings[professorName]) return;
    
    try {
      setIsLoading(true);
      // This would normally be your RMP API call
      // For demo purposes, we'll simulate an API call with setTimeout
      const mockApiCall = new Promise((resolve) => {
        setTimeout(() => {
          // Generate a random rating between 2.0 and 5.0
          const rating = (Math.random() * 3 + 2).toFixed(1);
          resolve({ rating });
        }, 500);
      });
      
      const { rating } = await mockApiCall;
      setProfessorRatings(prev => ({
        ...prev,
        [professorName]: rating
      }));
    } catch (error) {
      console.error('Error fetching professor rating:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Reset professor ratings when toggle is turned off
    if (!showRMP) {
      setProfessorRatings({});
    }
  }, [showRMP]);

  useEffect(() => {
    // Fetch ratings for professors in the selected course when RMP is toggled on
    if (showRMP && selectedCourse) {
      const uniqueProfessors = [...new Set(selectedCourse.Sections.map(section => section.Instructor))];
      uniqueProfessors.forEach(professor => {
        if (professor) fetchProfessorRatings(professor);
      });
    }
  }, [showRMP, selectedCourse]);

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

  // Check for conflicts with personal time blocks
  const hasTimeBlockConflict = (section) => {
    if (!section.Times || section.Times === 'TBA' || timeBlocks.length === 0) return false;
    
    const sectionTime = parseTimeRange(section.Times);
    const sectionDays = section.Days.split('\n').join('').split('');
    
    return timeBlocks.some(timeBlock => {
      const timeBlockTime = {
        start: parseMilitaryTime(timeBlock.startTime),
        end: parseMilitaryTime(timeBlock.endTime)
      };
      
      const timeBlockDays = timeBlock.days.split('');
      const sharedDays = sectionDays.some(day => timeBlockDays.includes(day));
      
      if (!sharedDays) return false;
      
      const sectionStart = sectionTime.start.hours * 60 + sectionTime.start.minutes;
      const sectionEnd = sectionTime.end.hours * 60 + sectionTime.end.minutes;
      const blockStart = timeBlockTime.start.hours * 60 + timeBlockTime.start.minutes;
      const blockEnd = timeBlockTime.end.hours * 60 + timeBlockTime.end.minutes;
      
      return (sectionStart < blockEnd && blockStart < sectionEnd);
    });
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

  // Apply filters to search results
  const applyFilters = (courses) => {
    return courses.filter(course => {
      // Subject filter
      if (filters.subject && !course.Course.startsWith(filters.subject.toUpperCase())) {
        return false;
      }
      
      // Course level filter
      if (filters.courseLevel !== 'any') {
        const courseNumber = course.Course.match(/\d+/);
        if (courseNumber) {
          const numValue = parseInt(courseNumber[0]);
          if (filters.courseLevel === '3000+' && numValue < 3000) {
            return false;
          }
          if (filters.courseLevel === '5000+' && numValue < 5000) {
            return false;
          }
        }
      }
      
      // Credits filter
      if (filters.credits && parseInt(course.Credits) !== parseInt(filters.credits)) {
        return false;
      }
      
      // Days filter
      const selectedDays = Object.entries(filters.days)
        .filter(([_, value]) => value.selected)
        .map(([day]) => day);
      
      if (selectedDays.length > 0) {
        const hasMatchingSections = course.Sections.some(section => {
          const sectionDays = section.Days.split('\n').join('').split('');
          
          // For "include" mode, at least one of the selected days must be in the section
          if (filters.days[selectedDays[0]].include) {
            return selectedDays.some(day => sectionDays.includes(day));
          } 
          // For "exclude" mode, none of the selected days can be in the section
          else {
            return !selectedDays.some(day => sectionDays.includes(day));
          }
        });
        
        if (!hasMatchingSections) {
          return false;
        }
      }
      
      // Professor filter
      if (filters.professor) {
        const hasMatchingProfessor = course.Sections.some(section => 
          section.Instructor && 
          section.Instructor.toLowerCase().includes(filters.professor.toLowerCase())
        );
        
        if (!hasMatchingProfessor) {
          return false;
        }
      }
      
      return true;
    });
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data } = await axios.get('http://localhost:8000/api/courses/search', {
        params: {
          query: query
        },
      });
      
      // Apply filters to the results
      const filteredResults = applyFilters(data);
      setResults(filteredResults);
      setSelectedCourse(null);
    } catch (error) {
      console.error('Error fetching search results:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters({
      ...filters,
      [key]: value
    });
  };

  const handleDayFilterChange = (day) => {
    setFilters({
      ...filters,
      days: {
        ...filters.days,
        [day]: {
          ...filters.days[day],
          selected: !filters.days[day].selected
        }
      }
    });
  };

  const toggleDayFilterMode = () => {
    const firstSelectedDay = Object.entries(filters.days).find(([_, value]) => value.selected);
    
    if (firstSelectedDay) {
      const [day, value] = firstSelectedDay;
      const newIncludeValue = !value.include;
      
      const updatedDays = { ...filters.days };
      Object.keys(updatedDays).forEach(d => {
        if (updatedDays[d].selected) {
          updatedDays[d].include = newIncludeValue;
        }
      });
      
      setFilters({
        ...filters,
        days: updatedDays
      });
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
    
    const hasBlockConflict = hasTimeBlockConflict(section);
    
    if (hasConflict || hasBlockConflict) {
      setModal({
        type: 'error',
        message: 'This section conflicts with another course or personal time block in your schedule.',
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
  
  // Handle adding a personal time block
  const handleAddTimeBlock = () => {
    // Validate form
    if (!timeBlockForm.name || !timeBlockForm.days || !timeBlockForm.startTime || !timeBlockForm.endTime) {
      setModal({
        type: 'error',
        message: 'Please fill in all fields for your time block.',
      });
      return;
    }
    
    // Format time in military format
    const formatTimeToMilitary = (timeString) => {
      const [time, period] = timeString.split(' ');
      let [hours, minutes] = time.split(':').map(Number);
      
      if (period === 'PM' && hours !== 12) {
        hours += 12;
      } else if (period === 'AM' && hours === 12) {
        hours = 0;
      }
      
      return `${hours.toString().padStart(2, '0')}${minutes.toString().padStart(2, '0')}`;
    };
    
    const newTimeBlock = {
      id: Date.now().toString(),
      name: timeBlockForm.name,
      days: timeBlockForm.days,
      startTime: formatTimeToMilitary(timeBlockForm.startTime),
      endTime: formatTimeToMilitary(timeBlockForm.endTime),
      color: generateTimeBlockColors(timeBlockForm)
    };
    
    setTimeBlocks([...timeBlocks, newTimeBlock]);
    setTimeBlockForm({
      name: '',
      days: '',
      startTime: '',
      endTime: ''
    });
    setShowTimeBlockForm(false);
  };
  
  const handleRemoveTimeBlock = (id) => {
    setTimeBlocks(timeBlocks.filter(block => block.id !== id));
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
  
  // Get time block style for the schedule grid
  const getTimeBlockStyle = (timeBlock) => {
    const startTime = parseMilitaryTime(timeBlock.startTime);
    const endTime = parseMilitaryTime(timeBlock.endTime);
    
    const startPosition = ((startTime.hours - 7) * 60 + startTime.minutes) / 60;
    const duration = ((endTime.hours - startTime.hours) * 60 + (endTime.minutes - startTime.minutes)) / 60;
    
    return {
      top: `${startPosition * 60}px`,
      height: `${duration * 60}px`,
      backgroundColor: timeBlock.color.backgroundColor,
      color: timeBlock.color.textColor,
      borderLeft: `2px dashed ${timeBlock.color.borderColor}`,
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

  const handleRegister = async () => {
    try {
      // Get user ID from localStorage
      const userId = localStorage.getItem('userId');
      
      if (!userId) {
        setRegistrationStatus({
          type: 'error',
          message: 'You must be logged in to register for classes. Please login first.'
        });
        return;
      }
      
      const response = await axios.post('http://localhost:8000/api/courses/register', {
        sections: selectedSections.map(section => section.CRN),
        userId: userId
      });
      
      setRegistrationStatus({
        type: 'success',
        message: 'Successfully registered for classes!'
      });
      
      // Refresh the course data
      if (query) {
        handleSearch({ preventDefault: () => {} });
      }
    } catch (error) {
      setRegistrationStatus({
        type: 'error',
        message: error.response?.data?.message || 'Registration failed'
      });
    }
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
  
  // Time block form modal
  const TimeBlockForm = () => {
    if (!showTimeBlockForm) return null;
    
    return (
      <div className="modal-overlay">
        <div className="modal-content time-block-form">
          <h3>Add Personal Time Block</h3>
          <div className="form-group">
            <label>Name</label>
            <input 
              type="text" 
              placeholder="e.g., Gym, Study Time"
              value={timeBlockForm.name}
              onChange={(e) => setTimeBlockForm({...timeBlockForm, name: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label>Days</label>
            <div className="day-checkboxes">
              {days.map(day => (
                <label key={day} className="day-checkbox">
                  <input 
                    type="checkbox" 
                    checked={timeBlockForm.days.includes(day)}
                    onChange={() => {
                      if (timeBlockForm.days.includes(day)) {
                        setTimeBlockForm({
                          ...timeBlockForm, 
                          days: timeBlockForm.days.replace(day, '')
                        });
                      } else {
                        setTimeBlockForm({
                          ...timeBlockForm,
                          days: timeBlockForm.days + day
                        });
                      }
                    }}
                  />
                  {day}
                </label>
              ))}
            </div>
          </div>
          <div className="form-group time-inputs">
            <div>
              <label>Start Time</label>
              <input 
                type="text" 
                placeholder="e.g., 8:00 AM"
                value={timeBlockForm.startTime}
                onChange={(e) => setTimeBlockForm({...timeBlockForm, startTime: e.target.value})}
              />
            </div>
            <div>
              <label>End Time</label>
              <input 
                type="text" 
                placeholder="e.g., 9:30 AM"
                value={timeBlockForm.endTime}
                onChange={(e) => setTimeBlockForm({...timeBlockForm, endTime: e.target.value})}
              />
            </div>
          </div>
          <div className="modal-buttons">
            <button onClick={handleAddTimeBlock}>Add Block</button>
            <button onClick={() => setShowTimeBlockForm(false)}>Cancel</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    
    <div className="search-container">
      <Navbar />
      <h1>Search Courses</h1>
      
      <div className="search-filters">
        <div className="search-form-container">
          <form onSubmit={handleSearch} ref={searchFormRef}>
            <input
              type="text"
              placeholder="Search by course title or number"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button type="submit" disabled={isLoading}>
              {isLoading ? 'Searching...' : 'Search'}
            </button>
          </form>
        </div>
        
        <div className="advanced-filters">
          <h3>Filters</h3>
          <div className="filter-group">
            <label>Subject</label>
            <input
              type="text"
              placeholder="e.g., CSE, MTH"
              value={filters.subject}
              onChange={(e) => handleFilterChange('subject', e.target.value)}
            />
          </div>
          
          <div className="filter-group">
            <label>Course Level</label>
            <select 
              value={filters.courseLevel}
              onChange={(e) => handleFilterChange('courseLevel', e.target.value)}
            >
              <option value="any">Any Level</option>
              <option value="3000+">3000+</option>
              <option value="5000+">5000+</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Credit Hours</label>
            <input
              type="number"
              placeholder="e.g., 3"
              value={filters.credits}
              onChange={(e) => handleFilterChange('credits', e.target.value)}
              min="1"
              max="6"
            />
          </div>
          
          <div className="filter-group">
            <label>Professor</label>
            <input
              type="text"
              placeholder="Professor name"
              value={filters.professor}
              onChange={(e) => handleFilterChange('professor', e.target.value)}
            />
          </div>
          
          <div className="filter-group">
            <label className="days-label">Days</label>
            <div className="days-selector">
              {days.map(day => (
                <label key={day} className="day-checkbox">
                  <input
                    type="checkbox"
                    checked={filters.days[day].selected}
                    onChange={() => handleDayFilterChange(day)}
                  />
                  {day}
                </label>
              ))}
            </div>
            <div className="day-filter-mode">
              <label>
                <input
                  type="radio"
                  checked={Object.values(filters.days).some(day => day.selected && day.include)}
                  onChange={toggleDayFilterMode}
                  disabled={!Object.values(filters.days).some(day => day.selected)}
                />
                Include selected days
              </label>
              <label>
                <input
                  type="radio"
                  checked={Object.values(filters.days).some(day => day.selected && !day.include)}
                  onChange={toggleDayFilterMode}
                  disabled={!Object.values(filters.days).some(day => day.selected)}
                />
                Exclude selected days
              </label>
            </div>
          </div>
          
          <div className="filter-actions">
            <button 
              className="add-time-block"
              onClick={() => setShowTimeBlockForm(true)}
            >
              Add Personal Time Block
            </button>
            
            <div className="rmp-toggle">
              <label>
                <input
                  type="checkbox"
                  checked={showRMP}
                  onChange={() => setShowRMP(!showRMP)}
                />
                Show RateMyProfessor Scores
              </label>
            </div>
          </div>
        </div>
      </div>

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
                  
                  const hasConflict = selectedSections.some(
                    selectedSection => hasTimeConflict(section, selectedSection)
                  ) || hasTimeBlockConflict(section);

                  return (
                    <div
                      key={section.CRN}
                      className={`section-card ${selectedSections.some(s => s.CRN === section.CRN) ? 'selected' : ''} ${hasConflict ? 'conflict' : ''}`}
                      onClick={() => handleAddSection(section)}
                    >
                      <h4>Section {section.Section}</h4>
                      <p>Days: {section.Days.replace('\n', ' ')}</p>
                      <p>Time: {displayTime}</p>
                      <p>Place: {displayPlace}</p>
                      
                      <p>Instructor: {section.Instructor}</p>
                      <p>Capacity: {section.CurrentEnrollment || 0} / {section.Capacity.split('/')[1] || section.Capacity}</p>

                      <div className="instructor-info">
                        <p>Instructor: {section.Instructor}
                          {showRMP && professorRatings[section.Instructor] && (
                            <span className="rmp-score">
                              RMP: {professorRatings[section.Instructor]}
                            </span>
                          )}
                        </p>
                      </div>

                      <p>CRN: {section.CRN}</p>
                      {hasConflict && <p className="conflict-warning">Time conflict detected</p>}
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

      {(selectedSections.length > 0 || timeBlocks.length > 0) && (
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
            
            {timeBlocks.map((block) => (
              <div key={block.id} className="selected-section-card time-block-card">
                <div className="selected-section-info">
                  <h4>{block.name}</h4>
                  <p>Days: {block.days.split('').join(', ')}</p>
                  <p>Time: {formatTimeToStandard(`${block.startTime}-${block.endTime}`)}</p>
                </div>
                <button
                  className="remove-section"
                  onClick={() => handleRemoveTimeBlock(block.id)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <div className="registration-actions">
            <button 
              className="register-button"
              onClick={handleRegister}
            >
              Register for Selected Classes
            </button>
            {registrationStatus && (
              <div className={`registration-status ${registrationStatus.type}`}>
                {registrationStatus.message}
              </div>
            )}
          </div>
        </div>
      )}

      {(selectedSections.length > 0 || timeBlocks.length > 0) && (
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
                  
                  {/* Render personal time blocks */}
                  {timeBlocks.map((block) => {
                    if (block.days.includes(day)) {
                      const blockStyle = getTimeBlockStyle(block);
                      
                      return blockStyle && (
                        <div
                          key={`timeblock-${block.id}-${day}`}
                          className="course-block time-block"
                          style={blockStyle}
                        >
                          <div className="course-block-content">
                            <div className="course-block-title">
                              <strong>{block.name}</strong>
                            </div>
                            <div className="course-block-details">
                              <span>{formatTimeToStandard(`${block.startTime}-${block.endTime}`)}</span>
                              <span className="time-block-indicator">Personal Time</span>
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
      <TimeBlockForm />
    </div>
  );
};

export default Search;
