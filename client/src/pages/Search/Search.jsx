import React, { useState } from 'react';
import axios from 'axios';
import './Search.css';

const Search = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [resultsPerPage] = useState(5);
  const [selectedDay, setSelectedDay] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    try {
      console.log('Searching for:', query, 'on day:', selectedDay); // Log the query and day
      const { data } = await axios.get('http://localhost:8000/api/courses/search', {
        params: {
          query: query,
          filter_day: selectedDay,
        },
      });
      console.log('Search results:', data); // Log the response data
      setResults(data);
      setCurrentPage(1); // Reset to first page on new search
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

  const indexOfLastCourse = currentPage * resultsPerPage;
  const indexOfFirstCourse = indexOfLastCourse - resultsPerPage;
  const currentResults = sortedResults.slice(indexOfFirstCourse, indexOfLastCourse);

  const nextPage = () => {
    if (currentPage < Math.ceil(results.length / resultsPerPage)) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="search-container">
      <h1>Search Courses</h1>
      <form onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Search by course title or prerequisites"
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

      {currentResults.length > 0 ? (
        <div>
          {currentResults.map((course) => (
            <div key={course._id} className="course-card">
              <h3 className="course-title">{course.Course}: {course.Title}</h3>
              <div className="course-details">
                <p>Course Code: {course.Course}</p>
                <p>Credits: {course.Credits}</p>
                <p>Prerequisites: {course.Prerequisites || 'None'}</p>
                <h4>Sections:</h4>
                <ul>
                  {course.sections.map((section) => (
                    <li key={section.CRN}>
                      {section.Section}: {section.Days} at {section.Times} 
                       , {section.Instructor} ({section.Enrolled}/{section["Max Capacity"]}) | CRN: {section.CRN}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}

          <div className="pagination">
            <button onClick={prevPage} disabled={currentPage === 1}>Previous</button>
            <button onClick={nextPage} disabled={currentPage === Math.ceil(results.length / resultsPerPage)}>Next</button>
            <p>Page {currentPage} of {Math.ceil(results.length / resultsPerPage)}</p>
          </div>
        </div>
      ) : (
        <p>No results found.</p>
      )}
    </div>
  );
};

export default Search;
