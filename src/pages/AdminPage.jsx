// src/pages/AdminPage.jsx
import React, { useEffect, useState } from 'react';
import { events } from '../data/events';

/**
 * Admin page that reads registrations from localStorage,
 * shows them with event titles, allows delete, clear all,
 * and export to CSV.
 */

function loadRegistrations() {
  try {
    return JSON.parse(localStorage.getItem('registrations') || '[]');
  } catch (err) {
    console.error('Failed to parse registrations from localStorage', err);
    return [];
  }
}

function saveRegistrations(list) {
  localStorage.setItem('registrations', JSON.stringify(list));
}

function toCSV(rows) {
  // rows: array of objects with same keys
  if (!rows || rows.length === 0) return '';
  const keys = Object.keys(rows[0]);
  const header = keys.join(',');
  const lines = rows.map(r =>
    keys.map(k => {
      // escape quotes and commas
      const v = r[k] == null ? '' : String(r[k]);
      const escaped = v.replace(/"/g, '""');
      return `"${escaped}"`;
    }).join(',')
  );
  return [header, ...lines].join('\n');
}

export default function AdminPage() {
  const [regs, setRegs] = useState([]);

  useEffect(() => {
    setRegs(loadRegistrations());
  }, []);

  function deleteOne(id) {
    const next = regs.filter(r => r.id !== id);
    setRegs(next);
    saveRegistrations(next);
  }

  function clearAll() {
    if (!confirm('Clear all registrations?')) return;
    setRegs([]);
    saveRegistrations([]);
  }

  function exportCSV() {
    // map rows and include event title
    const rows = regs.map(r => ({
      id: r.id,
      eventId: r.eventId,
      eventTitle: (events.find(e => e.id === r.eventId) || {}).title || '',
      name: r.name || '',
      email: r.email || '',
      phone: r.phone || '',
      createdAt: r.createdAt || ''
    }));
    const csv = toCSV(rows);
    if (!csv) {
      alert('No registrations to export.');
      return;
    }
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `registrations-${new Date().toISOString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main>
      <h2>Admin — Registrations</h2>

      <div style={{ display: 'flex', gap: 8, margin: '12px 0' }}>
        <button onClick={exportCSV}>Export CSV</button>
        <button onClick={clearAll}>Clear All</button>
      </div>

      {regs.length === 0 ? (
        <div>No registrations yet. Try submitting a registration from the Home page.</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Reg ID</th>
                <th>Event</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {regs.map(r => {
                const eventTitle = (events.find(e => e.id === r.eventId) || {}).title || r.eventId;
                return (
                  <tr key={r.id}>
                    <td>{r.id}</td>
                    <td>{eventTitle}</td>
                    <td>{r.name}</td>
                    <td>{r.email}</td>
                    <td>{r.phone}</td>
                    <td>{new Date(r.createdAt).toLocaleString()}</td>
                    <td>
                      <button onClick={() => {
                        if (confirm(`Delete registration ${r.id}?`)) deleteOne(r.id);
                      }}>Delete</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
