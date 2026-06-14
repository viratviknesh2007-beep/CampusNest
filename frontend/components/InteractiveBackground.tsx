"use client";

import React, { useState, useEffect, useRef } from "react";
import { Shield, Brain, QrCode, Home as HomeIcon } from "lucide-react";

function ConstellationCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
    }> = [];

    const particleCount = 45;
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 2 + 1,
      });
    }

    let mouseX = 0;
    let mouseY = 0;
    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };
    window.addEventListener("mousemove", handleMouseMove);

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw connections - soft clean lines
      ctx.strokeStyle = "rgba(148, 163, 184, 0.08)";
      ctx.lineWidth = 0.8;

      particles.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(148, 163, 184, 0.25)";
        ctx.fill();

        for (let j = idx + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist < 110) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }

        const mouseDist = Math.hypot(p.x - mouseX, p.y - mouseY);
        if (mouseDist < 160) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mouseX, mouseY);
          ctx.strokeStyle = `rgba(16, 185, 129, ${(1 - mouseDist / 160) * 0.12})`;
          ctx.stroke();
          ctx.strokeStyle = "rgba(148, 163, 184, 0.08)";
        }
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />;
}

export default function InteractiveBackground() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [spotlightPos, setSpotlightPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX - window.innerWidth / 2) * 0.015,
        y: (e.clientY - window.innerHeight / 2) * 0.015,
      });
      setSpotlightPos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <>
      {/* Animated Mesh Gradient Background */}
      <div className="absolute inset-0 mesh-bg opacity-75 z-0 pointer-events-none" />

      {/* Parallax Background Elements */}
      <div
        className="absolute inset-0 pointer-events-none z-0 transition-transform duration-300 ease-out"
        style={{ transform: `translate(${mousePos.x * 0.8}px, ${mousePos.y * 0.8}px)` }}
      >
        {/* Soft glowing pulsing orbs */}
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-slate-800/10 rounded-full blur-[110px] animate-pulse-glow" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-emerald-950/10 rounded-full blur-[130px] animate-pulse-glow" style={{ animationDelay: "-3s" }} />

        {/* Ambient Light streaks */}
        <div className="streak streak-1" />
        <div className="streak streak-1 particle-delay-2" style={{ left: "65%", animationDelay: "4s" }} />

        {/* Floating Geometric shapes */}
        <div className="absolute top-12 left-1/3 w-16 h-16 border border-slate-800/20 rounded-full flex items-center justify-center opacity-40 animate-float">
          <div className="w-10 h-10 border border-slate-700/20 rounded-full" />
        </div>
        <div className="absolute bottom-24 right-1/3 w-20 h-20 border border-slate-700/20 rotate-12 flex items-center justify-center opacity-30 animate-float" style={{ animationDelay: "-2s" }}>
          <div className="w-12 h-12 border border-slate-800/20" />
        </div>

        {/* Floating hostel icons with very low opacity */}
        <div className="absolute top-1/3 left-10 opacity-5 animate-float"><HomeIcon className="h-16 w-16 text-slate-500" /></div>
        <div className="absolute top-20 right-20 opacity-5 animate-float" style={{ animationDelay: "-1s" }}><Shield className="h-14 w-14 text-emerald-500" /></div>
        <div className="absolute bottom-1/3 left-20 opacity-5 animate-float" style={{ animationDelay: "-3s" }}><Brain className="h-14 w-14 text-slate-500" /></div>
        <div className="absolute bottom-20 right-10 opacity-5 animate-float" style={{ animationDelay: "-2s" }}><QrCode className="h-16 w-16 text-emerald-500" /></div>

        {/* Floating Sparks */}
        <div className="particle particle-1" />
        <div className="particle particle-2" />
        <div className="particle particle-3" />
        <div className="particle particle-4" />
        <div className="particle particle-5" />
      </div>

      {/* Constellation & Star Network Canvas */}
      <ConstellationCanvas />

      {/* Cursor Spotlight Glow */}
      <div
        className="fixed inset-0 pointer-events-none z-0 transition-opacity duration-300"
        style={{
          background: `radial-gradient(650px at ${spotlightPos.x}px ${spotlightPos.y}px, rgba(148, 163, 184, 0.04), transparent 70%)`,
        }}
      />

      {/* Animated Skyline Silhouette at the bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-40 opacity-10 pointer-events-none z-0 flex items-end">
        <svg className="w-full h-full text-slate-800/30" viewBox="0 0 1440 200" fill="currentColor" preserveAspectRatio="none">
          <path d="M0 200V150l20-10h15l10 10h30l5-25h40l10 25h35l15-35h50l20 35h45l5-40h60l10 40h40l10-50h70l20 50h30l5-15h50l10 15h45l20-60h60l15 60h40l10-30h50l15 30h40l15-20h60l10 20h35l20-75h55l20 75h40l10-40h50l15 40h35l10-15h60l15 15h45l20-30h60l15 30h40v50z" />
          <circle cx="45" cy="165" r="1.5" className="fill-emerald-500/40 animate-ping" />
          <circle cx="120" cy="140" r="1.5" className="fill-rose-500/40 animate-pulse" />
          <circle cx="340" cy="130" r="1.5" className="fill-emerald-500/40 animate-pulse" />
          <circle cx="680" cy="110" r="1.5" className="fill-emerald-500/40 animate-ping" />
          <circle cx="980" cy="120" r="1.5" className="fill-rose-500/40 animate-pulse" />
          <circle cx="1240" cy="90" r="1.5" className="fill-emerald-500/40 animate-pulse" />
        </svg>
      </div>
    </>
  );
}
