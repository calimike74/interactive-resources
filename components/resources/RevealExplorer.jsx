'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { theme, typography, borderRadius, spacing, transitions } from '@/lib/theme';
import Script from 'next/script';

// ============================================
// HAND TRACKING HOOK
// MediaPipe Hands integration for gesture control
// ============================================
const useHandTracking = (enabled, canvasWidth, canvasHeight) => {
    const [handPosition, setHandPosition] = useState({ x: 0, y: 0 });
    const [handOpenness, setHandOpenness] = useState(0);
    const [isTracking, setIsTracking] = useState(false);
    const [scriptsLoaded, setScriptsLoaded] = useState(false);
    const videoRef = useRef(null);
    const handsRef = useRef(null);
    const cameraRef = useRef(null);
    const previewCanvasRef = useRef(null);
    const smoothPosition = useRef({ x: 0.5, y: 0.5 });
    const smoothOpenness = useRef(0.5);

    // Check if MediaPipe scripts are loaded
    useEffect(() => {
        const checkScripts = () => {
            if (typeof window !== 'undefined' && window.Hands && window.Camera) {
                setScriptsLoaded(true);
            }
        };
        checkScripts();
        // Also check periodically in case scripts load async
        const interval = setInterval(checkScripts, 100);
        return () => clearInterval(interval);
    }, []);

    // Initialize hand tracking
    useEffect(() => {
        if (!enabled || !scriptsLoaded) {
            if (cameraRef.current) {
                cameraRef.current.stop();
                cameraRef.current = null;
            }
            setIsTracking(false);
            return;
        }

        const initHandTracking = async () => {
            try {
                // Create video element if needed
                if (!videoRef.current) {
                    videoRef.current = document.createElement('video');
                    videoRef.current.style.display = 'none';
                    document.body.appendChild(videoRef.current);
                }

                // Initialize MediaPipe Hands
                const hands = new window.Hands({
                    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
                });

                hands.setOptions({
                    maxNumHands: 1,
                    modelComplexity: 1,
                    minDetectionConfidence: 0.7,
                    minTrackingConfidence: 0.5,
                });

                hands.onResults((results) => {
                    // Draw to preview canvas
                    if (previewCanvasRef.current) {
                        const ctx = previewCanvasRef.current.getContext('2d');
                        ctx.save();
                        ctx.clearRect(0, 0, previewCanvasRef.current.width, previewCanvasRef.current.height);

                        // Mirror and draw video
                        ctx.scale(-1, 1);
                        ctx.translate(-previewCanvasRef.current.width, 0);
                        ctx.drawImage(results.image, 0, 0, previewCanvasRef.current.width, previewCanvasRef.current.height);
                        ctx.restore();

                        // Draw hand landmarks
                        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
                            const landmarks = results.multiHandLandmarks[0];

                            // Draw connections
                            ctx.strokeStyle = 'rgba(14, 165, 233, 0.8)';
                            ctx.lineWidth = 2;
                            const connections = [
                                [0, 1], [1, 2], [2, 3], [3, 4],
                                [0, 5], [5, 6], [6, 7], [7, 8],
                                [5, 9], [9, 10], [10, 11], [11, 12],
                                [9, 13], [13, 14], [14, 15], [15, 16],
                                [13, 17], [17, 18], [18, 19], [19, 20],
                                [0, 17],
                            ];
                            connections.forEach(([start, end]) => {
                                ctx.beginPath();
                                ctx.moveTo(
                                    (1 - landmarks[start].x) * previewCanvasRef.current.width,
                                    landmarks[start].y * previewCanvasRef.current.height
                                );
                                ctx.lineTo(
                                    (1 - landmarks[end].x) * previewCanvasRef.current.width,
                                    landmarks[end].y * previewCanvasRef.current.height
                                );
                                ctx.stroke();
                            });

                            // Draw landmark points
                            landmarks.forEach((lm, idx) => {
                                ctx.beginPath();
                                const x = (1 - lm.x) * previewCanvasRef.current.width;
                                const y = lm.y * previewCanvasRef.current.height;
                                const isFingerTip = [4, 8, 12, 16, 20].includes(idx);
                                ctx.arc(x, y, isFingerTip ? 5 : 3, 0, 2 * Math.PI);
                                ctx.fillStyle = idx === 8 ? '#ef4444' : (isFingerTip ? '#22c55e' : '#0ea5e9');
                                ctx.fill();
                            });
                        }
                    }

                    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
                        const landmarks = results.multiHandLandmarks[0];

                        // Get index fingertip position (landmark 8)
                        const indexTip = landmarks[8];

                        // Smooth position (mirror X for natural control)
                        const targetX = 1 - indexTip.x;
                        const targetY = indexTip.y;
                        smoothPosition.current.x += (targetX - smoothPosition.current.x) * 0.25;
                        smoothPosition.current.y += (targetY - smoothPosition.current.y) * 0.25;

                        // Calculate hand openness
                        const wrist = landmarks[0];
                        const middleMCP = landmarks[9];
                        const palmSize = Math.sqrt(
                            Math.pow(wrist.x - middleMCP.x, 2) + Math.pow(wrist.y - middleMCP.y, 2)
                        );

                        // Calculate hand openness by measuring finger extension
                        const fingerTips = [4, 8, 12, 16, 20]; // thumb, index, middle, ring, pinky tips
                        const fingerMCPs = [2, 5, 9, 13, 17];  // corresponding base knuckles

                        let totalExtension = 0;
                        fingerTips.forEach((tipIdx, i) => {
                            const tip = landmarks[tipIdx];
                            const mcp = landmarks[fingerMCPs[i]];
                            // Distance from fingertip to its base knuckle
                            const extension = Math.sqrt(
                                Math.pow(tip.x - mcp.x, 2) + Math.pow(tip.y - mcp.y, 2)
                            );
                            totalExtension += extension;
                        });
                        const avgExtension = totalExtension / fingerTips.length;

                        // Normalize: closed fist ~ 0.05-0.08 palm units, open hand ~ 0.15-0.25 palm units
                        const normalizedOpenness = Math.max(0, Math.min(1, (avgExtension / palmSize - 0.4) / 0.8));

                        smoothOpenness.current += (normalizedOpenness - smoothOpenness.current) * 0.15;

                        setHandPosition({
                            x: smoothPosition.current.x * canvasWidth,
                            y: smoothPosition.current.y * canvasHeight,
                        });
                        setHandOpenness(smoothOpenness.current);
                        setIsTracking(true);
                    } else {
                        setIsTracking(false);
                    }
                });

                handsRef.current = hands;

                // Initialize camera
                const camera = new window.Camera(videoRef.current, {
                    onFrame: async () => {
                        if (handsRef.current && videoRef.current) {
                            await handsRef.current.send({ image: videoRef.current });
                        }
                    },
                    width: 640,
                    height: 480,
                });

                await camera.start();
                cameraRef.current = camera;

            } catch (error) {
                console.error('Failed to initialize hand tracking:', error);
                setIsTracking(false);
            }
        };

        initHandTracking();

        return () => {
            if (cameraRef.current) {
                cameraRef.current.stop();
                cameraRef.current = null;
            }
            if (videoRef.current && videoRef.current.parentNode) {
                videoRef.current.parentNode.removeChild(videoRef.current);
                videoRef.current = null;
            }
        };
    }, [enabled, scriptsLoaded, canvasWidth, canvasHeight]);

    return {
        handPosition,
        handOpenness,
        isTracking,
        previewCanvasRef,
        scriptsLoaded,
    };
};

// ============================================
// REVEAL EXPLORER
// Interactive tool for discovering hidden content
// ============================================

// Pre-built example data
const EXAMPLE_REVEALS = [
    // Spotlight reveal example using real images
    {
        id: 'eq-frequency-reveal',
        title: 'Graphic Equalizer',
        topic: '1.11 EQ',
        description: 'Hover to reveal the frequency band annotations hidden beneath the EQ',
        mode: 'spotlight',
        baseImage: '/eq-photo.jpg',
        revealImage: '/eq-annotated.jpg',
        maskSize: 400,
        maskShape: 'circle',
        infoPanel: {
            subtitle: '31-Band Graphic Equalizer',
            description: 'A graphic EQ uses parallel filter routing where all bands process the original signal simultaneously, with outputs summed together. Each slider controls a fixed frequency band.',
            stats: [
                { label: 'Routing', value: 'Parallel', detail: 'All bands process signal at once' },
                { label: 'Control', value: 'Gain Only', detail: 'Fixed frequency per band' },
                { label: 'Bands', value: '31', detail: '1/3 octave spacing' },
                { label: 'Range', value: '20Hz-20kHz', detail: 'Full audible spectrum' },
            ],
            frequencyBands: [
                { name: 'Sub Bass', range: '20-80Hz', quality: 'Rumble, weight, intensity' },
                { name: 'Bass', range: '80-225Hz', quality: 'Boom, punch, energy' },
                { name: 'Low Mid', range: '225-500Hz', quality: 'Depth, body (too much = mud)' },
                { name: 'Mid', range: '500Hz-2.5kHz', quality: 'Musicality, presence' },
                { name: 'Upper Mid', range: '2.5-7kHz', quality: 'Crunch, sibilance, clarity' },
                { name: 'High', range: '7-20kHz', quality: 'Sparkle, air, brightness' },
            ],
            useCase: 'Quick adjustments in live venues where visual feedback of the frequency curve is essential.',
        },
    }
];

