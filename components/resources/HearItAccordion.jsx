'use client';

import { useState } from 'react';

export default function HearItAccordion({ title, tracks }) {
  const [expandedTrack, setExpandedTrack] = useState(null);

  if (!tracks || tracks.length === 0) return null;

  return (
    <>
    <style>{`details > summary::-webkit-details-marker { display: none; }`}</style>
    <details style={{
      border: '1px solid #e5e7eb',
      borderRadius: '10px',
      marginTop: '24px',
      overflow: 'hidden',
    }}>
      <summary style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '14px 18px',
        cursor: 'pointer',
        background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.04), rgba(124, 58, 237, 0.04))',
        fontWeight: 600,
        fontSize: '1rem',
        color: '#1a1a2e',
        listStyle: 'none',
        userSelect: 'none',
      }}>
        <span style={{ flex: 1 }}>{title}</span>
        <span style={{
          background: '#2563eb',
          color: '#fff',
          fontSize: '0.75rem',
          fontWeight: 600,
          padding: '2px 10px',
          borderRadius: '999px',
        }}>
          {tracks.length} {tracks.length === 1 ? 'example' : 'examples'}
        </span>
        <span aria-hidden="true" style={{ fontSize: '0.75rem', color: '#6b7280' }}>&#9660;</span>
      </summary>

      <div style={{ padding: '4px 18px 18px', borderTop: '1px solid #e5e7eb' }}>
        {tracks.map((track, i) => (
          <div key={i} style={{
            padding: '14px 0',
            borderBottom: i < tracks.length - 1 ? '1px solid #f0f0f0' : 'none',
          }}>
            <h4 style={{
              margin: '0 0 4px',
              fontSize: '0.95rem',
              fontWeight: 600,
              color: '#1a1a2e',
            }}>
              {track.title} — {track.artist}
            </h4>

            <div style={{
              fontSize: '0.8rem',
              color: '#6b7280',
              marginBottom: '8px',
            }}>
              <span aria-hidden="true">&#9654;</span> Listen from {track.timestamp}
            </div>

            {expandedTrack === i ? (
              <div style={{
                position: 'relative',
                paddingBottom: '56.25%',
                height: 0,
                marginBottom: '10px',
                borderRadius: '8px',
                overflow: 'hidden',
              }}>
                <iframe
                  src={`https://www.youtube.com/embed/${track.videoId}?rel=0&start=${track.timestampSeconds}`}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    borderRadius: '8px',
                  }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={`${track.title} by ${track.artist}`}
                />
              </div>
            ) : (
              <button type="button"
                onClick={() => setExpandedTrack(i)}
                style={{
                  background: 'rgba(37, 99, 235, 0.08)',
                  color: '#2563eb',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 14px',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  marginBottom: '6px',
                }}
              >
                &#9654; Play video
              </button>
            )}

            <p style={{
              margin: '4px 0 0',
              fontSize: '0.85rem',
              color: '#374151',
              lineHeight: 1.5,
            }}>
              {track.description}
            </p>
          </div>
        ))}
      </div>
    </details>
    </>
  );
}
