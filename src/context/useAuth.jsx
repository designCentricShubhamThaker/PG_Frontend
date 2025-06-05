import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const loginUser = async (username, password) => {
  try {
    // const response = await axios.post('https://pg-backend-udfn.onrender.com/api/auth/login', { username, password });
    const response = await axios.post('http://localhost:5000/api/auth/login', { username, password });
    return response.data;
  } catch (error) {
    console.error('API login error:', error);
    throw new Error(error.response?.data?.message || 'Login failed. Please check your credentials.');
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuthStatus = () => {
      const storedUser = localStorage.getItem('user');
      const storedToken = localStorage.getItem('token');
      
      if (storedUser && storedToken) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser({ ...parsedUser, token: storedToken });
        } catch (err) {
          console.error('Error parsing stored user data:', err);
          localStorage.removeItem('user');
          localStorage.removeItem('token');
        }
      }
      
      setIsLoading(false);
    };

    checkAuthStatus();
  }, []);

useEffect(() => {
  if (user && !isLoading) {
    if (user.role === 'superadmin') {
      navigate('/superadmin');
    } else if (user.role === 'admin') {
      navigate('/admin');
    } else if (user.role === 'user') {
      if (user.subteam) {
        navigate(`/dashboard/${user.team}/${user.subteam}`);
      } else {
        navigate(`/dashboard/${user.team}`);
      }
    }
  }
}, [user, isLoading, navigate]);


  const login = async (username, password) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const userData = await loginUser(username, password);
      
      if (!userData || !userData.role) {
        throw new Error('Invalid user data received from server');
      }
      
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', userData.token || '');

      setUser(userData);
      return userData;
    } catch (err) {
      const errorMessage = err.message || 'An unknown error occurred';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    navigate('/login');
  };

  const value = {
    user,
    login,
    logout,
    isLoading,
    error
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;