// client/src/pages/Login/Login.jsx
import { useState, useContext } from 'react'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { UserContext } from '../../context/userContext'
import './Login.css'

function Login() {
    const navigate = useNavigate()
    const { setUser } = useContext(UserContext)
    const [data, setData] = useState({
        email: '',
        password: '',
    })

    const loginUser = async (e) => {
        e.preventDefault()
        const { email, password } = data
        try {
            const { data: responseData } = await axios.post('/login', {
                email,
                password
            });

            if (responseData.error) {
                toast.error(responseData.error)
            } else {
                setUser(responseData)
                setData({})
                toast.success('Login successful!')
                navigate('/dashboard')
            }
        } catch (error) {
            console.error('Login error:', error)
            toast.error('An error occurred during login')
        }
    }

    return (
        <div className="login-container">
            <form onSubmit={loginUser}>
                <label>Email</label>
                <input
                    type='email'
                    placeholder='enter email...'
                    value={data.email}
                    onChange={(e) => setData({ ...data, email: e.target.value })}
                />

                <label>Password</label>
                <input
                    type='password'
                    placeholder='enter password...'
                    value={data.password}
                    onChange={(e) => setData({ ...data, password: e.target.value })}
                />
                <button type='submit'>Login</button>
            </form>
        </div>
    )
}

export default Login