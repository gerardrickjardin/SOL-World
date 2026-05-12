"use client";

import React from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

export default function InteractiveLogo() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Normalize between -1 and 1
    mouseX.set((e.clientX - centerX) / (rect.width / 2));
    mouseY.set((e.clientY - centerY) / (rect.height / 2));
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const springConfig = { damping: 30, stiffness: 100, mass: 0.8 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  // Responsive parallax limits using percentages relative to the dot's own size
  // This ensures the parallax scales perfectly on mobile and desktop
  const solX = useTransform(smoothX, [-1, 1], ["-50%", "50%"]);
  const solY = useTransform(smoothY, [-1, 1], ["-50%", "50%"]);
  
  const worldX = useTransform(smoothX, [-1, 1], ["-45%", "45%"]);
  const worldY = useTransform(smoothY, [-1, 1], ["-45%", "45%"]);

  return (
    <div 
      className="logo-container hero-main-logo-anim"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ 
        display: 'grid',
        width: '100%', 
        maxWidth: '600px', 
        margin: '0 auto',
        cursor: 'default'
      }}
    >
      <img 
        src="assets/sol-world-base.png" 
        alt="SOL World Base" 
        style={{ 
          gridArea: '1 / 1',
          width: '100%', 
          height: 'auto', 
          display: 'block', 
          pointerEvents: 'none',
          userSelect: 'none'
        }} 
      />
      
      <div
        style={{
          gridArea: '1 / 1',
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          pointerEvents: 'none'
        }}
      >
        {/* --- SOL Dot Alignment --- */}
        {/* Uses the tuned CSS variable for the exact vertical center */}
        <div style={{ height: 'var(--sol-top, 28%)' }} />
        
        {/* The padding trick perfectly aligns the horizontal center using the left variable without absolute positioning */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: 0,
          paddingRight: 'calc(100% - (var(--sol-left, 50%) * 2))'
        }}>
          {/* Hole Container sets the bounds relative to the logo width */}
          <div style={{ width: 'var(--sol-width, 16%)', aspectRatio: '1/1', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {/* The actual dot scales as a percentage of the hole */}
            <motion.div
              style={{
                width: 'var(--dot-width, 40%)',
                height: 'var(--dot-width, 40%)',
                backgroundColor: '#ffffff',
                borderRadius: '50%',
                x: solX,
                y: solY,
              }}
            />
          </div>
        </div>

        {/* --- WORLD Dot Alignment --- */}
        {/* The height spacer is exactly the gap between the two centers */}
        <div style={{ height: 'calc(var(--world-top, 73%) - var(--sol-top, 28%))' }} />
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: 0, 
          paddingRight: 'calc(100% - (var(--world-left, 36%) * 2))' 
        }}>
          {/* Hole Container for WORLD */}
          <div style={{ width: 'var(--world-width, 16%)', aspectRatio: '1/1', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <motion.div
              style={{
                width: 'var(--dot-width, 40%)',
                height: 'var(--dot-width, 40%)',
                backgroundColor: '#050505',
                borderRadius: '50%',
                x: worldX,
                y: worldY,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
