import { Link } from 'react-router-dom'
import './Navbar.css'
import logo from "../../assets/main-logo.png"



function Navbar() {
  return (
    <>
    
    <nav>
      <img className='logo' src={logo} alt='fit logo'/>
      <Link to='/'>Home</Link>
      <Link to='/register'>Register</Link>
      <Link to='/login'>Login</Link>
    </nav>
    </>
  )
}

export default Navbar
