import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import './Navbar.css'
import logo from "../../assets/main-logo.png"
import { toast } from 'react-hot-toast'

function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userName, setUserName] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    // Check if user is logged in on component mount
    const userId = localStorage.getItem('userId')
    const name = localStorage.getItem('userName')
    
    if (userId && name) {
      setIsLoggedIn(true)
      setUserName(name)
    }
  }, [])

  const handleLogout = () => {
    // Clear all localStorage items
    localStorage.removeItem('userId')
    localStorage.removeItem('userName')
    localStorage.removeItem('token')
    
    // Update state
    setIsLoggedIn(false)
    setUserName('')
    
    // Show toast and redirect
    toast.success('Logged out successfully')
    navigate('/login')
  }

  return (
    <nav>
      <div className="navbar-logo">
        <Link to="/">
          <img src={logo} alt="My College Logo" />
        </Link>
      </div>
      <div className="navbar-links">
        <Link to="/">Home</Link>
        <Link to="/search">Course Search</Link>
        <Link to="/prerequisite-tree">Prerequisites</Link>
        {isLoggedIn ? (
          <>
            <Link to="/dashboard">Dashboard</Link>
            <button onClick={handleLogout} className="logout-button">
              Logout ({userName})
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  )
}

export default Navbar
