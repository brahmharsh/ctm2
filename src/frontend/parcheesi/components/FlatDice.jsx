'use client';
import React from 'react';

export default function FlatDice({
  values = [1, 1],
  used = [],
  pending = [],
  debug,
}) {
  if (!debug) return null;
  const faceStyle = (i) => ({
    width: 48,
    height: 48,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: 20,
    background: used[i] ? '#ddd' : '#fff',
    border: '2px solid #333',
    boxShadow: 'inset 0 0 4px rgba(0,0,0,0.25)',
    position: 'relative',
  });
  return (
    <div style={{ display: 'flex', gap: 12 }}>
      {values.map((v, i) => (
        <div key={i} style={faceStyle(i)}>
          {v}
          {used[i] && (
            <span
              style={{
                position: 'absolute',
                bottom: -16,
                fontSize: 10,
                color: '#555',
              }}
            >
              used
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
