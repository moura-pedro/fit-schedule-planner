import { Link } from 'react-router-dom'
import './Navbar.css'
import logo from "../../assets/main-logo.png"



function Navbar() {
  return (
    <>
    
    <nav>
      <img className='logo' src={logo} alt='fit logo'/>

      <ul>
        <li><Link to='/'>Home</Link></li>
        <li><Link to='/register'>Register</Link></li>
        <li><Link to='/login'>Login</Link></li>
      </ul>
    </nav>
    </>
  )
}

export default Navbar
