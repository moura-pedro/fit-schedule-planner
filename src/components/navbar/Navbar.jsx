import React from 'react'
import './Navbar.css'
import logo from "../../assets/fit-logo.png"

const Navbar = () => {
  return (
    <nav>
      <img src={logo} alt="" className='logo' />
      <ul>
        <li>Home</li>
        <li>Generate Schedule</li>
        <li>Search for Classes</li>
        <li>Your Progress</li>
      </ul>
    </nav>
  )
}

export default Navbar
