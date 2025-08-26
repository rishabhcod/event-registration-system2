// src/pages/ThanksPage.jsx
import React from 'react';
import { useLocation } from 'react-router-dom';

export default function ThanksPage() {
  const loc = useLocation();
  const params = new URLSearchParams(loc.search);
  const regId = params.get('regId');

  return (
    <main>
      <h2>Thank you for registering!</h2>
      {regId ? (
        <div>
          <p>Your registration ID:</p>
          <pre className="reg-id">{regId}</pre>
        </div>
      ) : (
        <p>No registration ID found.</p>
      )}
      <p>Check your browser's localStorage to see stored registrations.</p>
    </main>
  );
}
