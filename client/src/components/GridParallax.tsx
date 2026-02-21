'use client';

import React, { useEffect, useRef } from 'react';
import styles from './GridParallax.module.css';

interface GridParallaxProps {
    opacity?: number;
}

export default function GridParallax({ opacity = 0.8 }: GridParallaxProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const requestRef = useRef<number | undefined>(undefined);
    const mousePos = useRef({ x: 0, y: 0 });
    const targetMousePos = useRef({ x: 0, y: 0 });

    useEffect(() => {
        // Smooth mouse follow logic (parallax)
        const animate = () => {
            mousePos.current.x += (targetMousePos.current.x - mousePos.current.x) * 0.05;
            mousePos.current.y += (targetMousePos.current.y - mousePos.current.y) * 0.05;

            if (containerRef.current) {
                containerRef.current.style.transform = `translate(${mousePos.current.x * -1}px, ${mousePos.current.y * -1}px)`;
            }

            requestRef.current = requestAnimationFrame(animate);
        };

        requestRef.current = requestAnimationFrame(animate);

        const handleMouseMove = (e: MouseEvent) => {
            const x = (e.clientX / window.innerWidth) - 0.5;
            const y = (e.clientY / window.innerHeight) - 0.5;

            // Control maximum parallax offset (blueprint should be subtle)
            targetMousePos.current = { x: x * 20, y: y * 20 };
        };

        window.addEventListener('mousemove', handleMouseMove);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, []);

    return (
        <div className={styles.container} style={{ opacity }}>
            <div ref={containerRef} className={styles.layer}>
                {/* The grid is drawn using CSS backgrounds in the layer */}
            </div>

            {/* Optional faint vignette to soften the edges */}
            <div className={styles.vignette} />
        </div>
    );
}