// ============================================
// SPOTLIGHT REVEAL CANVAS
// Canvas-based cursor-following reveal effect
// Now supports both mouse and hand tracking input
// ============================================
const SpotlightRevealCanvas = ({
    baseImage,
    revealImage,
    maskSize = 280,
    maskShape = 'circle',
    enableParallax = true,
    // Hand tracking props
    handEnabled = false,
    handPosition = null,
    handOpenness = 0.5,
    isHandTracking = false,
}) => {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [mousePos, setMousePos] = useState({ x: -200, y: -200 });
    const [isMouseInside, setIsMouseInside] = useState(false);
    const smoothPos = useRef({ x: -200, y: -200 });
    const animationRef = useRef(null);
    const baseImgRef = useRef(null);
    const revealImgRef = useRef(null);
    const [imagesLoaded, setImagesLoaded] = useState(false);
    const [size, setSize] = useState({ width: 800, height: 500 });
    const [parallaxOffset, setParallaxOffset] = useState({ x: 0, y: 0 });
    const t = theme.light;

    // Calculate dynamic mask size based on hand openness when hand control is enabled
    // Closed fist = small spotlight (80px), open hand = massive spotlight (1000px)
    const dynamicMaskSize = handEnabled && isHandTracking
        ? Math.round(80 + (handOpenness * 920)) // Range from 80px to 1000px
        : maskSize;

    // Load images
    useEffect(() => {
        if (!baseImage || !revealImage) return;

        const baseImg = new Image();
        const revealImg = new Image();
        let loadedCount = 0;

        const checkLoaded = () => {
            loadedCount++;
            if (loadedCount === 2) {
                baseImgRef.current = baseImg;
                revealImgRef.current = revealImg;
                setSize({ width: baseImg.width, height: baseImg.height });
                setImagesLoaded(true);
            }
        };

        baseImg.onload = checkLoaded;
        revealImg.onload = checkLoaded;
        baseImg.src = baseImage;
        revealImg.src = revealImage;

        return () => {
            setImagesLoaded(false);
        };
    }, [baseImage, revealImage]);

    // Animation loop for smooth cursor following (supports both mouse and hand input)
    useEffect(() => {
        if (!imagesLoaded) return;

        const animate = () => {
            // Determine current position source: hand tracking or mouse
            const useHand = handEnabled && isHandTracking && handPosition;
            const targetPos = useHand ? handPosition : mousePos;

            // Lerp for smooth following
            smoothPos.current.x += (targetPos.x - smoothPos.current.x) * 0.15;
            smoothPos.current.y += (targetPos.y - smoothPos.current.y) * 0.15;

            const canvas = canvasRef.current;
            if (!canvas || !baseImgRef.current || !revealImgRef.current) {
                animationRef.current = requestAnimationFrame(animate);
                return;
            }

            const ctx = canvas.getContext('2d');
            const { width, height } = canvas;

            // Clear
            ctx.clearRect(0, 0, width, height);

            // Draw base image
            ctx.drawImage(baseImgRef.current, 0, 0, width, height);

            // Show reveal if mouse is inside OR hand is tracking
            const shouldShowReveal = useHand || isMouseInside;
            if (shouldShowReveal) {
                // Save context
                ctx.save();

                // Create clipping mask (use dynamic size for hand control)
                const currentMaskSize = useHand ? dynamicMaskSize : maskSize;
                ctx.beginPath();
                if (maskShape === 'circle') {
                    ctx.arc(smoothPos.current.x, smoothPos.current.y, currentMaskSize / 2, 0, Math.PI * 2);
                } else {
                    ctx.rect(
                        smoothPos.current.x - currentMaskSize / 2,
                        smoothPos.current.y - currentMaskSize / 2,
                        currentMaskSize,
                        currentMaskSize
                    );
                }
                ctx.clip();

                // Draw reveal image through the mask
                ctx.drawImage(revealImgRef.current, 0, 0, width, height);

                // Draw soft edge glow
                const gradient = ctx.createRadialGradient(
                    smoothPos.current.x, smoothPos.current.y, currentMaskSize / 2 - 10,
                    smoothPos.current.x, smoothPos.current.y, currentMaskSize / 2
                );
                gradient.addColorStop(0, 'rgba(255,255,255,0)');
                gradient.addColorStop(1, useHand ? 'rgba(14,165,233,0.4)' : 'rgba(255,255,255,0.3)');
                ctx.fillStyle = gradient;
                ctx.fill();

                ctx.restore();
            }

            animationRef.current = requestAnimationFrame(animate);
        };

        animationRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [imagesLoaded, mousePos, maskSize, dynamicMaskSize, maskShape, isMouseInside, handEnabled, handPosition, isHandTracking]);

    const handleMouseMove = useCallback((e) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Calculate position relative to canvas size
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        const newX = (e.clientX - rect.left) * scaleX;
        const newY = (e.clientY - rect.top) * scaleY;

        // If mouse just entered, snap smoothPos to current position (no lerp animation from old spot)
        if (!isMouseInside) {
            smoothPos.current = { x: newX, y: newY };
            setIsMouseInside(true);
        }

        setMousePos({ x: newX, y: newY });

        // Calculate parallax offset based on cursor position
        if (enableParallax) {
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const parallaxStrength = 12; // Max pixels of shift
            setParallaxOffset({
                x: ((newX - centerX) / centerX) * parallaxStrength,
                y: ((newY - centerY) / centerY) * parallaxStrength,
            });
        }
    }, [enableParallax, isMouseInside]);

    const handleMouseLeave = useCallback(() => {
        // Simply hide the reveal - don't animate to a corner
        setIsMouseInside(false);
        if (enableParallax) {
            setParallaxOffset({ x: 0, y: 0 });
        }
    }, [enableParallax]);

    if (!baseImage || !revealImage) {
        return (
            <div style={{
                background: t.bg.tertiary,
                borderRadius: borderRadius.xl,
                padding: spacing[8],
                textAlign: 'center',
                color: t.text.tertiary,
            }}>
                <p>Upload both a base image and a reveal image to see the spotlight effect.</p>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                position: 'relative',
                cursor: 'none',
                borderRadius: borderRadius.xl,
                overflow: 'hidden',
            }}
        >
            <canvas
                ref={canvasRef}
                width={size.width}
                height={size.height}
                style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                    transform: enableParallax ? `translate(${parallaxOffset.x}px, ${parallaxOffset.y}px)` : 'none',
                    transition: 'transform 0.1s ease-out',
                }}
            />
            {/* Custom cursor indicator */}
            <div
                style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    right: 0,
                    bottom: 0,
                    pointerEvents: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                {!imagesLoaded && (
                    <div style={{
                        background: 'rgba(0,0,0,0.7)',
                        color: '#fff',
                        padding: `${spacing[3]} ${spacing[5]}`,
                        borderRadius: borderRadius.lg,
                    }}>
                        Loading images...
                    </div>
                )}
            </div>
            {/* Hover instruction */}
            {imagesLoaded && mousePos.x < -100 && (
                <div style={{
                    position: 'absolute',
                    bottom: spacing[4],
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'rgba(0,0,0,0.7)',
                    color: '#fff',
                    padding: `${spacing[2]} ${spacing[4]}`,
                    borderRadius: borderRadius.full,
                    fontSize: typography.size.sm,
                    pointerEvents: 'none',
                }}>
                    Hover to reveal hidden layer
                </div>
            )}
        </div>
    );
};

