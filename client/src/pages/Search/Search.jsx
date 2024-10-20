// /client/src/pages/SearchPage.jsx
import React, { useState } from 'react';
import axios from 'axios';
import './Search.css';

const Search = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [resultsPerPage] = useState(5);

  const handleSearch = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.get(`http://localhost:8000/api/courses/search?query=${query}`);
      setResults(data);
      setCurrentPage(1); // Reset to first page on new search
    } catch (error) {
      console.error('Error fetching search results:', error);
    }
  };

  const indexOfLastCourse = currentPage * resultsPerPage;
  const indexOfFirstCourse = indexOfLastCourse - resultsPerPage;
  const currentResults = results.slice(indexOfFirstCourse, indexOfLastCourse);

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
        <button type="submit">Search</button>
      </form>

      {currentResults.length > 0 ? (
        <div>
          {currentResults.map((course) => (
            <div key={course._id} className="course-card">
              <h3 className="course-title">{course.Course}: {course.Title}</h3>
              <div className="course-details">
                <p>Credits: {course.Credits}</p>
                <p>Prerequisites: {course.Prerequisites || 'None'}</p>
                <h4>Sections:</h4>
                <ul>
                  {course.sections.map((section) => (
                    <li key={section.CRN}>
                      {section.Section}: {section.Days} at {section.Times}, {section.Instructor} ({section.Enrolled}/{section["Max Capacity"]})
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
