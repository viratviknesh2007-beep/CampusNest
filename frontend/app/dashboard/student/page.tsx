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
  AlertTriangle
} from "lucide-react";

import InteractiveBackground from "@/components/InteractiveBackground";

export default function StudentDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [user, setUser] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [gatePasses, setGatePasses] = useState<any[]>([]);
  const [lostFound, setLostFound] = useState<any[]>([]);
  const [roommateMatches, setRoommateMatches] = useState<any[]>([]);
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

  // Roommate preferences
  const [sleepPref, setSleepPref] = useState("Early Bird");
  const [studyPref, setStudyPref] = useState("Silent");
  const [cleanPref, setCleanPref] = useState("High");

  // Chatbot states
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<any[]>([
    { sender: "ai", text: "Hi! I'm Nestor, your CampusNest assistant. Ask me anything about room allocations, leave rules, gate passes, or complaint status!" }
  ]);

  // SOS state
  const [sosStatus, setSosStatus] = useState("");

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

      // Prepopulate prefs
      if (meData.student_profile) {
        setSleepPref(meData.student_profile.sleep_schedule || "Early Bird");
        setStudyPref(meData.student_profile.study_preference || "Silent");
        setCleanPref(meData.student_profile.cleanliness_level || "High");
      }

      // 2. Fetch Notifications
      const notifRes = await fetch(`${apiUrl}/api/auth/notifications`, {
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

      // 8. Fetch Roommate Recommendations
      const roommateRes = await fetch(`${apiUrl}/api/ai/roommate-recommendations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (roommateRes.ok) {
        const roommateData = await roommateRes.json();
        if (roommateData.status === "success") {
          setRoommateMatches(roommateData.matches);
        }
      }

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

  // Save Preferences
  const savePreferences = async () => {
    try {
      const token = localStorage.getItem("token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      const res = await fetch(`${apiUrl}/api/rooms/preferences`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          sleep_schedule: sleepPref,
          study_preference: studyPref,
          cleanliness_level: cleanPref
        })
      });

      if (res.ok) {
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
    <div className="relative flex h-screen overflow-hidden bg-[#0b0f19] text-slate-100">
      <InteractiveBackground />
      {/* Sidebar Navigation */}
      <div className="w-64 sidebar-glass flex flex-col justify-between p-6 hidden md:flex">
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
              <h2 className="font-extrabold text-lg tracking-tight text-white">CampusNest</h2>
              <p className="text-xs opacity-60">Student Portal</p>
            </div>
          </div>

          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab("overview")}
              className={`w-full py-2.5 px-4 rounded-xl flex items-center gap-3 font-semibold text-sm transition-all ${
                activeTab === "overview" ? "bg-[#82ab7d]/20 text-[#cfaecf] border-l-4 border-[#82ab7d]" : "opacity-70 hover:opacity-100 hover:bg-white/5"
              }`}
            >
              <Home className="h-4.5 w-4.5" /> Overview
            </button>

            <button
              onClick={() => setActiveTab("roommate")}
              className={`w-full py-2.5 px-4 rounded-xl flex items-center gap-3 font-semibold text-sm transition-all ${
                activeTab === "roommate" ? "bg-[#82ab7d]/20 text-[#cfaecf] border-l-4 border-[#82ab7d]" : "opacity-70 hover:opacity-100 hover:bg-white/5"
              }`}
            >
              <Sparkles className="h-4.5 w-4.5" /> Roommate Finder
            </button>

            <button
              onClick={() => setActiveTab("complaints")}
              className={`w-full py-2.5 px-4 rounded-xl flex items-center gap-3 font-semibold text-sm transition-all ${
                activeTab === "complaints" ? "bg-[#82ab7d]/20 text-[#cfaecf] border-l-4 border-[#82ab7d]" : "opacity-70 hover:opacity-100 hover:bg-white/5"
              }`}
            >
              <MessageSquare className="h-4.5 w-4.5" /> Complaints
            </button>

            <button
              onClick={() => setActiveTab("leaves")}
              className={`w-full py-2.5 px-4 rounded-xl flex items-center gap-3 font-semibold text-sm transition-all ${
                activeTab === "leaves" ? "bg-[#82ab7d]/20 text-[#cfaecf] border-l-4 border-[#82ab7d]" : "opacity-70 hover:opacity-100 hover:bg-white/5"
              }`}
            >
              <FileText className="h-4.5 w-4.5" /> Leave Forms
            </button>

            <button
              onClick={() => setActiveTab("gatepass")}
              className={`w-full py-2.5 px-4 rounded-xl flex items-center gap-3 font-semibold text-sm transition-all ${
                activeTab === "gatepass" ? "bg-[#82ab7d]/20 text-[#cfaecf] border-l-4 border-[#82ab7d]" : "opacity-70 hover:opacity-100 hover:bg-white/5"
              }`}
            >
              <Key className="h-4.5 w-4.5" /> Gate Passes
            </button>

            <button
              onClick={() => setActiveTab("lostfound")}
              className={`w-full py-2.5 px-4 rounded-xl flex items-center gap-3 font-semibold text-sm transition-all ${
                activeTab === "lostfound" ? "bg-[#82ab7d]/20 text-[#cfaecf] border-l-4 border-[#82ab7d]" : "opacity-70 hover:opacity-100 hover:bg-white/5"
              }`}
            >
              <Compass className="h-4.5 w-4.5" /> Lost & Found
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
      <div className="flex-1 flex flex-col overflow-y-auto p-4 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold">
              {welcomeMessage()}, {user.full_name} 👋
            </h1>
            <p className="text-xs opacity-60 mt-1">
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

        {/* Dynamic Tab Switcher for Mobile */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-4 md:hidden border-b border-white/5">
          {["overview", "roommate", "complaints", "leaves", "gatepass", "lostfound"].map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold capitalize shrink-0 transition-all ${
                activeTab === t ? "bg-emerald-500 text-white" : "glass-card text-slate-300"
              }`}
            >
              {t}
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
                <div className="glass-panel rounded-2xl p-5 border border-white/5">
                  <span className="text-xs opacity-60 font-semibold block uppercase">Room Status</span>
                  <span className="text-xl md:text-2xl font-black mt-2 block text-emerald-400">
                    {profile?.room ? `${profile.room.block_name} - Room ${profile.room.room_number}` : "Pending"}
                  </span>
                </div>
                <div className="glass-panel rounded-2xl p-5 border border-white/5">
                  <span className="text-xs opacity-60 font-semibold block uppercase">Pending Complaints</span>
                  <span className="text-xl md:text-2xl font-black mt-2 block text-amber-400">
                    {complaints.filter(c => c.status !== "Resolved").length}
                  </span>
                </div>
                <div className="glass-panel rounded-2xl p-5 border border-white/5">
                  <span className="text-xs opacity-60 font-semibold block uppercase">Approved Leaves</span>
                  <span className="text-xl md:text-2xl font-black mt-2 block text-indigo-400">
                    {leaves.filter(l => l.status === "Approved").length}
                  </span>
                </div>
                <div className="glass-panel rounded-2xl p-5 border border-white/5">
                  <span className="text-xs opacity-60 font-semibold block uppercase">Active Gate Pass</span>
                  <span className="text-xl md:text-2xl font-black mt-2 block text-emerald-400">
                    {gatePasses.some(p => p.status === "Active" || p.status === "Generated") ? "Valid Pass Available" : "None"}
                  </span>
                </div>
              </div>

              {/* Activity Timeline */}
              <div className="glass-panel rounded-2xl p-6 border border-white/5">
                <h3 className="text-lg font-bold mb-4">Activity Timeline</h3>
                <div className="space-y-4">
                  {complaints.slice(0, 2).map((c, i) => (
                    <div key={i} className="flex gap-3 text-sm items-start">
                      <div className="h-2 w-2 rounded-full bg-amber-500 mt-1.5" />
                      <div>
                        <p className="font-semibold">Complaint submitted: {c.title}</p>
                        <span className="text-xs opacity-50">{new Date(c.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                  {leaves.slice(0, 2).map((l, i) => (
                    <div key={i} className="flex gap-3 text-sm items-start">
                      <div className="h-2 w-2 rounded-full bg-indigo-500 mt-1.5" />
                      <div>
                        <p className="font-semibold">Leave application {l.status}: {l.reason}</p>
                        <span className="text-xs opacity-50">{new Date(l.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                  {complaints.length === 0 && leaves.length === 0 && (
                    <p className="text-xs opacity-60">No recent actions recorded.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Digital Hostel ID Pass */}
            <div className="glass-panel rounded-3xl p-6 border border-white/5 flex flex-col items-center text-center glow-border relative overflow-hidden">
              <div className="absolute top-0 right-0 h-16 w-16 bg-gradient-to-br from-emerald-500/20 to-amber-500/20 rounded-bl-full" />
              <h3 className="text-base font-extrabold uppercase tracking-wider text-emerald-400 mb-4">Digital Hostel ID Pass</h3>
              
              <div className="h-24 w-24 rounded-full bg-slate-800 border-4 border-emerald-500 flex items-center justify-center font-black text-2xl text-white shadow-inner mb-3">
                {user.full_name[0]}
              </div>

              <h4 className="font-bold text-lg">{user.full_name}</h4>
              <p className="text-xs opacity-60">Roll: {profile?.roll_number}</p>
              
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

              <div className="w-full text-xs space-y-2 border-t border-white/5 pt-4">
                <div className="flex justify-between"><span className="opacity-60">Dept:</span> <span className="font-semibold">{profile?.department}</span></div>
                <div className="flex justify-between"><span className="opacity-60">Year:</span> <span className="font-semibold">Year {profile?.year}</span></div>
                <div className="flex justify-between"><span className="opacity-60">Emergency No:</span> <span className="font-semibold">{profile?.emergency_contact}</span></div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "roommate" && (
          <div className="grid md:grid-cols-2 gap-6 items-start">
            {/* Preferences Setup */}
            <div className="glass-panel rounded-2xl p-6 border border-white/5">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-emerald-400">
                <Sparkles className="h-5 w-5 animate-pulse" /> Roommate Preferences
              </h3>
              <p className="text-xs opacity-75 mb-6">
                Tell CampusNest your living habits. The AI roommate suggestions engine will process these compatibility metrics to recommend matching students.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-2">Sleep Schedule</label>
                  <select
                    value={sleepPref}
                    onChange={(e) => setSleepPref(e.target.value)}
                    className="w-full p-2.5 bg-black/25 border border-white/10 rounded-xl text-white text-sm"
                  >
                    <option value="Early Bird" className="bg-slate-900">Early Bird</option>
                    <option value="Night Owl" className="bg-slate-900">Night Owl</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-2">Study Preferences</label>
                  <select
                    value={studyPref}
                    onChange={(e) => setStudyPref(e.target.value)}
                    className="w-full p-2.5 bg-black/25 border border-white/10 rounded-xl text-white text-sm"
                  >
                    <option value="Silent" className="bg-slate-900">Silent / Solo Study</option>
                    <option value="Group Study" className="bg-slate-900">Group Study / Active Discussion</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-2">Cleanliness Habit</label>
                  <select
                    value={cleanPref}
                    onChange={(e) => setCleanPref(e.target.value)}
                    className="w-full p-2.5 bg-black/25 border border-white/10 rounded-xl text-white text-sm"
                  >
                    <option value="High" className="bg-slate-900">High (Spick & Span)</option>
                    <option value="Medium" className="bg-slate-900">Medium (Casual cleaning)</option>
                    <option value="Low" className="bg-slate-900">Low (Relaxed)</option>
                  </select>
                </div>

                <button
                  onClick={savePreferences}
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-450 font-bold rounded-xl text-white mt-4"
                >
                  Save Habits
                </button>
              </div>
            </div>

            {/* Match Listings */}
            <div className="glass-panel rounded-2xl p-6 border border-white/5">
              <h3 className="text-lg font-bold mb-4">Compatible Roommate Suggestions</h3>
              <div className="space-y-4">
                {roommateMatches.length > 0 ? (
                  roommateMatches.map((m, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-sm">{m.full_name}</h4>
                        <p className="text-xs opacity-60 mt-1">Roll: {m.roll_number} | Dept: {m.department} | Year {m.year}</p>
                        <div className="flex gap-1.5 flex-wrap mt-2">
                          {m.reasons.map((r: string, rid: number) => (
                            <span key={rid} className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">
                              {r}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-black text-emerald-400 block">{m.compatibility}%</span>
                        <span className="text-[10px] opacity-60">Compatibility</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-xs opacity-60">
                    No suggestions. Please save your habits first.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "complaints" && (
          <div className="grid md:grid-cols-2 gap-6 items-start">
            {/* Create Complaint */}
            <div className="glass-panel rounded-2xl p-6 border border-white/5">
              <h3 className="text-lg font-bold mb-4">Submit a Complaint</h3>
              <form onSubmit={submitComplaint} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-2">Category</label>
                  <select
                    value={complaintCat}
                    onChange={(e) => setComplaintCat(e.target.value)}
                    className="w-full p-2.5 bg-black/25 border border-white/10 rounded-xl text-white text-sm"
                  >
                    <option value="Electrical" className="bg-slate-900">Electrical</option>
                    <option value="Plumbing" className="bg-slate-900">Plumbing</option>
                    <option value="Internet" className="bg-slate-900">Internet</option>
                    <option value="Cleaning" className="bg-slate-900">Cleaning</option>
                    <option value="Furniture" className="bg-slate-900">Furniture</option>
                    <option value="Other" className="bg-slate-900">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-2">Title / Subject</label>
                  <input
                    type="text"
                    required
                    value={complaintTitle}
                    onChange={(e) => setComplaintTitle(e.target.value)}
                    className="w-full p-2.5 bg-black/25 border border-white/10 rounded-xl text-white text-sm"
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
                    className="w-full p-2.5 bg-black/25 border border-white/10 rounded-xl text-white text-sm"
                    placeholder="Provide detailed description..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-450 font-bold rounded-xl text-white"
                >
                  Submit Ticket
                </button>
              </form>
            </div>

            {/* Complaints List */}
            <div className="glass-panel rounded-2xl p-6 border border-white/5 space-y-4">
              <h3 className="text-lg font-bold mb-2">Ticket History</h3>
              <div className="max-h-[400px] overflow-y-auto space-y-3 pr-2">
                {complaints.map((c, i) => (
                  <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/5">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-sm">{c.title}</h4>
                        <p className="text-xs opacity-60 mt-1">{c.description}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        c.status === "Pending" ? "bg-amber-500/20 text-amber-400" :
                        c.status === "In Progress" ? "bg-indigo-500/20 text-indigo-400" :
                        "bg-emerald-500/20 text-emerald-400"
                      }`}>
                        {c.status}
                      </span>
                    </div>
                    <div className="mt-3 flex justify-between items-center text-[10px] opacity-50">
                      <span>Category: {c.category}</span>
                      <span>Filed: {new Date(c.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
                {complaints.length === 0 && (
                  <p className="text-xs opacity-60 text-center py-6">No complaints registered.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "leaves" && (
          <div className="grid md:grid-cols-2 gap-6 items-start">
            {/* Submit Leave */}
            <div className="glass-panel rounded-2xl p-6 border border-white/5">
              <h3 className="text-lg font-bold mb-4">Apply for Outing / Leave</h3>
              <form onSubmit={submitLeave} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-2">Start Date</label>
                    <input
                      type="date"
                      required
                      value={leaveStart}
                      onChange={(e) => setLeaveStart(e.target.value)}
                      className="w-full p-2.5 bg-black/25 border border-white/10 rounded-xl text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-2">End Date</label>
                    <input
                      type="date"
                      required
                      value={leaveEnd}
                      onChange={(e) => setLeaveEnd(e.target.value)}
                      className="w-full p-2.5 bg-black/25 border border-white/10 rounded-xl text-white text-sm"
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
                    className="w-full p-2.5 bg-black/25 border border-white/10 rounded-xl text-white text-sm"
                    placeholder="e.g. Going home for Pooja holidays..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-450 font-bold rounded-xl text-white"
                >
                  Apply Outing
                </button>
              </form>
            </div>

            {/* Leave History */}
            <div className="glass-panel rounded-2xl p-6 border border-white/5 space-y-4">
              <h3 className="text-lg font-bold mb-2">Leave Request History</h3>
              <div className="max-h-[400px] overflow-y-auto space-y-3 pr-2">
                {leaves.map((l, i) => (
                  <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/5">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-semibold">{l.reason}</p>
                        <p className="text-[11px] opacity-60 mt-1">
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
                      <div className="mt-3 p-2 rounded bg-black/20 text-[11px] border border-white/5">
                        <span className="font-bold block text-emerald-400">Remarks:</span>
                        {l.warden_remarks}
                      </div>
                    )}
                  </div>
                ))}
                {leaves.length === 0 && (
                  <p className="text-xs opacity-60 text-center py-6">No leave history found.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "gatepass" && (
          <div className="grid md:grid-cols-2 gap-6 items-start">
            {/* Generate Pass */}
            <div className="glass-panel rounded-2xl p-6 border border-white/5">
              <h3 className="text-lg font-bold mb-4">Request Digital Gate Pass</h3>
              <form onSubmit={submitGatePass} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-2">Purpose / Location</label>
                  <input
                    type="text"
                    required
                    value={passPurpose}
                    onChange={(e) => setPassPurpose(e.target.value)}
                    className="w-full p-2.5 bg-black/25 border border-white/10 rounded-xl text-white text-sm"
                    placeholder="e.g. Canteen/Local Market"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-2">Exit Date & Time</label>
                    <input
                      type="datetime-local"
                      required
                      value={passExit}
                      onChange={(e) => setPassExit(e.target.value)}
                      className="w-full p-2.5 bg-black/25 border border-white/10 rounded-xl text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-2">Entry Date & Time</label>
                    <input
                      type="datetime-local"
                      required
                      value={passEntry}
                      onChange={(e) => setPassEntry(e.target.value)}
                      className="w-full p-2.5 bg-black/25 border border-white/10 rounded-xl text-white text-sm"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-450 font-bold rounded-xl text-white"
                >
                  Generate Pass
                </button>
              </form>
            </div>

            {/* Passes List with QR */}
            <div className="glass-panel rounded-2xl p-6 border border-white/5 space-y-4">
              <h3 className="text-lg font-bold mb-2">Active Gate Passes</h3>
              <div className="max-h-[400px] overflow-y-auto space-y-4 pr-2">
                {gatePasses.map((p, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/5 grid grid-cols-3 gap-4 items-center">
                    <div className="col-span-2 space-y-1.5">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                        p.status === "Returned" ? "bg-slate-500/20 text-slate-400" :
                        "bg-emerald-500/20 text-emerald-400"
                      }`}>
                        {p.status}
                      </span>
                      <h4 className="font-semibold text-sm">{p.purpose}</h4>
                      <p className="text-[10px] opacity-60">
                        Out: {new Date(p.exit_time).toLocaleString()}<br />
                        In: {new Date(p.entry_time).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex justify-center p-2 bg-white rounded-xl">
                      <QRCodeSVG value={p.qr_code_data} size={70} />
                    </div>
                  </div>
                ))}
                {gatePasses.length === 0 && (
                  <p className="text-xs opacity-60 text-center py-6">No gate passes created yet.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "lostfound" && (
          <div className="grid md:grid-cols-2 gap-6 items-start">
            {/* Create LF Post */}
            <div className="glass-panel rounded-2xl p-6 border border-white/5">
              <h3 className="text-lg font-bold mb-4">Post Lost / Found Items</h3>
              <form onSubmit={submitLostFound} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-2">Post Type</label>
                    <select
                      value={lfType}
                      onChange={(e) => setLfType(e.target.value)}
                      className="w-full p-2.5 bg-black/25 border border-white/10 rounded-xl text-white text-sm"
                    >
                      <option value="Lost" className="bg-slate-900">Lost</option>
                      <option value="Found" className="bg-slate-900">Found</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-2">Category</label>
                    <select
                      value={lfCat}
                      onChange={(e) => setLfCat(e.target.value)}
                      className="w-full p-2.5 bg-black/25 border border-white/10 rounded-xl text-white text-sm"
                    >
                      <option value="Electronics" className="bg-slate-900">Electronics</option>
                      <option value="Keys" className="bg-slate-900">Keys</option>
                      <option value="Books / Documents" className="bg-slate-900">Books / Docs</option>
                      <option value="Clothing" className="bg-slate-900">Clothing</option>
                      <option value="Other" className="bg-slate-900">Other</option>
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
                    className="w-full p-2.5 bg-black/25 border border-white/10 rounded-xl text-white text-sm"
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
                    className="w-full p-2.5 bg-black/25 border border-white/10 rounded-xl text-white text-sm"
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
                    className="w-full p-2.5 bg-black/25 border border-white/10 rounded-xl text-white text-sm"
                    placeholder="Call 9876..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-450 font-bold rounded-xl text-white"
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
                  <h4 className="font-extrabold text-xs text-emerald-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 animate-spin" /> Auto-Matcher Suggestion
                  </h4>
                  <div className="space-y-3">
                    {lostFoundMatches.map((m, i) => (
                      <div key={i} className="text-xs bg-slate-900/60 p-3 rounded-xl border border-white/5">
                        <p className="font-bold text-white mb-1">Match found: "{m.lost_item.title}" & "{m.found_item.title}"</p>
                        <p className="opacity-70 mt-1">Reason: {m.match_reason}</p>
                        <p className="font-semibold text-emerald-400 mt-2">Contact: {m.found_item.contact_info}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* General Posts */}
              <div className="glass-panel rounded-2xl p-6 border border-white/5 space-y-4">
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
                        <span className="text-[10px] opacity-50">Category: {item.category}</span>
                      </div>
                      <p className="text-xs opacity-75 mt-2">{item.description}</p>
                      <p className="text-[10px] font-bold text-slate-400 mt-3">Contact: {item.contact_info}</p>
                    </div>
                  ))}
                  {lostFound.length === 0 && (
                    <p className="text-xs opacity-60 text-center py-6">No items posted.</p>
                  )}
                </div>
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
                    h.sender === "user" ? "bg-emerald-500 text-white" : "bg-white/5 border border-white/10"
                  }`}>
                    {h.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Form */}
            <form onSubmit={sendChatMessage} className="p-3 border-t border-white/5 flex gap-2">
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
