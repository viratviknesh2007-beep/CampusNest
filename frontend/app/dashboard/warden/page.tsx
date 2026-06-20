"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Shield,
  Activity,
  Check,
  X,
  MessageSquare,
  FileText,
  Users,
  Home,
  LogOut,
  Bell,
  CheckCircle,
  Clock,
  ExternalLink,
  ChevronRight,
  Sparkles,
  AlertTriangle,
  Sun,
  Sunset,
  Moon,
  Pencil,
  Send
} from "lucide-react";
import InteractiveBackground from "@/components/InteractiveBackground";
import { useTheme } from "@/components/ThemeWrapper";

export default function WardenDashboard() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("leaves");
  const [user, setUser] = useState<any>(null);
  const [postMsgText, setPostMsgText] = useState("");
  const [postedMessages, setPostedMessages] = useState<any[]>([]);
  
  // Data States
  const [leaves, setLeaves] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [hostelMap, setHostelMap] = useState<any[]>([]);
  const [aiTrends, setAiTrends] = useState<string>("");
  const [complaintHeatmap, setComplaintHeatmap] = useState<any[]>([]);
  const [housekeepingContacts, setHousekeepingContacts] = useState<any[]>([]);
  
  // UI states
  const [remarks, setRemarks] = useState<{ [id: number]: string }>({});
  const [selectedBlockId, setSelectedBlockId] = useState<number | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [loadingAction, setLoadingAction] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedHeatmapFloor, setSelectedHeatmapFloor] = useState<{ blockId: number, floor: string } | null>(null);
  const [editingContactKey, setEditingContactKey] = useState<string | null>(null);
  const [editingContactValue, setEditingContactValue] = useState("");

  // Unseen Notifications State
  const [lastSeenCount, setLastSeenCount] = useState<number>(0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("last_seen_warden_messages_count");
      if (saved) {
        setLastSeenCount(parseInt(saved, 10));
      }
    }
  }, []);

  useEffect(() => {
    if (activeTab === "post_messages") {
      setLastSeenCount(postedMessages.length);
      localStorage.setItem("last_seen_warden_messages_count", postedMessages.length.toString());
    }
  }, [activeTab, postedMessages.length]);

  useEffect(() => {
    fetchWardenData();
  }, []);

  const fetchWardenData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/");
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      // 1. Fetch current user
      const meRes = await fetch(`${apiUrl}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (meRes.status === 401 || meRes.status === 403) {
        localStorage.clear();
        router.push("/");
        return;
      }
      if (!meRes.ok) throw new Error("Auth verify failed");
      const meData = await meRes.json();
      setUser(meData);

      // 2. Fetch leaves
      const leavesRes = await fetch(`${apiUrl}/api/leaves`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (leavesRes.ok) setLeaves(await leavesRes.json());

      // 3. Fetch complaints
      const complaintsRes = await fetch(`${apiUrl}/api/complaints`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (complaintsRes.ok) setComplaints(await complaintsRes.json());

      // 4. Fetch students roster
      const studentsRes = await fetch(`${apiUrl}/api/rooms/students`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (studentsRes.ok) setStudents(await studentsRes.json());

      // 5. Fetch map
      const mapRes = await fetch(`${apiUrl}/api/rooms/map`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (mapRes.ok) {
        const mapData = await mapRes.json();
        setHostelMap(mapData);
        if (mapData.length > 0 && selectedBlockId === null) {
          setSelectedBlockId(mapData[0].block_id);
        }
      }

      // 6. Fetch AI complaint trends
      const trendsRes = await fetch(`${apiUrl}/api/ai/complaint-trends`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (trendsRes.ok) {
        const trendsData = await trendsRes.json();
        setAiTrends(trendsData.summary);
      }

      // 7. Fetch complaint analytics heatmap
      const heatmapRes = await fetch(`${apiUrl}/api/complaints/analytics/heatmap`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (heatmapRes.ok) setComplaintHeatmap(await heatmapRes.json());

      // 8. Fetch housekeeping contacts
      const hkRes = await fetch(`${apiUrl}/api/complaints/housekeeping`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (hkRes.ok) setHousekeepingContacts(await hkRes.json());

      // 9. Fetch Broadcast Messages
      const msgRes = await fetch(`${apiUrl}/api/auth/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (msgRes.ok) setPostedMessages(await msgRes.json());

    } catch (err) {
      console.error("fetchWardenData error:", err);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push("/");
  };

  const handlePostMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postMsgText.trim()) return;

    try {
      const token = localStorage.getItem("token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      const res = await fetch(`${apiUrl}/api/auth/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ content: postMsgText })
      });

      if (res.ok) {
        setPostMsgText("");
        const msgRes = await fetch(`${apiUrl}/api/auth/messages`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (msgRes.ok) setPostedMessages(await msgRes.json());
        alert("Message posted successfully to all students!");
      } else {
        alert("Failed to post message.");
      }
    } catch (err) {
      alert("Error posting message.");
    }
  };

  // Review Leave
  const handleReviewLeave = async (leaveId: number, status: "Approved" | "Rejected") => {
    setLoadingAction(leaveId);
    try {
      const token = localStorage.getItem("token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const leaveRemark = remarks[leaveId] || "";

      const res = await fetch(`${apiUrl}/api/leaves/${leaveId}/review`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status: status,
          warden_remarks: leaveRemark
        })
      });

      if (res.ok) {
        // Clear remarks for this ID
        setRemarks(prev => {
          const next = { ...prev };
          delete next[leaveId];
          return next;
        });
        fetchWardenData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAction(null);
    }
  };

  // Resolve Complaint
  const handleResolveComplaint = async (complaintId: number, newStatus: string) => {
    try {
      const token = localStorage.getItem("token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      const res = await fetch(`${apiUrl}/api/complaints/${complaintId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        fetchWardenData();
        if (selectedRoom) {
          // Refresh details in selected room popup if it's currently open
          const updatedMapRes = await fetch(`${apiUrl}/api/rooms/map`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (updatedMapRes.ok) {
            const updatedMapData = await updatedMapRes.json();
            setHostelMap(updatedMapData);
            // Re-find and set selectedRoom details
            for (const b of updatedMapData) {
              const r = b.rooms.find((rm: any) => rm.id === selectedRoom.id);
              if (r) {
                setSelectedRoom(r);
                break;
              }
            }
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleResolveAllOnFloor = async (blockId: number, floorNum: number) => {
    // Find all active complaints for this block and floor
    const activeFloorComplaints = complaints.filter(c => 
      c.status !== "Resolved" && 
      c.student.room?.block_id === blockId && 
      c.student.room?.floor === floorNum
    );

    const token = localStorage.getItem("token");
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    for (const c of activeFloorComplaints) {
      try {
        await fetch(`${apiUrl}/api/complaints/${c.id}/status`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ status: "Resolved" })
        });
      } catch (e) {
        console.error(e);
      }
    }
    // Refresh dashboard data
    fetchWardenData();
  };

  const handleUpdateContact = async (contactId: number, number: string) => {
    try {
      const token = localStorage.getItem("token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/complaints/housekeeping/${contactId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ contact_number: number })
      });
      if (res.ok) {
        // Refresh housekeeping contacts
        const hkRes = await fetch(`${apiUrl}/api/complaints/housekeeping`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (hkRes.ok) setHousekeepingContacts(await hkRes.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (!user) return <div className="p-8 text-center text-sky-200">Loading Warden Profile...</div>;

  const selectedBlock = hostelMap.find(b => b.block_id === selectedBlockId);

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
              <p className="text-xs text-white/90">Warden Portal</p>
            </div>
          </div>

          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab("leaves")}
              className={`w-full py-2.5 px-4 rounded-xl flex items-center gap-3 font-semibold text-sm transition-all ${
                activeTab === "leaves" ? "bg-slate-800/80 text-white border-l-4 border-emerald-500 font-bold" : "text-white opacity-80 hover:opacity-100 hover:bg-slate-800/50"
              }`}
            >
              <FileText className="h-4.5 w-4.5" /> Leave Forms
            </button>

            <button
              onClick={() => setActiveTab("students")}
              className={`w-full py-2.5 px-4 rounded-xl flex items-center gap-3 font-semibold text-sm transition-all ${
                activeTab === "students" ? "bg-slate-800/80 text-white border-l-4 border-emerald-500 font-bold" : "text-white opacity-80 hover:opacity-100 hover:bg-slate-800/50"
              }`}
            >
              <Users className="h-4.5 w-4.5" /> Student Records
            </button>

            <button
              onClick={() => setActiveTab("complaints")}
              className={`w-full py-2.5 px-4 rounded-xl flex items-center gap-3 font-semibold text-sm transition-all ${
                activeTab === "complaints" ? "bg-slate-800/80 text-white border-l-4 border-emerald-500 font-bold" : "text-white opacity-80 hover:opacity-100 hover:bg-slate-800/50"
              }`}
            >
              <MessageSquare className="h-4.5 w-4.5" /> Complaint Box
            </button>

            <button
              onClick={() => setActiveTab("map")}
              className={`w-full py-2.5 px-4 rounded-xl flex items-center gap-3 font-semibold text-sm transition-all ${
                activeTab === "map" ? "bg-slate-800/80 text-white border-l-4 border-emerald-500 font-bold" : "text-white opacity-80 hover:opacity-100 hover:bg-slate-800/50"
              }`}
            >
              <Home className="h-4.5 w-4.5" /> Rooms Available
            </button>

            <button
              onClick={() => setActiveTab("approved")}
              className={`w-full py-2.5 px-4 rounded-xl flex items-center gap-3 font-semibold text-sm transition-all ${
                activeTab === "approved" ? "bg-slate-800/80 text-white border-l-4 border-emerald-500 font-bold" : "text-white opacity-80 hover:opacity-100 hover:bg-slate-800/50"
              }`}
            >
              <CheckCircle className="h-4.5 w-4.5" /> Approved Details
            </button>

            <button
              onClick={() => setActiveTab("post_messages")}
              title="messages will dissappear every 24 hrs"
              className={`w-full py-2.5 px-4 rounded-xl flex items-center justify-between font-semibold text-sm transition-all ${
                activeTab === "post_messages" ? "bg-slate-800/80 text-white border-l-4 border-emerald-500 font-bold" : "text-white opacity-80 hover:opacity-100 hover:bg-slate-800/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <Send className="h-4.5 w-4.5" /> Post Messages
              </div>
              {postedMessages.length - lastSeenCount > 0 && activeTab !== "post_messages" && (
                <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-600 text-white rounded-full">
                  {postedMessages.length - lastSeenCount}
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

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-y-auto p-4 md:p-8 z-10">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-[var(--glass-border)]">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white">
              Warden Operations Dashboard
            </h1>
            <p className="text-xs text-sky-300 mt-1">
              Logged in as: {user.full_name} | Role: Hostel Warden
            </p>
          </div>
        </div>

        {postedMessages.length - lastSeenCount > 0 && activeTab !== "post_messages" && (
          <div className="mb-6 p-4 rounded-2xl bg-indigo-500/10 border-2 border-indigo-500/20 text-white text-xs md:text-sm font-semibold flex justify-between items-center gap-3 animate-pulse-subtle">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-indigo-400 animate-bounce" />
              <span>You have {postedMessages.length - lastSeenCount} new unread messages.</span>
            </div>
            <button
              onClick={() => setActiveTab("post_messages")}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-extrabold transition-all shadow cursor-pointer shrink-0"
            >
              View
            </button>
          </div>
        )}

        {/* Mobile Tab Switcher */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-4 md:hidden border-b border-[var(--glass-border)]">
          {["leaves", "students", "complaints", "map", "approved", "post_messages"].map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold capitalize shrink-0 transition-all ${
                activeTab === t ? "bg-emerald-600 text-white border border-emerald-500 font-bold" : "glass-card text-sky-200"
              }`}
            >
              {t === "approved" ? "Approved Details" : t === "map" ? "Rooms Available" : t === "post_messages" ? (activeTab === "post_messages" ? "Post Messages" : (postedMessages.length - lastSeenCount > 0 ? `Post Messages (${postedMessages.length - lastSeenCount})` : "Post Messages")) : t}
            </button>
          ))}
        </div>

        {/* Tab 1: Leave Forms Review */}
        {activeTab === "leaves" && (
          <div className="space-y-6">
            <div className="glass-panel rounded-2xl p-6 border-2 border-slate-800/80">
              <h2 className="text-lg font-bold mb-4 text-[var(--text-primary)]">Student Outing & Leave Applications</h2>
              <div className="space-y-4">
                {leaves.filter(l => l.status !== "Approved").map((l) => (
                  <div key={l.id} className="p-5 rounded-2xl bg-[var(--input-bg)] border-2 border-slate-800/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[var(--text-primary)] text-sm">{l.student.user.full_name}</span>
                        <span className="text-[10px] text-sky-300 font-semibold px-2 py-0.5 bg-[var(--input-bg)] rounded">Roll: {l.student.roll_number}</span>
                      </div>
                      <p className="text-xs text-sky-200">
                        <span className="font-semibold text-indigo-400">Duration:</span> {new Date(l.start_date).toLocaleDateString()} to {new Date(l.end_date).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-sky-200">
                        <span className="font-semibold text-indigo-400">Reason:</span> {l.reason}
                      </p>
                      {l.warden_remarks && (
                        <p className="text-[11px] text-amber-400 italic">
                          Remarks: "{l.warden_remarks}"
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2 w-full md:w-auto">
                      {l.status === "Pending" ? (
                        <div className="flex flex-col gap-2 w-full">
                          <input
                            type="text"
                            placeholder="Add remarks (optional)..."
                            value={remarks[l.id] || ""}
                            onChange={(e) => setRemarks({ ...remarks, [l.id]: e.target.value })}
                            className="p-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg text-[var(--input-text)] text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                          <div className="flex gap-2 justify-end">
                            <button
                              disabled={loadingAction === l.id}
                              onClick={() => handleReviewLeave(l.id, "Approved")}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer"
                            >
                              <Check className="h-3 w-3" /> Approve
                            </button>
                            <button
                              disabled={loadingAction === l.id}
                              onClick={() => handleReviewLeave(l.id, "Rejected")}
                              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer"
                            >
                              <X className="h-3 w-3" /> Reject
                            </button>
                          </div>
                        </div>
                      ) : (
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          l.status === "Approved" ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
                        }`}>
                          {l.status}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {leaves.filter(l => l.status !== "Approved").length === 0 && (
                  <p className="text-xs text-sky-300 text-center py-6 text-sky-200">No pending or rejected leave requests registered.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 1.5: Approved Details */}
        {activeTab === "approved" && (
          <div className="space-y-6">
            <div className="glass-panel rounded-2xl p-6 border-2 border-slate-800/80">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-[var(--text-primary)]">Approved Leave Applications</h2>
                  <p className="text-xs text-sky-300 mt-1">Showing approved leaves stored for up to 7 days.</p>
                </div>
                {/* Search Bar */}
                <div className="relative w-full md:w-72">
                  <input
                    type="text"
                    placeholder="Search by student name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-3 pr-10 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl text-[var(--input-text)] text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-2.5 text-sky-300 hover:text-white cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                {(() => {
                  const sevenDaysAgo = new Date();
                  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

                  const filteredApproved = leaves.filter((l) => {
                    if (l.status !== "Approved") return false;
                    const startDate = new Date(l.start_date);
                    const isWithin7Days = startDate >= sevenDaysAgo;
                    if (!isWithin7Days) return false;

                    if (searchQuery.trim() === "") return true;
                    return l.student.user.full_name.toLowerCase().includes(searchQuery.toLowerCase());
                  });

                  return (
                    <>
                      {filteredApproved.map((l) => (
                        <div key={l.id} className="p-5 rounded-2xl bg-[var(--input-bg)] border-2 border-slate-800/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[var(--text-primary)] text-sm">{l.student.user.full_name}</span>
                              <span className="text-[10px] text-sky-300 font-semibold px-2 py-0.5 bg-[var(--input-bg)] rounded">Roll: {l.student.roll_number}</span>
                            </div>
                            <p className="text-xs text-sky-200">
                              <span className="font-semibold text-indigo-400">Duration:</span> {new Date(l.start_date).toLocaleDateString()} to {new Date(l.end_date).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-sky-200">
                              <span className="font-semibold text-indigo-400">Reason:</span> {l.reason}
                            </p>
                            {l.warden_remarks && (
                              <p className="text-[11px] text-amber-400 italic">
                                Remarks: "{l.warden_remarks}"
                              </p>
                            )}
                          </div>
                          <div>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400">
                              Approved
                            </span>
                          </div>
                        </div>
                      ))}
                      {filteredApproved.length === 0 && (
                        <p className="text-xs text-sky-300 text-center py-6 text-sky-200">No approved leave requests found.</p>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Complaint Box */}
        {activeTab === "complaints" && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">

              {/* Complaints list */}
              <div className="md:col-span-2 glass-panel rounded-2xl p-6 border-2 border-slate-800/80 space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-bold text-[var(--text-primary)]">Student Complaints & Help Tickets</h2>
                  <button
                    onClick={() => setComplaints([])}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer border border-white/10"
                  >
                    Refresh
                  </button>
                </div>
                <div className="space-y-3">
                  {complaints.map((c) => (
                    <div key={c.id} className="p-4 rounded-xl bg-[var(--input-bg)] border-2 border-slate-800/80">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1.5 text-xs text-sky-200">
                          <div>
                            <span className="font-bold text-[var(--text-primary)]">Name:</span> {c.student.user.full_name}
                          </div>
                          <div>
                            <span className="font-bold text-[var(--text-primary)]">Problem:</span> {c.description}
                          </div>
                          <div>
                            <span className="font-bold text-[var(--text-primary)]">Room No:</span> {c.student.room?.room_number || "N/A"}
                          </div>
                          <div>
                            <span className="font-bold text-[var(--text-primary)]">Block:</span> {c.student.room?.block_name || "N/A"}
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                            c.status === "Pending" ? "bg-amber-500/20 text-amber-400" :
                            c.status === "In Progress" ? "bg-indigo-500/20 text-indigo-400" :
                            "bg-emerald-500/20 text-emerald-400"
                          }`}>
                            {c.status}
                          </span>
                          
                          {c.status !== "Resolved" && (
                            <div className="flex gap-1.5 mt-2">
                              {c.status === "Pending" && (
                                <button
                                  onClick={() => handleResolveComplaint(c.id, "In Progress")}
                                  className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[10px] font-bold cursor-pointer"
                                >
                                  In Progress
                                </button>
                              )}
                              <button
                                onClick={() => handleResolveComplaint(c.id, "Resolved")}
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold cursor-pointer"
                              >
                                Resolve
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {complaints.length === 0 && (
                    <p className="text-xs text-sky-300 text-center py-6 text-sky-200">No student complaints filed.</p>
                  )}
                </div>
              </div>

              {/* Housekeeping Contacts */}
              <div className="glass-panel rounded-2xl p-6 border-2 border-slate-800/80 space-y-6">
                <h3 className="text-base font-bold text-[var(--text-primary)] border-b border-[var(--glass-border)] pb-2">Housekeeping Contacts</h3>
                
                <div className="grid grid-cols-1 gap-6">
                  
                  {/* Boys Block Square Box */}
                  <div className="p-6 bg-[var(--input-bg)] border border-[var(--glass-border)] rounded-2xl flex flex-col justify-between aspect-square">
                    <h4 className="text-sm font-bold text-sky-300 uppercase tracking-wider border-b border-[var(--glass-border)] pb-2">Boys Block</h4>
                    <div className="flex-1 flex flex-col justify-around pt-2">
                      {["Electrician", "Plumber", "Cleaning", "Internet", "Furniture"].map((profession) => {
                        const block = "Boys";
                        const c = housekeepingContacts.find(
                          (hc) => hc.block_type === block && hc.job_profession === profession
                        ) || { id: -1, block_type: block, job_profession: profession, contact_number: "" };
                        const key = `${block}-${profession}`;
                        const isEditing = editingContactKey === key;

                        return (
                          <div key={profession} className="flex justify-between items-center text-xs">
                            <span className="font-bold text-[var(--text-primary)]">{profession}:</span>
                            <div className="flex items-center gap-2">
                              {isEditing ? (
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="text"
                                    value={editingContactValue}
                                    onChange={(e) => setEditingContactValue(e.target.value)}
                                    className="w-24 px-1.5 py-0.5 bg-black/40 border border-[var(--glass-border)] rounded text-[11px] text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                    placeholder="Contact..."
                                    autoFocus
                                  />
                                  <button
                                    onClick={() => {
                                      handleUpdateContact(c.id, editingContactValue);
                                      setEditingContactKey(null);
                                    }}
                                    className="p-0.5 text-emerald-500 hover:text-emerald-400 cursor-pointer"
                                  >
                                    <Check className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={() => setEditingContactKey(null)}
                                    className="p-0.5 text-rose-500 hover:text-rose-400 cursor-pointer"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <span className="text-sky-200">{c.contact_number || "Not Added"}</span>
                                  <button
                                    onClick={() => {
                                      setEditingContactKey(key);
                                      setEditingContactValue(c.contact_number || "");
                                    }}
                                    className="p-0.5 text-sky-400 hover:text-sky-300 cursor-pointer"
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Girls Block Square Box */}
                  <div className="p-6 bg-[var(--input-bg)] border border-[var(--glass-border)] rounded-2xl flex flex-col justify-between aspect-square">
                    <h4 className="text-sm font-bold text-rose-300 uppercase tracking-wider border-b border-[var(--glass-border)] pb-2">Girls Block</h4>
                    <div className="flex-1 flex flex-col justify-around pt-2">
                      {["Electrician", "Plumber", "Cleaning", "Internet", "Furniture"].map((profession) => {
                        const block = "Girls";
                        const c = housekeepingContacts.find(
                          (hc) => hc.block_type === block && hc.job_profession === profession
                        ) || { id: -1, block_type: block, job_profession: profession, contact_number: "" };
                        const key = `${block}-${profession}`;
                        const isEditing = editingContactKey === key;

                        return (
                          <div key={profession} className="flex justify-between items-center text-xs">
                            <span className="font-bold text-[var(--text-primary)]">{profession}:</span>
                            <div className="flex items-center gap-2">
                              {isEditing ? (
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="text"
                                    value={editingContactValue}
                                    onChange={(e) => setEditingContactValue(e.target.value)}
                                    className="w-24 px-1.5 py-0.5 bg-black/40 border border-[var(--glass-border)] rounded text-[11px] text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                    placeholder="Contact..."
                                    autoFocus
                                  />
                                  <button
                                    onClick={() => {
                                      handleUpdateContact(c.id, editingContactValue);
                                      setEditingContactKey(null);
                                    }}
                                    className="p-0.5 text-emerald-500 hover:text-emerald-400 cursor-pointer"
                                  >
                                    <Check className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={() => setEditingContactKey(null)}
                                    className="p-0.5 text-rose-500 hover:text-rose-400 cursor-pointer"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <span className="text-sky-200">{c.contact_number || "Not Added"}</span>
                                  <button
                                    onClick={() => {
                                      setEditingContactKey(key);
                                      setEditingContactValue(c.contact_number || "");
                                    }}
                                    className="p-0.5 text-sky-400 hover:text-sky-300 cursor-pointer"
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>

              </div>

            </div>
          </div>
        )}

        {/* Tab 3: Student Roster */}
        {activeTab === "students" && (
          <div className="glass-panel rounded-2xl p-6 border-2 border-slate-800/80">
            <h2 className="text-lg font-bold mb-4 text-[var(--text-primary)]">Student Occupancy Records</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-sky-300 border-b border-[var(--glass-border)]">
                    <th className="pb-3 font-semibold uppercase tracking-wider">Student Name</th>
                    <th className="pb-3 font-semibold uppercase tracking-wider">Roll Number</th>
                    <th className="pb-3 font-semibold uppercase tracking-wider">Gender</th>
                    <th className="pb-3 font-semibold uppercase tracking-wider">Department</th>
                    <th className="pb-3 font-semibold uppercase tracking-wider">Year</th>
                    <th className="pb-3 font-semibold uppercase tracking-wider">Phone</th>
                    <th className="pb-3 font-semibold uppercase tracking-wider">Allocated Room</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--glass-border)]">
                  {students.map((s) => (
                    <tr key={s.id} className="hover:bg-[var(--input-bg)] transition-colors">
                      <td className="py-3.5 font-bold text-[var(--text-primary)]">{s.full_name}</td>
                      <td className="py-3.5">{s.roll_number}</td>
                      <td className="py-3.5 opacity-80">{s.gender}</td>
                      <td className="py-3.5 opacity-80">{s.department}</td>
                      <td className="py-3.5 opacity-80">Year {s.year}</td>
                      <td className="py-3.5 opacity-80">{s.phone}</td>
                      <td className="py-3.5 font-bold text-emerald-400">
                        {s.room ? `${s.room.block_name} - Rm ${s.room.room_number}` : "Not Allocated"}
                      </td>
                    </tr>
                  ))}
                  {students.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-sky-300/80">No students found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Interactive Layout Map */}
        {activeTab === "map" && (
          <div className="space-y-6">
            
            {/* Block switcher */}
            <div className="flex gap-2 border-b border-[var(--glass-border)] pb-4">
              {hostelMap.map((b) => (
                <button
                  key={b.block_id}
                  onClick={() => setSelectedBlockId(b.block_id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all capitalize border ${
                    selectedBlockId === b.block_id ? "bg-emerald-500/25 border-emerald-500 text-emerald-400" : "bg-[var(--input-bg)] border-[var(--glass-border)] hover:bg-white/10"
                  }`}
                >
                  {b.block_name}
                </button>
              ))}
            </div>

            {selectedBlock && (
              <div className="space-y-8">
                {Array.from({ length: selectedBlock.total_floors }, (_, i) => selectedBlock.total_floors - i).map((floor) => (
                  <div key={floor} className="space-y-3">
                    <h3 className="text-sm font-bold text-[var(--text-primary)] text-sky-300">Floor {floor}</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {selectedBlock.rooms.filter((r: any) => r.floor === floor).map((room: any) => {
                        const isRoomOccupied = room.status === "Occupied" || room.occupants.length >= room.capacity;
                        let colorClass = "room-available";
                        if (isRoomOccupied) colorClass = "room-occupied";
                        else if (room.status === "Maintenance") colorClass = "room-maintenance";
                        if (room.complaints_count > 0) {
                          colorClass = "bg-rose-950/70 hover:bg-rose-900 border border-rose-500/50 text-rose-100 shadow-lg shadow-rose-950/40 animate-pulse-subtle";
                        }

                        return (
                          <button
                            key={room.id}
                            onClick={() => setSelectedRoom(room)}
                            className={`p-4 rounded-2xl text-left transition-all relative cursor-pointer ${colorClass}`}
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-extrabold text-base">{room.room_number}</span>
                              {room.complaints_count > 0 && (
                                <span className="h-4.5 w-4.5 bg-rose-500 text-white rounded-full flex items-center justify-center text-[9px] font-black animate-pulse">
                                  {room.complaints_count}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] block mt-1.5 opacity-80 font-medium">
                              Occupied: {room.occupants.length} / {room.capacity}
                            </span>
                            <span className="text-[9px] block mt-1 uppercase font-bold tracking-wider text-sky-300">
                              {room.complaints_count > 0 ? "Complaint Active" : (isRoomOccupied ? "Occupied" : room.status)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Room Detail Modal popup */}
            {selectedRoom && (
              <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                <div className="glass-panel w-full max-w-lg rounded-3xl p-6 border border-white/10 relative">
                  
                  <button
                    onClick={() => setSelectedRoom(null)}
                    className="absolute top-4 right-4 text-sky-300 hover:text-white cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>

                  <h3 className="text-lg font-black text-[var(--text-primary)] flex items-center gap-2 mb-2">
                    Room Details: {selectedRoom.room_number}
                  </h3>
                  <p className="text-xs text-sky-200 mb-6">
                    Floor {selectedRoom.floor} | Capacity: {selectedRoom.capacity} slots | Current Status: <span className={`font-bold ${selectedRoom.complaints_count > 0 ? "text-rose-400" : "text-emerald-400"}`}>{selectedRoom.complaints_count > 0 ? "Active Complaints" : selectedRoom.status}</span>
                  </p>

                  <div className="space-y-4">
                    
                    {/* Room Occupants */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-2">Room Occupants</h4>
                      <div className="space-y-2">
                        {selectedRoom.occupants.map((o: any) => (
                          <div key={o.student_id} className="p-3 bg-[var(--input-bg)] rounded-xl border-2 border-slate-800/80 flex justify-between items-center text-xs">
                            <div>
                              <p className="font-bold text-[var(--text-primary)]">{o.full_name}</p>
                              <p className="text-[10px] text-sky-300">Roll: {o.roll_number} | Year {o.year}</p>
                            </div>
                            <span className="text-[10px] opacity-75 font-medium">{o.department}</span>
                          </div>
                        ))}
                        {selectedRoom.occupants.length === 0 && (
                          <p className="text-xs text-sky-300/80 italic text-sky-200">Room is currently empty.</p>
                        )}
                      </div>
                    </div>

                    {/* Room complaints details section */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 mb-2">Active Problems Faced</h4>
                      <div className="space-y-2.5 max-h-[160px] overflow-y-auto pr-1">
                        {(() => {
                          // Compile all complaints belonging to students in this room from backend state/students roster
                          const roomStudents = students.filter(s => s.room && s.room.id === selectedRoom.id);
                          const complaintsList: any[] = [];
                          roomStudents.forEach((st: any) => {
                            if (st.complaints && st.complaints.length > 0) {
                              st.complaints.forEach((c: any) => {
                                if (c.status !== "Resolved") {
                                  complaintsList.push({
                                    ...c,
                                    student_name: st.full_name
                                  });
                                }
                              });
                            }
                          });

                          if (complaintsList.length === 0) {
                            return <p className="text-xs text-sky-300/80 italic text-sky-200">No active complaints filed in this room.</p>;
                          }

                          return complaintsList.map((c: any) => (
                            <div key={c.id} className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs">
                              <div className="flex justify-between items-center font-bold text-rose-300 mb-1">
                                <span>{c.title}</span>
                                <span className="text-[9px] uppercase px-2 py-0.5 bg-rose-500/25 rounded-full">{c.status}</span>
                              </div>
                              <p className="text-[11px] opacity-80 mb-1 text-sky-200">{c.description}</p>
                              <div className="text-[9px] text-sky-300">Filed by: {c.student_name} | Category: {c.category}</div>
                              {c.status !== "Resolved" && (
                                <div className="mt-2 flex gap-1.5 justify-end">
                                  {c.status === "Pending" && (
                                    <button
                                      onClick={() => handleResolveComplaint(c.id, "In Progress")}
                                      className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[9px] font-bold cursor-pointer"
                                    >
                                      In Progress
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleResolveComplaint(c.id, "Resolved")}
                                    className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[9px] font-bold cursor-pointer"
                                  >
                                    Resolve
                                  </button>
                                </div>
                              )}
                            </div>
                          ));
                        })()}
                      </div>
                    </div>

                  </div>

                </div>
              </div>
            )}

          </div>
        )}

        {activeTab === "post_messages" && (
          <div className="space-y-6 animate-fade-in">
            <div className="glass-panel rounded-2xl p-6 border-2 border-slate-800/80">
              <h2 className="text-xl font-black text-white mb-2">Post Public Message</h2>
              <p className="text-xs text-sky-200 mb-6">Send a message to all student portals instantly.</p>
              
              <form onSubmit={handlePostMessage} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-2">Message Body</label>
                  <textarea
                    required
                    rows={4}
                    value={postMsgText}
                    onChange={(e) => setPostMsgText(e.target.value)}
                    className="w-full p-2.5 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl text-[var(--input-text)] text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="Type the message you want to send..."
                  />
                </div>
                
                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 font-extrabold rounded-xl text-white transition-all active:scale-95 shadow-md flex items-center justify-center gap-2"
                >
                  <Send className="h-4 w-4" /> Post Message
                </button>
              </form>
            </div>

            <div className="glass-panel rounded-2xl p-6 border-2 border-slate-800/80">
              <h3 className="text-lg font-bold mb-2">Notifications</h3>
              <p className="text-xs text-sky-200 mb-6 font-semibold">messages will dissappear every 24 hrs</p>
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                {postedMessages.length > 0 ? (
                  postedMessages.map((msg) => (
                    <div key={msg.id} className="p-4 rounded-xl bg-[var(--input-bg)] border-2 border-slate-800/80">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-emerald-400">By: {msg.sender_name}</span>
                        <span className="text-[10px] text-sky-300 opacity-80">{new Date(msg.created_at).toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-white leading-relaxed">{msg.content}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-sky-300 italic">No received messages sent yet.</p>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
