// src/pages/HomePage.jsx
import React from 'react';
import EventCard from '../components/EventCard';
import { events } from '../data/events';

export default function HomePage() {
  return (
    <main>
      <h2>Upcoming Events</h2>
      <div>
        {events.map(e => (
          <EventCard key={e.id} event={e} />
        ))}
      </div>
    </main>
  );
}
