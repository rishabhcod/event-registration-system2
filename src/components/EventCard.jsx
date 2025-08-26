// src/components/EventCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';

export default function EventCard({ event }) {
  if (!event) return null;
  return (
    <div className="event-card">
      <h3>{event.title}</h3>
      <p>{event.description}</p>
      <p style={{ fontSize: 14 }}>
        <strong>Date:</strong> {new Date(event.date).toLocaleString()}
      </p>
      <p style={{ fontSize: 14 }}>
        <strong>Location:</strong> {event.location}
      </p>
      <Link to={`/register/${event.id}`}>
        <button>Register</button>
      </Link>
    </div>
  );
}

