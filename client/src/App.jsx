import './App.css';

import { Routes, Route } from 'react-router-dom';
import axios from 'axios';
import { Toaster } from 'react-hot-toast';

import { UserContextProvider } from './context/userContext';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';


import Navbar from './components/Navbar/Navbar'
import Home from './pages/Home/Home'
import Register from './pages/Register/Register';
import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import Search from './pages/Search/Search';

axios.defaults.baseURL = 'http://localhost:8000'
axios.defaults.withCredentials = true

function App () {
  return (
    
    <UserContextProvider>
      {/* <Navbar /> */}
      <Toaster position='bottom-right' toastOptions={{duration:2000}} />
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/register' element={<Register />} />
        <Route path='/login' element={<Login />} />
        <Route 
          path='/dashboard' 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route path="/search" element={<Search />} />
      </Routes>
    </UserContextProvider>
  )
}

export default App;
