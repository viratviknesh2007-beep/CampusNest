"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, User, Key, ArrowRight, Activity, Moon, BookOpen, Mail, Lock, Eye, EyeOff, BarChart2, Brain, QrCode, Home as HomeIcon } from "lucide-react";

// Constellation Background Component
function ConstellationBackground() {
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

      // Draw connections
      ctx.strokeStyle = "rgba(164, 125, 171, 0.08)";
      ctx.lineWidth = 0.8;

      particles.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(164, 125, 171, 0.35)";
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
          ctx.strokeStyle = `rgba(130, 171, 125, ${(1 - mouseDist / 160) * 0.16})`;
          ctx.stroke();
          ctx.strokeStyle = "rgba(164, 125, 171, 0.08)";
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

export default function Home() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Parallax mouse position refs
  const containerRef = useRef<HTMLDivElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);

  // Register state
  const [fullName, setFullName] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [gender, setGender] = useState("Male");
  const [dept, setDept] = useState("Computer Science");
  const [year, setYear] = useState(1);
  const [phone, setPhone] = useState("");
  const [emergency, setEmergency] = useState("");

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const xVal = (e.clientX - window.innerWidth / 2) * 0.015;
      const yVal = (e.clientY - window.innerHeight / 2) * 0.015;
      if (containerRef.current) {
        containerRef.current.style.transform = `translate(${xVal * 0.8}px, ${yVal * 0.8}px)`;
      }
      if (spotlightRef.current) {
        spotlightRef.current.style.background = `radial-gradient(650px at ${e.clientX}px ${e.clientY}px, rgba(164, 125, 171, 0.07), transparent 70%)`;
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const handleLogin = async (e: React.FormEvent, presetEmail?: string, presetPass?: string) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const targetEmail = presetEmail || email;
    const targetPass = presetPass || password;

    if (!targetEmail || !targetPass) {
      setError("Please fill in all fields.");
      setLoading(false);
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const formData = new URLSearchParams();
      formData.append("username", targetEmail);
      formData.append("password", targetPass);

      const res = await fetch(`${apiUrl}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Invalid credentials");
      }

      const data = await res.json();
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("role", data.role);

      router.push(`/dashboard/${data.role}`);
    } catch (err: any) {
      setError(err.message || "Failed to log in.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          full_name: fullName,
          roll_number: rollNumber,
          gender,
          department: dept,
          year: Number(year),
          phone,
          emergency_contact: emergency,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Registration failed");
      }

      await handleLogin(e, email, password);
    } catch (err: any) {
      setError(err.message || "Registration failed.");
      setLoading(false);
    }
  };

  const quickLogin = (role: string) => {
    setIsRegister(false);
    if (role === "student") {
      setEmail("student1@campusnest.edu");
      setPassword("student123");
    } else if (role === "warden") {
      setEmail("warden@campusnestw.edu");
      setPassword("warden123");
    } else if (role === "admin") {
      setEmail("admin@campusnesta.edu");
      setPassword("admin123");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden bg-[#030712]">
      {/* Animated Mesh Gradient Background */}
      <div className="absolute inset-0 mesh-bg opacity-75 z-0" />

      {/* Parallax Background Elements */}
      <div
        ref={containerRef}
        className="absolute inset-0 pointer-events-none z-0 transition-transform duration-300 ease-out"
        style={{ transform: `translate(0px, 0px)` }}
      >
        {/* Soft glowing pulsing orbs */}
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-[#1e3a8a]/30 rounded-full blur-[110px] animate-pulse-glow" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-[#0ea5e9]/20 rounded-full blur-[130px] animate-pulse-glow" style={{ animationDelay: "-3s" }} />

        {/* Ambient Light streaks */}
        <div className="streak streak-1" />
        <div className="streak streak-1 particle-delay-2" style={{ left: "65%", animationDelay: "4s" }} />

        {/* Floating Geometric shapes */}
        <div className="absolute top-12 left-1/3 w-16 h-16 border border-[#38bdf8]/10 rounded-full flex items-center justify-center opacity-40 animate-float">
          <div className="w-10 h-10 border border-[#0ea5e9]/10 rounded-full" />
        </div>
        <div className="absolute bottom-24 right-1/3 w-20 h-20 border border-[#0ea5e9]/10 rotate-12 flex items-center justify-center opacity-30 animate-float" style={{ animationDelay: "-2s" }}>
          <div className="w-12 h-12 border border-[#38bdf8]/10" />
        </div>

        {/* Floating hostel icons with very low opacity */}
        <div className="absolute top-1/3 left-10 opacity-5 animate-float"><HomeIcon className="h-16 w-16 text-[#38bdf8]" /></div>
        <div className="absolute top-20 right-20 opacity-5 animate-float" style={{ animationDelay: "-1s" }}><Shield className="h-14 w-14 text-[#0ea5e9]" /></div>
        <div className="absolute bottom-1/3 left-20 opacity-5 animate-float" style={{ animationDelay: "-3s" }}><Brain className="h-14 w-14 text-[#38bdf8]" /></div>
        <div className="absolute bottom-20 right-10 opacity-5 animate-float" style={{ animationDelay: "-2s" }}><QrCode className="h-16 w-16 text-[#0ea5e9]" /></div>
      </div>

      {/* Constellation & Star Network Canvas */}
      <ConstellationBackground />

      {/* Cursor Spotlight Glow */}
      <div
        ref={spotlightRef}
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: `radial-gradient(650px at 0px 0px, rgba(164, 125, 171, 0.0), transparent 70%)`,
        }}
      />

      {/* Animated Skyline Silhouette at the bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-40 opacity-10 pointer-events-none z-0 flex items-end">
        <svg className="w-full h-full text-[#38bdf8]" viewBox="0 0 1440 200" fill="currentColor" preserveAspectRatio="none">
          <path d="M0 200V150l20-10h15l10 10h30l5-25h40l10 25h35l15-35h50l20 35h45l5-40h60l10 40h40l10-50h70l20 50h30l5-15h50l10 15h45l20-60h60l15 60h40l10-30h50l15 30h40l15-20h60l10 20h35l20-75h55l20 75h40l10-40h50l15 40h35l10-15h60l15 15h45l20-30h60l15 30h40v50z" />
          {/* Neon occupancy indicators in windows */}
          <circle cx="45" cy="165" r="1.5" className="fill-[#38bdf8] animate-ping" />
          <circle cx="120" cy="140" r="1.5" className="fill-rose-500 animate-pulse" />
          <circle cx="340" cy="130" r="1.5" className="fill-[#38bdf8] animate-pulse" />
          <circle cx="680" cy="110" r="1.5" className="fill-[#38bdf8] animate-ping" />
          <circle cx="980" cy="120" r="1.5" className="fill-rose-500 animate-pulse" />
          <circle cx="1240" cy="90" r="1.5" className="fill-[#38bdf8] animate-pulse" />
        </svg>
      </div>

      {/* Title Header with Framer Motion */}
      <motion.div
        initial={{ opacity: 0, y: -25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: "easeOut" }}
        className="text-center mb-8 flex flex-col items-center z-10"
      >
        <div className="h-16 w-16 bg-gradient-to-tr from-[#1e40af] to-[#0ea5e9] rounded-2xl flex items-center justify-center shadow-lg border border-white/20 mb-4 animate-pulse-glow relative overflow-hidden group">
          <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" style={{ animationDuration: '2.5s' }} />
          <svg className="h-9 w-9 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 12c0 4.418 4.477 8 10 8s10-3.582 10-8" />
            <path d="M4 14c0 3 3.5 5.5 8 5.5s8-2.5 8-5.5" />
            <path d="M7 16c0 1.5 2.24 3 5 3s5-1.5 5-3" />
            <ellipse cx="10" cy="11" rx="2" ry="3" fill="currentColor" opacity="0.8" transform="rotate(-15 10 11)" />
            <ellipse cx="14" cy="11" rx="2" ry="3" fill="currentColor" opacity="0.9" transform="rotate(15 14 11)" />
          </svg>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight drop-shadow-md relative">
          <span className="bg-gradient-to-r from-[#bae6fd] to-[#f0f9ff] bg-clip-text text-transparent">Campus</span>
          <span className="bg-gradient-to-r from-[#38bdf8] to-[#0ea5e9] bg-clip-text text-transparent">Nest</span>
        </h1>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "3.5rem" }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="h-1 bg-[#38bdf8] mt-2.5 rounded-full shadow-lg shadow-[#38bdf8]/50"
        />
        <p className="text-xs md:text-sm font-semibold opacity-70 mt-2 tracking-wide uppercase text-[#0ea5e9]">
          An Intelligent Hostel Management Platform
        </p>
      </motion.div>

      {/* Main Container */}
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-stretch z-10">
        
        {/* Left Card: Welcome & Quick Access */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          whileHover={{ y: -4 }}
          className="glass-panel rounded-3xl p-6 md:p-8 flex flex-col justify-between border border-white/10 shadow-2xl relative overflow-hidden group"
        >
          {/* Soft animated border pulse */}
          <div className="absolute inset-0 border border-[#38bdf8]/10 group-hover:border-[#a47dab]/35 rounded-3xl transition-colors duration-500 pointer-events-none" />

          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-[#bae6fd] bg-clip-text text-transparent">
                Welcome Back
              </h2>
              <div className="w-12 h-1 bg-[#38bdf8] mt-2 rounded-full" />
            </div>

            <div className="space-y-4">
              <button
                onClick={() => quickLogin("student")}
                className="w-full py-3.5 px-4 rounded-2xl glass-card flex items-center justify-between border border-[#82ab7d]/40 text-[#0ea5e9] font-semibold group/btn transition-all duration-300 hover:shadow-lg hover:shadow-[#38bdf8]/10 hover:border-[#38bdf8]"
              >
                <span className="flex items-center gap-3">
                  <User className="h-5 w-5" /> Quick Student Login
                </span>
                <ArrowRight className="h-4 w-4 transform group-hover/btn:translate-x-1.5 transition-transform" />
              </button>

              <button
                onClick={() => quickLogin("warden")}
                className="w-full py-3.5 px-4 rounded-2xl glass-card flex items-center justify-between border border-white/30 text-white font-semibold group/btn transition-all duration-300 hover:shadow-lg hover:shadow-white/10 hover:border-white"
              >
                <span className="flex items-center gap-3">
                  <Activity className="h-5 w-5" /> Quick Warden Login
                </span>
                <ArrowRight className="h-4 w-4 transform group-hover/btn:translate-x-1.5 transition-transform" />
              </button>

              <button
                onClick={() => quickLogin("admin")}
                className="w-full py-3.5 px-4 rounded-2xl glass-card flex items-center justify-between border border-[#82ab7d]/40 text-[#0ea5e9] font-semibold group/btn transition-all duration-300 hover:shadow-lg hover:shadow-[#38bdf8]/10 hover:border-[#38bdf8]"
              >
                <span className="flex items-center gap-3">
                  <Shield className="h-5 w-5" /> Quick Admin Login
                </span>
                <ArrowRight className="h-4 w-4 transform group-hover/btn:translate-x-1.5 transition-transform" />
              </button>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-center gap-1.5 text-xs opacity-60 text-slate-300">
            <span className="text-emerald-400">✦</span> Powered by Google Gemini AI
          </div>
        </motion.div>

        {/* Right Card: Login / Register Form */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          whileHover={{ y: -4 }}
          className="glass-panel rounded-3xl p-6 md:p-8 border border-white/10 flex flex-col justify-center shadow-2xl relative overflow-hidden group"
        >
          {/* Soft animated border pulse */}
          <div className="absolute inset-0 border border-[#0ea5e9]/10 group-hover:border-[#82ab7d]/35 rounded-3xl transition-colors duration-500 pointer-events-none" />

          <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-white to-[#bae6fd] bg-clip-text text-transparent">
            {isRegister ? "Create Student Account" : "Secure Log In"}
          </h2>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm font-medium"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={isRegister ? handleRegister : handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider opacity-75 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4.5 w-4.5" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-black/35 border border-white/10 rounded-xl focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8]/50 focus:outline-none text-sm text-slate-200 transition-all duration-300"
                  placeholder="student1@campusnest.edu"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider opacity-75 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4.5 w-4.5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-black/35 border border-white/10 rounded-xl focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8]/50 focus:outline-none text-sm text-slate-200 transition-all duration-300"
                  placeholder="••••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
            </div>

            {!isRegister && (
              <div className="flex justify-between items-center text-[11px] text-slate-400">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="rounded border-white/10 bg-black/40 text-[#38bdf8] focus:ring-[#a47dab] h-3.5 w-3.5"
                  />
                  <span>Remember me</span>
                </label>
                <a href="#" className="text-[#38bdf8] hover:text-[#0ea5e9] transition-colors">
                  Forgot Password?
                </a>
              </div>
            )}

            {isRegister && (
              <div className="space-y-4 pt-2 border-t border-white/5 mt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold opacity-75 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold opacity-75 mb-1">Roll Number</label>
                    <input
                      type="text"
                      value={rollNumber}
                      onChange={(e) => setRollNumber(e.target.value)}
                      className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-xl text-sm"
                      placeholder="CS-2024-001"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-semibold opacity-75 mb-1">Gender</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full px-2 py-2 bg-black/20 border border-white/10 rounded-xl text-sm text-white"
                    >
                      <option value="Male" className="bg-slate-900">Male</option>
                      <option value="Female" className="bg-slate-900">Female</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold opacity-75 mb-1">Department</label>
                    <input
                      type="text"
                      value={dept}
                      onChange={(e) => setDept(e.target.value)}
                      className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold opacity-75 mb-1">Year</label>
                    <input
                      type="number"
                      min={1}
                      max={4}
                      value={year}
                      onChange={(e) => setYear(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-xl text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold opacity-75 mb-1">Phone</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold opacity-75 mb-1">Emergency Contact</label>
                    <input
                      type="text"
                      value={emergency}
                      onChange={(e) => setEmergency(e.target.value)}
                      className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-xl text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-[#8e2de2] to-[#4a00e0] hover:from-[#9b3df3] hover:to-[#5c13f5] rounded-xl font-bold text-white shadow-lg shadow-[#8e2de2]/20 transition-all mt-4 flex items-center justify-center gap-2 hover:scale-[1.01] duration-300"
            >
              {loading ? "Processing..." : isRegister ? "Sign Up" : "Log In"}
            </button>
          </form>

          <button
            onClick={() => setIsRegister(!isRegister)}
            className="text-xs text-center font-semibold mt-4 text-[#38bdf8] hover:text-[#0ea5e9] hover:underline transition-colors"
          >
            {isRegister ? "Already have an account? Log In" : "New Student? Create an account"}
          </button>
        </motion.div>
      </div>

      {/* Bottom Features Inline List */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 1 }}
        className="mt-12 flex flex-wrap gap-8 justify-center items-center text-xs text-slate-400 border-t border-white/5 pt-6 z-10 w-full max-w-4xl"
      >
        <div className="flex items-center gap-2">
          <BarChart2 className="h-4 w-4 text-[#38bdf8]" />
          <span>Smart Management</span>
        </div>
        <div className="h-4 w-[1px] bg-white/10 hidden md:block" />
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-[#0ea5e9]" />
          <span>AI Powered Insights</span>
        </div>
        <div className="h-4 w-[1px] bg-white/10 hidden md:block" />
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-[#38bdf8]" />
          <span>Secure & Reliable</span>
        </div>
      </motion.div>
    </div>
  );
}
