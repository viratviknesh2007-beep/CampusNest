"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Shield,
  Activity,
  Home,
  Users,
  MessageSquare,
  Key,
  Plus,
  Trash,
  Settings,
  Sparkles,
  AlertTriangle,
  Info,
  LogOut,
  X,
  Check
} from "lucide-react";
import InteractiveBackground from "@/components/InteractiveBackground";

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("map");
  const [user, setUser] = useState<any>(null);
  
  // Database States
  const [hostelMap, setHostelMap] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [complaintHeatmap, setComplaintHeatmap] = useState<any[]>([]);
  const [aiTrendsSummary, setAiTrendsSummary] = useState("");
  const [selectedBlockId, setSelectedBlockId] = useState<number | null>(null);
  const [complaintBlockId, setComplaintBlockId] = useState<number | null>(null);
  const [selectedComplaintRoom, setSelectedComplaintRoom] = useState<any>(null);

  // Room allocation form states
  const [allocStudentId, setAllocStudentId] = useState("");
  const [allocRoomId, setAllocRoomId] = useState("");
  const [allocationError, setAllocationError] = useState("");
  const [allocationSuccess, setAllocationSuccess] = useState("");

  // Room detail modal state
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [loadingAction, setLoadingAction] = useState<any>(null);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/");
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      // 1. Fetch user info
      const meRes = await fetch(`${apiUrl}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!meRes.ok) throw new Error();
      setUser(await meRes.json());

      // 2. Fetch Map Layout
      const mapRes = await fetch(`${apiUrl}/api/rooms/map`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (mapRes.ok) {
        const mapData = await mapRes.json();
        setHostelMap(mapData);
        if (mapData.length > 0) {
          if (selectedBlockId === null) {
            setSelectedBlockId(mapData[0].block_id);
          }
          if (complaintBlockId === null) {
            setComplaintBlockId(mapData[0].block_id);
          }
        }
      }

      // 3. Fetch Students List
      const studentsRes = await fetch(`${apiUrl}/api/rooms/students`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (studentsRes.ok) setStudents(await studentsRes.json());

      // 4. Fetch Complaint Heatmap
      const heatmapRes = await fetch(`${apiUrl}/api/complaints/analytics/heatmap`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (heatmapRes.ok) setComplaintHeatmap(await heatmapRes.json());

      // 5. Fetch AI Complaint trends
      const trendsRes = await fetch(`${apiUrl}/api/ai/complaint-trends`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (trendsRes.ok) {
        const trendsData = await trendsRes.json();
        setAiTrendsSummary(trendsData.summary);
      }

    } catch (e) {
      console.error(e);
      localStorage.clear();
      router.push("/");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push("/");
  };

  // Submit Allocation
  const handleAllocate = async (e: React.FormEvent) => {
    e.preventDefault();
    setAllocationError("");
    setAllocationSuccess("");
    if (!allocStudentId || !allocRoomId) {
      setAllocationError("Please select both a student and a room.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      const res = await fetch(`${apiUrl}/api/rooms/allocate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          student_id: parseInt(allocStudentId),
          room_id: parseInt(allocRoomId)
        })
      });

      const data = await res.json();
      if (res.ok) {
        setAllocationSuccess("Room allocated successfully!");
        setAllocStudentId("");
        setAllocRoomId("");
        fetchAdminData();
      } else {
        setAllocationError(data.detail || "Failed to allocate room.");
      }
    } catch (err) {
      setAllocationError("Failed to connect to backend api.");
    }
  };

  // Deallocate Student
  const handleDeallocate = async (studentId: number) => {
    setLoadingAction(studentId);
    try {
      const token = localStorage.getItem("token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      const res = await fetch(`${apiUrl}/api/rooms/deallocate/${studentId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        fetchAdminData();
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
        fetchAdminData();
        const updatedMapRes = await fetch(`${apiUrl}/api/rooms/map`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (updatedMapRes.ok) {
          const updatedMapData = await updatedMapRes.json();
          setHostelMap(updatedMapData);
          if (selectedRoom) {
            for (const b of updatedMapData) {
              const r = b.rooms.find((rm: any) => rm.id === selectedRoom.id);
              if (r) {
                setSelectedRoom(r);
                break;
              }
            }
          }
          if (selectedComplaintRoom) {
            for (const b of updatedMapData) {
              const r = b.rooms.find((rm: any) => rm.id === selectedComplaintRoom.id);
              if (r) {
                setSelectedComplaintRoom(r);
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

  if (!user) return <div className="p-8 text-center text-slate-300">Loading Admin Command Center...</div>;

  const selectedBlock = hostelMap.find(b => b.block_id === selectedBlockId);

  // Derive unallocated and allocated students dynamically
  const unallocatedStudents = students.filter(s => !s.room);
  const allocatedStudents = students.filter(s => s.room);

  // Compile list of available rooms with vacancy
  const availableRoomsList: any[] = [];
  hostelMap.forEach((block) => {
    block.rooms.forEach((room: any) => {
      if (room.status !== "Maintenance" && room.occupants.length < room.capacity) {
        availableRoomsList.push({
          id: room.id,
          room_number: room.room_number,
          block_name: block.block_name,
          vacancy: room.capacity - room.occupants.length
        });
      }
    });
  });

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
              <p className="text-xs opacity-60">Admin Command</p>
            </div>
          </div>

          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab("map")}
              className={`w-full py-2.5 px-4 rounded-xl flex items-center gap-3 font-semibold text-sm transition-all ${
                activeTab === "map" ? "bg-[#82ab7d]/20 text-[#cfaecf] border-l-4 border-[#82ab7d]" : "opacity-70 hover:opacity-100 hover:bg-white/5"
              }`}
            >
              <Home className="h-4.5 w-4.5" /> Interactive Map
            </button>

            <button
              onClick={() => setActiveTab("allocate")}
              className={`w-full py-2.5 px-4 rounded-xl flex items-center gap-3 font-semibold text-sm transition-all ${
                activeTab === "allocate" ? "bg-[#82ab7d]/20 text-[#cfaecf] border-l-4 border-[#82ab7d]" : "opacity-70 hover:opacity-100 hover:bg-white/5"
              }`}
            >
              <Key className="h-4.5 w-4.5" /> Room Allocations
            </button>

            <button
              onClick={() => setActiveTab("heatmap")}
              className={`w-full py-2.5 px-4 rounded-xl flex items-center gap-3 font-semibold text-sm transition-all ${
                activeTab === "heatmap" ? "bg-[#82ab7d]/20 text-[#cfaecf] border-l-4 border-[#82ab7d]" : "opacity-70 hover:opacity-100 hover:bg-white/5"
              }`}
            >
              <Activity className="h-4.5 w-4.5" /> Active Complaints
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

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col overflow-y-auto p-4 md:p-8 z-10">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white">
              Administrator Command Center
            </h1>
            <p className="text-xs opacity-60 mt-1">
              Logged in: {user.full_name} | Role: Chief Hostel Administrator
            </p>
          </div>
        </div>

        {/* Mobile Tab Switcher */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-4 md:hidden border-b border-white/5">
          {["map", "allocate", "heatmap"].map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold capitalize shrink-0 transition-all ${
                activeTab === t ? "bg-[#82ab7d]/20 text-[#cfaecf] border border-[#82ab7d]" : "glass-card text-slate-300"
              }`}
            >
              {t === "heatmap" ? "Active Complaints" : t}
            </button>
          ))}
        </div>

        {/* Tab 1: Interactive Map layout */}
        {activeTab === "map" && (
          <div className="space-y-6">
            
            {/* Block Switcher */}
            <div className="flex gap-2 border-b border-white/5 pb-4">
              {hostelMap.map((b) => (
                <button
                  key={b.block_id}
                  onClick={() => setSelectedBlockId(b.block_id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all capitalize border ${
                    selectedBlockId === b.block_id ? "bg-[#82ab7d]/20 border-[#82ab7d] text-[#cfaecf]" : "bg-white/5 border-white/5 hover:bg-white/10"
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
                              {room.status}
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
                    Floor {selectedRoom.floor} | Capacity: {selectedRoom.capacity} slots | Current Status: <span className="font-bold text-emerald-400">{selectedRoom.status}</span>
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



                  </div>

                </div>
              </div>
            )}

          </div>
        )}

        {/* Tab 2: Room Allocations manager */}
        {activeTab === "allocate" && (
          <div className="grid md:grid-cols-3 gap-6 items-start">
            
            {/* Left Col: Allocate form */}
            <div className="glass-panel rounded-2xl p-6 border border-white/5 space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Key className="h-5 w-5 text-emerald-400" /> Allocate Room
              </h3>
              
              <form onSubmit={handleAllocate} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-2">Unallocated Student</label>
                  <select
                    value={allocStudentId}
                    onChange={(e) => setAllocStudentId(e.target.value)}
                    className="w-full p-2.5 bg-black/25 border border-white/10 rounded-xl text-white text-sm"
                  >
                    <option value="" className="bg-slate-900">Select Student...</option>
                    {unallocatedStudents.map((s) => (
                      <option key={s.id} value={s.id} className="bg-slate-900">
                        {s.full_name} ({s.roll_number}) - {s.department}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-2">Available Room (Vacancy)</label>
                  <select
                    value={allocRoomId}
                    onChange={(e) => setAllocRoomId(e.target.value)}
                    className="w-full p-2.5 bg-black/25 border border-white/10 rounded-xl text-white text-sm"
                  >
                    <option value="" className="bg-slate-900">Select Room...</option>
                    {availableRoomsList.map((r) => (
                      <option key={r.id} value={r.id} className="bg-slate-900">
                        {r.block_name} - Room {r.room_number} ({r.vacancy} slots left)
                      </option>
                    ))}
                  </select>
                </div>

                {allocationError && (
                  <p className="text-xs text-rose-400 font-semibold">{allocationError}</p>
                )}
                {allocationSuccess && (
                  <p className="text-xs text-emerald-400 font-semibold">{allocationSuccess}</p>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 font-bold rounded-xl text-white text-sm cursor-pointer"
                >
                  Allocate Room
                </button>
              </form>
            </div>

            {/* Right Col: Allocated Student List with Deallocate action */}
            <div className="md:col-span-2 glass-panel rounded-2xl p-6 border border-white/5 space-y-4">
              <h3 className="text-lg font-bold text-white">Active Room Assignments</h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="opacity-60 border-b border-white/5">
                      <th className="pb-3 font-semibold uppercase">Student Name</th>
                      <th className="pb-3 font-semibold uppercase">Roll Number</th>
                      <th className="pb-3 font-semibold uppercase">Allocated Room</th>
                      <th className="pb-3 font-semibold uppercase text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {allocatedStudents.map((s) => (
                      <tr key={s.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-3.5 font-bold text-white">{s.full_name}</td>
                        <td className="py-3.5">{s.roll_number}</td>
                        <td className="py-3.5 font-bold text-emerald-400">
                          {s.room.block_name} - Room {s.room.room_number}
                        </td>
                        <td className="py-3.5 text-right">
                          <button
                            disabled={loadingAction === s.id}
                            onClick={() => handleDeallocate(s.id)}
                            className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Trash className="h-3 w-3" /> Deallocate
                          </button>
                        </td>
                      </tr>
                    ))}
                    {allocatedStudents.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-8 text-center opacity-50 text-slate-300">No active allocations.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* Tab 3: Heatmap & AI Analysis -> Active Complaints */}
        {activeTab === "heatmap" && (
          <div className="space-y-6">

            {/* Boys / Girls Hostel switcher */}
            <div className="flex gap-2 border-b border-white/5 pb-4">
              {hostelMap.map((b) => (
                <button
                  key={b.block_id}
                  onClick={() => setComplaintBlockId(b.block_id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all capitalize border cursor-pointer ${
                    complaintBlockId === b.block_id ? "bg-[#82ab7d]/20 border-[#82ab7d] text-[#cfaecf]" : "bg-white/5 border-white/5 hover:bg-white/10"
                  }`}
                >
                  {b.block_name}
                </button>
              ))}
            </div>

            {/* Rooms Grid for the selected hostel block */}
            {(() => {
              const selectedCBlock = hostelMap.find(b => b.block_id === complaintBlockId);
              if (!selectedCBlock) return null;

              return (
                <div className="space-y-8 animate-fade-in">
                  {Array.from({ length: selectedCBlock.total_floors }, (_, i) => selectedCBlock.total_floors - i).map((floor) => (
                    <div key={floor} className="space-y-3">
                      <h3 className="text-sm font-bold text-white opacity-60">Floor {floor}</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {selectedCBlock.rooms.filter((r: any) => r.floor === floor).map((room: any) => {
                          const hasComplaints = room.complaints_count > 0;
                          
                          // If room has complaints, background is red/rose, otherwise standard theme colors
                          let bgClass = "bg-white/5 hover:bg-white/10 text-slate-100 border border-white/10";
                          if (hasComplaints) {
                            bgClass = "bg-rose-950/70 hover:bg-rose-900 border border-rose-500/50 text-rose-100 shadow-lg shadow-rose-950/40 animate-pulse-subtle";
                          } else if (room.status === "Maintenance") {
                            bgClass = "bg-amber-950/20 hover:bg-amber-950/30 border border-amber-500/20 text-amber-200/80 opacity-60";
                          }

                          return (
                            <button
                              key={room.id}
                              onClick={() => setSelectedComplaintRoom(room)}
                              className={`p-4 rounded-2xl text-left transition-all relative cursor-pointer ${bgClass}`}
                            >
                              <div className="flex justify-between items-center">
                                <span className="font-extrabold text-base">{room.room_number}</span>
                                {hasComplaints && (
                                  <span className="h-5 w-5 bg-rose-500 text-white rounded-full flex items-center justify-center text-[10px] font-black shadow">
                                    {room.complaints_count}
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] block mt-1.5 opacity-80 font-medium">
                                Occupied: {room.occupants.length} / {room.capacity}
                              </span>
                              <span className="text-[9px] block mt-1 uppercase font-bold tracking-wider opacity-60">
                                {hasComplaints ? "COMPLAINT ACTIVE" : room.status}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* Room Details & Complaints Modal popup */}
            {selectedComplaintRoom && (
              <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                <div className="glass-panel w-full max-w-lg rounded-3xl p-6 border border-white/10 relative">
                  
                  <button
                    onClick={() => setSelectedComplaintRoom(null)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>

                  <h3 className="text-lg font-black text-white flex items-center gap-2 mb-2">
                    Room Details: {selectedComplaintRoom.room_number}
                  </h3>
                  <p className="text-xs text-slate-300 mb-6">
                    Floor {selectedComplaintRoom.floor} | Capacity: {selectedComplaintRoom.capacity} slots | Current Status: <span className={`font-bold ${selectedComplaintRoom.complaints_count > 0 ? "text-rose-400" : "text-emerald-400"}`}>{selectedComplaintRoom.complaints_count > 0 ? "Active Complaints" : selectedComplaintRoom.status}</span>
                  </p>

                  <div className="space-y-6">
                    
                    {/* Room Occupants */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-2">Room Members</h4>
                      <div className="space-y-2">
                        {selectedComplaintRoom.occupants.map((o: any) => (
                          <div key={o.student_id} className="p-3 bg-white/5 rounded-xl border border-white/5 flex justify-between items-center text-xs">
                            <div>
                              <p className="font-bold text-white">{o.full_name}</p>
                              <p className="text-[10px] opacity-60">Roll: {o.roll_number} | Year {o.year}</p>
                            </div>
                            <span className="text-[10px] opacity-75 font-medium">{o.department}</span>
                          </div>
                        ))}
                        {selectedComplaintRoom.occupants.length === 0 && (
                          <p className="text-xs opacity-50 italic text-slate-300">Room is currently empty.</p>
                        )}
                      </div>
                    </div>

                    {/* Room Complaints */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 mb-2">Complaints</h4>
                      <div className="space-y-3">
                        {(() => {
                          // Compile all complaints belonging to students in this room
                          const studentIds = selectedComplaintRoom.occupants.map((o: any) => o.student_id);
                          
                          // Fetch complaints from our student list / backend state.
                          // Wait, does the selectedComplaintRoom have direct access to complaints or do we need to filter students/complaints?
                          // Let's filter from the state or check if the room object contains them.
                          // Let's search students list for complaints in this room.
                          const roomStudents = students.filter(s => s.room && s.room.id === selectedComplaintRoom.id);
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
                            return <p className="text-xs opacity-50 italic text-slate-300">No active complaints for this room.</p>;
                          }

                          return complaintsList.map((c) => (
                            <div key={c.id} className="p-3 bg-rose-950/30 rounded-xl border border-rose-500/20 text-xs space-y-2">
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[9px] font-black uppercase tracking-wider">
                                    {c.category}
                                  </span>
                                  <p className="mt-1 text-slate-300">
                                    <span className="font-bold text-white">Complain:</span> {c.description}
                                  </p>
                                </div>
                                <span className="text-[10px] text-slate-400 italic">By {c.student_name}</span>
                              </div>
                              <div className="pt-2 border-t border-rose-500/10 flex justify-between items-center">
                                <span className="text-[9px] text-rose-300/70 font-semibold uppercase tracking-wider">
                                  Status: {c.status}
                                </span>
                                <button
                                  onClick={() => handleResolveComplaint(c.id, "Resolved")}
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                                >
                                  <Check className="h-3 w-3" /> Resolve
                                </button>
                              </div>
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
