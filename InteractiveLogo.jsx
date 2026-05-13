"use client";

import React, { useEffect, useRef } from 'react';

export default function InteractiveLogo() {
  const containerRef = useRef(null);
  const solDotRef = useRef(null);
  const worldDotRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!containerRef.current || !solDotRef.current || !worldDotRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.width === 0) return;

      const mouseX = e.clientX;
      const mouseY = e.clientY;

      // Anchor points (Percentages matching the holes in the image)
      const solX = rect.left + (rect.width * 0.495);
      const solY = rect.top + (rect.height * 0.285);
      const worldX = rect.left + (rect.width * 0.442);
      const worldY = rect.top + (rect.height * 0.685);

      // Maximum travel distance relative to image size
      const maxTravel = rect.width * 0.035;

      // Calculate SOL Dot
      const sDx = mouseX - solX;
      const sDy = mouseY - solY;
      const sAngle = Math.atan2(sDy, sDx);
      const sDist = Math.min(Math.sqrt(sDx * sDx + sDy * sDy), maxTravel);
      solDotRef.current.style.transform = `translate(${Math.cos(sAngle) * sDist}px, ${Math.sin(sAngle) * sDist}px)`;

      // Calculate WORLD Dot
      const wDx = mouseX - worldX;
      const wDy = mouseY - worldY;
      const wAngle = Math.atan2(wDy, wDx);
      const wDist = Math.min(Math.sqrt(wDx * wDx + wDy * wDy), maxTravel);
      worldDotRef.current.style.transform = `translate(${Math.cos(wAngle) * wDist}px, ${Math.sin(wAngle) * wDist}px)`;
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', maxWidth: '800px', margin: '0 auto', lineHeight: 0 }}>
      
      <img 
        src="assets/sol-world-base.png" 
        alt="SOL WORLD" 
        style={{ width: '100%', height: 'auto', display: 'block', pointerEvents: 'none' }} 
      />
      
      {/* SOL DOT ANCHOR */}
      <div style={{ position: 'absolute', top: '28.5%', left: '49.5%', width: 0, height: 0 }}>
        <div 
          ref={solDotRef} 
          style={{ position: 'absolute', width: '22px', height: '22px', backgroundColor: '#ffffff', borderRadius: '50%', marginLeft: '-11px', marginTop: '-11px', pointerEvents: 'none', transition: 'transform 0.15s ease-out', willChange: 'transform' }}
        ></div>
      </div>

      {/* WORLD DOT ANCHOR */}
      <div style={{ position: 'absolute', top: '68.5%', left: '44.2%', width: 0, height: 0 }}>
        <div 
          ref={worldDotRef} 
          style={{ position: 'absolute', width: '34px', height: '34px', backgroundColor: '#050505', borderRadius: '50%', marginLeft: '-17px', marginTop: '-17px', pointerEvents: 'none', transition: 'transform 0.15s ease-out', willChange: 'transform' }}
        ></div>
      </div>

    </div>
  );
}
