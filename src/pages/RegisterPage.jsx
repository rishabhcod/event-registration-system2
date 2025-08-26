// src/pages/RegisterPage.jsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { events } from '../data/events';

function saveRegistration(reg) {
  const list = JSON.parse(localStorage.getItem('registrations') || '[]');
  list.push(reg);
  localStorage.setItem('registrations', JSON.stringify(list));
}

export default function RegisterPage() {
  const { id } = useParams();
  const event = events.find(e => e.id === id);
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [error, setError] = useState('');

  if (!event) {
    return <main>Event not found.</main>;
  }

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function validateEmail(email) {
    return /^\S+@\S+\.\S+$/.test(email);
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!form.name.trim() || !form.email.trim()) {
      setError('Please enter name and email.');
      return;
    }
    if (!validateEmail(form.email)) {
      setError('Please enter a valid email.');
      return;
    }

    const regId = `${event.id}-${Date.now()}`;
    const registration = {
      id: regId,
      eventId: event.id,
      ...form,
      createdAt: new Date().toISOString()
    };

    saveRegistration(registration);

    // Go to thanks page with regId in query string
    navigate(`/thanks?regId=${encodeURIComponent(regId)}`);
  }

  return (
    <main style={{ maxWidth: 600 }}>
      <h2>Register for: {event.title}</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Name
          <input name="name" value={form.name} onChange={handleChange} />
        </label>
        <label>
          Email
          <input name="email" value={form.email} onChange={handleChange} />
        </label>
        <label>
          Phone
          <input name="phone" value={form.phone} onChange={handleChange} />
        </label>
        {error && <div className="error">{error}</div>}
        <button type="submit">Submit Registration</button>
      </form>
    </main>
  );
}
