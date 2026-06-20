"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import {
  User,
  Home,
  MessageSquare,
  FileText,
  Key,
  ShieldAlert,
  Search,
  Bell,
  LogOut,
  Send,
  Sparkles,
  CheckCircle,
  HelpCircle,
  Clock,
  Compass,
  AlertTriangle,
  Sun,
  Sunset,
  Moon
} from "lucide-react";

import InteractiveBackground from "@/components/InteractiveBackground";
import { useTheme } from "@/components/ThemeWrapper";

export default function StudentDashboard() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("overview");
  const [user, setUser] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [gatePasses, setGatePasses] = useState<any[]>([]);
  const [lostFound, setLostFound] = useState<any[]>([]);
  const [lostFoundMatches, setLostFoundMatches] = useState<any[]>([]);

  // Form states
  const [complaintTitle, setComplaintTitle] = useState("");
  const [complaintDesc, setComplaintDesc] = useState("");
  const [complaintCat, setComplaintCat] = useState("Internet");
  const [leaveStart, setLeaveStart] = useState("");
  const [leaveEnd, setLeaveEnd] = useState("");
  const [leaveReason, setLeaveReason] = useState("");
  const [passPurpose, setPassPurpose] = useState("");
  const [passExit, setPassExit] = useState("");
  const [passEntry, setPassEntry] = useState("");
  const [lfTitle, setLfTitle] = useState("");
  const [lfDesc, setLfDesc] = useState("");
  const [lfCat, setLfCat] = useState("Electronics");
  const [lfType, setLfType] = useState("Lost");
  const [lfContact, setLfContact] = useState("");



  // Chatbot states
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<any[]>([
    { sender: "ai", text: "Hi! I'm Nestor, your CampusNest assistant. Ask me anything about room allocations, leave rules, gate passes, or complaint status!" }
  ]);

  // SOS state
  const [sosStatus, setSosStatus] = useState("");

  // Unseen Notifications State
  const [lastSeenCount, setLastSeenCount] = useState<number>(0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("last_seen_messages_count");
      if (saved) {
        setLastSeenCount(parseInt(saved, 10));
      }
    }
  }, []);

  useEffect(() => {
    if (activeTab === "notifications") {
      setLastSeenCount(notifications.length);
      localStorage.setItem("last_seen_messages_count", notifications.length.toString());
    }
  }, [activeTab, notifications.length]);

  // Unseen Lost & Found State
  const [lastSeenLostFoundCount, setLastSeenLostFoundCount] = useState<number>(0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("last_seen_lostfound_count");
      if (saved) {
        setLastSeenLostFoundCount(parseInt(saved, 10));
      }
    }
  }, []);

  useEffect(() => {
    if (activeTab === "lostfound" && lostFound.length > 0) {
      setLastSeenLostFoundCount(lostFound.length);
      localStorage.setItem("last_seen_lostfound_count", lostFound.length.toString());
    }
  }, [activeTab, lostFound.length]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/");
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      // 1. Fetch Me
      const meRes = await fetch(`${apiUrl}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!meRes.ok) throw new Error();
      const meData = await meRes.json();
      setUser(meData);



      // 2. Fetch Messages
      const notifRes = await fetch(`${apiUrl}/api/auth/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (notifRes.ok) setNotifications(await notifRes.json());

      // 3. Fetch Complaints
      const complaintsRes = await fetch(`${apiUrl}/api/complaints`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (complaintsRes.ok) setComplaints(await complaintsRes.json());

      // 4. Fetch Leaves
      const leavesRes = await fetch(`${apiUrl}/api/leaves`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (leavesRes.ok) setLeaves(await leavesRes.json());

      // 5. Fetch Gate Passes
      const passRes = await fetch(`${apiUrl}/api/gate-pass`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (passRes.ok) setGatePasses(await passRes.json());

      // 6. Fetch Lost & Found
      const lfRes = await fetch(`${apiUrl}/api/lost-found`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (lfRes.ok) setLostFound(await lfRes.json());

      // 7. Fetch Lost & Found Matches
      const lfMatchRes = await fetch(`${apiUrl}/api/lost-found/matches`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (lfMatchRes.ok) setLostFoundMatches(await lfMatchRes.json());



    } catch (err) {
      localStorage.clear();
      router.push("/");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push("/");
  };

  // Submit Complaint
  const submitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      
      const res = await fetch(`${apiUrl}/api/complaints`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          category: complaintCat,
          title: complaintTitle,
          description: complaintDesc,
          block_id: 1, // Fallback to seed block 1
          floor: user?.student_profile?.room?.floor || 1
        })
      });

      if (res.ok) {
        setComplaintTitle("");
        setComplaintDesc("");
        fetchDashboardData();
        setActiveTab("complaints");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Apply Leave
  const submitLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      const res = await fetch(`${apiUrl}/api/leaves`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          start_date: new Date(leaveStart).toISOString(),
          end_date: new Date(leaveEnd).toISOString(),
          reason: leaveReason
        })
      });

      if (res.ok) {
        setLeaveStart("");
        setLeaveEnd("");
        setLeaveReason("");
        fetchDashboardData();
        setActiveTab("leaves");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Generate Gate Pass
  const submitGatePass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      const res = await fetch(`${apiUrl}/api/gate-pass`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          purpose: passPurpose,
          exit_time: new Date(passExit).toISOString(),
          entry_time: new Date(passEntry).toISOString()
        })
      });

      if (res.ok) {
        setPassPurpose("");
        setPassExit("");
        setPassEntry("");
        fetchDashboardData();
        setActiveTab("gatepass");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Upload Lost/Found
  const submitLostFound = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      const res = await fetch(`${apiUrl}/api/lost-found`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          item_type: lfType,
          title: lfTitle,
          description: lfDesc,
          category: lfCat,
          contact_info: lfContact
        })
      });

      if (res.ok) {
        setLfTitle("");
        setLfDesc("");
        setLfContact("");
        fetchDashboardData();
      }
    } catch (e) {
      console.error(e);
    }
  };



  // Trigger SOS
  const triggerSOS = async () => {
    setSosStatus("Activating...");
    try {
      const token = localStorage.getItem("token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      const res = await fetch(`${apiUrl}/api/complaints/sos`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        setSosStatus("ALARM SENT! Warden & Security have been notified.");
        setTimeout(() => setSosStatus(""), 6000);
        fetchDashboardData();
      }
    } catch (e) {
      setSosStatus("Failed to send alert.");
    }
  };

  // Chatbot Send Message
  const sendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const userMsg = chatMessage;
    setChatMessage("");
    setChatHistory(prev => [...prev, { sender: "user", text: userMsg }]);

    try {
      const token = localStorage.getItem("token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      const res = await fetch(`${apiUrl}/api/ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ message: userMsg })
      });

      if (res.ok) {
        const data = await res.json();
        setChatHistory(prev => [...prev, { sender: "ai", text: data.reply }]);
      }
    } catch (e) {
      setChatHistory(prev => [...prev, { sender: "ai", text: "Sorry, I lost connection. Please try again." }]);
    }
  };

  if (!user) return <div className="p-8 text-center">Loading Student Profile...</div>;

  const profile = user.student_profile;
  const welcomeMessage = () => {
    const hr = new Date().getHours();
    if (hr < 12) return "Good Morning";
    if (hr < 18) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div className="relative flex h-screen overflow-hidden bg-transparent text-[var(--text-primary)]">
      <InteractiveBackground />
      {/* Sidebar Navigation */}
      <div className="w-64 sidebar-glass flex flex-col justify-between p-6 hidden md:flex z-10">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gradient-to-tr from-[#692475] to-[#82ab7d] rounded-xl flex items-center justify-center text-white shadow-md">
              <svg className="h-5.5 w-5.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 12c0 4.418 4.477 8 10 8s10-3.582 10-8" />
                <path d="M4 14c0 3 3.5 5.5 8 5.5s8-2.5 8-5.5" />
                <ellipse cx="10" cy="11" rx="2" ry="3" fill="currentColor" opacity="0.8" transform="rotate(-15 10 11)" />
                <ellipse cx="14" cy="11" rx="2" ry="3" fill="currentColor" opacity="0.9" transform="rotate(15 14 11)" />
              </svg>
            </div>
            <div>
              <h2 className="font-extrabold text-lg tracking-tight text-[var(--text-primary)]">CampusNest</h2>
              <p className="text-xs text-white/90">Student Portal</p>
            </div>
          </div>

          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab("overview")}
              className={`w-full py-2.5 px-4 rounded-xl flex items-center gap-3 font-semibold text-sm transition-all ${
                activeTab === "overview" ? "bg-slate-800/80 text-white border-l-4 border-emerald-500 font-bold" : "text-white opacity-80 hover:opacity-100 hover:bg-slate-800/50"
              }`}
            >
              <Home className="h-4.5 w-4.5" /> Profile
            </button>



            <button
              onClick={() => setActiveTab("complaints")}
              className={`w-full py-2.5 px-4 rounded-xl flex items-center gap-3 font-semibold text-sm transition-all ${
                activeTab === "complaints" ? "bg-slate-800/80 text-white border-l-4 border-emerald-500 font-bold" : "text-white opacity-80 hover:opacity-100 hover:bg-slate-800/50"
              }`}
            >
              <MessageSquare className="h-4.5 w-4.5" /> Complaints
            </button>

            <button
              onClick={() => setActiveTab("leaves")}
              className={`w-full py-2.5 px-4 rounded-xl flex items-center gap-3 font-semibold text-sm transition-all ${
                activeTab === "leaves" ? "bg-slate-800/80 text-white border-l-4 border-emerald-500 font-bold" : "text-white opacity-80 hover:opacity-100 hover:bg-slate-800/50"
              }`}
            >
              <FileText className="h-4.5 w-4.5" /> Leave Forms
            </button>

            <button
              onClick={() => setActiveTab("gatepass")}
              className={`w-full py-2.5 px-4 rounded-xl flex items-center gap-3 font-semibold text-sm transition-all ${
                activeTab === "gatepass" ? "bg-slate-800/80 text-white border-l-4 border-emerald-500 font-bold" : "text-white opacity-80 hover:opacity-100 hover:bg-slate-800/50"
              }`}
            >
              <Key className="h-4.5 w-4.5" /> Gate Passes
            </button>

            <button
              onClick={() => setActiveTab("lostfound")}
              className={`w-full py-2.5 px-4 rounded-xl flex items-center justify-between font-semibold text-sm transition-all ${
                activeTab === "lostfound" ? "bg-slate-800/80 text-white border-l-4 border-emerald-500 font-bold" : "text-white opacity-80 hover:opacity-100 hover:bg-slate-800/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <Compass className="h-4.5 w-4.5" /> Lost & Found
              </div>
              {lostFound.length - lastSeenLostFoundCount > 0 && activeTab !== "lostfound" && (
                <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-600 text-white rounded-full">
                  {lostFound.length - lastSeenLostFoundCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("notifications")}
              title="messages will dissappear every 24 hrs"
              className={`w-full py-2.5 px-4 rounded-xl flex items-center justify-between font-semibold text-sm transition-all ${
                activeTab === "notifications" ? "bg-slate-800/80 text-white border-l-4 border-emerald-500 font-bold" : "text-white opacity-80 hover:opacity-100 hover:bg-slate-800/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <Bell className="h-4.5 w-4.5" /> Notifications
              </div>
              {notifications.length - lastSeenCount > 0 && activeTab !== "notifications" && (
                <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-600 text-white rounded-full">
                  {notifications.length - lastSeenCount}
                </span>
              )}
            </button>
          </nav>
        </div>

        <button
          onClick={handleLogout}
          className="w-full py-2.5 px-4 rounded-xl flex items-center gap-3 text-sm font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors"
        >
          <LogOut className="h-4.5 w-4.5" /> Log Out
        </button>
      </div>

      {/* Main Panel */}
      <div className="flex-1 flex flex-col overflow-y-auto p-4 md:p-8 z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-[var(--glass-border)]">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white">
              {welcomeMessage()}, {user.full_name} 👋
            </h1>
            <p className="text-xs text-sky-300 mt-1">
              Roll: {profile?.roll_number} | Room: {profile?.room ? `${profile.room.block_name} - ${profile.room.room_number}` : "Not Allocated"}
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* SOS Button */}
            <button
              onClick={triggerSOS}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-2xl flex items-center gap-2 shadow-lg shadow-rose-600/30 glow-border animate-pulse transition-all text-xs md:text-sm"
            >
              <ShieldAlert className="h-4.5 w-4.5" /> EMERGENCY SOS
            </button>
          </div>
        </div>

        {sosStatus && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/20 border-2 border-rose-500 text-rose-200 text-sm font-semibold flex items-center gap-3 animate-bounce">
            <AlertTriangle className="h-5 w-5" /> {sosStatus}
          </div>
        )}

        {notifications.length - lastSeenCount > 0 && activeTab !== "notifications" && (
          <div className="mb-6 p-4 rounded-2xl bg-indigo-500/10 border-2 border-indigo-500/20 text-white text-xs md:text-sm font-semibold flex justify-between items-center gap-3 animate-pulse-subtle">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-indigo-400 animate-bounce" />
              <span>You have {notifications.length - lastSeenCount} new unread notifications.</span>
            </div>
            <button
              onClick={() => setActiveTab("notifications")}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-extrabold transition-all shadow cursor-pointer shrink-0"
            >
              View
            </button>
          </div>
        )}

        {/* Dynamic Tab Switcher for Mobile */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-4 md:hidden border-b border-[var(--glass-border)]">
          {["overview", "complaints", "leaves", "gatepass", "lostfound", "notifications"].map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold capitalize shrink-0 transition-all ${
                activeTab === t ? "bg-emerald-600 text-white border border-emerald-500 font-bold" : "glass-card text-sky-200"
              }`}
            >
              {t === "gatepass" ? "Gate Passes" : t === "lostfound" ? (activeTab === "lostfound" ? "Lost & Found" : (lostFound.length - lastSeenLostFoundCount > 0 ? `Lost & Found (${lostFound.length - lastSeenLostFoundCount})` : "Lost & Found")) : t === "notifications" ? (activeTab === "notifications" ? "Notifications" : (notifications.length - lastSeenCount > 0 ? `Notifications (${notifications.length - lastSeenCount})` : "Notifications")) : t === "overview" ? "Profile" : t}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        {activeTab === "overview" && (
          <div className="grid md:grid-cols-3 gap-6 items-start">
            {/* Left Column: Stats & Welcome */}
            <div className="md:col-span-2 space-y-6">
              {/* Personalized Dashboard Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="glass-panel rounded-2xl p-5 border-2 border-slate-800/80">
                  <span className="text-xs text-emerald-400 font-bold block uppercase tracking-wider">Room Status</span>
                  <span className="text-xl md:text-2xl font-black mt-2 block text-white">
                    {profile?.room ? `${profile.room.block_name} - Room ${profile.room.room_number}` : "Pending"}
                  </span>
                </div>
                <div className="glass-panel rounded-2xl p-5 border-2 border-slate-800/80">
                  <span className="text-xs text-emerald-400 font-bold block uppercase tracking-wider">Pending Complaints</span>
                  <span className="text-xl md:text-2xl font-black mt-2 block text-white">
                    {complaints.filter(c => c.status !== "Resolved").length}
                  </span>
                </div>
                <div className="glass-panel rounded-2xl p-5 border-2 border-slate-800/80">
                  <span className="text-xs text-emerald-400 font-bold block uppercase tracking-wider">Approved Leaves</span>
                  <span className="text-xl md:text-2xl font-black mt-2 block text-white">
                    {leaves.filter(l => l.status === "Approved").length}
                  </span>
                </div>
                <div className="glass-panel rounded-2xl p-5 border-2 border-slate-800/80">
                  <span className="text-xs text-emerald-400 font-bold block uppercase tracking-wider">Active Gate Pass</span>
                  <span className="text-xl md:text-2xl font-black mt-2 block text-white">
                    {gatePasses.some(p => (p.status === "Active" || p.status === "Generated" || p.status === "Approved") && new Date(p.entry_time) >= new Date()) ? "Valid Pass Available" : "None"}
                  </span>
                </div>
              </div>

              {/* Activity Timeline */}
              <div className="glass-panel rounded-2xl p-6 border-2 border-slate-800/80">
                <h3 className="text-lg font-bold mb-4 text-white">Activity Timeline</h3>
                <div className="space-y-4">
                  {complaints.slice(0, 2).map((c, i) => (
                    <div key={i} className="flex gap-3 text-sm items-start">
                      <div className="h-2 w-2 rounded-full bg-amber-500 mt-1.5" />
                      <div>
                        <p className="font-semibold">Complaint submitted: {c.title}</p>
                        <span className="text-xs text-sky-300/80">{new Date(c.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                  {leaves.slice(0, 2).map((l, i) => (
                    <div key={i} className="flex gap-3 text-sm items-start">
                      <div className="h-2 w-2 rounded-full bg-indigo-500 mt-1.5" />
                      <div>
                        <p className="font-semibold">Leave application {l.status}: {l.reason}</p>
                        <span className="text-xs text-sky-300/80">{new Date(l.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                  {complaints.length === 0 && leaves.length === 0 && (
                    <p className="text-xs text-sky-300">No recent actions recorded.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Digital Hostel ID Pass */}
            <div className="glass-panel rounded-3xl p-6 border-2 border-slate-800/80 flex flex-col items-center text-center glow-border relative overflow-hidden">
              <div className="absolute top-0 right-0 h-16 w-16 bg-gradient-to-br from-emerald-500/20 to-amber-500/20 rounded-bl-full" />
              <h3 className="text-base font-extrabold uppercase tracking-wider text-white font-black mb-4">Digital Hostel ID Pass</h3>
              
              <div className="h-24 w-24 rounded-full bg-slate-800 border-4 border-emerald-500 flex items-center justify-center font-black text-2xl text-white shadow-inner mb-3">
                {user.full_name[0]}
              </div>

              <h4 className="font-bold text-lg text-white">{user.full_name}</h4>
              <p className="text-xs text-sky-300">Roll: {profile?.roll_number}</p>
              
              <div className="my-5 p-3 bg-white rounded-2xl shadow-lg border border-slate-200">
                <QRCodeSVG
                  value={JSON.stringify({
                    name: user.full_name,
                    roll: profile?.roll_number,
                    room: profile?.room?.room_number || "Not Assigned",
                    block: profile?.room?.block_name || "N/A"
                  })}
                  size={120}
                />
              </div>

              <div className="w-full text-xs space-y-2 border-t border-[var(--glass-border)] pt-4">
                <div className="flex justify-between"><span className="text-emerald-400 font-semibold">Dept:</span> <span className="text-white font-bold">{profile?.department}</span></div>
                <div className="flex justify-between"><span className="text-emerald-400 font-semibold">Year:</span> <span className="text-white font-bold">Year {profile?.year}</span></div>
                <div className="flex justify-between"><span className="text-emerald-400 font-semibold">Emergency No:</span> <span className="text-white font-bold">{profile?.emergency_contact}</span></div>
              </div>
            </div>
          </div>
        )}



        {activeTab === "complaints" && (
          <div className="grid md:grid-cols-2 gap-6 items-start">
            {/* Create Complaint */}
            <div className="glass-panel rounded-2xl p-6 border-2 border-slate-800/80">
              <h3 className="text-lg font-bold mb-4 text-white">Submit a Complaint</h3>
              <form onSubmit={submitComplaint} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-2">Category</label>
                  <select
                    value={complaintCat}
                    onChange={(e) => setComplaintCat(e.target.value)}
                    className="w-full p-2.5 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl text-[var(--input-text)] text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="Electrical" className="bg-[var(--mesh-bg-color)] text-[var(--text-primary)]">Electrical</option>
                    <option value="Plumbing" className="bg-[var(--mesh-bg-color)] text-[var(--text-primary)]">Plumbing</option>
                    <option value="Internet" className="bg-[var(--mesh-bg-color)] text-[var(--text-primary)]">Internet</option>
                    <option value="Cleaning" className="bg-[var(--mesh-bg-color)] text-[var(--text-primary)]">Cleaning</option>
                    <option value="Furniture" className="bg-[var(--mesh-bg-color)] text-[var(--text-primary)]">Furniture</option>
                    <option value="Other" className="bg-[var(--mesh-bg-color)] text-[var(--text-primary)]">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-2">Title / Subject</label>
                  <input
                    type="text"
                    required
                    value={complaintTitle}
                    onChange={(e) => setComplaintTitle(e.target.value)}
                    className="w-full p-2.5 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl text-[var(--input-text)] text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="e.g. WiFi disconnected in corridor"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-2">Description</label>
                  <textarea
                    required
                    rows={4}
                    value={complaintDesc}
                    onChange={(e) => setComplaintDesc(e.target.value)}
                    className="w-full p-2.5 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl text-[var(--input-text)] text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="Provide detailed description..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 font-extrabold rounded-xl text-white transition-all active:scale-95 shadow-md"
                >
                  Submit Ticket
                </button>
              </form>
            </div>

            {/* Complaints List */}
            <div className="glass-panel rounded-2xl p-6 border-2 border-slate-800/80 space-y-4">
              <h3 className="text-lg font-bold mb-2">Ticket History</h3>
              <div className="max-h-[400px] overflow-y-auto space-y-3 pr-2">
                {complaints.map((c, i) => (
                  <div key={i} className="p-4 rounded-xl bg-[var(--input-bg)] border-2 border-slate-800/80">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-sm">{c.title}</h4>
                        <p className="text-xs text-sky-300 mt-1">{c.description}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        c.status === "Pending" ? "bg-amber-500/20 text-amber-400" :
                        c.status === "In Progress" ? "bg-indigo-500/20 text-indigo-400" :
                        "bg-emerald-500/20 text-emerald-400"
                      }`}>
                        {c.status}
                      </span>
                    </div>
                    <div className="mt-3 flex justify-between items-center text-[10px] text-sky-300/80">
                      <span>Category: {c.category}</span>
                      <span>Filed: {new Date(c.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
                {complaints.length === 0 && (
                  <p className="text-xs text-sky-300 text-center py-6">No complaints registered.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "leaves" && (
          <div className="grid md:grid-cols-2 gap-6 items-start">
            {/* Submit Leave */}
            <div className="glass-panel rounded-2xl p-6 border-2 border-slate-800/80">
              <h3 className="text-lg font-bold mb-4 text-white">Apply for Outing / Leave</h3>
              <form onSubmit={submitLeave} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-2">Start Date</label>
                    <input
                      type="date"
                      required
                      value={leaveStart}
                      onChange={(e) => setLeaveStart(e.target.value)}
                      className="w-full p-2.5 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl text-[var(--input-text)] text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-2">End Date</label>
                    <input
                      type="date"
                      required
                      value={leaveEnd}
                      onChange={(e) => setLeaveEnd(e.target.value)}
                      className="w-full p-2.5 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl text-[var(--input-text)] text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-2">Reason</label>
                  <textarea
                    required
                    rows={4}
                    value={leaveReason}
                    onChange={(e) => setLeaveReason(e.target.value)}
                    className="w-full p-2.5 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl text-[var(--input-text)] text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="e.g. Going home for Pooja holidays..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 font-extrabold rounded-xl text-white transition-all active:scale-95 shadow-md"
                >
                  Apply Outing
                </button>
              </form>
            </div>

            {/* Leave History */}
            <div className="glass-panel rounded-2xl p-6 border-2 border-slate-800/80 space-y-4">
              <h3 className="text-lg font-bold mb-2">Leave Request History</h3>
              <div className="max-h-[400px] overflow-y-auto space-y-3 pr-2">
                {leaves.slice(0, 1).map((l, i) => (
                  <div key={i} className="p-4 rounded-xl bg-[var(--input-bg)] border-2 border-slate-800/80">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-semibold">{l.reason}</p>
                        <p className="text-[11px] text-sky-300 mt-1">
                          Dates: {new Date(l.start_date).toLocaleDateString()} to {new Date(l.end_date).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        l.status === "Pending" ? "bg-amber-500/20 text-amber-400" :
                        l.status === "Rejected" ? "bg-rose-500/20 text-rose-400" :
                        "bg-emerald-500/20 text-emerald-400"
                      }`}>
                        {l.status}
                      </span>
                    </div>
                    {l.warden_remarks && (
                      <div className="mt-3 p-2 rounded bg-black/20 text-[11px] border-2 border-slate-800/80">
                        <span className="font-bold block text-white">Remarks:</span>
                        {l.warden_remarks}
                      </div>
                    )}
                  </div>
                ))}
                {leaves.length === 0 && (
                  <p className="text-xs text-sky-300 text-center py-6">No leave history found.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "gatepass" && (
          <div className="flex flex-col items-center justify-center space-y-6 max-w-xl mx-auto w-full animate-fade-in">
            <div className="text-center">
              <h2 className="text-2xl font-black tracking-tight text-white">Digital Gate Pass</h2>
              <div className="w-12 h-1 bg-emerald-500 mx-auto mt-2.5 rounded-full shadow-lg shadow-emerald-500/50" />
            </div>

            <div className="w-full space-y-4">
              {gatePasses
                .filter((p) => {
                  const expiryDate = new Date(p.entry_time);
                  const currentDate = new Date();
                  return currentDate <= expiryDate && p.status !== "Returned";
                })
                .slice(0, 1)
                .map((p, idx) => {
                  const isExpired = new Date(p.entry_time) < new Date();
                  const isRejected = p.status === "Rejected" || isExpired;
                  
                  // Encode student ID info just like the digital ID card
                  const qrValue = JSON.stringify({
                    name: user.full_name,
                    roll: profile?.roll_number,
                    room: profile?.room?.room_number || "Not Assigned",
                    block: profile?.room?.block_name || "N/A"
                  });

                  // Deterministic 6-digit serial number based on database gate pass id
                  const serialNumber = String(100000 + p.id).substring(0, 6);

                  return (
                    <div key={idx} className="glass-panel rounded-3xl p-8 border-2 border-slate-800/80 w-full flex flex-col items-center text-center space-y-6 glow-border relative overflow-hidden">
                      <div className="absolute top-0 right-0 h-16 w-16 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-bl-full" />
                      
                      {/* 1. QR Code containing student ID details */}
                      <div className="flex justify-center p-4 bg-white rounded-2xl shadow-xl border border-slate-200">
                        <QRCodeSVG value={qrValue} size={180} />
                      </div>

                      {/* 2. APPROVED in Bold green letters */}
                      <div>
                        <span className="text-3xl font-black text-emerald-500 uppercase tracking-widest block font-extrabold">
                          APPROVED
                        </span>
                      </div>

                      {/* 3. 6-digit serial number */}
                      <div className="space-y-1">
                        <span className="text-[10px] text-sky-400 font-bold uppercase tracking-wider block">Gatepass Serial No.</span>
                        <span className="text-xl font-mono font-bold text-white tracking-widest bg-slate-900/60 px-5 py-2 rounded-xl border border-white/5 block">
                          {serialNumber}
                        </span>
                      </div>

                      {/* 4. From Date and To Date */}
                      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-[var(--glass-border)] pt-6 text-sm">
                        <div className="space-y-1">
                          <span className="text-xs text-indigo-400 font-bold block uppercase tracking-wider">From Date</span>
                          <span className="text-white font-semibold block bg-slate-900/40 py-2 px-3 rounded-lg border border-white/5">
                            {new Date(p.exit_time).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-xs text-indigo-400 font-bold block uppercase tracking-wider">To Date</span>
                          <span className="text-white font-semibold block bg-slate-900/40 py-2 px-3 rounded-lg border border-white/5">
                            {new Date(p.entry_time).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* Purpose */}
                      <div className="text-xs text-sky-200/80 italic border-t border-[var(--glass-border)] w-full pt-4">
                        Purpose: {p.purpose}
                      </div>
                    </div>
                  );
                })}

              {gatePasses.filter((p) => {
                const expiryDate = new Date(p.entry_time);
                const currentDate = new Date();
                return currentDate <= expiryDate && p.status !== "Returned";
              }).length === 0 && (
                <div className="glass-panel rounded-3xl p-8 border-2 border-slate-800/80 w-full text-center py-12 text-sky-200 italic text-sm">
                  No active gate passes registered.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "lostfound" && (
          <div className="grid md:grid-cols-2 gap-6 items-start">
            {/* Create LF Post */}
            <div className="glass-panel rounded-2xl p-6 border-2 border-slate-800/80">
              <h3 className="text-lg font-bold mb-4 text-white">Post Lost / Found Items</h3>
              <form onSubmit={submitLostFound} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-2">Post Type</label>
                    <select
                      value={lfType}
                      onChange={(e) => setLfType(e.target.value)}
                      className="w-full p-2.5 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl text-[var(--input-text)] text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="Lost" className="bg-[var(--mesh-bg-color)] text-[var(--text-primary)]">Lost</option>
                      <option value="Found" className="bg-[var(--mesh-bg-color)] text-[var(--text-primary)]">Found</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-2">Category</label>
                    <select
                      value={lfCat}
                      onChange={(e) => setLfCat(e.target.value)}
                      className="w-full p-2.5 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl text-[var(--input-text)] text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="Electronics" className="bg-[var(--mesh-bg-color)] text-[var(--text-primary)]">Electronics</option>
                      <option value="Keys" className="bg-[var(--mesh-bg-color)] text-[var(--text-primary)]">Keys</option>
                      <option value="Books / Documents" className="bg-[var(--mesh-bg-color)] text-[var(--text-primary)]">Books / Docs</option>
                      <option value="Clothing" className="bg-[var(--mesh-bg-color)] text-[var(--text-primary)]">Clothing</option>
                      <option value="Other" className="bg-[var(--mesh-bg-color)] text-[var(--text-primary)]">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-2">Item Title</label>
                  <input
                    type="text"
                    required
                    value={lfTitle}
                    onChange={(e) => setLfTitle(e.target.value)}
                    className="w-full p-2.5 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl text-[var(--input-text)] text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="e.g. Black AirPods Case"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-2">Item Description & Contact Info</label>
                  <textarea
                    required
                    rows={3}
                    value={lfDesc}
                    onChange={(e) => setLfDesc(e.target.value)}
                    className="w-full p-2.5 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl text-[var(--input-text)] text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="Explain location, time, and how to reach you..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-2">Contact Link/Number</label>
                  <input
                    type="text"
                    required
                    value={lfContact}
                    onChange={(e) => setLfContact(e.target.value)}
                    className="w-full p-2.5 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl text-[var(--input-text)] text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="Call 9876..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 font-extrabold rounded-xl text-white transition-all active:scale-95 shadow-md"
                >
                  Publish Post
                </button>
              </form>
            </div>

            {/* List and Matches */}
            <div className="space-y-6">
              {/* Automated suggestions */}
              {lostFoundMatches.length > 0 && (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                  <h4 className="font-extrabold text-xs text-white font-black uppercase tracking-wide mb-3 flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 animate-spin" /> Auto-Matcher Suggestion
                  </h4>
                  <div className="space-y-3">
                    {lostFoundMatches.map((m, i) => (
                      <div key={i} className="text-xs bg-slate-900/60 p-3 rounded-xl border-2 border-slate-800/80">
                        <p className="font-bold text-white mb-1">Match found: "{m.lost_item.title}" & "{m.found_item.title}"</p>
                        <p className="opacity-70 mt-1">Reason: {m.match_reason}</p>
                        <p className="font-semibold text-white font-black mt-2">Contact: {m.found_item.contact_info}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* General Posts */}
              <div className="glass-panel rounded-2xl p-6 border-2 border-slate-800/80 space-y-4">
                <h3 className="text-lg font-bold">Lost & Found Feed</h3>
                <div className="max-h-[300px] overflow-y-auto space-y-3 pr-2">
                  {lostFound.map((item, i) => (
                    <div key={i} className={`p-4 rounded-xl border ${
                      item.item_type === "Lost" ? "bg-rose-500/5 border-rose-500/20" : "bg-emerald-500/5 border-emerald-500/20"
                    }`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-sm">{item.title}</h4>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                            item.item_type === "Lost" ? "bg-rose-500/20 text-rose-400" : "bg-emerald-500/20 text-emerald-400"
                          }`}>
                            {item.item_type}
                          </span>
                        </div>
                        <span className="text-[10px] text-sky-300/80">Category: {item.category}</span>
                      </div>
                      <p className="text-xs opacity-75 mt-2">{item.description}</p>
                      <p className="text-[10px] font-bold text-sky-300 mt-3">Contact: {item.contact_info}</p>
                    </div>
                  ))}
                  {lostFound.length === 0 && (
                    <p className="text-xs text-sky-300 text-center py-6">No items posted.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "notifications" && (
          <div className="space-y-6 animate-fade-in">
            <div className="glass-panel rounded-2xl p-6 border-2 border-slate-800/80">
              <h2 className="text-xl font-black text-white mb-2">Notifications</h2>
              <p className="text-xs text-sky-200 mb-6 font-semibold">messages will dissappear every 24 hrs</p>
              
              <div className="space-y-4">
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className="p-5 rounded-2xl bg-[var(--input-bg)] border border-[var(--glass-border)] hover:bg-slate-900/40 transition-all duration-300 flex items-start gap-4"
                    >
                      <div className="h-10 w-10 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center shrink-0">
                        <Bell className="h-5 w-5" />
                      </div>
                      <div className="space-y-1 flex-1">
                        <div className="flex justify-between items-start flex-wrap gap-2">
                          <h4 className="font-extrabold text-sm text-white">Sender: {n.sender_name}</h4>
                          <span className="text-[10px] text-sky-300 opacity-80">{new Date(n.created_at).toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-sky-200 leading-relaxed">{n.content}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-sky-200 italic text-sm">
                    No received messages
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating Chat Assistant Nestor */}
      <div className="fixed bottom-6 right-6 z-40">
        {showChat ? (
          <div className="h-[450px] w-[350px] glass-panel border border-white/10 rounded-2xl flex flex-col shadow-2xl overflow-hidden glow-border">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-amber-500 p-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-white/20 rounded-full flex items-center justify-center font-bold">🤖</div>
                <div>
                  <h4 className="font-bold text-sm">Nestor</h4>
                  <p className="text-[10px] opacity-75">AI Hostel Assistant</p>
                </div>
              </div>
              <button onClick={() => setShowChat(false)} className="text-white hover:opacity-75 font-black text-sm">✕</button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
              {chatHistory.map((h, i) => (
                <div key={i} className={`flex ${h.sender === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-xl p-3 shadow-sm ${
                    h.sender === "user" ? "bg-emerald-500 text-white" : "bg-[var(--input-bg)] border border-white/10"
                  }`}>
                    {h.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Form */}
            <form onSubmit={sendChatMessage} className="p-3 border-t border-[var(--glass-border)] flex gap-2">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Ask Nestor..."
                className="flex-1 px-3 py-2 bg-black/30 border border-white/10 rounded-xl text-xs focus:outline-none focus:border-emerald-500 text-white"
              />
              <button type="submit" className="p-2 bg-emerald-500 text-white rounded-xl hover:opacity-90">
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        ) : (
          <button
            onClick={() => setShowChat(true)}
            className="h-14 w-14 rounded-full bg-gradient-to-tr from-emerald-500 to-amber-500 text-white flex items-center justify-center shadow-xl hover:scale-105 transition-transform"
          >
            <MessageSquare className="h-6 w-6" />
          </button>
        )}
      </div>
    </div>
  );
}