// ============================================
// SPOTLIGHT BUILDER VIEW
// ============================================
const SpotlightBuilderView = ({ onBack }) => {
    const t = theme.light;
    const [baseImage, setBaseImage] = useState(null);
    const [revealImage, setRevealImage] = useState(null);
    const [title, setTitle] = useState('My Spotlight Reveal');
    const [maskSize, setMaskSize] = useState(280);
    const [maskShape, setMaskShape] = useState('circle');
    const [savedProjects, setSavedProjects] = useState([]);

    useEffect(() => {
        try {
            const saved = localStorage.getItem('spotlightRevealProjects');
            if (saved) {
                setSavedProjects(JSON.parse(saved));
            }
        } catch (e) {
            console.error('Failed to load saved projects:', e);
        }
    }, []);

    const handleBaseImageUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => setBaseImage(event.target.result);
        reader.readAsDataURL(file);
    };

    const handleRevealImageUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => setRevealImage(event.target.result);
        reader.readAsDataURL(file);
    };

    const saveProject = () => {
        const project = {
            id: `spotlight-${Date.now()}`,
            title,
            baseImage,
            revealImage,
            maskSize,
            maskShape,
            mode: 'spotlight',
            createdAt: new Date().toISOString(),
        };

        const updatedProjects = [...savedProjects, project];
        setSavedProjects(updatedProjects);

        try {
            localStorage.setItem('spotlightRevealProjects', JSON.stringify(updatedProjects));
            alert('Spotlight reveal saved!');
        } catch (e) {
            alert('Failed to save. Storage may be full.');
        }
    };

    const loadProject = (project) => {
        setTitle(project.title);
        setBaseImage(project.baseImage);
        setRevealImage(project.revealImage);
        setMaskSize(project.maskSize || 120);
        setMaskShape(project.maskShape || 'circle');
    };

    const deleteProject = (projectId) => {
        const updatedProjects = savedProjects.filter(p => p.id !== projectId);
        setSavedProjects(updatedProjects);
        localStorage.setItem('spotlightRevealProjects', JSON.stringify(updatedProjects));
    };

    return (
        <div style={{ padding: spacing[6] }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: spacing[6],
                flexWrap: 'wrap',
                gap: spacing[4],
            }}>
                <div>
                    <button
                        onClick={onBack}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: t.accent.primary,
                            cursor: 'pointer',
                            fontSize: typography.size.sm,
                            padding: 0,
                            marginBottom: spacing[2],
                        }}
                    >
                        ← Back to Gallery
                    </button>
                    <h2 style={{
                        fontSize: typography.size['2xl'],
                        fontWeight: typography.weight.bold,
                        color: t.text.primary,
                        marginBottom: spacing[1],
                    }}>
                        Spotlight Reveal Builder
                    </h2>
                    <p style={{
                        color: t.text.secondary,
                        fontSize: typography.size.sm,
                    }}>
                        Upload two images - hover reveals the hidden layer underneath
                    </p>
                </div>

                <button
                    onClick={saveProject}
                    disabled={!baseImage || !revealImage}
                    style={{
                        background: baseImage && revealImage ? t.accent.primary : t.bg.tertiary,
                        color: baseImage && revealImage ? t.text.inverse : t.text.tertiary,
                        border: 'none',
                        borderRadius: borderRadius.lg,
                        padding: `${spacing[3]} ${spacing[5]}`,
                        fontSize: typography.size.sm,
                        fontWeight: typography.weight.semibold,
                        cursor: baseImage && revealImage ? 'pointer' : 'not-allowed',
                    }}
                >
                    Save Project
                </button>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 300px',
                gap: spacing[6],
            }}>
                {/* Preview area */}
                <div>
                    <div style={{ marginBottom: spacing[4] }}>
                        <label style={{
                            display: 'block',
                            fontSize: typography.size.sm,
                            fontWeight: typography.weight.medium,
                            color: t.text.secondary,
                            marginBottom: spacing[1],
                        }}>
                            Project Title
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            style={{
                                width: '100%',
                                padding: `${spacing[2]} ${spacing[3]}`,
                                border: `1px solid ${t.border.input}`,
                                borderRadius: borderRadius.md,
                                fontSize: typography.size.base,
                                fontFamily: typography.fontFamily,
                            }}
                        />
                    </div>

                    {/* Spotlight canvas or upload prompts */}
                    {baseImage && revealImage ? (
                        <SpotlightRevealCanvas
                            baseImage={baseImage}
                            revealImage={revealImage}
                            maskSize={maskSize}
                            maskShape={maskShape}
                        />
                    ) : (
                        <div style={{
                            background: t.bg.tertiary,
                            borderRadius: borderRadius.xl,
                            padding: spacing[8],
                            textAlign: 'center',
                            minHeight: '400px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: spacing[6],
                        }}>
                            <p style={{ color: t.text.secondary, maxWidth: '400px' }}>
                                Upload a <strong>base image</strong> (what students see initially) and a <strong>reveal image</strong> (what's hidden underneath).
                            </p>
                            <div style={{ display: 'flex', gap: spacing[4], flexWrap: 'wrap', justifyContent: 'center' }}>
                                <label style={{
                                    background: baseImage ? t.accent.successLight : t.accent.primary,
                                    color: baseImage ? t.accent.success : t.text.inverse,
                                    padding: `${spacing[3]} ${spacing[5]}`,
                                    borderRadius: borderRadius.lg,
                                    cursor: 'pointer',
                                    fontSize: typography.size.sm,
                                    fontWeight: typography.weight.semibold,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: spacing[2],
                                }}>
                                    {baseImage ? '✓ Base Image' : '1. Upload Base Image'}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleBaseImageUpload}
                                        style={{ display: 'none' }}
                                    />
                                </label>
                                <label style={{
                                    background: revealImage ? t.accent.successLight : (baseImage ? t.accent.primary : t.bg.tertiary),
                                    color: revealImage ? t.accent.success : (baseImage ? t.text.inverse : t.text.tertiary),
                                    padding: `${spacing[3]} ${spacing[5]}`,
                                    borderRadius: borderRadius.lg,
                                    cursor: baseImage ? 'pointer' : 'not-allowed',
                                    fontSize: typography.size.sm,
                                    fontWeight: typography.weight.semibold,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: spacing[2],
                                }}>
                                    {revealImage ? '✓ Reveal Image' : '2. Upload Reveal Image'}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleRevealImageUpload}
                                        disabled={!baseImage}
                                        style={{ display: 'none' }}
                                    />
                                </label>
                            </div>
                        </div>
                    )}

                    {/* Change images buttons */}
                    {baseImage && revealImage && (
                        <div style={{ marginTop: spacing[4], display: 'flex', gap: spacing[3] }}>
                            <label style={{
                                background: t.bg.primary,
                                color: t.text.primary,
                                border: `1px solid ${t.border.medium}`,
                                borderRadius: borderRadius.lg,
                                padding: `${spacing[2]} ${spacing[4]}`,
                                cursor: 'pointer',
                                fontSize: typography.size.sm,
                            }}>
                                Change Base
                                <input type="file" accept="image/*" onChange={handleBaseImageUpload} style={{ display: 'none' }} />
                            </label>
                            <label style={{
                                background: t.bg.primary,
                                color: t.text.primary,
                                border: `1px solid ${t.border.medium}`,
                                borderRadius: borderRadius.lg,
                                padding: `${spacing[2]} ${spacing[4]}`,
                                cursor: 'pointer',
                                fontSize: typography.size.sm,
                            }}>
                                Change Reveal
                                <input type="file" accept="image/*" onChange={handleRevealImageUpload} style={{ display: 'none' }} />
                            </label>
                        </div>
                    )}
                </div>

                {/* Settings sidebar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[6] }}>
                    {/* Mask settings */}
                    <div style={{
                        background: t.bg.primary,
                        borderRadius: borderRadius.xl,
                        padding: spacing[5],
                        border: `1px solid ${t.border.subtle}`,
                    }}>
                        <h3 style={{
                            fontSize: typography.size.lg,
                            fontWeight: typography.weight.semibold,
                            color: t.text.primary,
                            marginBottom: spacing[4],
                        }}>
                            Spotlight Settings
                        </h3>

                        <div style={{ marginBottom: spacing[4] }}>
                            <label style={{
                                display: 'block',
                                fontSize: typography.size.sm,
                                fontWeight: typography.weight.medium,
                                color: t.text.secondary,
                                marginBottom: spacing[2],
                            }}>
                                Spotlight Size: {maskSize}px
                            </label>
                            <input
                                type="range"
                                min="60"
                                max="300"
                                value={maskSize}
                                onChange={(e) => setMaskSize(parseInt(e.target.value))}
                                style={{ width: '100%', accentColor: t.accent.primary }}
                            />
                        </div>

                        <div>
                            <label style={{
                                display: 'block',
                                fontSize: typography.size.sm,
                                fontWeight: typography.weight.medium,
                                color: t.text.secondary,
                                marginBottom: spacing[2],
                            }}>
                                Shape
                            </label>
                            <div style={{ display: 'flex', gap: spacing[2] }}>
                                {['circle', 'square'].map(shape => (
                                    <button
                                        key={shape}
                                        onClick={() => setMaskShape(shape)}
                                        style={{
                                            flex: 1,
                                            padding: spacing[2],
                                            background: maskShape === shape ? t.accent.primary : t.bg.tertiary,
                                            color: maskShape === shape ? t.text.inverse : t.text.primary,
                                            border: 'none',
                                            borderRadius: borderRadius.md,
                                            cursor: 'pointer',
                                            fontSize: typography.size.sm,
                                            textTransform: 'capitalize',
                                        }}
                                    >
                                        {shape}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* How it works */}
                    <div style={{
                        background: t.accent.infoLight,
                        borderRadius: borderRadius.xl,
                        padding: spacing[5],
                    }}>
                        <h4 style={{
                            fontSize: typography.size.sm,
                            fontWeight: typography.weight.semibold,
                            color: t.accent.info,
                            marginBottom: spacing[2],
                        }}>
                            How it works
                        </h4>
                        <ul style={{
                            margin: 0,
                            paddingLeft: spacing[4],
                            color: t.text.secondary,
                            fontSize: typography.size.sm,
                            lineHeight: typography.lineHeight.relaxed,
                        }}>
                            <li>Base image is visible by default</li>
                            <li>Hover creates a spotlight that reveals the second image</li>
                            <li>Great for showing: internals, annotations, labeled diagrams</li>
                        </ul>
                    </div>

                    {/* Saved projects */}
                    {savedProjects.length > 0 && (
                        <div style={{
                            background: t.bg.primary,
                            borderRadius: borderRadius.xl,
                            padding: spacing[5],
                            border: `1px solid ${t.border.subtle}`,
                        }}>
                            <h3 style={{
                                fontSize: typography.size.lg,
                                fontWeight: typography.weight.semibold,
                                color: t.text.primary,
                                marginBottom: spacing[4],
                            }}>
                                Saved Projects
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
                                {savedProjects.map((project) => (
                                    <div
                                        key={project.id}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: spacing[2],
                                            background: t.bg.tertiary,
                                            borderRadius: borderRadius.md,
                                        }}
                                    >
                                        <button
                                            onClick={() => loadProject(project)}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                fontSize: typography.size.sm,
                                                color: t.text.primary,
                                                textAlign: 'left',
                                                flex: 1,
                                            }}
                                        >
                                            {project.title}
                                        </button>
                                        <button
                                            onClick={() => deleteProject(project.id)}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                color: t.accent.error,
                                                fontSize: typography.size.sm,
                                            }}
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ============================================
// PLACEHOLDER IMAGE GENERATOR
// ============================================
const PlaceholderCanvas = ({ width, height, title, hotspots, activeHotspot, onHotspotClick, onHotspotHover }) => {
    const canvasRef = useRef(null);
    const t = theme.light;

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        // Background gradient
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(1, '#16213e');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Grid pattern
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.lineWidth = 1;
        const gridSize = 40;
        for (let x = 0; x <= width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        for (let y = 0; y <= height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }

        // Title
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.font = 'bold 24px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(title, width / 2, height / 2);

        // Decorative elements based on hotspots
        hotspots.forEach((hotspot, idx) => {
            const x = (hotspot.x / 100) * width;
            const y = (hotspot.y / 100) * height;
            const w = (hotspot.width / 100) * width;
            const h = (hotspot.height / 100) * height;

            // Draw subtle zone indicators
            ctx.fillStyle = `hsla(${idx * 60}, 70%, 60%, 0.1)`;
            if (hotspot.shape === 'circle') {
                ctx.beginPath();
                ctx.arc(x + w/2, y + h/2, Math.min(w, h) / 2, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.fillRect(x, y, w, h);
            }
        });

    }, [width, height, title, hotspots]);

    return (
        <div style={{ position: 'relative' }}>
            <canvas
                ref={canvasRef}
                width={width}
                height={height}
                style={{
                    width: '100%',
                    height: 'auto',
                    borderRadius: borderRadius.lg,
                    display: 'block'
                }}
            />
            {/* Hotspot overlays */}
            {hotspots.map((hotspot, idx) => (
                <div
                    key={hotspot.id}
                    onClick={() => onHotspotClick?.(hotspot)}
                    onMouseEnter={() => onHotspotHover?.(hotspot)}
                    onMouseLeave={() => onHotspotHover?.(null)}
                    style={{
                        position: 'absolute',
                        left: `${hotspot.x}%`,
                        top: `${hotspot.y}%`,
                        width: `${hotspot.width}%`,
                        height: `${hotspot.height}%`,
                        borderRadius: hotspot.shape === 'circle' ? '50%' : borderRadius.md,
                        border: `2px solid ${activeHotspot?.id === hotspot.id ? t.accent.primary : 'rgba(255,255,255,0.3)'}`,
                        background: activeHotspot?.id === hotspot.id
                            ? 'rgba(37, 99, 235, 0.2)'
                            : 'rgba(255,255,255,0.05)',
                        cursor: 'pointer',
                        transition: `all ${transitions.fast}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <span style={{
                        background: activeHotspot?.id === hotspot.id ? t.accent.primary : 'rgba(0,0,0,0.6)',
                        color: '#fff',
                        fontSize: typography.size.xs,
                        fontWeight: typography.weight.semibold,
                        padding: `${spacing[1]} ${spacing[2]}`,
                        borderRadius: borderRadius.full,
                        whiteSpace: 'nowrap',
                        pointerEvents: 'none',
                    }}>
                        {idx + 1}
                    </span>
                </div>
            ))}
        </div>
    );
};

// ============================================
// HOTSPOT INFO PANEL
// ============================================
const HotspotPanel = ({ hotspot, onClose }) => {
    const t = theme.light;

    if (!hotspot) return null;

    return (
        <div style={{
            background: t.bg.primary,
            borderRadius: borderRadius.xl,
            padding: spacing[6],
            boxShadow: t.shadow.lg,
            border: `1px solid ${t.border.subtle}`,
        }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: spacing[4],
            }}>
                <div>
                    <div style={{
                        fontSize: typography.size.xs,
                        color: t.accent.primary,
                        fontWeight: typography.weight.semibold,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: spacing[1],
                    }}>
                        Component
                    </div>
                    <h3 style={{
                        fontSize: typography.size.xl,
                        fontWeight: typography.weight.bold,
                        color: t.text.primary,
                        margin: 0,
                    }}>
                        {hotspot.label}
                    </h3>
                </div>
                <button
                    onClick={onClose}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: t.text.tertiary,
                        cursor: 'pointer',
                        fontSize: typography.size.lg,
                        padding: spacing[1],
                    }}
                >
                    ×
                </button>
            </div>
            <p style={{
                color: t.text.secondary,
                fontSize: typography.size.base,
                lineHeight: typography.lineHeight.relaxed,
                margin: 0,
            }}>
                {hotspot.description}
            </p>
        </div>
    );
};

// ============================================
// GALLERY VIEW
// ============================================
const GalleryView = ({ onSelectExample }) => {
    const t = theme.light;

    return (
        <div style={{ padding: spacing[6] }}>
            <div style={{ marginBottom: spacing[6] }}>
                <h2 style={{
                    fontSize: typography.size['2xl'],
                    fontWeight: typography.weight.bold,
                    color: t.text.primary,
                    marginBottom: spacing[2],
                }}>
                    Explore Examples
                </h2>
                <p style={{
                    color: t.text.secondary,
                    fontSize: typography.size.base,
                }}>
                    Click on an example to explore its hidden details
                </p>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: spacing[6],
            }}>
                {EXAMPLE_REVEALS.map((example) => (
                    <button
                        key={example.id}
                        onClick={() => onSelectExample(example)}
                        style={{
                            background: t.bg.primary,
                            border: `1px solid ${t.border.subtle}`,
                            borderRadius: borderRadius.xl,
                            padding: spacing[5],
                            textAlign: 'left',
                            cursor: 'pointer',
                            transition: `all ${transitions.fast}`,
                            boxShadow: t.shadow.sm,
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = t.shadow.md;
                            e.currentTarget.style.borderColor = t.accent.primary;
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = t.shadow.sm;
                            e.currentTarget.style.borderColor = t.border.subtle;
                        }}
                    >
                        {/* Preview - image or placeholder */}
                        <div style={{
                            background: example.baseImage
                                ? `url(${example.baseImage}) center/cover no-repeat`
                                : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                            borderRadius: borderRadius.lg,
                            height: '120px',
                            marginBottom: spacing[4],
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative',
                            overflow: 'hidden',
                        }}>
                            <div style={{
                                position: 'absolute',
                                bottom: spacing[2],
                                right: spacing[2],
                                background: 'rgba(0,0,0,0.6)',
                                color: '#fff',
                                fontSize: typography.size.xs,
                                padding: `${spacing[1]} ${spacing[2]}`,
                                borderRadius: borderRadius.full,
                            }}>
                                {example.mode === 'spotlight' ? 'spotlight' : `${example.hotspots?.length || 0} hotspots`}
                            </div>
                        </div>

                        <h3 style={{
                            fontSize: typography.size.lg,
                            fontWeight: typography.weight.semibold,
                            color: t.text.primary,
                            marginBottom: spacing[2],
                        }}>
                            {example.title}
                        </h3>
                        <p style={{
                            fontSize: typography.size.sm,
                            color: t.text.secondary,
                            margin: 0,
                            lineHeight: typography.lineHeight.normal,
                        }}>
                            {example.description}
                        </p>
                    </button>
                ))}
            </div>
        </div>
    );
};

// ============================================
// EXPLORER VIEW
// ============================================
const ExplorerView = ({ example, onBack }) => {
    const t = theme.light;
    const [activeHotspot, setActiveHotspot] = useState(null);
    const [discoveredHotspots, setDiscoveredHotspots] = useState(new Set());

    const handleHotspotClick = (hotspot) => {
        setActiveHotspot(hotspot);
        setDiscoveredHotspots(prev => new Set([...prev, hotspot.id]));
    };

    const progress = (discoveredHotspots.size / example.hotspots.length) * 100;

    return (
        <div style={{ padding: spacing[6] }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: spacing[6],
                flexWrap: 'wrap',
                gap: spacing[4],
            }}>
                <div>
                    <button
                        onClick={onBack}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: t.accent.primary,
                            cursor: 'pointer',
                            fontSize: typography.size.sm,
                            padding: 0,
                            marginBottom: spacing[2],
                            display: 'flex',
                            alignItems: 'center',
                            gap: spacing[1],
                        }}
                    >
                        ← Back to Gallery
                    </button>
                    <h2 style={{
                        fontSize: typography.size['2xl'],
                        fontWeight: typography.weight.bold,
                        color: t.text.primary,
                        marginBottom: spacing[1],
                    }}>
                        {example.title}
                    </h2>
                    <p style={{
                        color: t.text.secondary,
                        fontSize: typography.size.sm,
                    }}>
                        Click on the numbered zones to discover each component
                    </p>
                </div>

                {/* Progress */}
                <div style={{
                    background: t.bg.tertiary,
                    borderRadius: borderRadius.lg,
                    padding: spacing[4],
                    minWidth: '180px',
                }}>
                    <div style={{
                        fontSize: typography.size.xs,
                        color: t.text.tertiary,
                        marginBottom: spacing[2],
                    }}>
                        Discovery Progress
                    </div>
                    <div style={{
                        background: t.border.subtle,
                        borderRadius: borderRadius.full,
                        height: '8px',
                        overflow: 'hidden',
                        marginBottom: spacing[2],
                    }}>
                        <div style={{
                            background: t.accent.success,
                            height: '100%',
                            width: `${progress}%`,
                            borderRadius: borderRadius.full,
                            transition: `width ${transitions.normal}`,
                        }} />
                    </div>
                    <div style={{
                        fontSize: typography.size.sm,
                        color: t.text.secondary,
                    }}>
                        <span style={{ fontWeight: typography.weight.semibold, color: t.accent.success }}>
                            {discoveredHotspots.size}
                        </span> / {example.hotspots.length} discovered
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: activeHotspot ? '1fr 350px' : '1fr',
                gap: spacing[6],
            }}>
                {/* Canvas area */}
                <div style={{
                    background: t.bg.tertiary,
                    borderRadius: borderRadius.xl,
                    padding: spacing[4],
                }}>
                    <PlaceholderCanvas
                        width={800}
                        height={500}
                        title={example.title}
                        hotspots={example.hotspots}
                        activeHotspot={activeHotspot}
                        onHotspotClick={handleHotspotClick}
                        onHotspotHover={(h) => h && handleHotspotClick(h)}
                    />
                </div>

                {/* Info panel */}
                {activeHotspot && (
                    <HotspotPanel
                        hotspot={activeHotspot}
                        onClose={() => setActiveHotspot(null)}
                    />
                )}
            </div>

            {/* Hotspot legend */}
            <div style={{
                marginTop: spacing[6],
                display: 'flex',
                flexWrap: 'wrap',
                gap: spacing[2],
            }}>
                {example.hotspots.map((hotspot, idx) => (
                    <button
                        key={hotspot.id}
                        onClick={() => handleHotspotClick(hotspot)}
                        style={{
                            background: discoveredHotspots.has(hotspot.id)
                                ? t.accent.successLight
                                : t.bg.primary,
                            border: `1px solid ${activeHotspot?.id === hotspot.id
                                ? t.accent.primary
                                : t.border.subtle}`,
                            borderRadius: borderRadius.lg,
                            padding: `${spacing[2]} ${spacing[3]}`,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: spacing[2],
                            fontSize: typography.size.sm,
                            color: t.text.primary,
                            transition: `all ${transitions.fast}`,
                        }}
                    >
                        <span style={{
                            background: discoveredHotspots.has(hotspot.id)
                                ? t.accent.success
                                : t.text.tertiary,
                            color: '#fff',
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: typography.size.xs,
                            fontWeight: typography.weight.semibold,
                        }}>
                            {discoveredHotspots.has(hotspot.id) ? '✓' : idx + 1}
                        </span>
                        {hotspot.label}
                    </button>
                ))}
            </div>
        </div>
    );
};

// ============================================
// SPOTLIGHT EXPLORER VIEW
// For viewing pre-built spotlight examples
// Side-by-side layout: Title + Info on left, Interactive image on right
// Now with optional hand tracking control
// ============================================
const SpotlightExplorerView = ({ example, onBack }) => {
    const t = theme.light;
    const hasInfoPanel = example.infoPanel && example.infoPanel.stats;

    // Hand tracking state
    const [handControlEnabled, setHandControlEnabled] = useState(false);
    const canvasSize = { width: 1600, height: 1000 }; // Approximate canvas size for hand tracking

    // Use hand tracking hook
    const {
        handPosition,
        handOpenness,
        isTracking,
        previewCanvasRef,
        scriptsLoaded,
    } = useHandTracking(handControlEnabled, canvasSize.width, canvasSize.height);

    return (
        <div style={{
            padding: spacing[6],
            minHeight: '100vh',
            background: t.bg.secondary,
        }}>
            {/* Minimal back button */}
            <button
                onClick={onBack}
                style={{
                    background: 'none',
                    border: 'none',
                    color: t.accent.primary,
                    cursor: 'pointer',
                    fontSize: typography.size.sm,
                    padding: 0,
                    marginBottom: spacing[6],
                }}
            >
                ← Back to Gallery
            </button>

            {/* Elegant title - spans full width */}
            <div style={{ marginBottom: spacing[5] }}>
                {example.topic && (
                    <div style={{
                        fontFamily: '"Playfair Display", Georgia, serif',
                        fontSize: typography.size.sm,
                        color: t.text.tertiary,
                        letterSpacing: '0.15em',
                        textTransform: 'uppercase',
                        marginBottom: spacing[1],
                    }}>
                        {example.topic}
                    </div>
                )}
                <h1 style={{
                    fontFamily: '"Playfair Display", Georgia, serif',
                    fontSize: '2.75rem',
                    fontWeight: 700,
                    color: t.text.primary,
                    margin: 0,
                    lineHeight: 1.1,
                }}>
                    {example.title}
                </h1>
            </div>

            {/* Main layout: Left panel + Right image - aligned at top */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: hasInfoPanel ? '380px 1fr' : '1fr',
                gap: spacing[6],
                alignItems: 'start',
            }}>
                {/* Left side: Info Panel (always visible) */}
                {hasInfoPanel && (
                    <div style={{
                        position: 'sticky',
                        top: spacing[6],
                    }}>

                        {/* Info panel - always visible, broadcast style */}
                        <div style={{
                            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                            borderRadius: borderRadius.xl,
                            overflow: 'hidden',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                            border: '1px solid rgba(255,255,255,0.1)',
                        }}>
                            {/* Header bar with accent */}
                            <div style={{
                                background: 'linear-gradient(90deg, #0ea5e9 0%, #06b6d4 100%)',
                                padding: `${spacing[3]} ${spacing[4]}`,
                                display: 'flex',
                                alignItems: 'center',
                                gap: spacing[3],
                            }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: borderRadius.md,
                                    background: 'rgba(255,255,255,0.2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1.25rem',
                                }}>
                                    
                                </div>
                                <div>
                                    <div style={{
                                        color: '#fff',
                                        fontWeight: typography.weight.bold,
                                        fontSize: typography.size.base,
                                    }}>
                                        {example.infoPanel.subtitle || example.title}
                                    </div>
                                    <div style={{
                                        color: 'rgba(255,255,255,0.8)',
                                        fontSize: typography.size.xs,
                                    }}>
                                        {example.topic}
                                    </div>
                                </div>
                            </div>

                            {/* Stats grid */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(2, 1fr)',
                                gap: '1px',
                                background: 'rgba(255,255,255,0.1)',
                                margin: spacing[3],
                                borderRadius: borderRadius.md,
                                overflow: 'hidden',
                            }}>
                                {example.infoPanel.stats.map((stat, idx) => (
                                    <div
                                        key={idx}
                                        style={{
                                            background: 'rgba(30,41,59,0.8)',
                                            padding: spacing[3],
                                            transition: `all ${transitions.fast}`,
                                            cursor: 'default',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'rgba(14,165,233,0.2)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'rgba(30,41,59,0.8)';
                                        }}
                                    >
                                        <div style={{
                                            color: 'rgba(255,255,255,0.6)',
                                            fontSize: typography.size.xs,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em',
                                            marginBottom: '2px',
                                        }}>
                                            {stat.label}
                                        </div>
                                        <div style={{
                                            color: '#fff',
                                            fontSize: typography.size.lg,
                                            fontWeight: typography.weight.bold,
                                        }}>
                                            {stat.value}
                                        </div>
                                        <div style={{
                                            color: 'rgba(255,255,255,0.5)',
                                            fontSize: typography.size.xs,
                                            marginTop: '2px',
                                        }}>
                                            {stat.detail}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Frequency bands section */}
                            {example.infoPanel.frequencyBands && (
                                <div style={{ padding: `0 ${spacing[3]} ${spacing[3]}` }}>
                                    <div style={{
                                        color: 'rgba(255,255,255,0.6)',
                                        fontSize: typography.size.xs,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.1em',
                                        marginBottom: spacing[2],
                                    }}>
                                        Frequency Bands
                                    </div>
                                    <div style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '4px',
                                    }}>
                                        {example.infoPanel.frequencyBands.map((band, idx) => (
                                            <div
                                                key={idx}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: spacing[2],
                                                    padding: '4px 8px',
                                                    background: 'rgba(255,255,255,0.05)',
                                                    borderRadius: borderRadius.sm,
                                                    borderLeft: `3px solid hsl(${200 + idx * 25}, 70%, 50%)`,
                                                }}
                                            >
                                                <span style={{
                                                    color: '#fff',
                                                    fontSize: typography.size.xs,
                                                    fontWeight: typography.weight.semibold,
                                                    minWidth: '70px',
                                                }}>
                                                    {band.name}
                                                </span>
                                                <span style={{
                                                    color: 'rgba(255,255,255,0.5)',
                                                    fontSize: typography.size.xs,
                                                    minWidth: '80px',
                                                }}>
                                                    {band.range}
                                                </span>
                                                <span style={{
                                                    color: 'rgba(255,255,255,0.7)',
                                                    fontSize: typography.size.xs,
                                                    flex: 1,
                                                }}>
                                                    {band.quality}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Use case footer */}
                            {example.infoPanel.useCase && (
                                <div style={{
                                    background: 'rgba(0,0,0,0.3)',
                                    padding: spacing[3],
                                    borderTop: '1px solid rgba(255,255,255,0.1)',
                                }}>
                                    <div style={{
                                        color: 'rgba(255,255,255,0.6)',
                                        fontSize: typography.size.xs,
                                        lineHeight: 1.5,
                                    }}>
                                        <strong style={{ color: '#0ea5e9' }}>Use Case:</strong> {example.infoPanel.useCase}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Instruction hint below info panel */}
                        <div style={{
                            marginTop: spacing[4],
                            padding: spacing[3],
                            background: t.bg.tertiary,
                            borderRadius: borderRadius.lg,
                            textAlign: 'center',
                        }}>
                            <p style={{
                                color: t.text.secondary,
                                fontSize: typography.size.sm,
                                margin: 0,
                            }}>
                                 Hover over the image to reveal hidden annotations
                            </p>
                        </div>
                    </div>
                )}

                {/* Right side: Clean interactive image */}
                <div style={{
                    position: 'relative',
                    borderRadius: borderRadius.xl,
                    overflow: 'hidden',
                    boxShadow: t.shadow.lg,
                    background: t.bg.primary,
                }}>
                    <SpotlightRevealCanvas
                        baseImage={example.baseImage}
                        revealImage={example.revealImage}
                        maskSize={example.maskSize || 280}
                        maskShape={example.maskShape || 'circle'}
                        enableParallax={!handControlEnabled}
                        handEnabled={handControlEnabled}
                        handPosition={handPosition}
                        handOpenness={handOpenness}
                        isHandTracking={isTracking}
                    />

                    {/* Hand control toggle button */}
                    <button
                        onClick={() => setHandControlEnabled(!handControlEnabled)}
                        style={{
                            position: 'absolute',
                            top: spacing[3],
                            right: spacing[3],
                            background: handControlEnabled
                                ? 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)'
                                : 'rgba(15, 23, 42, 0.85)',
                            backdropFilter: 'blur(8px)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: borderRadius.lg,
                            padding: `${spacing[2]} ${spacing[4]}`,
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: typography.size.sm,
                            fontWeight: typography.weight.medium,
                            display: 'flex',
                            alignItems: 'center',
                            gap: spacing[2],
                            transition: `all ${transitions.fast}`,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                            zIndex: 10,
                        }}
                    >
                        {handControlEnabled ? 'Hand Control ON' : 'Enable Hand Control'}
                    </button>

                    {/* Hand tracking status indicator */}
                    {handControlEnabled && (
                        <div style={{
                            position: 'absolute',
                            top: spacing[3],
                            left: spacing[3],
                            background: 'rgba(15, 23, 42, 0.85)',
                            backdropFilter: 'blur(8px)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: borderRadius.lg,
                            padding: `${spacing[2]} ${spacing[3]}`,
                            color: '#fff',
                            fontSize: typography.size.xs,
                            display: 'flex',
                            alignItems: 'center',
                            gap: spacing[2],
                            zIndex: 10,
                        }}>
                            <div style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: isTracking ? '#22c55e' : '#ef4444',
                                boxShadow: isTracking ? '0 0 8px #22c55e' : '0 0 8px #ef4444',
                            }} />
                            {isTracking ? 'Tracking' : 'No Hand Detected'}
                        </div>
                    )}
                </div>
            </div>

            {/* Camera preview - fixed position in corner, glass panel style */}
            {handControlEnabled && (
                <div style={{
                    position: 'fixed',
                    bottom: spacing[4],
                    right: spacing[4],
                    width: '200px',
                    height: '150px',
                    borderRadius: borderRadius.xl,
                    overflow: 'hidden',
                    background: 'rgba(15, 23, 42, 0.9)',
                    backdropFilter: 'blur(12px)',
                    border: isTracking
                        ? '2px solid rgba(14, 165, 233, 0.6)'
                        : '2px solid rgba(255,255,255,0.2)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                    zIndex: 50,
                    transition: `all ${transitions.fast}`,
                }}>
                    <canvas
                        ref={previewCanvasRef}
                        width={320}
                        height={240}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                        }}
                    />
                    {/* Camera preview label */}
                    <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                        padding: `${spacing[2]} ${spacing[3]}`,
                        color: '#fff',
                        fontSize: typography.size.xs,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}>
                        <span>Hand Control</span>
                        {isTracking && (
                            <span style={{ color: '#22c55e' }}>
                                Size: {Math.round(150 + handOpenness * 350)}px
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// ============================================
// BUILDER VIEW
// ============================================
const BuilderView = ({ onBack }) => {
    const t = theme.light;
    const [baseImage, setBaseImage] = useState(null);
    const [hotspots, setHotspots] = useState([]);
    const [title, setTitle] = useState('My Reveal');
    const [editingHotspot, setEditingHotspot] = useState(null);
    const [isAddingHotspot, setIsAddingHotspot] = useState(false);
    const [savedProjects, setSavedProjects] = useState([]);
    const imageContainerRef = useRef(null);

    // Load saved projects from localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem('revealExplorerProjects');
            if (saved) {
                setSavedProjects(JSON.parse(saved));
            }
        } catch (e) {
            console.error('Failed to load saved projects:', e);
        }
    }, []);

    const handleImageUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            setBaseImage(event.target.result);
        };
        reader.readAsDataURL(file);
    };

    const handleCanvasClick = (e) => {
        if (!isAddingHotspot || !imageContainerRef.current) return;

        const rect = imageContainerRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        const newHotspot = {
            id: `hotspot-${Date.now()}`,
            x: Math.max(0, x - 5),
            y: Math.max(0, y - 5),
            width: 10,
            height: 10,
            shape: 'circle',
            label: `Hotspot ${hotspots.length + 1}`,
            description: 'Click to edit this description...',
        };

        setHotspots([...hotspots, newHotspot]);
        setEditingHotspot(newHotspot);
        setIsAddingHotspot(false);
    };

    const updateHotspot = (id, updates) => {
        setHotspots(hotspots.map(h => h.id === id ? { ...h, ...updates } : h));
        if (editingHotspot?.id === id) {
            setEditingHotspot({ ...editingHotspot, ...updates });
        }
    };

    const deleteHotspot = (id) => {
        setHotspots(hotspots.filter(h => h.id !== id));
        if (editingHotspot?.id === id) {
            setEditingHotspot(null);
        }
    };

    const saveProject = () => {
        const project = {
            id: `project-${Date.now()}`,
            title,
            baseImage,
            hotspots,
            mode: 'hotspots',
            createdAt: new Date().toISOString(),
        };

        const updatedProjects = [...savedProjects, project];
        setSavedProjects(updatedProjects);

        try {
            localStorage.setItem('revealExplorerProjects', JSON.stringify(updatedProjects));
            alert('Project saved successfully!');
        } catch (e) {
            alert('Failed to save project. Storage may be full.');
        }
    };

    const loadProject = (project) => {
        setTitle(project.title);
        setBaseImage(project.baseImage);
        setHotspots(project.hotspots || []);
        setEditingHotspot(null);
    };

    const deleteProject = (projectId) => {
        const updatedProjects = savedProjects.filter(p => p.id !== projectId);
        setSavedProjects(updatedProjects);
        localStorage.setItem('revealExplorerProjects', JSON.stringify(updatedProjects));
    };

    return (
        <div style={{ padding: spacing[6] }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: spacing[6],
                flexWrap: 'wrap',
                gap: spacing[4],
            }}>
                <div>
                    <button
                        onClick={onBack}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: t.accent.primary,
                            cursor: 'pointer',
                            fontSize: typography.size.sm,
                            padding: 0,
                            marginBottom: spacing[2],
                        }}
                    >
                        ← Back to Gallery
                    </button>
                    <h2 style={{
                        fontSize: typography.size['2xl'],
                        fontWeight: typography.weight.bold,
                        color: t.text.primary,
                        marginBottom: spacing[1],
                    }}>
                        Build Your Own Reveal
                    </h2>
                    <p style={{
                        color: t.text.secondary,
                        fontSize: typography.size.sm,
                    }}>
                        Upload an image and add interactive hotspots
                    </p>
                </div>

                <button
                    onClick={saveProject}
                    disabled={!baseImage || hotspots.length === 0}
                    style={{
                        background: baseImage && hotspots.length > 0
                            ? t.accent.primary
                            : t.bg.tertiary,
                        color: baseImage && hotspots.length > 0
                            ? t.text.inverse
                            : t.text.tertiary,
                        border: 'none',
                        borderRadius: borderRadius.lg,
                        padding: `${spacing[3]} ${spacing[5]}`,
                        fontSize: typography.size.sm,
                        fontWeight: typography.weight.semibold,
                        cursor: baseImage && hotspots.length > 0 ? 'pointer' : 'not-allowed',
                    }}
                >
                    Save Project
                </button>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 320px',
                gap: spacing[6],
            }}>
                {/* Main editor area */}
                <div>
                    {/* Title input */}
                    <div style={{ marginBottom: spacing[4] }}>
                        <label style={{
                            display: 'block',
                            fontSize: typography.size.sm,
                            fontWeight: typography.weight.medium,
                            color: t.text.secondary,
                            marginBottom: spacing[1],
                        }}>
                            Project Title
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            style={{
                                width: '100%',
                                padding: `${spacing[2]} ${spacing[3]}`,
                                border: `1px solid ${t.border.input}`,
                                borderRadius: borderRadius.md,
                                fontSize: typography.size.base,
                                fontFamily: typography.fontFamily,
                            }}
                        />
                    </div>

                    {/* Image area */}
                    <div
                        ref={imageContainerRef}
                        onClick={handleCanvasClick}
                        style={{
                            background: t.bg.tertiary,
                            borderRadius: borderRadius.xl,
                            minHeight: '400px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative',
                            cursor: isAddingHotspot ? 'crosshair' : 'default',
                            overflow: 'hidden',
                        }}
                    >
                        {baseImage ? (
                            <>
                                <img
                                    src={baseImage}
                                    alt="Base"
                                    style={{
                                        maxWidth: '100%',
                                        maxHeight: '500px',
                                        display: 'block',
                                    }}
                                />
                                {/* Hotspot overlays */}
                                {hotspots.map((hotspot, idx) => (
                                    <div
                                        key={hotspot.id}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingHotspot(hotspot);
                                        }}
                                        style={{
                                            position: 'absolute',
                                            left: `${hotspot.x}%`,
                                            top: `${hotspot.y}%`,
                                            width: `${hotspot.width}%`,
                                            height: `${hotspot.height}%`,
                                            borderRadius: hotspot.shape === 'circle' ? '50%' : borderRadius.md,
                                            border: `2px solid ${editingHotspot?.id === hotspot.id
                                                ? t.accent.primary
                                                : 'rgba(255,255,255,0.5)'}`,
                                            background: editingHotspot?.id === hotspot.id
                                                ? 'rgba(37, 99, 235, 0.3)'
                                                : 'rgba(255,255,255,0.1)',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <span style={{
                                            background: 'rgba(0,0,0,0.7)',
                                            color: '#fff',
                                            fontSize: typography.size.xs,
                                            fontWeight: typography.weight.bold,
                                            padding: `${spacing[1]} ${spacing[2]}`,
                                            borderRadius: borderRadius.full,
                                        }}>
                                            {idx + 1}
                                        </span>
                                    </div>
                                ))}
                            </>
                        ) : (
                            <div style={{ textAlign: 'center', padding: spacing[8] }}>
                                <p style={{
                                    color: t.text.secondary,
                                    marginBottom: spacing[4],
                                }}>
                                    Upload an image to get started
                                </p>
                                <label style={{
                                    background: t.accent.primary,
                                    color: t.text.inverse,
                                    padding: `${spacing[3]} ${spacing[5]}`,
                                    borderRadius: borderRadius.lg,
                                    cursor: 'pointer',
                                    fontSize: typography.size.sm,
                                    fontWeight: typography.weight.semibold,
                                }}>
                                    Choose Image
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        style={{ display: 'none' }}
                                    />
                                </label>
                            </div>
                        )}
                    </div>

                    {/* Add hotspot button */}
                    {baseImage && (
                        <div style={{ marginTop: spacing[4], display: 'flex', gap: spacing[3] }}>
                            <button
                                onClick={() => setIsAddingHotspot(!isAddingHotspot)}
                                style={{
                                    background: isAddingHotspot ? t.accent.warning : t.bg.primary,
                                    color: isAddingHotspot ? t.text.inverse : t.text.primary,
                                    border: `1px solid ${isAddingHotspot ? t.accent.warning : t.border.medium}`,
                                    borderRadius: borderRadius.lg,
                                    padding: `${spacing[2]} ${spacing[4]}`,
                                    cursor: 'pointer',
                                    fontSize: typography.size.sm,
                                    fontWeight: typography.weight.medium,
                                }}
                            >
                                {isAddingHotspot ? 'Click on image to place hotspot...' : '+ Add Hotspot'}
                            </button>
                            <label style={{
                                background: t.bg.primary,
                                color: t.text.primary,
                                border: `1px solid ${t.border.medium}`,
                                borderRadius: borderRadius.lg,
                                padding: `${spacing[2]} ${spacing[4]}`,
                                cursor: 'pointer',
                                fontSize: typography.size.sm,
                                fontWeight: typography.weight.medium,
                            }}>
                                Change Image
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    style={{ display: 'none' }}
                                />
                            </label>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[6] }}>
                    {/* Hotspot editor */}
                    {editingHotspot && (
                        <div style={{
                            background: t.bg.primary,
                            borderRadius: borderRadius.xl,
                            padding: spacing[5],
                            border: `1px solid ${t.border.subtle}`,
                        }}>
                            <h3 style={{
                                fontSize: typography.size.lg,
                                fontWeight: typography.weight.semibold,
                                color: t.text.primary,
                                marginBottom: spacing[4],
                            }}>
                                Edit Hotspot
                            </h3>

                            <div style={{ marginBottom: spacing[4] }}>
                                <label style={{
                                    display: 'block',
                                    fontSize: typography.size.sm,
                                    fontWeight: typography.weight.medium,
                                    color: t.text.secondary,
                                    marginBottom: spacing[1],
                                }}>
                                    Label
                                </label>
                                <input
                                    type="text"
                                    value={editingHotspot.label}
                                    onChange={(e) => updateHotspot(editingHotspot.id, { label: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: `${spacing[2]} ${spacing[3]}`,
                                        border: `1px solid ${t.border.input}`,
                                        borderRadius: borderRadius.md,
                                        fontSize: typography.size.sm,
                                        fontFamily: typography.fontFamily,
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: spacing[4] }}>
                                <label style={{
                                    display: 'block',
                                    fontSize: typography.size.sm,
                                    fontWeight: typography.weight.medium,
                                    color: t.text.secondary,
                                    marginBottom: spacing[1],
                                }}>
                                    Description
                                </label>
                                <textarea
                                    value={editingHotspot.description}
                                    onChange={(e) => updateHotspot(editingHotspot.id, { description: e.target.value })}
                                    rows={4}
                                    style={{
                                        width: '100%',
                                        padding: `${spacing[2]} ${spacing[3]}`,
                                        border: `1px solid ${t.border.input}`,
                                        borderRadius: borderRadius.md,
                                        fontSize: typography.size.sm,
                                        fontFamily: typography.fontFamily,
                                        resize: 'vertical',
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: spacing[4] }}>
                                <label style={{
                                    display: 'block',
                                    fontSize: typography.size.sm,
                                    fontWeight: typography.weight.medium,
                                    color: t.text.secondary,
                                    marginBottom: spacing[2],
                                }}>
                                    Shape
                                </label>
                                <div style={{ display: 'flex', gap: spacing[2] }}>
                                    {['circle', 'rect'].map(shape => (
                                        <button
                                            key={shape}
                                            onClick={() => updateHotspot(editingHotspot.id, { shape })}
                                            style={{
                                                flex: 1,
                                                padding: spacing[2],
                                                background: editingHotspot.shape === shape
                                                    ? t.accent.primary
                                                    : t.bg.tertiary,
                                                color: editingHotspot.shape === shape
                                                    ? t.text.inverse
                                                    : t.text.primary,
                                                border: 'none',
                                                borderRadius: borderRadius.md,
                                                cursor: 'pointer',
                                                fontSize: typography.size.sm,
                                                textTransform: 'capitalize',
                                            }}
                                        >
                                            {shape === 'rect' ? 'Rectangle' : 'Circle'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={() => deleteHotspot(editingHotspot.id)}
                                style={{
                                    width: '100%',
                                    padding: spacing[2],
                                    background: t.accent.errorLight,
                                    color: t.accent.error,
                                    border: 'none',
                                    borderRadius: borderRadius.md,
                                    cursor: 'pointer',
                                    fontSize: typography.size.sm,
                                    fontWeight: typography.weight.medium,
                                }}
                            >
                                Delete Hotspot
                            </button>
                        </div>
                    )}

                    {/* Hotspots list */}
                    <div style={{
                        background: t.bg.primary,
                        borderRadius: borderRadius.xl,
                        padding: spacing[5],
                        border: `1px solid ${t.border.subtle}`,
                    }}>
                        <h3 style={{
                            fontSize: typography.size.lg,
                            fontWeight: typography.weight.semibold,
                            color: t.text.primary,
                            marginBottom: spacing[4],
                        }}>
                            Hotspots ({hotspots.length})
                        </h3>

                        {hotspots.length === 0 ? (
                            <p style={{
                                color: t.text.tertiary,
                                fontSize: typography.size.sm,
                                textAlign: 'center',
                                padding: spacing[4],
                            }}>
                                No hotspots yet. Add one to get started.
                            </p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
                                {hotspots.map((hotspot, idx) => (
                                    <button
                                        key={hotspot.id}
                                        onClick={() => setEditingHotspot(hotspot)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: spacing[2],
                                            padding: spacing[2],
                                            background: editingHotspot?.id === hotspot.id
                                                ? t.accent.infoLight
                                                : t.bg.tertiary,
                                            border: `1px solid ${editingHotspot?.id === hotspot.id
                                                ? t.accent.info
                                                : 'transparent'}`,
                                            borderRadius: borderRadius.md,
                                            cursor: 'pointer',
                                            width: '100%',
                                            textAlign: 'left',
                                        }}
                                    >
                                        <span style={{
                                            background: t.text.tertiary,
                                            color: '#fff',
                                            width: '20px',
                                            height: '20px',
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: typography.size.xs,
                                            fontWeight: typography.weight.bold,
                                            flexShrink: 0,
                                        }}>
                                            {idx + 1}
                                        </span>
                                        <span style={{
                                            fontSize: typography.size.sm,
                                            color: t.text.primary,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}>
                                            {hotspot.label}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Saved projects */}
                    {savedProjects.length > 0 && (
                        <div style={{
                            background: t.bg.primary,
                            borderRadius: borderRadius.xl,
                            padding: spacing[5],
                            border: `1px solid ${t.border.subtle}`,
                        }}>
                            <h3 style={{
                                fontSize: typography.size.lg,
                                fontWeight: typography.weight.semibold,
                                color: t.text.primary,
                                marginBottom: spacing[4],
                            }}>
                                Saved Projects
                            </h3>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
                                {savedProjects.map((project) => (
                                    <div
                                        key={project.id}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: spacing[2],
                                            background: t.bg.tertiary,
                                            borderRadius: borderRadius.md,
                                        }}
                                    >
                                        <button
                                            onClick={() => loadProject(project)}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                fontSize: typography.size.sm,
                                                color: t.text.primary,
                                                textAlign: 'left',
                                                flex: 1,
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {project.title}
                                        </button>
                                        <button
                                            onClick={() => deleteProject(project.id)}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                color: t.accent.error,
                                                fontSize: typography.size.sm,
                                                padding: spacing[1],
                                            }}
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ============================================
// MAIN COMPONENT
// ============================================
export default function RevealExplorer() {
    const t = theme.light;
    const [view, setView] = useState('gallery'); // 'gallery' | 'explorer' | 'builder'
    const [selectedExample, setSelectedExample] = useState(null);

    const handleSelectExample = (example) => {
        setSelectedExample(example);
        // Route to appropriate view based on example mode
        if (example.mode === 'spotlight') {
            setView('spotlight-explorer');
        } else {
            setView('explorer');
        }
    };

    const handleBack = () => {
        setSelectedExample(null);
        setView('gallery');
    };

    return (
        <>
            {/* MediaPipe Scripts for Hand Tracking */}
            <Script
                src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js"
                crossOrigin="anonymous"
                strategy="afterInteractive"
            />
            <Script
                src="https://cdn.jsdelivr.net/npm/@mediapipe/control_utils/control_utils.js"
                crossOrigin="anonymous"
                strategy="afterInteractive"
            />
            <Script
                src="https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js"
                crossOrigin="anonymous"
                strategy="afterInteractive"
            />
            <Script
                src="https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js"
                crossOrigin="anonymous"
                strategy="afterInteractive"
            />

            <div style={{
                minHeight: '100vh',
                background: t.bg.secondary,
                fontFamily: typography.fontFamily,
            }}>
            {/* Header */}
            <header style={{
                background: t.bg.primary,
                borderBottom: `1px solid ${t.border.subtle}`,
                padding: `${spacing[4]} ${spacing[6]}`,
            }}>
                <div style={{
                    maxWidth: '1200px',
                    margin: '0 auto',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: spacing[4],
                }}>
                    <div>
                        <h1 style={{
                            fontSize: typography.size.xl,
                            fontWeight: typography.weight.bold,
                            color: t.text.primary,
                            margin: 0,
                            display: 'flex',
                            alignItems: 'center',
                            gap: spacing[2],
                        }}>
                            <span></span> Reveal Explorer
                        </h1>
                        <p style={{
                            fontSize: typography.size.sm,
                            color: t.text.secondary,
                            margin: `${spacing[1]} 0 0 0`,
                        }}>
                            Discover hidden details through interactive exploration
                        </p>
                    </div>

                    {/* View tabs */}
                    <div style={{
                        display: 'flex',
                        gap: spacing[2],
                        background: t.bg.tertiary,
                        padding: spacing[1],
                        borderRadius: borderRadius.lg,
                    }}>
                        {[
                            { id: 'gallery', label: 'Gallery', icon: '' },
                            { id: 'spotlight', label: 'Spotlight', icon: '' },
                            { id: 'builder', label: 'Hotspots', icon: '' },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    setView(tab.id);
                                    setSelectedExample(null);
                                }}
                                style={{
                                    background: view === tab.id || (view === 'explorer' && tab.id === 'gallery')
                                        ? t.bg.primary
                                        : 'transparent',
                                    border: 'none',
                                    borderRadius: borderRadius.md,
                                    padding: `${spacing[2]} ${spacing[3]}`,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: spacing[1],
                                    fontSize: typography.size.sm,
                                    fontWeight: typography.weight.medium,
                                    color: view === tab.id || (view === 'explorer' && tab.id === 'gallery')
                                        ? t.text.primary
                                        : t.text.secondary,
                                    transition: `all ${transitions.fast}`,
                                    boxShadow: view === tab.id || (view === 'explorer' && tab.id === 'gallery')
                                        ? t.shadow.sm
                                        : 'none',
                                }}
                            >
                                <span>{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            {/* Content */}
            <main style={{ maxWidth: '1200px', margin: '0 auto' }}>
                {view === 'gallery' && (
                    <GalleryView onSelectExample={handleSelectExample} />
                )}
                {view === 'explorer' && selectedExample && (
                    <ExplorerView example={selectedExample} onBack={handleBack} />
                )}
                {view === 'spotlight-explorer' && selectedExample && (
                    <SpotlightExplorerView example={selectedExample} onBack={handleBack} />
                )}
                {view === 'spotlight' && (
                    <SpotlightBuilderView onBack={handleBack} />
                )}
                {view === 'builder' && (
                    <BuilderView onBack={handleBack} />
                )}
            </main>

            {/* Help section */}
            {view === 'gallery' && (
                <section style={{
                    maxWidth: '1200px',
                    margin: '0 auto',
                    padding: `0 ${spacing[6]} ${spacing[8]}`,
                }}>
                    <div style={{
                        background: t.bg.primary,
                        borderRadius: borderRadius.xl,
                        padding: spacing[6],
                        border: `1px solid ${t.border.subtle}`,
                    }}>
                        <h2 style={{
                            fontSize: typography.size.lg,
                            fontWeight: typography.weight.semibold,
                            color: t.text.primary,
                            marginBottom: spacing[4],
                        }}>
                            How to Use
                        </h2>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                            gap: spacing[6],
                        }}>
                            <div>
                                <div style={{
                                    fontSize: '1.5rem',
                                    marginBottom: spacing[2],
                                }}></div>
                                <h3 style={{
                                    fontSize: typography.size.base,
                                    fontWeight: typography.weight.semibold,
                                    color: t.text.primary,
                                    marginBottom: spacing[2],
                                }}>
                                    Explore Examples
                                </h3>
                                <p style={{
                                    fontSize: typography.size.sm,
                                    color: t.text.secondary,
                                    lineHeight: typography.lineHeight.relaxed,
                                    margin: 0,
                                }}>
                                    Click on pre-built examples to discover equipment anatomy, DAW interfaces, and audio concepts through interactive hotspots.
                                </p>
                            </div>
                            <div>
                                <div style={{
                                    fontSize: '1.5rem',
                                    marginBottom: spacing[2],
                                }}></div>
                                <h3 style={{
                                    fontSize: typography.size.base,
                                    fontWeight: typography.weight.semibold,
                                    color: t.text.primary,
                                    marginBottom: spacing[2],
                                }}>
                                    Discover Hotspots
                                </h3>
                                <p style={{
                                    fontSize: typography.size.sm,
                                    color: t.text.secondary,
                                    lineHeight: typography.lineHeight.relaxed,
                                    margin: 0,
                                }}>
                                    Click numbered zones to reveal explanations. Track your discovery progress and learn about each component.
                                </p>
                            </div>
                            <div>
                                <div style={{
                                    fontSize: '1.5rem',
                                    marginBottom: spacing[2],
                                }}></div>
                                <h3 style={{
                                    fontSize: typography.size.base,
                                    fontWeight: typography.weight.semibold,
                                    color: t.text.primary,
                                    marginBottom: spacing[2],
                                }}>
                                    Build Your Own
                                </h3>
                                <p style={{
                                    fontSize: typography.size.sm,
                                    color: t.text.secondary,
                                    lineHeight: typography.lineHeight.relaxed,
                                    margin: 0,
                                }}>
                                    Upload any image and add your own hotspots with custom labels and descriptions. Save projects locally for future study.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            )}
        </div>
        </>
    );
}
