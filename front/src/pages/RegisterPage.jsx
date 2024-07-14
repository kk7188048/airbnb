import React from 'react'
import axios from 'axios'
import { useState } from 'react';
import { Link } from 'react-router-dom';

const RegisterPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');

  const handleRegister = async(event) => {
    event.preventDefault();
    if (!email || !password || !username) {
      alert('Please fill in all fields');
      return;
    }
    try {
      await axios.post('/register', {
        email,
        password,
        username
      }, console.log("Registered successfully"));
      alert('Registered successfully');
    } catch (error) {
      console.error('Error registering user:', error);
      alert('Failed to register. Please try again.');
    }
  }


  const handleUsernameChange = (event) => {
    if (event && event.target && event.target.value) {
      setUsername(event.target.value);
    }
  };

  const handleEmailChange = (event) => {
    if (event && event.target && event.target.value) {
      setEmail(event.target.value);
    }
  };

  const handlePasswordChange = (event) => {
    if (event && event.target && event.target.value) {
      setPassword(event.target.value);
    }
  };

  return (
    <div className="mt-4 grow flex items-center justify-around">
      <div className="mb-64">
        <h1 className="text-4xl text-center mb-4">Register</h1>
        <form className="max-w-md mx-auto" onSubmit={handleRegister}>
          <input
            type="text"
            placeholder="Krishna Kumar"
            value={username}
            onChange={handleUsernameChange}
            required
          />
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={handleEmailChange}
            required
          />
          <input
            type="password"
            placeholder="password"
            value={password}
            onChange={handlePasswordChange}
            required
          />
          <button className="primary" disabled={!username || !email || !password}>
            Register
          </button>
          <div className="text-center py-2 text-gray-500">
            Alredy a member?
            <Link className="underline text-black" to={"/login"}>
              Login now
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage
