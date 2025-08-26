// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import RegisterPage from './pages/RegisterPage';
import ThanksPage from './pages/ThanksPage';
import AdminPage from './pages/AdminPage';

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/register/:id" element={<RegisterPage />} />
        <Route path="/thanks" element={<ThanksPage />} />
        <Route path="/admin" element={<AdminPage />} />
        {/* future: nested admin routes, auth, etc. */}
      </Routes>
    </BrowserRouter>
  );
}
