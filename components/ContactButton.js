'use client';

import { useState } from 'react';

/**
 * Floating contact button that links to the grades-dashboard
 * where students can send messages to the teacher
 */
export default function ContactButton() {
    const [isHovered, setIsHovered] = useState(false);

    const gradesUrl = 'https://grades-dashboard.vercel.app';

    return (
        <div
            className="fixed bottom-6 right-6 z-50"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Tooltip */}
            <div
                style={{
                    position: 'absolute',
                    bottom: '100%',
                    right: 0,
                    marginBottom: '8px',
                    padding: '12px 16px',
                    background: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                    width: '220px',
                    opacity: isHovered ? 1 : 0,
                    transform: isHovered ? 'translateY(0)' : 'translateY(8px)',
                    transition: 'all 0.2s ease-out',
                    pointerEvents: isHovered ? 'auto' : 'none',
                }}
            >
                <p style={{
                    margin: 0,
                    fontSize: '13px',
                    color: '#374151',
                    lineHeight: 1.5,
                }}>
                    Have a question? Contact me through the Grades Dashboard.
                </p>
                {/* Arrow */}
                <div style={{
                    position: 'absolute',
                    bottom: '-6px',
                    right: '20px',
                    width: '12px',
                    height: '12px',
                    background: 'white',
                    transform: 'rotate(45deg)',
                    boxShadow: '2px 2px 4px rgba(0, 0, 0, 0.05)',
                }} />
            </div>

            {/* Button */}
            <a
                href={gradesUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #14b8a6 0%, #10b981 100%)',
                    color: 'white',
                    boxShadow: isHovered
                        ? '0 8px 25px rgba(20, 184, 166, 0.4)'
                        : '0 4px 15px rgba(20, 184, 166, 0.3)',
                    transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                    transition: 'all 0.2s ease-out',
                    textDecoration: 'none',
                }}
                aria-label="Contact teacher through Grades Dashboard"
            >
                {/* Chat bubble icon */}
                <svg
                    width="24"
                    height="24"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
            </a>
        </div>
    );
}
