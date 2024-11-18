// client/src/pages/PrerequisiteTree/PrerequisiteTree.jsx
import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../../components/Navbar/Navbar';
import { ZoomIn, ZoomOut } from 'lucide-react';
import './PrerequisiteTree.css';

export default function PrerequisiteTree() {
  const [query, setQuery] = useState('');
  const [courseTree, setCourseTree] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const containerRef = useRef(null);
  const visualizationRef = useRef(null);

  const MIN_SCALE = 0.1;
  const MAX_SCALE = 2;
  const SCALE_STEP = 0.1;

  useEffect(() => {
    if (courseTree && visualizationRef.current) {
      // Center the tree initially
      const container = containerRef.current;
      const visualization = visualizationRef.current;
      
      setPosition({
        x: (container.clientWidth - visualization.clientWidth) / 2,
        y: 0
      });
    }
  }, [courseTree]);

  const handleWheel = (e) => {
    e.preventDefault();
    if (!courseTree) return;

    const delta = -Math.sign(e.deltaY);
    const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale + delta * SCALE_STEP));
    
    // Calculate cursor position relative to visualization
    const rect = visualizationRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Calculate new position to zoom towards cursor
    const scaleChange = newScale - scale;
    const newX = position.x - (x * scaleChange);
    const newY = position.y - (y * scaleChange);

    setScale(newScale);
    setPosition({ x: newX, y: newY });
  };

  const handleMouseDown = (e) => {
    if (e.button !== 0) return; // Only left click
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => {
    setScale(Math.min(MAX_SCALE, scale + SCALE_STEP));
  };

  const handleZoomOut = () => {
    setScale(Math.max(MIN_SCALE, scale - SCALE_STEP));
  };

  const searchCourse = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.get(`/api/courses/search?query=${query}`);
      if (data.length > 0) {
        const prereqResponse = await axios.get(`/api/courses/prerequisites?courseCode=${data[0].Course}`);
        setCourseTree(prereqResponse.data);
        setScale(1); // Reset zoom when new course is loaded
      } else {
        setError('No course found. Please try another search.');
      }
    } catch (error) {
      console.error('Error searching courses:', error);
      setError('Failed to search courses. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const TreeNode = ({ course, isRoot = false }) => {
    if (!course) return null;
  
    const hasPrereqs = course.prerequisiteDetails && 
                      course.prerequisiteDetails.length > 0 && 
                      course.prerequisiteDetails.some(prereq => prereq); // Check for valid prerequisites
  
    return (
      <div className="tree-node-wrapper">
        <div className={`tree-node ${isRoot ? 'root-node' : ''}`}>
          <div className="node-circle">
            <div className="node-content">
              <div className="course-code">{course.Course}</div>
              <div className="course-title">{course.Title}</div>
            </div>
          </div>
        </div>
        
        {hasPrereqs && (
          <div className="node-children">
            {course.prerequisiteDetails
              .filter(prereq => prereq) // Filter out null/undefined prerequisites
              .map((prereq, index) => (
                <TreeNode 
                  key={`${prereq.Course}-${index}`} 
                  course={prereq}
                />
              ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="prerequisite-tree-container">
      <Navbar />
      <div className="prerequisite-tree-content">
        <div className="search-section">
          <h1>Course Prerequisite Tree</h1>
          <div className="search-box">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter course code or title..."
              onKeyPress={(e) => e.key === 'Enter' && searchCourse()}
            />
            <button
              onClick={searchCourse}
              disabled={loading}
              className="search-button"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
          {error && <div className="error-message">{error}</div>}
        </div>

        {courseTree && (
          <div className="tree-section">
            <h2>Prerequisites for {courseTree.Course}</h2>
            <div className="zoom-controls">
              <button onClick={handleZoomIn} className="zoom-button">
                <ZoomIn size={20} />
              </button>
              <span className="zoom-level">{Math.round(scale * 100)}%</span>
              <button onClick={handleZoomOut} className="zoom-button">
                <ZoomOut size={20} />
              </button>
            </div>
            <div 
              className="tree-container" 
              ref={containerRef}
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <div 
                className="tree-visualization"
                ref={visualizationRef}
                style={{
                  transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                  cursor: isDragging ? 'grabbing' : 'grab'
                }}
              >
                <TreeNode course={courseTree} isRoot={true} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}