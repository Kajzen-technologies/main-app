"use client";

import React, { useState, useEffect } from "react";
import { 
  Lock, 
  MapPin, 
  BookOpen, 
  BarChart2, 
  AlertTriangle, 
  Check, 
  X, 
  Edit, 
  Plus, 
  Trash, 
  LogOut,
  Map as MapIcon,
  RefreshCw
} from "lucide-react";

// Shared imports
import { 
  Marker, 
  Guide, 
  MARKER_CATEGORIES, 
  MARKER_CATEGORY_LABELS, 
  GUIDE_CATEGORIES,
  GUIDE_CATEGORY_LABELS,
  MarkerCategory
} from "shared";

// Leaflet styles
import "leaflet/dist/leaflet.css";

// Dynamic Leaflet import
let MapContainer: any;
let TileLayer: any;
let CircleMarker: any;
let Popup: any;

if (typeof window !== "undefined") {
  const Leaflet = require("react-leaflet");
  MapContainer = Leaflet.MapContainer;
  TileLayer = Leaflet.TileLayer;
  CircleMarker = Leaflet.CircleMarker;
  Popup = Leaflet.Popup;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";
const PRAGUE_CENTER = { lat: 50.0755, lng: 14.4378 };

export default function AdminAppClient() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [adminEmail, setAdminEmail] = useState<string>("");
  const [loginEmail, setLoginEmail] = useState<string>("");
  const [loginPassword, setLoginPassword] = useState<string>("");
  const [loginError, setLoginError] = useState<string | null>(null);

  // Active Menu: 'analytics' | 'pending' | 'guides' | 'review'
  const [activeMenu, setActiveMenu] = useState<"analytics" | "pending" | "guides" | "review">("analytics");

  // Data States
  const [analyticsOverview, setAnalyticsOverview] = useState<any>(null);
  const [reportsByIssue, setReportsByIssue] = useState<any[]>([]);
  const [reportsByCat, setReportsByCat] = useState<any[]>([]);
  const [problemAreas, setProblemAreas] = useState<any[]>([]);
  const [pendingMarkers, setPendingMarkers] = useState<Marker[]>([]);
  const [adminGuides, setAdminGuides] = useState<Guide[]>([]);
  const [needingReview, setNeedingReview] = useState<any[]>([]);

  // Modals / Editors
  const [editingMarker, setEditingMarker] = useState<Marker | null>(null);
  const [editingGuide, setEditingGuide] = useState<Guide | null>(null);
  const [isNewGuideOpen, setIsNewGuideOpen] = useState(false);
  const [guideForm, setGuideForm] = useState<any>({
    slug: "",
    category: "BEFORE_BLACKOUT",
    priority: 0,
    isPublished: false,
    titleCs: "",
    shortDescriptionCs: "",
    contentCs: "",
    titleEn: "",
    shortDescriptionEn: "",
    contentEn: "",
    checklistItems: [] // array of { textCs, textEn, order }
  });

  // Verify active session on mount
  const checkSession = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/auth/me`, {
        headers: { "x-admin-session-id": localStorage.getItem("admin_session") || "" }
      });
      if (res.ok) {
        const data = await res.json();
        setIsAuthenticated(true);
        setAdminEmail(data.admin.email);
        fetchAdminData();
      }
    } catch (e) {
      console.warn("Session validation failed:", e);
    } finally {
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  // Login handler
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    try {
      const res = await fetch(`${API_BASE}/admin/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("admin_session", data.session.id);
        setIsAuthenticated(true);
        setAdminEmail(data.session.email);
        fetchAdminData();
      } else {
        const data = await res.json();
        setLoginError(data.error || "Login failed.");
      }
    } catch {
      setLoginError("Cannot connect to server API.");
    }
  };

  // Logout handler
  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/admin/auth/logout`, {
        method: "POST",
        headers: { "x-admin-session-id": localStorage.getItem("admin_session") || "" }
      });
    } catch {}
    localStorage.removeItem("admin_session");
    setIsAuthenticated(false);
    setAdminEmail("");
  };

  // Fetch admin dashboard content
  const fetchAdminData = async () => {
    const headers = { "x-admin-session-id": localStorage.getItem("admin_session") || "" };
    try {
      // 1. Analytics overview
      const overviewRes = await fetch(`${API_BASE}/admin/analytics/overview`, { headers });
      if (overviewRes.ok) setAnalyticsOverview(await overviewRes.json());

      const issueRes = await fetch(`${API_BASE}/admin/analytics/reports-by-issue-type`, { headers });
      if (issueRes.ok) setReportsByIssue(await issueRes.json());

      const catRes = await fetch(`${API_BASE}/admin/analytics/reports-by-category`, { headers });
      if (catRes.ok) setReportsByCat(await catRes.json());

      const problemRes = await fetch(`${API_BASE}/admin/analytics/problem-areas`, { headers });
      if (problemRes.ok) setProblemAreas(await problemRes.json());

      // 2. Pending places
      const pendingRes = await fetch(`${API_BASE}/admin/markers/pending`, { headers });
      if (pendingRes.ok) setPendingMarkers(await pendingRes.json());

      // 3. Guides
      const guidesRes = await fetch(`${API_BASE}/admin/guides`, { headers });
      if (guidesRes.ok) setAdminGuides(await guidesRes.json());

      // 4. Markers needing review
      const reviewRes = await fetch(`${API_BASE}/admin/analytics/markers-needing-review`, { headers });
      if (reviewRes.ok) setNeedingReview(await reviewRes.json());

    } catch (e) {
      console.error("Failed to load admin data", e);
    }
  };

  // Moderation Handlers
  const handleApproveMarker = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/admin/markers/${id}/approve`, {
        method: "PATCH",
        headers: { "x-admin-session-id": localStorage.getItem("admin_session") || "" }
      });
      if (res.ok) {
        fetchAdminData();
      }
    } catch (e) {
      alert("Approve failed");
    }
  };

  const handleRejectMarker = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/admin/markers/${id}/reject`, {
        method: "PATCH",
        headers: { "x-admin-session-id": localStorage.getItem("admin_session") || "" }
      });
      if (res.ok) {
        fetchAdminData();
      }
    } catch (e) {
      alert("Reject failed");
    }
  };

  const handleDeleteMarker = async (id: string) => {
    if (!confirm("Are you sure you want to delete this place permanently?")) return;
    try {
      const res = await fetch(`${API_BASE}/admin/markers/${id}`, {
        method: "DELETE",
        headers: { "x-admin-session-id": localStorage.getItem("admin_session") || "" }
      });
      if (res.ok) {
        fetchAdminData();
        setEditingMarker(null);
      }
    } catch (e) {
      alert("Delete failed");
    }
  };

  const handleSaveMarkerEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMarker) return;
    try {
      const res = await fetch(`${API_BASE}/admin/markers/${editingMarker.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-session-id": localStorage.getItem("admin_session") || ""
        },
        body: JSON.stringify(editingMarker)
      });
      if (res.ok) {
        alert("Místo bylo uloženo / Place updated successfully.");
        setEditingMarker(null);
        fetchAdminData();
      }
    } catch (e) {
      alert("Update failed");
    }
  };

  // Needing Review resolution handlers
  const handleConfirmMarkerStatus = async (id: string, currentStatus: string) => {
    const status = prompt("Confirm public status (OPEN, CLOSED, or UNKNOWN):", currentStatus);
    if (!status) return;

    try {
      const res = await fetch(`${API_BASE}/admin/markers/${id}/confirm-status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-session-id": localStorage.getItem("admin_session") || ""
        },
        body: JSON.stringify({ publicStatus: status })
      });
      if (res.ok) {
        fetchAdminData();
      }
    } catch (e) {
      alert("Verification failed");
    }
  };

  const handleDismissReports = async (id: string) => {
    if (!confirm("Dismiss all reports and mark this place as verified?")) return;
    try {
      const res = await fetch(`${API_BASE}/admin/markers/${id}/dismiss-reports`, {
        method: "PATCH",
        headers: { "x-admin-session-id": localStorage.getItem("admin_session") || "" }
      });
      if (res.ok) {
        fetchAdminData();
      }
    } catch (e) {
      alert("Dismiss reports failed");
    }
  };

  // Guides handling
  const handleCreateGuideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/admin/guides`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-session-id": localStorage.getItem("admin_session") || ""
        },
        body: JSON.stringify(guideForm)
      });
      if (res.ok) {
        alert("Guide created.");
        setIsNewGuideOpen(false);
        setGuideForm({
          slug: "",
          category: "BEFORE_BLACKOUT",
          priority: 0,
          isPublished: false,
          titleCs: "",
          shortDescriptionCs: "",
          contentCs: "",
          titleEn: "",
          shortDescriptionEn: "",
          contentEn: "",
          checklistItems: []
        });
        fetchAdminData();
      }
    } catch (e) {
      alert("Create guide failed");
    }
  };

  const handleSaveGuideEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGuide) return;
    
    // Map form fields from editing state
    const csTranslation = editingGuide.translations?.find(t => t.language === "cs");
    const enTranslation = editingGuide.translations?.find(t => t.language === "en");

    const payload = {
      slug: editingGuide.slug,
      category: editingGuide.category,
      priority: editingGuide.priority,
      isPublished: editingGuide.isPublished,
      titleCs: csTranslation?.title || "",
      shortDescriptionCs: csTranslation?.shortDescription || "",
      contentCs: csTranslation?.content || "",
      titleEn: enTranslation?.title || "",
      shortDescriptionEn: enTranslation?.shortDescription || "",
      contentEn: enTranslation?.content || "",
      checklistItems: editingGuide.checklistItems?.map(item => ({
        textCs: item.textCs,
        textEn: item.textEn,
        order: item.order
      })) || []
    };

    try {
      const res = await fetch(`${API_BASE}/admin/guides/${editingGuide.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-session-id": localStorage.getItem("admin_session") || ""
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        alert("Guide updated.");
        setEditingGuide(null);
        fetchAdminData();
      }
    } catch (e) {
      alert("Update guide failed");
    }
  };

  const handleDeleteGuide = async (id: string) => {
    if (!confirm("Delete this guide permanently?")) return;
    try {
      const res = await fetch(`${API_BASE}/admin/guides/${id}`, {
        method: "DELETE",
        headers: { "x-admin-session-id": localStorage.getItem("admin_session") || "" }
      });
      if (res.ok) {
        fetchAdminData();
        setEditingGuide(null);
      }
    } catch (e) {
      alert("Delete guide failed");
    }
  };

  // Helper for checklist item additions in forms
  const addChecklistItemField = (isEdit = false) => {
    if (isEdit && editingGuide) {
      const items = editingGuide.checklistItems || [];
      const updated = [...items, {
        id: `temp_${Date.now()}`,
        guideId: editingGuide.id,
        order: items.length + 1,
        textCs: "",
        textEn: ""
      }];
      setEditingGuide({ ...editingGuide, checklistItems: updated });
    } else {
      const items = guideForm.checklistItems;
      const updated = [...items, {
        textCs: "",
        textEn: "",
        order: items.length + 1
      }];
      setGuideForm({ ...guideForm, checklistItems: updated });
    }
  };

  if (authLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", backgroundColor: "#060913", color: "#94a3b8" }}>
        Ověřování relace administrátora...
      </div>
    );
  }

  // 1. LOGIN SCREEN
  if (!isAuthenticated) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", backgroundColor: "#060913" }}>
        <form 
          onSubmit={handleLoginSubmit}
          style={{
            background: "rgba(13, 20, 38, 0.7)",
            border: "1px solid var(--border-color)",
            padding: "40px",
            borderRadius: "20px",
            width: "100%",
            maxWidth: "400px",
            display: "flex",
            flexDirection: "column",
            gap: "24px",
            boxShadow: "0 20px 50px rgba(0,0,0,0.6)"
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div style={{
              width: "50px",
              height: "50px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, var(--color-primary), #7e22ce)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              margin: "0 auto 16px auto"
            }}>
              <Lock size={24} />
            </div>
            <h2 style={{ fontSize: "22px", color: "white" }}>Administrace Praha Odolná</h2>
            <p style={{ color: "#94a3b8", fontSize: "12px", marginTop: "4px" }}>Vstup pro koordinátory hlavního města</p>
          </div>

          {loginError && (
            <div style={{ backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid var(--color-danger)", padding: "10px", borderRadius: "8px", color: "var(--color-danger)", fontSize: "13px", textAlign: "center" }}>
              {loginError}
            </div>
          )}

          <div className="form-group">
            <label>E-mail</label>
            <input 
              type="email" 
              required 
              placeholder="admin@praha-blackout.demo"
              value={loginEmail}
              onChange={e => setLoginEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Heslo (Password)</label>
            <input 
              type="password" 
              required 
              placeholder="••••••••"
              value={loginPassword}
              onChange={e => setLoginPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="btn-primary" style={{ width: "100%", justifyContent: "center" }}>
            Přihlásit se
          </button>
        </form>
      </div>
    );
  }

  // 2. MAIN ADMIN PORTAL
  return (
    <div className="admin-container">
      {/* Header */}
      <header className="admin-header">
        <div className="brand-section">
          <div className="brand-logo-container">
            <AlertTriangle size={24} />
          </div>
          <div className="brand-title-wrap">
            <h1>Praha Odolná (Admin)</h1>
            <p>Koordinační krizový panel</p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span style={{ fontSize: "13px", color: "#c084fc" }}>👤 {adminEmail}</span>
          <button className="btn-secondary" onClick={handleLogout} style={{ padding: "8px 12px", fontSize: "12px" }}>
            <LogOut size={14} />
            Odhlásit
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="admin-main">
        {/* Sidebar */}
        <aside className="admin-sidebar">
          <button 
            className={`admin-nav-item ${activeMenu === "analytics" ? "active" : ""}`}
            onClick={() => setActiveMenu("analytics")}
          >
            <BarChart2 size={16} />
            Přehled a analytika
          </button>
          <button 
            className={`admin-nav-item ${activeMenu === "pending" ? "active" : ""}`}
            onClick={() => setActiveMenu("pending")}
          >
            <MapPin size={16} />
            Návrhy míst ke schválení ({pendingMarkers.length})
          </button>
          <button 
            className={`admin-nav-item ${activeMenu === "review" ? "active" : ""}`}
            onClick={() => setActiveMenu("review")}
          >
            <AlertTriangle size={16} />
            Místa k prověření ({needingReview.length})
          </button>
          <button 
            className={`admin-nav-item ${activeMenu === "guides" ? "active" : ""}`}
            onClick={() => setActiveMenu("guides")}
          >
            <BookOpen size={16} />
            Správa nouzových návodů
          </button>

          <button 
            className="btn-secondary" 
            onClick={fetchAdminData}
            style={{ marginTop: "auto", fontSize: "12px" }}
          >
            <RefreshCw size={12} />
            Aktualizovat data
          </button>
        </aside>

        {/* Page content Workspace */}
        <main className="admin-workspace">
          {/* MENU 1: ANALYTICS OVERVIEW */}
          {activeMenu === "analytics" && (
            <div>
              <h2 style={{ fontSize: "24px", color: "white", marginBottom: "20px" }}>Přehled a statistiky města</h2>

              {analyticsOverview && (
                <div className="analytics-grid">
                  <div className="stat-card">
                    <span className="stat-header">Schválená místa</span>
                    <span className="stat-value">{analyticsOverview.totalApprovedMarkers}</span>
                  </div>
                  <div className="stat-card" style={{ borderLeft: "3px solid #a855f7" }}>
                    <span className="stat-header">Návrhy ke schválení</span>
                    <span className="stat-value">{analyticsOverview.totalPendingMarkers}</span>
                  </div>
                  <div className="stat-card" style={{ borderLeft: "3px solid #f59e0b" }}>
                    <span className="stat-header">Hlášení za 24 hod</span>
                    <span className="stat-value">{analyticsOverview.totalReports24h}</span>
                  </div>
                  <div className="stat-card" style={{ borderLeft: "3px solid #ef4444" }}>
                    <span className="stat-header">Místa k prověření</span>
                    <span className="stat-value">{analyticsOverview.totalNeedsReview}</span>
                  </div>
                </div>
              )}

              {/* Layout for chart summary & Map */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "24px" }}>
                {/* Lists of reports */}
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-color)", padding: "24px", borderRadius: "16px" }}>
                    <h3 style={{ fontSize: "16px", color: "white", marginBottom: "16px" }}>Četnost problémů (Issue types)</h3>
                    {reportsByIssue.length === 0 ? <p style={{ color: "#94a3b8", fontSize: "13px" }}>Žádná hlášení</p> : (
                      reportsByIssue.map(r => (
                        <div key={r.issueType} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: "13px" }}>
                          <span>⚠️ {r.issueType}</span>
                          <strong>{r.count} hlášení</strong>
                        </div>
                      ))
                    )}
                  </div>

                  <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-color)", padding: "24px", borderRadius: "16px" }}>
                    <h3 style={{ fontSize: "16px", color: "white", marginBottom: "16px" }}>Hlášení dle kategorií</h3>
                    {reportsByCat.length === 0 ? <p style={{ color: "#94a3b8", fontSize: "13px" }}>Žádná hlášení</p> : (
                      reportsByCat.map(r => (
                        <div key={r.category} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: "13px" }}>
                          <span>{MARKER_CATEGORY_LABELS.cs[r.category as MarkerCategory]}</span>
                          <strong>{r.count} hlášení</strong>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Problem Areas Map */}
                <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-color)", padding: "24px", borderRadius: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
                  <h3 style={{ fontSize: "16px", color: "white" }}>📍 Mapa rizikových ohnisek (Problem Areas)</h3>
                  <div style={{ flex: 1, minHeight: "300px", borderRadius: "12px", overflow: "hidden" }}>
                    {typeof window !== "undefined" && MapContainer ? (
                      <MapContainer 
                        center={[PRAGUE_CENTER.lat, PRAGUE_CENTER.lng]} 
                        zoom={12} 
                        style={{ width: "100%", height: "100%" }}
                      >
                        <TileLayer
                          attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
                          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        />
                        {problemAreas.map(area => (
                          <CircleMarker
                            key={area.id}
                            center={[area.latitude, area.longitude]}
                            radius={8 + area.reportCount * 3}
                            fillColor="#ef4444"
                            color="#ef4444"
                            weight={1}
                            fillOpacity={0.6}
                          >
                            <Popup>
                              <div style={{ color: "#000000" }}>
                                <strong>{area.title}</strong>
                                <br />
                                Počet nahlášených problémů: {area.reportCount}
                              </div>
                            </Popup>
                          </CircleMarker>
                        ))}
                      </MapContainer>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", background: "#000" }}>
                        Mapa nedostupná.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MENU 2: PENDING MARKERS */}
          {activeMenu === "pending" && (
            <div>
              <h2 style={{ fontSize: "24px", color: "white", marginBottom: "8px" }}>Návrhy nových míst</h2>
              <p style={{ color: "#94a3b8", fontSize: "14px", marginBottom: "20px" }}>Uživateli navržená místa vyžadující věcné schválení pro publikaci na mapě</p>

              {pendingMarkers.length === 0 ? (
                <div style={{ padding: "40px", textAlign: "center", background: "var(--bg-surface)", border: "1px solid var(--border-color)", borderRadius: "16px", color: "#94a3b8" }}>
                  Žádná nová místa k posouzení.
                </div>
              ) : (
                <div className="data-table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Název</th>
                        <th>Kategorie</th>
                        <th>Adresa</th>
                        <th>Popis</th>
                        <th>Souřadnice</th>
                        <th>Akce</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingMarkers.map(m => (
                        <tr key={m.id}>
                          <td><strong>{m.title}</strong></td>
                          <td>
                            <span className="badge badge-warning" style={{ color: "#c084fc", borderColor: "rgba(168,85,247,0.3)", background: "rgba(168,85,247,0.05)" }}>
                              {MARKER_CATEGORY_LABELS.cs[m.category]}
                            </span>
                          </td>
                          <td>{m.address || "-"}</td>
                          <td>{m.description || "-"}</td>
                          <td>{m.latitude.toFixed(4)}, {m.longitude.toFixed(4)}</td>
                          <td>
                            <div style={{ display: "flex", gap: "8px" }}>
                              <button 
                                className="btn-primary" 
                                onClick={() => handleApproveMarker(m.id)}
                                style={{ padding: "6px 10px", fontSize: "11px", background: "#10b981", borderColor: "#10b981", boxShadow: "none" }}
                              >
                                <Check size={12} />
                                Schválit
                              </button>
                              <button 
                                className="btn-secondary" 
                                onClick={() => handleRejectMarker(m.id)}
                                style={{ padding: "6px 10px", fontSize: "11px", color: "#ef4444" }}
                              >
                                <X size={12} />
                                Zamítnout
                              </button>
                              <button 
                                className="btn-secondary" 
                                onClick={() => setEditingMarker(m)}
                                style={{ padding: "6px 10px", fontSize: "11px" }}
                              >
                                <Edit size={12} />
                                Edit
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* MENU 3: MARKERS NEEDING REVIEW */}
          {activeMenu === "review" && (
            <div>
              <h2 style={{ fontSize: "24px", color: "white", marginBottom: "8px" }}>Místa k prověření</h2>
              <p style={{ color: "#94a3b8", fontSize: "14px", marginBottom: "20px" }}>Místa, která obdržela více hlášení o problémech a vyžadují kontrolu koordinačním týmem</p>

              {needingReview.length === 0 ? (
                <div style={{ padding: "40px", textAlign: "center", background: "var(--bg-surface)", border: "1px solid var(--border-color)", borderRadius: "16px", color: "#94a3b8" }}>
                  Žádná nahlášená místa k prověření.
                </div>
              ) : (
                <div className="data-table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Název místa</th>
                        <th>Kategorie</th>
                        <th>Adresa</th>
                        <th>Hlášení (24h)</th>
                        <th>Převažující problém</th>
                        <th>Poslední hlášení</th>
                        <th>Akce</th>
                      </tr>
                    </thead>
                    <tbody>
                      {needingReview.map(m => (
                        <tr key={m.id}>
                          <td><strong>{m.title}</strong></td>
                          <td>{MARKER_CATEGORY_LABELS.cs[m.category as MarkerCategory]}</td>
                          <td>{m.address}</td>
                          <td style={{ color: "#ef4444", fontWeight: "bold" }}>🚨 {m.reports24h}</td>
                          <td style={{ color: "#fbbf24" }}>{m.mostCommonIssueType}</td>
                          <td>{m.lastReportTime ? new Date(m.lastReportTime).toLocaleString("cs-CZ") : "-"}</td>
                          <td>
                            <div style={{ display: "flex", gap: "8px" }}>
                              <button 
                                className="btn-primary" 
                                onClick={() => handleConfirmMarkerStatus(m.id, m.publicStatus)}
                                style={{ padding: "6px 10px", fontSize: "11px", background: "#10b981", borderColor: "#10b981", boxShadow: "none" }}
                              >
                                Potvrdit stav
                              </button>
                              <button 
                                className="btn-secondary" 
                                onClick={() => handleDismissReports(m.id)}
                                style={{ padding: "6px 10px", fontSize: "11px", color: "#38bdf8" }}
                              >
                                Smazat hlášení
                              </button>
                              <button 
                                className="btn-secondary" 
                                onClick={() => setEditingMarker(m as any)}
                                style={{ padding: "6px 10px", fontSize: "11px" }}
                              >
                                Upravit detail
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* MENU 4: GUIDES ADMIN */}
          {activeMenu === "guides" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <div>
                  <h2 style={{ fontSize: "24px", color: "white" }}>Správa nouzových návodů</h2>
                  <p style={{ color: "#94a3b8", fontSize: "14px" }}>Vytváření a úprava krizových instrukcí pro občany</p>
                </div>
                <button className="btn-primary" onClick={() => setIsNewGuideOpen(true)}>
                  <Plus size={16} />
                  Nový návod
                </button>
              </div>

              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Identifikátor (Slug)</th>
                      <th>Kategorie</th>
                      <th>Priorita</th>
                      <th>Stav publikace</th>
                      <th>Český název</th>
                      <th>Anglický název</th>
                      <th>Akce</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminGuides.map(guide => {
                      const csTranslation = guide.translations?.find(t => t.language === "cs");
                      const enTranslation = guide.translations?.find(t => t.language === "en");
                      return (
                        <tr key={guide.id}>
                          <td><code>{guide.slug}</code></td>
                          <td>{GUIDE_CATEGORY_LABELS.cs[guide.category]}</td>
                          <td>{guide.priority}</td>
                          <td>
                            <span className={`badge ${guide.isPublished ? "badge-success" : "badge-danger"}`}>
                              {guide.isPublished ? "Publikováno" : "Koncept"}
                            </span>
                          </td>
                          <td>{csTranslation?.title || "-"}</td>
                          <td>{enTranslation?.title || "-"}</td>
                          <td>
                            <div style={{ display: "flex", gap: "8px" }}>
                              <button className="btn-secondary" onClick={() => setEditingGuide(guide)} style={{ padding: "6px 10px", fontSize: "11px" }}>
                                <Edit size={12} />
                                Upravit
                              </button>
                              <button className="btn-secondary" onClick={() => handleDeleteGuide(guide.id)} style={{ padding: "6px 10px", fontSize: "11px", color: "#ef4444" }}>
                                <Trash size={12} />
                                Smazat
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* EDIT MODAL: MARKER */}
      {editingMarker && (
        <div className="modal-overlay">
          <form className="modal-content" onSubmit={handleSaveMarkerEdit}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ color: "white" }}>Upravit místo: {editingMarker.title}</h3>
              <button type="button" className="drawer-close" onClick={() => setEditingMarker(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="form-group">
              <label>Název (Title)</label>
              <input 
                type="text" 
                value={editingMarker.title}
                onChange={e => setEditingMarker({ ...editingMarker, title: e.target.value })}
              />
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label>Kategorie</label>
                <select 
                  value={editingMarker.category}
                  onChange={e => setEditingMarker({ ...editingMarker, category: e.target.value as any })}
                  style={{ color: "black" }}
                >
                  {MARKER_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{MARKER_CATEGORY_LABELS.cs[cat]}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Adresa</label>
                <input 
                  type="text" 
                  value={editingMarker.address || ""}
                  onChange={e => setEditingMarker({ ...editingMarker, address: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Popis</label>
              <textarea 
                rows={3}
                value={editingMarker.description || ""}
                onChange={e => setEditingMarker({ ...editingMarker, description: e.target.value })}
              />
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label>Zeměpisná šířka (Lat)</label>
                <input 
                  type="number" 
                  step="0.0001"
                  value={editingMarker.latitude}
                  onChange={e => setEditingMarker({ ...editingMarker, latitude: parseFloat(e.target.value) })}
                />
              </div>
              <div className="form-group">
                <label>Zeměpisná délka (Lng)</label>
                <input 
                  type="number" 
                  step="0.0001"
                  value={editingMarker.longitude}
                  onChange={e => setEditingMarker({ ...editingMarker, longitude: parseFloat(e.target.value) })}
                />
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label>Dostupnost elektřiny</label>
                <select 
                  value={editingMarker.hasElectricity === true ? "yes" : "no"}
                  onChange={e => setEditingMarker({ ...editingMarker, hasElectricity: e.target.value === "yes" })}
                  style={{ color: "black" }}
                >
                  <option value="yes">Ano (Yes)</option>
                  <option value="no">Ne (No)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Dostupnost vody</label>
                <select 
                  value={editingMarker.hasWater === true ? "yes" : "no"}
                  onChange={e => setEditingMarker({ ...editingMarker, hasWater: e.target.value === "yes" })}
                  style={{ color: "black" }}
                >
                  <option value="yes">Ano (Yes)</option>
                  <option value="no">Ne (No)</option>
                </select>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "12px" }}>
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={() => handleDeleteMarker(editingMarker.id)}
                style={{ color: "#ef4444" }}
              >
                Smazat trvale
              </button>
              <div style={{ display: "flex", gap: "12px" }}>
                <button type="button" className="btn-secondary" onClick={() => setEditingMarker(null)}>
                  Zrušit
                </button>
                <button type="submit" className="btn-primary">
                  Uložit změny
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* EDIT MODAL: NEW GUIDE */}
      {isNewGuideOpen && (
        <div className="modal-overlay" style={{ overflowY: "auto", padding: "40px 0" }}>
          <form className="modal-content" onSubmit={handleCreateGuideSubmit} style={{ maxWidth: "700px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ color: "white" }}>Nový nouzový návod</h3>
              <button type="button" className="drawer-close" onClick={() => setIsNewGuideOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label>Slug (Identifikátor, např: co-delat-v-zime)</label>
                <input 
                  type="text" 
                  required
                  placeholder="co-delat-v-zime"
                  value={guideForm.slug}
                  onChange={e => setGuideForm({ ...guideForm, slug: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Kategorie</label>
                <select 
                  value={guideForm.category}
                  onChange={e => setGuideForm({ ...guideForm, category: e.target.value as any })}
                  style={{ color: "black" }}
                >
                  {GUIDE_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{GUIDE_CATEGORY_LABELS.cs[cat]}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label>Priorita (Číslo pro řazení)</label>
                <input 
                  type="number" 
                  value={guideForm.priority}
                  onChange={e => setGuideForm({ ...guideForm, priority: parseInt(e.target.value) })}
                />
              </div>
              <div className="form-group">
                <label>Stav publikace</label>
                <select 
                  value={guideForm.isPublished ? "yes" : "no"}
                  onChange={e => setGuideForm({ ...guideForm, isPublished: e.target.value === "yes" })}
                  style={{ color: "black" }}
                >
                  <option value="no">Koncept (Draft)</option>
                  <option value="yes">Zveřejnit (Published)</option>
                </select>
              </div>
            </div>

            {/* Localized Content CS */}
            <div style={{ border: "1px solid rgba(255,255,255,0.05)", padding: "16px", borderRadius: "10px", background: "rgba(255,255,255,0.01)" }}>
              <h4 style={{ color: "#c084fc", fontSize: "14px", marginBottom: "12px" }}>Česká lokalizace (CS)</h4>
              <div className="form-group" style={{ marginBottom: "10px" }}>
                <label>Název návodu</label>
                <input 
                  type="text" 
                  required
                  placeholder="Co dělat před výpadkem"
                  value={guideForm.titleCs}
                  onChange={e => setGuideForm({ ...guideForm, titleCs: e.target.value })}
                />
              </div>
              <div className="form-group" style={{ marginBottom: "10px" }}>
                <label>Krátký popis</label>
                <input 
                  type="text" 
                  placeholder="Stručný úvodní popis..."
                  value={guideForm.shortDescriptionCs}
                  onChange={e => setGuideForm({ ...guideForm, shortDescriptionCs: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Obsah (Markdown text)</label>
                <textarea 
                  rows={4}
                  placeholder="### Nadpis..."
                  value={guideForm.contentCs}
                  onChange={e => setGuideForm({ ...guideForm, contentCs: e.target.value })}
                />
              </div>
            </div>

            {/* Localized Content EN */}
            <div style={{ border: "1px solid rgba(255,255,255,0.05)", padding: "16px", borderRadius: "10px", background: "rgba(255,255,255,0.01)" }}>
              <h4 style={{ color: "#c084fc", fontSize: "14px", marginBottom: "12px" }}>English localization (EN)</h4>
              <div className="form-group" style={{ marginBottom: "10px" }}>
                <label>Title</label>
                <input 
                  type="text" 
                  placeholder="What to do before blackout"
                  value={guideForm.titleEn}
                  onChange={e => setGuideForm({ ...guideForm, titleEn: e.target.value })}
                />
              </div>
              <div className="form-group" style={{ marginBottom: "10px" }}>
                <label>Short Description</label>
                <input 
                  type="text" 
                  placeholder="Short introduction..."
                  value={guideForm.shortDescriptionEn}
                  onChange={e => setGuideForm({ ...guideForm, shortDescriptionEn: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Content</label>
                <textarea 
                  rows={4}
                  placeholder="### Header..."
                  value={guideForm.contentEn}
                  onChange={e => setGuideForm({ ...guideForm, contentEn: e.target.value })}
                />
              </div>
            </div>

            {/* Checklist Items section */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#cbd5e1" }}>Kontrolní seznam (Checklist items)</label>
                <button type="button" className="btn-secondary" onClick={() => addChecklistItemField(false)} style={{ padding: "4px 8px", fontSize: "11px" }}>
                  + Přidat položku
                </button>
              </div>

              {guideForm.checklistItems.map((item: any, idx: number) => (
                <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 40px", gap: "12px", marginBottom: "10px", alignItems: "center" }}>
                  <input 
                    type="text" 
                    placeholder="Text česky" 
                    value={item.textCs}
                    onChange={e => {
                      const updated = [...guideForm.checklistItems];
                      updated[idx].textCs = e.target.value;
                      setGuideForm({ ...guideForm, checklistItems: updated });
                    }}
                  />
                  <input 
                    type="text" 
                    placeholder="Text English" 
                    value={item.textEn}
                    onChange={e => {
                      const updated = [...guideForm.checklistItems];
                      updated[idx].textEn = e.target.value;
                      setGuideForm({ ...guideForm, checklistItems: updated });
                    }}
                  />
                  <button 
                    type="button" 
                    onClick={() => {
                      const updated = guideForm.checklistItems.filter((_: any, i: number) => i !== idx);
                      setGuideForm({ ...guideForm, checklistItems: updated });
                    }}
                    style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer" }}
                  >
                    <Trash size={16} />
                  </button>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "16px" }}>
              <button type="button" className="btn-secondary" onClick={() => setIsNewGuideOpen(false)}>
                Zrušit
              </button>
              <button type="submit" className="btn-primary">
                Vytvořit návod
              </button>
            </div>
          </form>
        </div>
      )}

      {/* EDIT MODAL: EDIT GUIDE */}
      {editingGuide && (
        <div className="modal-overlay" style={{ overflowY: "auto", padding: "40px 0" }}>
          <form className="modal-content" onSubmit={handleSaveGuideEditSubmit} style={{ maxWidth: "700px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ color: "white" }}>Upravit návod: {editingGuide.slug}</h3>
              <button type="button" className="drawer-close" onClick={() => setEditingGuide(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label>Slug</label>
                <input 
                  type="text" 
                  required
                  value={editingGuide.slug}
                  onChange={e => setEditingGuide({ ...editingGuide, slug: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Kategorie</label>
                <select 
                  value={editingGuide.category}
                  onChange={e => setEditingGuide({ ...editingGuide, category: e.target.value as any })}
                  style={{ color: "black" }}
                >
                  {GUIDE_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{GUIDE_CATEGORY_LABELS.cs[cat]}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label>Priorita (Číslo pro řazení)</label>
                <input 
                  type="number" 
                  value={editingGuide.priority}
                  onChange={e => setEditingGuide({ ...editingGuide, priority: parseInt(e.target.value) })}
                />
              </div>
              <div className="form-group">
                <label>Stav publikace</label>
                <select 
                  value={editingGuide.isPublished ? "yes" : "no"}
                  onChange={e => setEditingGuide({ ...editingGuide, isPublished: e.target.value === "yes" })}
                  style={{ color: "black" }}
                >
                  <option value="no">Koncept (Draft)</option>
                  <option value="yes">Zveřejnit (Published)</option>
                </select>
              </div>
            </div>

            {/* Localized Content CS */}
            <div style={{ border: "1px solid rgba(255,255,255,0.05)", padding: "16px", borderRadius: "10px", background: "rgba(255,255,255,0.01)" }}>
              <h4 style={{ color: "#c084fc", fontSize: "14px", marginBottom: "12px" }}>Česká lokalizace (CS)</h4>
              <div className="form-group" style={{ marginBottom: "10px" }}>
                <label>Název návodu</label>
                <input 
                  type="text" 
                  required
                  value={editingGuide.translations?.find(t => t.language === "cs")?.title || ""}
                  onChange={e => {
                    const trans = [...(editingGuide.translations || [])];
                    const idx = trans.findIndex(t => t.language === "cs");
                    if (idx !== -1) trans[idx].title = e.target.value;
                    else trans.push({ id: "", guideId: editingGuide.id, language: "cs", title: e.target.value, shortDescription: "", content: "" });
                    setEditingGuide({ ...editingGuide, translations: trans });
                  }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: "10px" }}>
                <label>Krátký popis</label>
                <input 
                  type="text" 
                  value={editingGuide.translations?.find(t => t.language === "cs")?.shortDescription || ""}
                  onChange={e => {
                    const trans = [...(editingGuide.translations || [])];
                    const idx = trans.findIndex(t => t.language === "cs");
                    if (idx !== -1) trans[idx].shortDescription = e.target.value;
                    else trans.push({ id: "", guideId: editingGuide.id, language: "cs", title: "", shortDescription: e.target.value, content: "" });
                    setEditingGuide({ ...editingGuide, translations: trans });
                  }}
                />
              </div>
              <div className="form-group">
                <label>Obsah (Markdown text)</label>
                <textarea 
                  rows={4}
                  value={editingGuide.translations?.find(t => t.language === "cs")?.content || ""}
                  onChange={e => {
                    const trans = [...(editingGuide.translations || [])];
                    const idx = trans.findIndex(t => t.language === "cs");
                    if (idx !== -1) trans[idx].content = e.target.value;
                    else trans.push({ id: "", guideId: editingGuide.id, language: "cs", title: "", shortDescription: "", content: e.target.value });
                    setEditingGuide({ ...editingGuide, translations: trans });
                  }}
                />
              </div>
            </div>

            {/* Localized Content EN */}
            <div style={{ border: "1px solid rgba(255,255,255,0.05)", padding: "16px", borderRadius: "10px", background: "rgba(255,255,255,0.01)" }}>
              <h4 style={{ color: "#c084fc", fontSize: "14px", marginBottom: "12px" }}>English localization (EN)</h4>
              <div className="form-group" style={{ marginBottom: "10px" }}>
                <label>Title</label>
                <input 
                  type="text" 
                  value={editingGuide.translations?.find(t => t.language === "en")?.title || ""}
                  onChange={e => {
                    const trans = [...(editingGuide.translations || [])];
                    const idx = trans.findIndex(t => t.language === "en");
                    if (idx !== -1) trans[idx].title = e.target.value;
                    else trans.push({ id: "", guideId: editingGuide.id, language: "en", title: e.target.value, shortDescription: "", content: "" });
                    setEditingGuide({ ...editingGuide, translations: trans });
                  }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: "10px" }}>
                <label>Short Description</label>
                <input 
                  type="text" 
                  value={editingGuide.translations?.find(t => t.language === "en")?.shortDescription || ""}
                  onChange={e => {
                    const trans = [...(editingGuide.translations || [])];
                    const idx = trans.findIndex(t => t.language === "en");
                    if (idx !== -1) trans[idx].shortDescription = e.target.value;
                    else trans.push({ id: "", guideId: editingGuide.id, language: "en", title: "", shortDescription: e.target.value, content: "" });
                    setEditingGuide({ ...editingGuide, translations: trans });
                  }}
                />
              </div>
              <div className="form-group">
                <label>Content</label>
                <textarea 
                  rows={4}
                  value={editingGuide.translations?.find(t => t.language === "en")?.content || ""}
                  onChange={e => {
                    const trans = [...(editingGuide.translations || [])];
                    const idx = trans.findIndex(t => t.language === "en");
                    if (idx !== -1) trans[idx].content = e.target.value;
                    else trans.push({ id: "", guideId: editingGuide.id, language: "en", title: "", shortDescription: "", content: e.target.value });
                    setEditingGuide({ ...editingGuide, translations: trans });
                  }}
                />
              </div>
            </div>

            {/* Checklist items list */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#cbd5e1" }}>Kontrolní seznam (Checklist items)</label>
                <button type="button" className="btn-secondary" onClick={() => addChecklistItemField(true)} style={{ padding: "4px 8px", fontSize: "11px" }}>
                  + Přidat položku
                </button>
              </div>

              {(editingGuide.checklistItems || []).map((item: any, idx: number) => (
                <div key={item.id || idx} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 40px", gap: "12px", marginBottom: "10px", alignItems: "center" }}>
                  <input 
                    type="text" 
                    placeholder="Text česky" 
                    value={item.textCs}
                    onChange={e => {
                      const updated = [...(editingGuide.checklistItems || [])];
                      updated[idx].textCs = e.target.value;
                      setEditingGuide({ ...editingGuide, checklistItems: updated });
                    }}
                  />
                  <input 
                    type="text" 
                    placeholder="Text English" 
                    value={item.textEn}
                    onChange={e => {
                      const updated = [...(editingGuide.checklistItems || [])];
                      updated[idx].textEn = e.target.value;
                      setEditingGuide({ ...editingGuide, checklistItems: updated });
                    }}
                  />
                  <button 
                    type="button" 
                    onClick={() => {
                      const updated = (editingGuide.checklistItems || []).filter((_, i: number) => i !== idx);
                      setEditingGuide({ ...editingGuide, checklistItems: updated });
                    }}
                    style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer" }}
                  >
                    <Trash size={16} />
                  </button>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "16px" }}>
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={() => handleDeleteGuide(editingGuide.id)}
                style={{ color: "#ef4444" }}
              >
                Smazat trvale
              </button>
              <div style={{ display: "flex", gap: "12px" }}>
                <button type="button" className="btn-secondary" onClick={() => setEditingGuide(null)}>
                  Zrušit
                </button>
                <button type="submit" className="btn-primary">
                  Uložit změny
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
