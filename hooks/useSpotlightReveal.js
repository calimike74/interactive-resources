'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Shared hook for canvas-based spotlight reveal effect.
 * Extracted from RevealExplorer for reuse across components.
 *
 * Returns refs, state, and handlers needed to render a spotlight
 * that follows the cursor and reveals a hidden image layer.
 */
export default function useSpotlightReveal({
    baseImage,
    revealImage,
    maskSize = 280,
    maskShape = 'circle',
    enableParallax = true,
}) {
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

    // Animation loop
    useEffect(() => {
        if (!imagesLoaded) return;

        const animate = () => {
            smoothPos.current.x += (mousePos.x - smoothPos.current.x) * 0.15;
            smoothPos.current.y += (mousePos.y - smoothPos.current.y) * 0.15;

            const canvas = canvasRef.current;
            if (!canvas || !baseImgRef.current || !revealImgRef.current) {
                animationRef.current = requestAnimationFrame(animate);
                return;
            }

            const ctx = canvas.getContext('2d');
            const { width, height } = canvas;

            ctx.clearRect(0, 0, width, height);
            ctx.drawImage(baseImgRef.current, 0, 0, width, height);

            if (isMouseInside) {
                ctx.save();
                ctx.beginPath();
                if (maskShape === 'circle') {
                    ctx.arc(smoothPos.current.x, smoothPos.current.y, maskSize / 2, 0, Math.PI * 2);
                } else {
                    ctx.rect(
                        smoothPos.current.x - maskSize / 2,
                        smoothPos.current.y - maskSize / 2,
                        maskSize,
                        maskSize
                    );
                }
                ctx.clip();
                ctx.drawImage(revealImgRef.current, 0, 0, width, height);

                // Soft edge glow
                const gradient = ctx.createRadialGradient(
                    smoothPos.current.x, smoothPos.current.y, maskSize / 2 - 10,
                    smoothPos.current.x, smoothPos.current.y, maskSize / 2
                );
                gradient.addColorStop(0, 'rgba(255,255,255,0)');
                gradient.addColorStop(1, 'rgba(255,255,255,0.3)');
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
    }, [imagesLoaded, mousePos, maskSize, maskShape, isMouseInside]);

    const handleMouseMove = useCallback((e) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const canvas = canvasRef.current;
        if (!canvas) return;

        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        const newX = (e.clientX - rect.left) * scaleX;
        const newY = (e.clientY - rect.top) * scaleY;

        if (!isMouseInside) {
            smoothPos.current = { x: newX, y: newY };
            setIsMouseInside(true);
        }

        setMousePos({ x: newX, y: newY });

        if (enableParallax) {
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const parallaxStrength = 12;
            setParallaxOffset({
                x: ((newX - centerX) / centerX) * parallaxStrength,
                y: ((newY - centerY) / centerY) * parallaxStrength,
            });
        }
    }, [enableParallax, isMouseInside]);

    const handleMouseLeave = useCallback(() => {
        setIsMouseInside(false);
        if (enableParallax) {
            setParallaxOffset({ x: 0, y: 0 });
        }
    }, [enableParallax]);

    return {
        canvasRef,
        containerRef,
        smoothPos,
        mousePos,
        isMouseInside,
        imagesLoaded,
        size,
        parallaxOffset,
        handleMouseMove,
        handleMouseLeave,
    };
}
