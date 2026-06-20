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
  Pencil,
  Sparkles,
  AlertTriangle,
  Info,
  LogOut,
  X,
  Check,
  Sun,
  Sunset,
  Moon,
  Search,
  Send,
  Bell
} from "lucide-react";
import InteractiveBackground from "@/components/InteractiveBackground";
import { useTheme } from "@/components/ThemeWrapper";

export default function AdminDashboard() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("map");
  const [user, setUser] = useState<any>(null);
  const [postMsgText, setPostMsgText] = useState("");
  const [postedMessages, setPostedMessages] = useState<any[]>([]);
  
  // Database States
  const [hostelMap, setHostelMap] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [complaintHeatmap, setComplaintHeatmap] = useState<any[]>([]);
  const [aiTrendsSummary, setAiTrendsSummary] = useState("");
  const [selectedBlockId, setSelectedBlockId] = useState<number | null>(null);
  const [complaintBlockId, setComplaintBlockId] = useState<number | null>(null);
  const [selectedComplaintRoom, setSelectedComplaintRoom] = useState<any>(null);
  const [locallySolvedComplaintIds, setLocallySolvedComplaintIds] = useState<number[]>([]);
  const [currentRoomComplaints, setCurrentRoomComplaints] = useState<any[]>([]);

  // Room allocation form states
  const [allocStudentId, setAllocStudentId] = useState("");
  const [allocRoomId, setAllocRoomId] = useState("");
  const [allocationError, setAllocationError] = useState("");
  const [allocationSuccess, setAllocationSuccess] = useState("");

  // Room detail modal state
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [loadingAction, setLoadingAction] = useState<any>(null);

  // Quick student registration form states
  const [showAddStudentForm, setShowAddStudentForm] = useState(false);
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentYear, setNewStudentYear] = useState("");
  const [newStudentPhone, setNewStudentPhone] = useState("");
  const [newStudentDept, setNewStudentDept] = useState("");
  const [addStudentError, setAddStudentError] = useState("");
  const [addStudentSuccess, setAddStudentSuccess] = useState("");

  // Student Detail View & Edit Modal state
  const [selectedStudentDetails, setSelectedStudentDetails] = useState<any>(null);
  const [isEditingStudent, setIsEditingStudent] = useState(false);
  const [editStudentForm, setEditStudentForm] = useState<any>({
    full_name: "",
    year: "",
    department: "",
    roll_number: "",
    phone: "",
    location: "",
    fees_paid: false,
    parents_name: "",
    parents_contact: "",
    locality: "",
    address: "",
    email: ""
  });
  const [editStudentError, setEditStudentError] = useState("");
  const [editStudentSuccess, setEditStudentSuccess] = useState("");
  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [studentToAllocate, setStudentToAllocate] = useState<any>(null);

  const handleDeleteStudent = async (studentId: number) => {
    if (!window.confirm("Are you sure you want to delete this student and all their associated records? This action cannot be undone.")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      const res = await fetch(`${apiUrl}/api/rooms/students/${studentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch (jsonErr) {
        // Handle non-JSON responses from server error page
      }

      if (res.ok) {
        alert("Student deleted successfully.");
        fetchAdminData();
      } else {
        alert(data.detail || `Server error (${res.status}). Failed to delete student.`);
      }
    } catch (err) {
      alert("Failed to connect to backend api.");
    }
  };

  const handleOpenStudentDetails = (student: any) => {
    setSelectedStudentDetails(student);
    setIsEditingStudent(false);
    setEditStudentError("");
    setEditStudentSuccess("");
    setEditStudentForm({
      full_name: student.full_name || "",
      year: student.year ? String(student.year) : "",
      department: student.department || "",
      roll_number: student.roll_number || "",
      phone: student.phone || "",
      location: student.location || "",
      fees_paid: !!student.fees_paid,
      parents_name: student.parents_name || "",
      parents_contact: student.parents_contact || "",
      locality: student.locality || "",
      address: student.address || "",
      email: student.email || ""
    });
  };

  const handleOpenRoomModal = (room: any) => {
    setSelectedRoom(room);
    setShowAddStudentForm(false);
    setNewStudentName("");
    setNewStudentYear("");
    setNewStudentPhone("");
    setNewStudentDept("");
    setAddStudentError("");
    setAddStudentSuccess("");
  };

  // Unseen Notifications State
  const [lastSeenCount, setLastSeenCount] = useState<number>(0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("last_seen_admin_messages_count");
      if (saved) {
        setLastSeenCount(parseInt(saved, 10));
      }
    }
  }, []);

  useEffect(() => {
    if (activeTab === "post_messages") {
      setLastSeenCount(postedMessages.length);
      localStorage.setItem("last_seen_admin_messages_count", postedMessages.length.toString());
    }
  }, [activeTab, postedMessages.length]);

  useEffect(() => {
    fetchAdminData();
  }, []);

  useEffect(() => {
    if (selectedComplaintRoom) {
      const complaints: any[] = [];
      selectedComplaintRoom.occupants.forEach((st: any) => {
        if (st.complaints) {
          st.complaints.forEach((c: any) => {
            if (!complaints.some(existing => existing.id === c.id)) {
              complaints.push({
                ...c,
                student_name: st.full_name
              });
            }
          });
        }
      });
      
      setCurrentRoomComplaints(prev => {
        const merged = [...prev];
        complaints.forEach(c => {
          if (!merged.some(m => m.id === c.id)) {
            merged.push(c);
          }
        });
        return merged;
      });
    } else {
      setCurrentRoomComplaints([]);
      setLocallySolvedComplaintIds([]);
    }
  }, [selectedComplaintRoom]);

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
      if (meRes.status === 401 || meRes.status === 403) {
        localStorage.clear();
        router.push("/");
        return;
      }
      if (!meRes.ok) throw new Error("Auth verify failed");
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

      // 6. Fetch Broadcast Messages
      const msgRes = await fetch(`${apiUrl}/api/auth/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (msgRes.ok) setPostedMessages(await msgRes.json());

    } catch (e) {
      console.error("fetchAdminData error:", e);
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
        const updatedMapRes = await fetch(`${apiUrl}/api/rooms/map`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (updatedMapRes.ok) {
          const updatedMapData = await updatedMapRes.json();
          setHostelMap(updatedMapData);
          if (selectedRoom) {
            let found = false;
            for (const b of updatedMapData) {
              const r = b.rooms.find((rm: any) => rm.id === selectedRoom.id);
              if (r) {
                setSelectedRoom(r);
                found = true;
                break;
              }
            }
            if (!found) setSelectedRoom(null);
          }
        }
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

  const handleSaveNewStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddStudentError("");
    setAddStudentSuccess("");

    if (!newStudentName.trim() || !newStudentYear.trim() || !newStudentPhone.trim() || !newStudentDept.trim()) {
      setAddStudentError("All fields are required.");
      return;
    }

    const yearNum = parseInt(newStudentYear);
    if (isNaN(yearNum) || yearNum <= 0) {
      setAddStudentError("Year must be a positive integer.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      const res = await fetch(`${apiUrl}/api/rooms/allocate-new-student`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          room_id: selectedRoom.id,
          full_name: newStudentName.trim(),
          year: yearNum,
          phone: newStudentPhone.trim(),
          department: newStudentDept.trim()
        })
      });

      const data = await res.json();
      if (res.ok) {
        setAddStudentSuccess("Student registered and allocated successfully!");
        setNewStudentName("");
        setNewStudentYear("");
        setNewStudentPhone("");
        setNewStudentDept("");
        setShowAddStudentForm(false);

        // Refresh all admin data
        await fetchAdminData();

        // Also update the current selectedRoom within modal
        const updatedMapRes = await fetch(`${apiUrl}/api/rooms/map`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (updatedMapRes.ok) {
          const updatedMapData = await updatedMapRes.json();
          setHostelMap(updatedMapData);
          for (const b of updatedMapData) {
            const r = b.rooms.find((rm: any) => rm.id === selectedRoom.id);
            if (r) {
              setSelectedRoom(r);
              break;
            }
          }
        }
      } else {
        setAddStudentError(data.detail || "Failed to allocate student.");
      }
    } catch (err) {
      setAddStudentError("Failed to connect to backend api.");
    }
  };

  const handleSaveStudentDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditStudentError("");
    setEditStudentSuccess("");

    if (
      !editStudentForm.full_name.trim() ||
      !editStudentForm.year.trim() ||
      !editStudentForm.department.trim() ||
      !editStudentForm.roll_number.trim() ||
      !editStudentForm.phone.trim()
    ) {
      setEditStudentError("Name, Year, Department, USN, and Phone are required.");
      return;
    }

    const yearNum = parseInt(editStudentForm.year);
    if (isNaN(yearNum) || yearNum <= 0) {
      setEditStudentError("Year must be a positive integer.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      const res = await fetch(`${apiUrl}/api/rooms/students/${selectedStudentDetails.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          full_name: editStudentForm.full_name.trim(),
          year: yearNum,
          department: editStudentForm.department.trim(),
          roll_number: editStudentForm.roll_number.trim(),
          phone: editStudentForm.phone.trim(),
          location: editStudentForm.location.trim() || null,
          fees_paid: !!editStudentForm.fees_paid,
          parents_name: editStudentForm.parents_name.trim() || null,
          parents_contact: editStudentForm.parents_contact.trim() || null,
          locality: editStudentForm.locality.trim() || null,
          address: editStudentForm.address.trim() || null,
          email: editStudentForm.email.trim() || null
        })
      });

      const data = await res.json();
      if (res.ok) {
        setEditStudentSuccess("Student details updated successfully!");
        setIsEditingStudent(false);
        // Refresh all student records
        await fetchAdminData();
        
        // Update local modal details
        setSelectedStudentDetails((prev: any) => ({
          ...prev,
          full_name: editStudentForm.full_name.trim(),
          year: yearNum,
          department: editStudentForm.department.trim(),
          roll_number: editStudentForm.roll_number.trim(),
          phone: editStudentForm.phone.trim(),
          location: editStudentForm.location.trim() || null,
          fees_paid: !!editStudentForm.fees_paid,
          parents_name: editStudentForm.parents_name.trim() || null,
          parents_contact: editStudentForm.parents_contact.trim() || null,
          locality: editStudentForm.locality.trim() || null,
          address: editStudentForm.address.trim() || null,
          email: editStudentForm.email.trim() || null
        }));
      } else {
        setEditStudentError(data.detail || "Failed to update student details.");
      }
    } catch (err) {
      setEditStudentError("Failed to connect to backend api.");
    }
  };

  if (!user) return <div className="p-8 text-center text-sky-200">Loading Admin Command Center...</div>;

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
              <p className="text-xs text-white/90">Admin Command</p>
            </div>
          </div>

          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab("map")}
              className={`w-full py-2.5 px-4 rounded-xl flex items-center gap-3 font-semibold text-sm transition-all ${
                activeTab === "map" ? "bg-slate-800/80 text-white border-l-4 border-emerald-500 font-bold" : "text-white opacity-80 hover:opacity-100 hover:bg-slate-800/50"
              }`}
            >
              <Home className="h-4.5 w-4.5" /> Rooms Available
            </button>

            <button
              onClick={() => setActiveTab("allocate")}
              className={`w-full py-2.5 px-4 rounded-xl flex items-center gap-3 font-semibold text-sm transition-all ${
                activeTab === "allocate" ? "bg-slate-800/80 text-white border-l-4 border-emerald-500 font-bold" : "text-white opacity-80 hover:opacity-100 hover:bg-slate-800/50"
              }`}
            >
              <Users className="h-4.5 w-4.5" /> Student Details
            </button>

            <button
              onClick={() => setActiveTab("heatmap")}
              className={`w-full py-2.5 px-4 rounded-xl flex items-center gap-3 font-semibold text-sm transition-all ${
                activeTab === "heatmap" ? "bg-slate-800/80 text-white border-l-4 border-emerald-500 font-bold" : "text-white opacity-80 hover:opacity-100 hover:bg-slate-800/50"
              }`}
            >
              <Activity className="h-4.5 w-4.5" /> Active Complaints
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

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col overflow-y-auto p-4 md:p-8 z-10">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-[var(--glass-border)]">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white">
              Administrator Command Center
            </h1>
            <p className="text-xs text-sky-300 mt-1">
              Logged in: {user.full_name} | Role: Chief Hostel Administrator
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
          {["map", "allocate", "heatmap", "post_messages"].map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold capitalize shrink-0 transition-all ${
                activeTab === t ? "bg-emerald-600 text-white border border-emerald-500 font-bold" : "glass-card text-sky-200"
              }`}
            >
              {t === "heatmap" ? "Active Complaints" : t === "map" ? "Rooms Available" : t === "allocate" ? "Student Details" : t === "post_messages" ? (activeTab === "post_messages" ? "Post Messages" : (postedMessages.length - lastSeenCount > 0 ? `Post Messages (${postedMessages.length - lastSeenCount})` : "Post Messages")) : t}
            </button>
          ))}
        </div>

        {/* Tab 1: Interactive Map layout */}
        {activeTab === "map" && (
          <div className="space-y-6">
            {studentToAllocate && (
              <div className="p-4 bg-emerald-950/40 border-2 border-emerald-500/30 rounded-2xl flex justify-between items-center animate-pulse-subtle">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-sm font-semibold text-white">
                    Allocating Room for <strong className="text-emerald-400">{studentToAllocate.full_name}</strong>. Please select an available room from the map.
                  </span>
                </div>
                <button
                  onClick={() => setStudentToAllocate(null)}
                  className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-900 rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            )}
            
            {/* Block Switcher */}
            <div className="flex gap-2 border-b border-[var(--glass-border)] pb-4">
              {hostelMap.map((b) => (
                <button
                  key={b.block_id}
                  onClick={() => setSelectedBlockId(b.block_id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all capitalize border ${
                    selectedBlockId === b.block_id ? "bg-slate-800/90 border-emerald-500 text-white font-bold" : "bg-[var(--input-bg)] border-[var(--glass-border)] hover:bg-slate-800/50"
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

                        return (
                          <button
                            key={room.id}
                            onClick={() => handleOpenRoomModal(room)}
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
                              {isRoomOccupied ? "Occupied" : room.status}
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
                    Floor {selectedRoom.floor} | Capacity: {selectedRoom.capacity} slots | Current Status: <span className="font-bold text-emerald-400">{selectedRoom.status}</span>
                  </p>

                  <div className="space-y-4">
                    {showAddStudentForm ? (
                      <form onSubmit={handleSaveNewStudent} className="space-y-4 animate-fade-in">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400">Add New Student</h4>
                          <button
                            type="button"
                            onClick={() => setShowAddStudentForm(false)}
                            className="text-xs text-sky-300 hover:text-white underline cursor-pointer"
                          >
                            Back to Occupants
                          </button>
                        </div>

                        <div className="flex flex-col gap-3">
                          <div>
                            <label className="block text-xs font-semibold mb-1 text-sky-200">Name:</label>
                            <input
                              type="text"
                              value={newStudentName}
                              onChange={(e) => setNewStudentName(e.target.value)}
                              placeholder="Enter full name"
                              className="w-full p-2.5 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl text-[var(--input-text)] text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold mb-1 text-sky-200">Year:</label>
                            <input
                              type="number"
                              value={newStudentYear}
                              onChange={(e) => setNewStudentYear(e.target.value)}
                              placeholder="Enter year (e.g. 1, 2, 3, 4)"
                              className="w-full p-2.5 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl text-[var(--input-text)] text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold mb-1 text-sky-200">Contact No:</label>
                            <input
                              type="text"
                              value={newStudentPhone}
                              onChange={(e) => setNewStudentPhone(e.target.value)}
                              placeholder="Enter contact number"
                              className="w-full p-2.5 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl text-[var(--input-text)] text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold mb-1 text-sky-200">Dept:</label>
                            <input
                              type="text"
                              value={newStudentDept}
                              onChange={(e) => setNewStudentDept(e.target.value)}
                              placeholder="Enter department (e.g. CSE, ECE)"
                              className="w-full p-2.5 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl text-[var(--input-text)] text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                              required
                            />
                          </div>
                        </div>

                        {addStudentError && (
                          <p className="text-xs text-rose-400 font-semibold">{addStudentError}</p>
                        )}
                        {addStudentSuccess && (
                          <p className="text-xs text-emerald-400 font-semibold">{addStudentSuccess}</p>
                        )}

                        <div className="flex justify-center pt-2">
                          <button
                            type="submit"
                            className="px-8 py-2.5 bg-emerald-600 hover:bg-emerald-500 font-bold rounded-full text-white text-sm transition-all cursor-pointer shadow-md"
                          >
                            Save
                          </button>
                        </div>
                      </form>
                    ) : (
                      <>
                        {/* Room Occupants */}
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-2">Room Occupants</h4>
                          <div className="space-y-2">
                            {selectedRoom.occupants.map((o: any) => (
                              <div key={o.student_id} className="p-3 bg-[var(--input-bg)] rounded-xl border-2 border-slate-800/80 flex justify-between items-center text-xs">
                                <div>
                                  <p className="font-bold text-[var(--text-primary)]">{o.full_name}</p>
                                  <p className="text-[10px] text-sky-300">Roll: {o.roll_number} | Year {o.year} | {o.department}</p>
                                </div>
                                <button
                                  disabled={loadingAction === o.student_id}
                                  onClick={() => handleDeallocate(o.student_id)}
                                  className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                                >
                                  <Trash className="h-3 w-3" /> Delete
                                </button>
                              </div>
                            ))}
                            {selectedRoom.occupants.length === 0 && (
                              <p className="text-xs text-sky-300/80 italic text-sky-200">Room is currently empty.</p>
                            )}
                          </div>
                        </div>

                        {studentToAllocate ? (
                          <div className="mt-4 p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 text-center space-y-3">
                            <p className="text-xs text-sky-200">
                              Are you sure you want to allocate <strong className="text-white">{studentToAllocate.full_name}</strong> to Room {selectedRoom.room_number}?
                            </p>
                            {addStudentError && (
                              <p className="text-xs text-rose-400 font-semibold">{addStudentError}</p>
                            )}
                            {addStudentSuccess && (
                              <p className="text-xs text-emerald-400 font-semibold">{addStudentSuccess}</p>
                            )}
                            <div className="flex gap-2 justify-center">
                              <button
                                onClick={async () => {
                                  setAddStudentError("");
                                  setAddStudentSuccess("");
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
                                        student_id: studentToAllocate.id,
                                        room_id: selectedRoom.id
                                      })
                                    });
                                    const data = await res.json();
                                    if (res.ok) {
                                      setAddStudentSuccess("Allocated successfully!");
                                      setStudentToAllocate(null);
                                      // Refresh all data
                                      await fetchAdminData();
                                      // Refresh selected room occupants list in modal
                                      const updatedMapRes = await fetch(`${apiUrl}/api/rooms/map`, {
                                        headers: { Authorization: `Bearer ${token}` }
                                      });
                                      if (updatedMapRes.ok) {
                                        const updatedMapData = await updatedMapRes.json();
                                        setHostelMap(updatedMapData);
                                        for (const b of updatedMapData) {
                                          const r = b.rooms.find((rm: any) => rm.id === selectedRoom.id);
                                          if (r) {
                                            setSelectedRoom(r);
                                            break;
                                          }
                                        }
                                      }
                                      setTimeout(() => {
                                        setSelectedRoom(null);
                                      }, 1000);
                                    } else {
                                      setAddStudentError(data.detail || "Failed to allocate student.");
                                    }
                                  } catch (err) {
                                    setAddStudentError("Failed to connect to backend api.");
                                  }
                                }}
                                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-md"
                              >
                                Allocate Student
                              </button>
                              <button
                                onClick={() => setStudentToAllocate(null)}
                                className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-all cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          selectedRoom.status === "Available" && selectedRoom.occupants.length < selectedRoom.capacity && (
                            <button
                              onClick={() => setShowAddStudentForm(true)}
                              className="w-full mt-4 py-3 bg-white hover:bg-slate-100 text-slate-900 font-extrabold rounded-xl transition-all shadow-md text-base tracking-wide flex items-center justify-center gap-2 cursor-pointer"
                            >
                              <Plus className="h-5 w-5 text-slate-900" />
                              Add Student
                            </button>
                          )
                        )}
                      </>
                    )}
                  </div>

                </div>
              </div>
            )}

          </div>
        )}

        {/* Tab 2: Student Details Roster */}
        {activeTab === "allocate" && (
          <div className="glass-panel rounded-2xl p-6 border-2 border-slate-800/80 space-y-6 animate-fade-in">
            <div className="flex justify-between items-center pb-4 border-b border-[var(--glass-border)] flex-wrap gap-4">
              <div>
                <h3 className="text-xl font-black text-white">Student Details</h3>
                <p className="text-xs text-sky-200 mt-1">Roster of all students registered in the hostel</p>
              </div>
              
              {/* Student Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by name..."
                  value={studentSearchQuery}
                  onChange={(e) => setStudentSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-1.5 bg-black/40 border border-white/10 rounded-xl text-xs text-sky-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-48 md:w-64 transition-all"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-sky-300 opacity-60" />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-sky-300 border-b border-[var(--glass-border)]">
                    <th className="pb-3 font-semibold uppercase">Student Name</th>
                    <th className="pb-3 font-semibold uppercase">Roll Number (USN)</th>
                    <th className="pb-3 font-semibold uppercase">Department</th>
                    <th className="pb-3 font-semibold uppercase">Year</th>
                    <th className="pb-3 font-semibold uppercase">Room Allocation</th>
                    <th className="pb-3 font-semibold uppercase text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--glass-border)]">
                  {(() => {
                    const filteredStudents = students.filter((s) =>
                      s.full_name.toLowerCase().includes(studentSearchQuery.toLowerCase())
                    );
                    
                    if (filteredStudents.length === 0) {
                      return (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-sky-200 italic">
                            {students.length === 0 ? "No students registered." : "No students matched your search."}
                          </td>
                        </tr>
                      );
                    }
                    
                    return filteredStudents.map((s) => (
                      <tr key={s.id} className="hover:bg-[var(--input-bg)] transition-colors">
                        <td className="py-4 font-bold text-white">{s.full_name}</td>
                        <td className="py-4 font-semibold text-slate-300">{s.roll_number}</td>
                        <td className="py-4 text-slate-300">{s.department}</td>
                        <td className="py-4 text-slate-300">Year {s.year}</td>
                        <td className="py-4">
                          {s.room ? (
                            <span className="font-bold text-emerald-400">
                              {s.room.block_name} - Room {s.room.room_number}
                            </span>
                          ) : (
                            <span className="font-bold text-rose-400 italic">Unallocated</span>
                          )}
                        </td>
                        <td className="py-4 text-right">
                          <div className="flex justify-end gap-2">
                            {!s.room && (
                              <button
                                onClick={() => {
                                  setStudentToAllocate(s);
                                  setActiveTab("map");
                                }}
                                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-md"
                              >
                                Allocate
                              </button>
                            )}
                            <button
                              onClick={() => handleOpenStudentDetails(s)}
                              className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-md"
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleDeleteStudent(s.id)}
                              className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-md flex items-center gap-1"
                            >
                              <Trash className="h-3.5 w-3.5" /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Heatmap & AI Analysis -> Active Complaints */}
        {activeTab === "heatmap" && (
          <div className="space-y-6">

            {/* Boys / Girls Hostel switcher */}
            <div className="flex gap-2 border-b border-[var(--glass-border)] pb-4">
              {hostelMap.map((b) => (
                <button
                  key={b.block_id}
                  onClick={() => setComplaintBlockId(b.block_id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all capitalize border cursor-pointer ${
                    complaintBlockId === b.block_id ? "bg-slate-800/90 border-emerald-500 text-white font-bold" : "bg-[var(--input-bg)] border-[var(--glass-border)] hover:bg-slate-800/50"
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
                      <h3 className="text-sm font-bold text-[var(--text-primary)] text-sky-300">Floor {floor}</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {selectedCBlock.rooms.filter((r: any) => r.floor === floor).map((room: any) => {
                          const hasComplaints = room.complaints_count > 0;
                          
                          // If room has complaints, background is red/rose, otherwise standard theme colors
                          let bgClass = "bg-[var(--input-bg)] hover:bg-white/10 text-slate-100 border border-white/10";
                          if (hasComplaints) {
                            bgClass = "bg-rose-950/70 hover:bg-rose-900 border border-rose-500/50 text-rose-100 shadow-lg shadow-rose-950/40 animate-pulse-subtle";
                          } else if (room.status === "Maintenance") {
                            bgClass = "bg-amber-950/20 hover:bg-amber-950/30 border border-amber-500/20 text-amber-200/80 text-sky-300";
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
                                {room.occupants.length} / {room.capacity}
                              </span>
                              <span className="text-[9px] block mt-1 uppercase font-bold tracking-wider text-sky-300">
                                {hasComplaints ? "COMPLAINT ACTIVE" : (room.status !== "Occupied" && room.status !== "Available") ? room.status : ""}
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
                    onClick={() => {
                      setSelectedComplaintRoom(null);
                      setLocallySolvedComplaintIds([]);
                    }}
                    className="absolute top-4 right-4 text-sky-300 hover:text-white cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>

                  <h3 className="text-lg font-black text-[var(--text-primary)] flex items-center gap-2 mb-2">
                    Room Details: {selectedComplaintRoom.room_number}
                  </h3>
                  <p className="text-xs text-sky-200 mb-6">
                    Floor {selectedComplaintRoom.floor} | Capacity: {selectedComplaintRoom.capacity} slots{(selectedComplaintRoom.complaints_count > 0 || (selectedComplaintRoom.status !== "Occupied" && selectedComplaintRoom.status !== "Available")) && ` | Current Status: `}
                    {(selectedComplaintRoom.complaints_count > 0 || (selectedComplaintRoom.status !== "Occupied" && selectedComplaintRoom.status !== "Available")) && (
                      <span className={`font-bold ${selectedComplaintRoom.complaints_count > 0 ? "text-rose-400" : "text-emerald-400"}`}>
                        {selectedComplaintRoom.complaints_count > 0 ? "Active Complaints" : selectedComplaintRoom.status}
                      </span>
                    )}
                  </p>

                  <div className="space-y-6">
                    
                    {/* Room Occupants */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-2">Room Members</h4>
                      <div className="space-y-2">
                        {selectedComplaintRoom.occupants.map((o: any) => (
                          <div key={o.student_id} className="p-3 bg-[var(--input-bg)] rounded-xl border-2 border-slate-800/80 flex justify-between items-center text-xs">
                            <div>
                              <p className="font-bold text-[var(--text-primary)]">{o.full_name}</p>
                              <p className="text-[10px] text-sky-300">Roll: {o.roll_number} | Year {o.year}</p>
                            </div>
                            <span className="text-[10px] opacity-75 font-medium">{o.department}</span>
                          </div>
                        ))}
                        {selectedComplaintRoom.occupants.length === 0 && (
                          <p className="text-xs text-sky-300/80 italic text-sky-200">Room is currently empty.</p>
                        )}
                      </div>
                    </div>

                    {/* Room Complaints */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 mb-2">Complaints</h4>
                      <div className="space-y-3">
                        {(() => {
                          if (currentRoomComplaints.length === 0) {
                            return <p className="text-xs text-sky-300/80 italic text-sky-200">No active complaints for this room.</p>;
                          }

                          return currentRoomComplaints.map((c) => {
                            const isSolved = c.status === "Resolved" || locallySolvedComplaintIds.includes(c.id);

                            return (
                              <div
                                key={c.id}
                                className={`p-3 rounded-xl border text-xs space-y-2 transition-all duration-300 ${
                                  isSolved
                                    ? "bg-slate-900/40 border-slate-700/50 text-slate-400 opacity-75"
                                    : "bg-rose-950/30 border-rose-500/20 text-rose-100"
                                }`}
                              >
                                <div className="flex justify-between items-start">
                                  <div>
                                    <span
                                      className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                                        isSolved
                                          ? "bg-slate-800 text-slate-500 border border-slate-700/30"
                                          : "bg-rose-500/20 text-rose-300"
                                      }`}
                                    >
                                      {c.category}
                                    </span>
                                    <p className={`mt-1 ${isSolved ? "text-slate-400 line-through decoration-slate-600" : "text-sky-200"}`}>
                                      <span className="font-bold">Complain:</span> {c.description}
                                    </p>
                                  </div>
                                  <span className={`text-[10px] italic ${isSolved ? "text-slate-500" : "text-sky-300"}`}>
                                    By {c.student_name}
                                  </span>
                                </div>
                                <div className={`pt-2 border-t flex justify-between items-center ${isSolved ? "border-slate-800" : "border-rose-500/10"}`}>
                                  <span className={`text-[9px] font-semibold uppercase tracking-wider ${isSolved ? "text-emerald-500/80" : "text-rose-300/70"}`}>
                                    Status: {isSolved ? "Resolved" : c.status}
                                  </span>
                                  {isSolved ? (
                                    <button
                                      disabled
                                      className="px-2 py-1 border border-emerald-500/50 text-emerald-400/80 rounded text-[10px] font-bold flex items-center gap-1 cursor-not-allowed bg-transparent animate-fade-in"
                                    >
                                      <Check className="h-3 w-3" /> Solved
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        handleResolveComplaint(c.id, "Resolved");
                                        setLocallySolvedComplaintIds((prev) => [...prev, c.id]);
                                      }}
                                      className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-md"
                                    >
                                      <Check className="h-3 w-3" /> Solve
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>

                  </div>

                </div>
              </div>
            )}

          {/* Student Profile View & Edit Modal */}
          {selectedStudentDetails && (
            <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
              <div className="glass-panel w-full max-w-lg rounded-3xl p-6 border border-white/10 relative">
                
                {/* Close button */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStudentDetails(null);
                    setIsEditingStudent(false);
                  }}
                  className="absolute top-4 right-4 text-sky-300 hover:text-white cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>

                {/* Pencil Edit Icon at top right */}
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingStudent(!isEditingStudent);
                    setEditStudentError("");
                    setEditStudentSuccess("");
                  }}
                  className="absolute top-4 right-12 text-sky-300 hover:text-white cursor-pointer"
                  title="Toggle Edit Mode"
                >
                  <Pencil className={`h-4.5 w-4.5 ${isEditingStudent ? "text-emerald-400" : "text-sky-300"}`} />
                </button>

                <h3 className="text-xl font-black text-white flex items-center gap-2 mb-2">
                  Student Profile
                </h3>
                <p className="text-xs text-sky-200 mb-6">
                  {isEditingStudent ? "Editing details for " : "Viewing details for "} <span className="font-bold text-sky-400">{selectedStudentDetails.full_name}</span>
                </p>

                <form onSubmit={handleSaveStudentDetails} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                  <div className="space-y-3">
                    
                    {/* Name */}
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-sky-200">NAME:</label>
                      <input
                        type="text"
                        disabled={!isEditingStudent}
                        value={isEditingStudent ? editStudentForm.full_name : selectedStudentDetails.full_name}
                        onChange={(e) => setEditStudentForm({ ...editStudentForm, full_name: e.target.value })}
                        className="w-full p-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl text-[var(--input-text)] text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-75 disabled:cursor-not-allowed"
                        required
                      />
                    </div>

                    {/* Year */}
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-sky-200">YEAR:</label>
                      <input
                        type="number"
                        disabled={!isEditingStudent}
                        value={isEditingStudent ? editStudentForm.year : selectedStudentDetails.year}
                        onChange={(e) => setEditStudentForm({ ...editStudentForm, year: e.target.value })}
                        className="w-full p-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl text-[var(--input-text)] text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-75 disabled:cursor-not-allowed"
                        required
                      />
                    </div>

                    {/* Dept */}
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-sky-200">DEPT:</label>
                      <input
                        type="text"
                        disabled={!isEditingStudent}
                        value={isEditingStudent ? editStudentForm.department : selectedStudentDetails.department}
                        onChange={(e) => setEditStudentForm({ ...editStudentForm, department: e.target.value })}
                        className="w-full p-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl text-[var(--input-text)] text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-75 disabled:cursor-not-allowed"
                        required
                      />
                    </div>

                    {/* USN */}
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-sky-200">USN:</label>
                      <input
                        type="text"
                        disabled={!isEditingStudent}
                        value={isEditingStudent ? editStudentForm.roll_number : selectedStudentDetails.roll_number}
                        onChange={(e) => setEditStudentForm({ ...editStudentForm, roll_number: e.target.value })}
                        className="w-full p-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl text-[var(--input-text)] text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-75 disabled:cursor-not-allowed"
                        required
                      />
                    </div>

                    {/* Contact No */}
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-sky-200">CONTACT NO:</label>
                      <input
                        type="text"
                        disabled={!isEditingStudent}
                        value={isEditingStudent ? editStudentForm.phone : selectedStudentDetails.phone}
                        onChange={(e) => setEditStudentForm({ ...editStudentForm, phone: e.target.value })}
                        className="w-full p-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl text-[var(--input-text)] text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-75 disabled:cursor-not-allowed"
                        required
                      />
                    </div>

                    {/* Location */}
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-sky-200">LOCATION:</label>
                      <input
                        type="text"
                        disabled={!isEditingStudent}
                        value={isEditingStudent ? editStudentForm.location : (selectedStudentDetails.location || "")}
                        onChange={(e) => setEditStudentForm({ ...editStudentForm, location: e.target.value })}
                        placeholder="e.g. City or State"
                        className="w-full p-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl text-[var(--input-text)] text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-75 disabled:cursor-not-allowed"
                      />
                    </div>

                    {/* Fees Paid Toggle */}
                    <div>
                      <label className="block text-xs font-semibold mb-1.5 text-sky-200">FEES PAID:</label>
                      {isEditingStudent ? (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setEditStudentForm({ ...editStudentForm, fees_paid: true })}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                              editStudentForm.fees_paid
                                ? "bg-emerald-600 border-emerald-500 text-white shadow-md"
                                : "bg-[var(--input-bg)] border-[var(--input-border)] text-slate-400 hover:bg-slate-800/40"
                            }`}
                          >
                            YES
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditStudentForm({ ...editStudentForm, fees_paid: false })}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                              !editStudentForm.fees_paid
                                ? "bg-rose-600 border-rose-500 text-white shadow-md"
                                : "bg-[var(--input-bg)] border-[var(--input-border)] text-slate-400 hover:bg-slate-800/40"
                            }`}
                          >
                            NO
                          </button>
                        </div>
                      ) : (
                        <span className={`px-3 py-1 rounded-full text-xs font-bold inline-block ${
                          selectedStudentDetails.fees_paid ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                        }`}>
                          {selectedStudentDetails.fees_paid ? "YES" : "NO"}
                        </span>
                      )}
                    </div>

                    {/* Parents Name */}
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-sky-200">PARENTS NAME:</label>
                      <input
                        type="text"
                        disabled={!isEditingStudent}
                        value={isEditingStudent ? editStudentForm.parents_name : (selectedStudentDetails.parents_name || "")}
                        onChange={(e) => setEditStudentForm({ ...editStudentForm, parents_name: e.target.value })}
                        className="w-full p-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl text-[var(--input-text)] text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-75 disabled:cursor-not-allowed"
                      />
                    </div>

                    {/* Parents Contact No */}
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-sky-200">PARENTS CONTACT NO:</label>
                      <input
                        type="text"
                        disabled={!isEditingStudent}
                        value={isEditingStudent ? editStudentForm.parents_contact : (selectedStudentDetails.parents_contact || "")}
                        onChange={(e) => setEditStudentForm({ ...editStudentForm, parents_contact: e.target.value })}
                        className="w-full p-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl text-[var(--input-text)] text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-75 disabled:cursor-not-allowed"
                      />
                    </div>

                    {/* Locality */}
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-sky-200">LOCALITY:</label>
                      <input
                        type="text"
                        disabled={!isEditingStudent}
                        value={isEditingStudent ? editStudentForm.locality : (selectedStudentDetails.locality || "")}
                        onChange={(e) => setEditStudentForm({ ...editStudentForm, locality: e.target.value })}
                        className="w-full p-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl text-[var(--input-text)] text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-75 disabled:cursor-not-allowed"
                      />
                    </div>

                    {/* Address */}
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-sky-200">ADDRESS:</label>
                      <textarea
                        disabled={!isEditingStudent}
                        value={isEditingStudent ? editStudentForm.address : (selectedStudentDetails.address || "")}
                        onChange={(e) => setEditStudentForm({ ...editStudentForm, address: e.target.value })}
                        rows={2}
                        className="w-full p-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl text-[var(--input-text)] text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-75 disabled:cursor-not-allowed resize-none"
                      />
                    </div>

                    {/* Email ID */}
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-sky-200">EMAIL ID:</label>
                      <input
                        type="email"
                        disabled={!isEditingStudent}
                        value={isEditingStudent ? editStudentForm.email : selectedStudentDetails.email}
                        onChange={(e) => setEditStudentForm({ ...editStudentForm, email: e.target.value })}
                        className="w-full p-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl text-[var(--input-text)] text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-75 disabled:cursor-not-allowed"
                        required
                      />
                    </div>

                  </div>

                  {editStudentError && (
                    <p className="text-xs text-rose-400 font-semibold">{editStudentError}</p>
                  )}
                  {editStudentSuccess && (
                    <p className="text-xs text-emerald-400 font-semibold">{editStudentSuccess}</p>
                  )}

                  {/* Bottom White Save Button */}
                  {isEditingStudent && (
                    <div className="flex justify-center pt-2">
                      <button
                        type="submit"
                        className="px-8 py-2.5 bg-white hover:bg-slate-100 font-extrabold rounded-full text-slate-900 text-sm transition-all cursor-pointer shadow-md"
                      >
                        Save
                      </button>
                    </div>
                  )}
                </form>

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
