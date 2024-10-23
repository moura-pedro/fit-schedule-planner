import { useState } from 'react'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
// import './Register.css'

function Register() {

  const navigate = useNavigate()
  const [data, setData] = useState({
    name: '',
    email: '',
    password: '',
  })

  const registerUser = async (e) => {
    e.preventDefault()
    const {name, email, password} = data;

    try {
      const {data} = await axios.post('/register', {
        name, email, password
      })

      if (data.error) {
        toast.error(data.error)
      } else {
        setData({})
        toast.success("Login Successfull. Welcome")
        navigate('/login')
      }

    } catch (error) {
      console.log(error)
    }

  }

  return (
    <div className="register-container">
      <form onSubmit={registerUser}>
        <label htmlFor="">Name</label>
        <input type='text' placeholder='enter name...' value={data.name} onChange={
          (e) => setData({...data, name: e.target.value})
        }/>

        <label htmlFor="">Email</label>
        <input type='email' placeholder='enter email...' value={data.email} onChange={
          (e) => setData({...data, email: e.target.value})
        }/>

        <label htmlFor="">Password</label>
        <input type='password' placeholder='enter password...' value={data.password} onChange={
          (e) => setData({...data, password: e.target.value})
        }/>

        <button type='submit'>Submit</button>
      </form>
    </div>
  )
}

export default Register
