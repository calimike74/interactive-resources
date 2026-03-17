'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { theme, glass, typography, spacing, borderRadius, transitions } from '../../lib/theme';
import { synthSchoolEP } from '../../lib/revision/synth-school-tracks';

const t = theme.light;

export default function FloatingPlayer() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [activeLyricIndex, setActiveLyricIndex] = useState(-1);
  const audioRef = useRef(null);
  const lyricsContainerRef = useRef(null);

  const ep = synthSchoolEP;
  const track = ep.tracks[currentTrackIndex];

  // Update current time and active lyric
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      // Find active lyric
      const lyrics = track.lyrics;
      let active = -1;
      for (let i = lyrics.length - 1; i >= 0; i--) {
        if (audio.currentTime >= lyrics[i].time) {
          active = i;
          break;
        }
      }
      setActiveLyricIndex(active);
    };

    const onLoadedMetadata = () => setDuration(audio.duration);
    const onEnded = () => {
      if (currentTrackIndex < ep.tracks.length - 1) {
        setCurrentTrackIndex(i => i + 1);
      } else {
        setIsPlaying(false);
      }
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
    };
  }, [track, currentTrackIndex, ep.tracks.length]);

  // Auto-scroll lyrics
  useEffect(() => {
    if (!lyricsContainerRef.current || activeLyricIndex < 0) return;
    const activeLine = lyricsContainerRef.current.children[activeLyricIndex];
    if (activeLine) {
      activeLine.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeLyricIndex]);

  // Play/pause when track changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.load();
    if (isPlaying) {
      audio.play().catch(() => {});
    }
  }, [currentTrackIndex]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(() => {});
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const skipTrack = useCallback((direction) => {
    setCurrentTrackIndex(i => {
      const next = i + direction;
      if (next < 0) return 0;
      if (next >= ep.tracks.length) return ep.tracks.length - 1;
      return next;
    });
  }, [ep.tracks.length]);

  const seekTo = useCallback((e) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    audio.currentTime = pct * duration;
  }, [duration]);

  const formatTime = (s) => {
    if (!s || isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const progress = duration ? (currentTime / duration) * 100 : 0;

  // Floating trigger button (when closed)
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: 'calc(80px + env(safe-area-inset-bottom, 0px))',
          right: spacing[4],
          width: 52,
          height: 52,
          borderRadius: borderRadius.full,
          border: `1px solid ${glass.borderOuter}`,
          background: glass.bg,
          backdropFilter: `blur(${glass.blur})`,
          WebkitBackdropFilter: `blur(${glass.blur})`,
          boxShadow: glass.shadow,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: `all ${transitions.normal} ${transitions.easing}`,
          zIndex: 50,
        }}
        onMouseEnter={e => {
          e.currentTarget.style.boxShadow = glass.shadowHover;
          e.currentTarget.style.transform = 'scale(1.05)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.boxShadow = glass.shadow;
          e.currentTarget.style.transform = 'scale(1)';
        }}
        aria-label="Open revision player"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={t.text.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
      </button>
    );
  }

  // Mini player (collapsed)
  if (!isExpanded) {
    return (
      <>
        <audio ref={audioRef} src={track.src} preload="metadata" />
        <div style={{
          position: 'fixed',
          bottom: 'calc(80px + env(safe-area-inset-bottom, 0px))',
          right: spacing[4],
          left: spacing[4],
          maxWidth: 480,
          marginLeft: 'auto',
          background: glass.bg,
          backdropFilter: `blur(${glass.blur})`,
          WebkitBackdropFilter: `blur(${glass.blur})`,
          border: `1px solid ${glass.borderOuter}`,
          borderRadius: borderRadius['2xl'],
          boxShadow: glass.shadowHover,
          zIndex: 50,
          overflow: 'hidden',
        }}>
          {/* Progress bar */}
          <div style={{ width: '100%', height: 3, background: t.border.subtle, cursor: 'pointer' }} onClick={seekTo}>
            <div style={{
              width: `${progress}%`,
              height: '100%',
              background: `linear-gradient(90deg, ${t.text.primary}, #5a5a6a)`,
              borderRadius: borderRadius.full,
              transition: 'width 0.3s linear',
            }} />
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing[3],
            padding: `${spacing[3]} ${spacing[4]}`,
          }}>
            {/* Album art mini */}
            <div style={{
              width: 40,
              height: 40,
              borderRadius: borderRadius.lg,
              background: 'linear-gradient(225deg, #ECEAE6 0%, #D8D3CC 50%, #CBC5BD 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: t.shadow.sm,
            }}>
              <span style={{
                fontFamily: typography.fontFamily,
                fontSize: typography.size.xs,
                fontWeight: typography.weight.bold,
                color: 'rgba(26, 26, 46, 0.35)',
              }}>
                {String(track.number).padStart(2, '0')}
              </span>
            </div>

            {/* Track info */}
            <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => setIsExpanded(true)}>
              <div style={{
                fontFamily: typography.fontFamily,
                fontSize: typography.size.sm,
                fontWeight: typography.weight.semibold,
                color: t.text.primary,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {track.title}
              </div>
              <div style={{
                fontFamily: typography.fontFamily,
                fontSize: typography.size.xs,
                color: t.text.tertiary,
              }}>
                {formatTime(currentTime)} / {formatTime(duration)} · {track.terms.length} terms
              </div>
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
              <button onClick={togglePlay} style={{
                width: 36,
                height: 36,
                borderRadius: borderRadius.full,
                border: 'none',
                background: t.text.primary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: t.shadow.sm,
              }}>
                {isPlaying ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill={t.text.inverse} stroke="none">
                    <rect x="6" y="4" width="4" height="16" rx="1" />
                    <rect x="14" y="4" width="4" height="16" rx="1" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill={t.text.inverse} stroke="none">
                    <polygon points="6,3 20,12 6,21" />
                  </svg>
                )}
              </button>

              <button onClick={() => skipTrack(1)} style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: spacing[1],
                display: 'flex',
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={t.text.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5,4 15,12 5,20" />
                  <line x1="19" y1="5" x2="19" y2="19" />
                </svg>
              </button>

              <button onClick={() => setIsOpen(false)} style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: spacing[1],
                display: 'flex',
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={t.text.tertiary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Expanded player with lyrics
  return (
    <>
      <audio ref={audioRef} src={track.src} preload="metadata" />
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        padding: spacing[4],
        paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))',
      }} onClick={(e) => { if (e.target === e.currentTarget) setIsExpanded(false); }}>
        <div style={{
          width: '100%',
          maxWidth: 440,
          maxHeight: '85vh',
          background: t.bg.primary,
          borderRadius: borderRadius['2xl'],
          boxShadow: t.shadow.lg,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: `${spacing[4]} ${spacing[5]}`,
            borderBottom: `1px solid ${t.border.subtle}`,
          }}>
            <button onClick={() => setIsExpanded(false)} style={{
              background: 'none', border: 'none', cursor: 'pointer', display: 'flex',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={t.text.tertiary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            <span style={{
              fontFamily: typography.fontFamily,
              fontSize: typography.size.xs,
              fontWeight: typography.weight.medium,
              color: t.text.tertiary,
              textTransform: 'uppercase',
              letterSpacing: typography.letterSpacing.wide,
            }}>
              Now Playing
            </span>
            <div style={{ width: 20 }} />
          </div>

          {/* Album art + track info */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: `${spacing[5]} ${spacing[6]}`,
            gap: spacing[4],
          }}>
            <div style={{
              width: 160,
              height: 160,
              borderRadius: borderRadius['2xl'],
              background: 'linear-gradient(225deg, #ECEAE6 0%, #D8D3CC 50%, #CBC5BD 100%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: spacing[1],
              boxShadow: '0 12px 32px -8px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.06)',
            }}>
              <span style={{
                fontFamily: typography.fontFamily,
                fontSize: '2.5rem',
                fontWeight: typography.weight.bold,
                color: 'rgba(26, 26, 46, 0.1)',
                lineHeight: 1,
              }}>
                {String(track.number).padStart(2, '0')}
              </span>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(26, 26, 46, 0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 10v3" /><path d="M6 6v11" /><path d="M10 3v18" /><path d="M14 8v7" /><path d="M18 5v13" /><path d="M22 10v3" />
              </svg>
              <span style={{
                fontFamily: typography.fontFamily,
                fontSize: '0.55rem',
                fontWeight: typography.weight.bold,
                letterSpacing: '0.15em',
                color: 'rgba(26, 26, 46, 0.3)',
                textTransform: 'uppercase',
              }}>
                Synth School
              </span>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontFamily: typography.fontFamily,
                fontSize: typography.size.xl,
                fontWeight: typography.weight.bold,
                color: t.text.primary,
              }}>
                {track.title}
              </div>
              <div style={{
                fontFamily: typography.fontFamily,
                fontSize: typography.size.sm,
                color: t.text.tertiary,
                marginTop: spacing[0.5],
              }}>
                Track {track.number} of {ep.tracks.length} · {track.terms.length} key terms
              </div>
            </div>
          </div>

          {/* Progress + controls */}
          <div style={{ padding: `0 ${spacing[6]} ${spacing[4]}` }}>
            {/* Progress bar */}
            <div
              style={{
                width: '100%',
                height: 4,
                background: t.border.subtle,
                borderRadius: borderRadius.full,
                cursor: 'pointer',
                marginBottom: spacing[1],
              }}
              onClick={seekTo}
            >
              <div style={{
                width: `${progress}%`,
                height: '100%',
                background: `linear-gradient(90deg, ${t.text.primary}, #5a5a6a)`,
                borderRadius: borderRadius.full,
                transition: 'width 0.3s linear',
              }} />
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontFamily: typography.fontFamily,
              fontSize: '0.6875rem',
              fontWeight: typography.weight.medium,
              color: t.text.tertiary,
            }}>
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>

            {/* Transport controls */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: spacing[8],
              marginTop: spacing[3],
            }}>
              <button onClick={() => skipTrack(-1)} style={{
                background: 'none', border: 'none', cursor: 'pointer', display: 'flex',
                opacity: currentTrackIndex === 0 ? 0.3 : 1,
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={t.text.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="19,20 9,12 19,4" />
                  <line x1="5" y1="19" x2="5" y2="5" />
                </svg>
              </button>

              <button onClick={togglePlay} style={{
                width: 52,
                height: 52,
                borderRadius: borderRadius.full,
                border: 'none',
                background: `linear-gradient(180deg, #3a3a3a 0%, ${t.text.primary} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }}>
                {isPlaying ? (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill={t.text.inverse} stroke="none">
                    <rect x="6" y="4" width="4" height="16" rx="1" />
                    <rect x="14" y="4" width="4" height="16" rx="1" />
                  </svg>
                ) : (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill={t.text.inverse} stroke="none">
                    <polygon points="7,3 21,12 7,21" />
                  </svg>
                )}
              </button>

              <button onClick={() => skipTrack(1)} style={{
                background: 'none', border: 'none', cursor: 'pointer', display: 'flex',
                opacity: currentTrackIndex === ep.tracks.length - 1 ? 0.3 : 1,
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={t.text.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5,4 15,12 5,20" />
                  <line x1="19" y1="5" x2="19" y2="19" />
                </svg>
              </button>
            </div>
          </div>

          {/* Lyrics panel */}
          <div style={{
            flex: 1,
            minHeight: 0,
            borderTop: `1px solid ${t.border.subtle}`,
            display: 'flex',
            flexDirection: 'column',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: `${spacing[3]} ${spacing[5]}`,
            }}>
              <span style={{
                fontFamily: typography.fontFamily,
                fontSize: typography.size.sm,
                fontWeight: typography.weight.semibold,
                color: t.text.primary,
              }}>
                Lyrics
              </span>
              <span style={{
                fontFamily: typography.fontFamily,
                fontSize: '0.625rem',
                fontWeight: typography.weight.medium,
                color: t.text.tertiary,
                background: t.bg.secondary,
                padding: `${spacing[0.5]} ${spacing[2]}`,
                borderRadius: borderRadius.full,
              }}>
                Key terms highlighted
              </span>
            </div>

            {/* Track list (quick jump) */}
            <div style={{
              display: 'flex',
              gap: spacing[1],
              padding: `0 ${spacing[5]} ${spacing[3]}`,
              overflowX: 'auto',
            }}>
              {ep.tracks.map((tr, i) => (
                <button
                  key={tr.id}
                  onClick={() => setCurrentTrackIndex(i)}
                  style={{
                    padding: `${spacing[1]} ${spacing[3]}`,
                    borderRadius: borderRadius.full,
                    border: `1px solid ${i === currentTrackIndex ? t.text.primary : t.border.subtle}`,
                    background: i === currentTrackIndex ? t.text.primary : 'transparent',
                    color: i === currentTrackIndex ? t.text.inverse : t.text.tertiary,
                    fontFamily: typography.fontFamily,
                    fontSize: typography.size.xs,
                    fontWeight: typography.weight.medium,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: `all ${transitions.fast} ${transitions.easing}`,
                  }}
                >
                  {tr.number}. {tr.title}
                </button>
              ))}
            </div>

            {/* Scrollable lyrics */}
            <div
              ref={lyricsContainerRef}
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: `0 ${spacing[5]} ${spacing[5]}`,
                display: 'flex',
                flexDirection: 'column',
                gap: spacing[2],
              }}
            >
              {track.lyrics.map((line, i) => {
                const isActive = i === activeLyricIndex;
                const hasTerm = !!line.term;
                const isHook = line.type === 'hook';

                return (
                  <div
                    key={`${track.id}-${i}`}
                    style={{
                      fontFamily: typography.fontFamily,
                      fontSize: typography.size.sm,
                      lineHeight: typography.lineHeight.relaxed,
                      fontWeight: isActive ? typography.weight.semibold : typography.weight.normal,
                      color: isActive
                        ? (hasTerm ? '#C4622A' : t.text.primary)
                        : (hasTerm ? 'rgba(196, 98, 42, 0.45)' : t.text.tertiary),
                      transition: `all ${transitions.normal} ${transitions.easing}`,
                      opacity: isActive ? 1 : 0.7,
                      paddingLeft: isHook ? spacing[3] : 0,
                      borderLeft: isHook ? `2px solid ${isActive ? t.text.primary : t.border.subtle}` : 'none',
                    }}
                  >
                    {line.text}
                    {hasTerm && isActive && (
                      <span style={{
                        display: 'inline-block',
                        marginLeft: spacing[2],
                        fontSize: '0.625rem',
                        fontWeight: typography.weight.medium,
                        color: '#C4622A',
                        background: 'rgba(196, 98, 42, 0.08)',
                        padding: `0 ${spacing[1]}`,
                        borderRadius: borderRadius.sm,
                      }}>
                        {line.term}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
