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
  AlertTriangle
} from "lucide-react";
import InteractiveBackground from "@/components/InteractiveBackground";

export default function WardenDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("leaves");
  const [user, setUser] = useState<any>(null);
  
  // Data States
  const [leaves, setLeaves] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [hostelMap, setHostelMap] = useState<any[]>([]);
  const [aiTrends, setAiTrends] = useState<string>("");
  const [complaintHeatmap, setComplaintHeatmap] = useState<any[]>([]);
  
  // UI states
  const [remarks, setRemarks] = useState<{ [id: number]: string }>({});
  const [selectedBlockId, setSelectedBlockId] = useState<number | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [loadingAction, setLoadingAction] = useState<number | null>(null);

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
      if (!meRes.ok) throw new Error();
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

    } catch (err) {
      console.error(err);
      localStorage.clear();
      router.push("/");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push("/");
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

  if (!user) return <div className="p-8 text-center text-slate-300">Loading Warden Profile...</div>;

  const selectedBlock = hostelMap.find(b => b.block_id === selectedBlockId);

  return (
    <div className="relative flex h-screen overflow-hidden bg-[#0b0f19] text-slate-100">
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
              <h2 className="font-extrabold text-lg tracking-tight text-white">CampusNest</h2>
              <p className="text-xs opacity-60">Warden Portal</p>
            </div>
          </div>

          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab("leaves")}
              className={`w-full py-2.5 px-4 rounded-xl flex items-center gap-3 font-semibold text-sm transition-all ${
                activeTab === "leaves" ? "bg-[#82ab7d]/20 text-[#cfaecf] border-l-4 border-[#82ab7d]" : "opacity-70 hover:opacity-100 hover:bg-white/5"
              }`}
            >
              <FileText className="h-4.5 w-4.5" /> Leave Forms
            </button>

            <button
              onClick={() => setActiveTab("complaints")}
              className={`w-full py-2.5 px-4 rounded-xl flex items-center gap-3 font-semibold text-sm transition-all ${
                activeTab === "complaints" ? "bg-[#82ab7d]/20 text-[#cfaecf] border-l-4 border-[#82ab7d]" : "opacity-70 hover:opacity-100 hover:bg-white/5"
              }`}
            >
              <MessageSquare className="h-4.5 w-4.5" /> Complaint Box
            </button>

            <button
              onClick={() => setActiveTab("students")}
              className={`w-full py-2.5 px-4 rounded-xl flex items-center gap-3 font-semibold text-sm transition-all ${
                activeTab === "students" ? "bg-[#82ab7d]/20 text-[#cfaecf] border-l-4 border-[#82ab7d]" : "opacity-70 hover:opacity-100 hover:bg-white/5"
              }`}
            >
              <Users className="h-4.5 w-4.5" /> Student Roster
            </button>

            <button
              onClick={() => setActiveTab("map")}
              className={`w-full py-2.5 px-4 rounded-xl flex items-center gap-3 font-semibold text-sm transition-all ${
                activeTab === "map" ? "bg-[#82ab7d]/20 text-[#cfaecf] border-l-4 border-[#82ab7d]" : "opacity-70 hover:opacity-100 hover:bg-white/5"
              }`}
            >
              <Home className="h-4.5 w-4.5" /> Interactive Map
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
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white">
              Warden Operations Dashboard
            </h1>
            <p className="text-xs opacity-60 mt-1">
              Logged in as: {user.full_name} | Role: Hostel Warden
            </p>
          </div>
        </div>

        {/* Mobile Tab Switcher */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-4 md:hidden border-b border-white/5">
          {["leaves", "complaints", "students", "map"].map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold capitalize shrink-0 transition-all ${
                activeTab === t ? "bg-[#82ab7d]/20 text-[#cfaecf] border border-[#82ab7d]" : "glass-card text-slate-300"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Tab 1: Leave Forms Review */}
        {activeTab === "leaves" && (
          <div className="space-y-6">
            <div className="glass-panel rounded-2xl p-6 border border-white/5">
              <h2 className="text-lg font-bold mb-4 text-white">Student Outing & Leave Applications</h2>
              <div className="space-y-4">
                {leaves.map((l) => (
                  <div key={l.id} className="p-5 rounded-2xl bg-white/5 border border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{l.student.user.full_name}</span>
                        <span className="text-[10px] opacity-60 font-semibold px-2 py-0.5 bg-white/5 rounded">Roll: {l.student.roll_number}</span>
                      </div>
                      <p className="text-xs text-slate-300">
                        <span className="font-semibold text-indigo-400">Duration:</span> {new Date(l.start_date).toLocaleDateString()} to {new Date(l.end_date).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-slate-300">
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
                            className="p-2 bg-black/25 border border-white/10 rounded-lg text-xs text-white"
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
                {leaves.length === 0 && (
                  <p className="text-xs opacity-60 text-center py-6 text-slate-300">No leave requests registered.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Complaint Box */}
        {activeTab === "complaints" && (
          <div className="space-y-6">
            
            {/* AI analysis trends */}
            <div className="glass-panel rounded-2xl p-5 border border-white/5 flex gap-4 items-start bg-indigo-950/20 border-indigo-500/20">
              <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400">
                <Sparkles className="h-6 w-6 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">AI Operations Analysis</h3>
                <p className="text-xs text-indigo-200 opacity-90 leading-relaxed">
                  {aiTrends || "Compiling complaint data and trends..."}
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              
              {/* Complaints list */}
              <div className="md:col-span-2 glass-panel rounded-2xl p-6 border border-white/5 space-y-4">
                <h2 className="text-lg font-bold text-white">Student Complaints & Help Tickets</h2>
                <div className="space-y-3">
                  {complaints.map((c) => (
                    <div key={c.id} className="p-4 rounded-xl bg-white/5 border border-white/5">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-sm text-white">{c.title}</h4>
                          <p className="text-xs text-slate-300 mt-1">{c.description}</p>
                          <div className="mt-2 text-[10px] text-slate-400 space-y-1">
                            <div>Submitted by: <span className="font-semibold text-white">{c.student.user.full_name}</span></div>
                            <div>Location: <span className="font-semibold text-white">Block {c.student.room?.block_name || "N/A"} - Room {c.student.room?.room_number || "N/A"}</span></div>
                            <div>Category: <span className="font-semibold text-white">{c.category}</span> | Filed: {new Date(c.created_at).toLocaleDateString()}</div>
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
                    <p className="text-xs opacity-60 text-center py-6 text-slate-300">No student complaints filed.</p>
                  )}
                </div>
              </div>

              {/* Heatmap / Analytics statistics */}
              <div className="glass-panel rounded-2xl p-6 border border-white/5 space-y-6">
                <h3 className="text-base font-bold text-white border-b border-white/5 pb-2">Facility Heatmap</h3>
                {complaintHeatmap.map((b) => (
                  <div key={b.block_id} className="space-y-3">
                    <div className="flex justify-between items-center text-sm font-semibold text-white">
                      <span>{b.block_name}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-rose-500/20 text-rose-300">
                        {b.total_complaints} Active issues
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {Object.entries(b.floors).map(([floor, count]: any) => (
                        <div key={floor} className={`p-2 rounded-lg text-center border ${
                          count > 0 ? "bg-rose-500/10 border-rose-500/30 text-rose-300" : "bg-white/5 border-white/5 opacity-60"
                        }`}>
                          <span className="block font-black text-xs">{count}</span>
                          <span className="text-[9px] opacity-70">Floor {floor}</span>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-1 text-xs pt-1">
                      {Object.entries(b.categories).map(([cat, count]: any) => (
                        <div key={cat} className="flex justify-between items-center p-1 rounded bg-black/20 text-[11px]">
                          <span className="opacity-80">{cat}</span>
                          <span className={`font-semibold ${count > 0 ? "text-rose-400" : "opacity-40"}`}>{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>
        )}

        {/* Tab 3: Student Roster */}
        {activeTab === "students" && (
          <div className="glass-panel rounded-2xl p-6 border border-white/5">
            <h2 className="text-lg font-bold mb-4 text-white">Student Occupancy Records</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="opacity-60 border-b border-white/5">
                    <th className="pb-3 font-semibold uppercase tracking-wider">Student Name</th>
                    <th className="pb-3 font-semibold uppercase tracking-wider">Roll Number</th>
                    <th className="pb-3 font-semibold uppercase tracking-wider">Gender</th>
                    <th className="pb-3 font-semibold uppercase tracking-wider">Department</th>
                    <th className="pb-3 font-semibold uppercase tracking-wider">Year</th>
                    <th className="pb-3 font-semibold uppercase tracking-wider">Phone</th>
                    <th className="pb-3 font-semibold uppercase tracking-wider">Allocated Room</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {students.map((s) => (
                    <tr key={s.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3.5 font-bold text-white">{s.full_name}</td>
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
                      <td colSpan={7} className="py-8 text-center opacity-50">No students found.</td>
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
            <div className="flex gap-2 border-b border-white/5 pb-4">
              {hostelMap.map((b) => (
                <button
                  key={b.block_id}
                  onClick={() => setSelectedBlockId(b.block_id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all capitalize border ${
                    selectedBlockId === b.block_id ? "bg-emerald-500/25 border-emerald-500 text-emerald-400" : "bg-white/5 border-white/5 hover:bg-white/10"
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
                    <h3 className="text-sm font-bold text-white opacity-60">Floor {floor}</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {selectedBlock.rooms.filter((r: any) => r.floor === floor).map((room: any) => {
                        let colorClass = "room-available";
                        if (room.status === "Occupied") colorClass = "room-occupied";
                        if (room.status === "Maintenance") colorClass = "room-maintenance";
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
                            <span className="text-[9px] block mt-1 uppercase font-bold tracking-wider opacity-60">
                              {room.complaints_count > 0 ? "Complaint Active" : room.status}
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
                    className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>

                  <h3 className="text-lg font-black text-white flex items-center gap-2 mb-2">
                    Room Details: {selectedRoom.room_number}
                  </h3>
                  <p className="text-xs text-slate-300 mb-6">
                    Floor {selectedRoom.floor} | Capacity: {selectedRoom.capacity} slots | Current Status: <span className={`font-bold ${selectedRoom.complaints_count > 0 ? "text-rose-400" : "text-emerald-400"}`}>{selectedRoom.complaints_count > 0 ? "Active Complaints" : selectedRoom.status}</span>
                  </p>

                  <div className="space-y-4">
                    
                    {/* Room Occupants */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-2">Room Occupants</h4>
                      <div className="space-y-2">
                        {selectedRoom.occupants.map((o: any) => (
                          <div key={o.student_id} className="p-3 bg-white/5 rounded-xl border border-white/5 flex justify-between items-center text-xs">
                            <div>
                              <p className="font-bold text-white">{o.full_name}</p>
                              <p className="text-[10px] opacity-60">Roll: {o.roll_number} | Year {o.year}</p>
                            </div>
                            <span className="text-[10px] opacity-75 font-medium">{o.department}</span>
                          </div>
                        ))}
                        {selectedRoom.occupants.length === 0 && (
                          <p className="text-xs opacity-50 italic text-slate-300">Room is currently empty.</p>
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
                            return <p className="text-xs opacity-50 italic text-slate-300">No active complaints filed in this room.</p>;
                          }

                          return complaintsList.map((c: any) => (
                            <div key={c.id} className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs">
                              <div className="flex justify-between items-center font-bold text-rose-300 mb-1">
                                <span>{c.title}</span>
                                <span className="text-[9px] uppercase px-2 py-0.5 bg-rose-500/25 rounded-full">{c.status}</span>
                              </div>
                              <p className="text-[11px] opacity-80 mb-1 text-slate-300">{c.description}</p>
                              <div className="text-[9px] opacity-60">Filed by: {c.student_name} | Category: {c.category}</div>
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

      </div>
    </div>
  );
}
