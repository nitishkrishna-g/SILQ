'use client';

import React, { useEffect, useState, useRef } from 'react';
import styles from './Starfield.module.css';

interface StarfieldProps {
    starCount?: number;
}

export default function Starfield({ starCount = 100 }: StarfieldProps) {
    const [stars, setStars] = useState<{ x: number; y: number; size: number; opacity: number; depth: number; animationDelay: number }[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);
    const requestRef = useRef<number | undefined>(undefined);
    const mousePos = useRef({ x: 0, y: 0 });
    const targetMousePos = useRef({ x: 0, y: 0 });

    useEffect(() => {
        // Generate initial stars
        const newStars = Array.from({ length: starCount }).map(() => ({
            x: Math.random() * 100, // percentage
            y: Math.random() * 100, // percentage
            size: Math.random() * 2 + 0.5, // 0.5px to 2.5px
            opacity: Math.random() * 0.8 + 0.2,
            depth: Math.random() * 3 + 1, // depth factor for parallax
            animationDelay: Math.random() * 5,
        }));
        const timer = setTimeout(() => {
            setStars(newStars);
        }, 0);
        return () => clearTimeout(timer);

        // Smooth mouse follow logic
        const animate = () => {
            // Ease mouse position
            mousePos.current.x += (targetMousePos.current.x - mousePos.current.x) * 0.05;
            mousePos.current.y += (targetMousePos.current.y - mousePos.current.y) * 0.05;

            if (containerRef.current) {
                // Apply transform based on eased mouse position
                containerRef.current.style.transform = `translate(${mousePos.current.x * -1}px, ${mousePos.current.y * -1}px)`;
            }

            requestRef.current = requestAnimationFrame(animate);
        };

        requestRef.current = requestAnimationFrame(animate);

        const handleMouseMove = (e: MouseEvent) => {
            // Calculate offset from center (-0.5 to 0.5 roughly)
            const x = (e.clientX / window.innerWidth) - 0.5;
            const y = (e.clientY / window.innerHeight) - 0.5;

            // Control maximum parallax offset (increased movement)
            targetMousePos.current = { x: x * 90, y: y * 90 };
        };

        window.addEventListener('mousemove', handleMouseMove);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [starCount]);

    return (
        <div className={styles.starfieldContainer}>
            <div ref={containerRef} className={styles.starLayer}>
                {stars.map((star, i) => (
                    <div
                        key={i}
                        className={styles.star}
                        style={{
                            left: `${star.x}%`,
                            top: `${star.y}%`,
                            width: `${star.size}px`,
                            height: `${star.size}px`,
                            opacity: star.opacity,
                            // Different depths move at different speeds (parallax effect)
                            transform: `translateZ(${star.depth * 10}px)`,
                            animationDelay: `${star.animationDelay}s`,
                        }}
                    />
                ))}
            </div>
        </div>
    );
}
