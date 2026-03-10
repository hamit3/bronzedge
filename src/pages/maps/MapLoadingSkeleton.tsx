import React from "react";
import { Spin } from "antd";

export const MapLoadingSkeleton: React.FC = () => {
  return (
    <div style={{
      width: "100%",
      height: "100%",
      backgroundColor: "#0b0e14",
      position: "relative",
      overflow: "hidden",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}>
      {/* Scanline Effect */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))",
        zIndex: 4,
        backgroundSize: "100% 2px, 3px 100%",
        pointerEvents: "none",
      }} />

      {/* Grid Background Effect */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `
          linear-gradient(to right, rgba(248, 134, 1, 0.05) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(248, 134, 1, 0.05) 1px, transparent 1px)
        `,
        backgroundSize: "50px 50px",
        opacity: 0.8,
      }} />

      {/* Pulsing Radar Ring */}
      <div className="radar-animation" style={{
        position: "absolute",
        width: "300px",
        height: "300px",
        borderRadius: "50%",
        border: "1px solid rgba(248, 134, 1, 0.3)",
        animation: "radar-pulse 4s infinite cubic-bezier(0.4, 0, 0.2, 1)",
        zIndex: 1,
      }} />
      <div className="radar-animation-delayed" style={{
        position: "absolute",
        width: "300px",
        height: "300px",
        borderRadius: "50%",
        border: "1px solid rgba(248, 134, 1, 0.15)",
        animation: "radar-pulse 4s infinite cubic-bezier(0.4, 0, 0.2, 1) 2s",
        zIndex: 1,
      }} />

      {/* Rotating Compass Ring */}
      <div style={{
        position: "absolute",
        width: "350px",
        height: "350px",
        borderRadius: "50%",
        border: "1px dashed rgba(248, 134, 1, 0.1)",
        animation: "rotate-slow 20s infinite linear",
        zIndex: 0,
      }} />

      {/* Central Marker Shadow */}
      <div className="central-glow" style={{
        width: "8px",
        height: "8px",
        backgroundColor: "#f88601",
        borderRadius: "50%",
        boxShadow: "0 0 30px #f88601, 0 0 60px rgba(248, 134, 1, 0.4)",
        zIndex: 2,
      }} />

      {/* Loading Text Overlay */}
      <div style={{
        position: "absolute",
        bottom: "60px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "20px",
        zIndex: 10,
      }}>
        <div style={{ position: 'relative' }}>
            <Spin 
                size="large" 
                style={{ 
                    color: "#f88601",
                    transform: "scale(1.4)"
                }} 
            />
            <div className="spin-glow" />
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <div className="glitch-text" data-text="CALIBRATING ORBITAL SENSORS" style={{
                color: "#f88601",
                fontSize: "14px",
                fontWeight: 700,
                letterSpacing: "3px",
                textTransform: "uppercase",
                fontFamily: "'Courier New', Courier, monospace",
                textShadow: "0 0 10px rgba(248, 134, 1, 0.5)"
            }}>
                CALIBRATING ORBITAL SENSORS
            </div>
            <div style={{
                color: "rgba(255,255,255,0.4)",
                fontSize: "10px",
                letterSpacing: "4px",
                textTransform: "uppercase",
                fontFamily: "Inter, sans-serif"
            }}>
                ESTABLISHING SECURE UPLINK...
            </div>
        </div>
      </div>

      <style>{`
        @keyframes radar-pulse {
          0% {
            transform: scale(0.2);
            opacity: 0;
          }
          10% {
            opacity: 0.8;
          }
          100% {
            transform: scale(3.5);
            opacity: 0;
          }
        }

        @keyframes rotate-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .central-glow {
            animation: glow-pulse 2s infinite ease-in-out;
        }

        @keyframes glow-pulse {
            0%, 100% { transform: scale(1); opacity: 0.8; }
            50% { transform: scale(1.5); opacity: 1; filter: blur(2px); }
        }

        .spin-glow {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 40px;
            height: 40px;
            background: radial-gradient(circle, rgba(248, 134, 1, 0.2) 0%, transparent 70%);
            border-radius: 50%;
            z-index: -1;
            filter: blur(5px);
        }

        .glitch-text {
            position: relative;
        }
        
        .glitch-text::before, .glitch-text::after {
            content: attr(data-text);
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            opacity: 0.8;
        }
        
        .glitch-text::before {
            color: #0ff;
            z-index: -1;
            animation: glitch-anim 3s infinite linear alternate-reverse;
        }
        
        .glitch-text::after {
            color: #f0f;
            z-index: -2;
            animation: glitch-anim2 2s infinite linear alternate-reverse;
        }

        @keyframes glitch-anim {
            0% { clip: rect(20px, 9999px, 10px, 0); transform: translate(-2px, -1px); }
            20% { clip: rect(40px, 9999px, 30px, 0); transform: translate(2px, 1px); }
            100% { clip: rect(10px, 9999px, 50px, 0); transform: translate(-1px, 2px); }
        }

        @keyframes glitch-anim2 {
            0% { clip: rect(10px, 9999px, 30px, 0); transform: translate(2px, 1px); }
            50% { clip: rect(30px, 9999px, 10px, 0); transform: translate(-2px, -1px); }
            100% { clip: rect(50px, 9999px, 40px, 0); transform: translate(1px, -2px); }
        }
        
        .radar-animation, .radar-animation-delayed {
          box-shadow: 0 0 120px rgba(248, 134, 1, 0.15) inset;
        }
      `}</style>
    </div>
  );
};
