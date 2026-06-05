"use client";

import React, { useState, useEffect } from "react";
import { 
  MapPin, 
  BookOpen, 
  Settings as SettingsIcon, 
  AlertOctagon, 
  Search, 
  CheckSquare, 
  Compass, 
  Wifi, 
  WifiOff, 
  Plus, 
  ChevronRight, 
  Navigation, 
  Globe, 
  Check, 
  X,
  RefreshCw,
  Clock,
  ExternalLink
} from "lucide-react";

// Local imports
import { cs } from "../lib/translations/cs";
import { en } from "../lib/translations/en";
import { useOfflineStatus } from "../features/offline/useOfflineStatus";
import { offlineStorage } from "../features/offline/offlineStorage";
import { offlineQueue } from "../features/offline/offlineQueue";
import { useLocalProfile } from "../features/profile/useLocalProfile";
import { useOptionalGeolocation } from "../features/location/useOptionalGeolocation";

// Shared package imports
import { 
  Marker, 
  Guide, 
  MarkerCategory,
  MARKER_CATEGORIES, 
  MARKER_CATEGORY_LABELS, 
  MARKER_CATEGORY_PRIORITY,
  searchMarkers,
  sortMarkersForDisplay,
  buildGoogleDirectionsUrl
} from "shared";

// Leaflet styles
import "leaflet/dist/leaflet.css";

// Dynamic imports for Leaflet components
let MapContainer: any;
let TileLayer: any;
let MarkerLayer: any;
let Popup: any;
let L: any;

if (typeof window !== "undefined") {
  const Leaflet = require("react-leaflet");
  MapContainer = Leaflet.MapContainer;
  TileLayer = Leaflet.TileLayer;
  MarkerLayer = Leaflet.Marker;
  Popup = Leaflet.Popup;
  L = require("leaflet");

  // Fix Leaflet marker icons
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  });
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";
const PRAGUE_CENTER = { lat: 50.0755, lng: 14.4378 };

export default function MainAppClient() {
  const { isOnline } = useOfflineStatus(API_BASE);
  const { profile, updateLanguage, clearHomeAddress, saveHomeAddress } = useLocalProfile(isOnline);
  const { coords: userCoords, requestLocation, loading: locationLoading } = useOptionalGeolocation();

  // Translations
  const lang = profile?.preferredLanguage || "cs";
  const t = lang === "cs" ? cs : en;

  // View Mode: 'map' | 'guides' | 'emergency' | 'profile'
  const [viewMode, setViewMode] = useState<"map" | "guides" | "emergency" | "profile">("map");

  // Data states
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<Marker | null>(null);
  const [selectedGuide, setSelectedGuide] = useState<Guide | null>(null);
  const [lastSyncText, setLastSyncText] = useState<string>("");
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [isOpenOnly, setIsOpenOnly] = useState(false);

  // Modals
  const [isAddPlaceOpen, setIsAddPlaceOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);

  // Form states
  const [addPlaceForm, setAddPlaceForm] = useState({
    title: "",
    category: "EMERGENCY_SUPPORT_POINT" as MarkerCategory,
    address: "",
    description: "",
    latitude: PRAGUE_CENTER.lat,
    longitude: PRAGUE_CENTER.lng
  });

  const [reportForm, setReportForm] = useState({
    reportedStatus: "OPEN" as "OPEN" | "CLOSED" | "UNKNOWN",
    hasElectricity: true,
    hasWater: true,
    hasInternet: false,
    crowdLevel: "MEDIUM" as "LOW" | "MEDIUM" | "HIGH" | "UNKNOWN",
    issueType: "OTHER" as any,
    comment: ""
  });

  // Fetch Data Function
  const fetchData = async (forceRefresh = false) => {
    setRefreshing(true);
    setErrorMessage(null);

    let success = false;
    if (isOnline) {
      try {
        const markersRes = await fetch(`${API_BASE}/markers`);
        const guidesRes = await fetch(`${API_BASE}/guides`);

        if (markersRes.ok && guidesRes.ok) {
          const markersData = await markersRes.json();
          const guidesData = await guidesRes.json();

          setMarkers(markersData);
          setGuides(guidesData);

          offlineStorage.saveCachedMarkers(markersData);
          offlineStorage.saveCachedGuides(guidesData);

          const now = new Date().toLocaleTimeString(lang === "cs" ? "cs-CZ" : "en-US", { hour: '2-digit', minute: '2-digit' });
          setLastSyncText(now);
          success = true;
        }
      } catch (e) {
        console.warn("API fetch failed, falling back to cache", e);
      }
    }

    if (!success) {
      // Offline fallback
      const cachedMarkers = offlineStorage.getCachedMarkers();
      const cachedGuides = offlineStorage.getCachedGuides();
      setMarkers(cachedMarkers);
      setGuides(cachedGuides);

      const syncTime = offlineStorage.getLastSyncTime();
      if (syncTime) {
        const time = new Date(syncTime).toLocaleTimeString(lang === "cs" ? "cs-CZ" : "en-US", { hour: '2-digit', minute: '2-digit' });
        setLastSyncText(time);
      } else {
        setLastSyncText("-");
      }

      if (forceRefresh) {
        setErrorMessage(t.refreshFail);
      }
    }
    setRefreshing(false);
  };

  useEffect(() => {
    fetchData();
  }, [isOnline, lang]);

  // Handle manual sync refresh
  const handleManualRefresh = () => {
    fetchData(true);
  };

  // Filter and sort markers
  const filteredMarkers = searchMarkers(markers, {
    query: searchQuery,
    category: selectedCategory === "ALL" ? undefined : selectedCategory as MarkerCategory,
    isOpenOnly: isOpenOnly
  }, lang);

  // Sorting
  const sortingCoords = userCoords || (profile?.homeLatitude && profile?.homeLongitude ? { latitude: profile.homeLatitude, longitude: profile.homeLongitude } : null);
  const sortedMarkers = sortMarkersForDisplay(filteredMarkers, sortingCoords);

  // Home location pin definition
  const homeCoords = profile?.homeLatitude && profile?.homeLongitude 
    ? { lat: profile.homeLatitude, lng: profile.homeLongitude } 
    : null;

  // Add Place Form submit
  const handleAddPlaceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addPlaceForm.title) return;

    const payload = {
      ...addPlaceForm,
      submittedByLocalUserId: profile?.mockUserId || "anonymous"
    };

    if (isOnline) {
      try {
        const res = await fetch(`${API_BASE}/markers`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          alert(t.submittedSuccess);
          setIsAddPlaceOpen(false);
          fetchData();
        } else {
          throw new Error("Failed to submit");
        }
      } catch {
        // Queue offline
        offlineQueue.enqueue("CREATE_MARKER", payload, profile?.mockUserId || "anonymous");
        alert(t.submittedSuccess + " (Uloženo offline, bude odesláno později)");
        setIsAddPlaceOpen(false);
      }
    } else {
      offlineQueue.enqueue("CREATE_MARKER", payload, profile?.mockUserId || "anonymous");
      alert(t.submittedSuccess + " (Uloženo offline)");
      setIsAddPlaceOpen(false);
    }
  };

  // Report status submit
  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMarker) return;

    const payload = {
      markerId: selectedMarker.id,
      ...reportForm,
      localUserId: profile?.mockUserId || "anonymous"
    };

    if (isOnline) {
      try {
        const res = await fetch(`${API_BASE}/markers/${selectedMarker.id}/reports`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          alert(t.reportSuccess);
          setIsReportOpen(false);
          fetchData();
        } else {
          throw new Error("Failed to report");
        }
      } catch {
        offlineQueue.enqueue("CREATE_MARKER_REPORT", payload, profile?.mockUserId || "anonymous");
        alert(t.reportSuccess + " (Uloženo offline)");
        setIsReportOpen(false);
      }
    } else {
      offlineQueue.enqueue("CREATE_MARKER_REPORT", payload, profile?.mockUserId || "anonymous");
      alert(t.reportSuccess + " (Uloženo offline)");
      setIsReportOpen(false);
    }
  };

  // Guide Checklist item check/uncheck
  const [checkedItems, setCheckedItems] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (guides.length > 0) {
      const progress: Record<string, string[]> = {};
      guides.forEach(g => {
        progress[g.id] = offlineStorage.getChecklistProgress(g.id);
      });
      setCheckedItems(progress);
    }
  }, [guides]);

  const toggleChecklistItem = (guideId: string, itemId: string) => {
    const currentChecked = checkedItems[guideId] || [];
    let updated: string[];
    if (currentChecked.includes(itemId)) {
      updated = currentChecked.filter(id => id !== itemId);
    } else {
      updated = [...currentChecked, itemId];
    }

    setCheckedItems({
      ...checkedItems,
      [guideId]: updated
    });
    offlineStorage.saveChecklistProgress(guideId, updated);
  };

  return (
    <div className="app-container">
      {/* Offline Banner */}
      <div style={{
        backgroundColor: isOnline ? "#10b981" : "#b91c1c",
        color: "#ffffff",
        padding: "8px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        fontSize: "12px",
        fontWeight: "600",
        zIndex: 1000
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
          <span>{isOnline ? "Online" : t.offlineBanner}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {lastSyncText && <span>{t.lastSync.replace("{time}", lastSyncText)}</span>}
          <button 
            onClick={handleManualRefresh}
            disabled={refreshing}
            style={{
              background: "rgba(255,255,255,0.15)",
              border: "none",
              color: "white",
              padding: "4px 8px",
              borderRadius: "4px",
              fontSize: "11px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px"
            }}
          >
            <RefreshCw size={10} className={refreshing ? "spin-animation" : ""} />
            {t.refreshBtn}
          </button>
        </div>
      </div>

      {/* Header */}
      <header className="app-header">
        <div className="brand-section">
          <div className="brand-logo-container">
            <AlertOctagon size={24} />
          </div>
          <div className="brand-title-wrap">
            <h1>{t.appName}</h1>
            <p>{t.appSubtitle}</p>
          </div>
        </div>

        <nav className="nav-controls">
          <button 
            className={`btn-glass ${viewMode === "map" ? "active" : ""}`}
            onClick={() => setViewMode("map")}
          >
            <Compass size={16} />
            Mapa a místa
          </button>
          <button 
            className={`btn-glass ${viewMode === "guides" ? "active" : ""}`}
            onClick={() => setViewMode("guides")}
          >
            <BookOpen size={16} />
            Návody
          </button>
          <button 
            className={`btn-glass ${viewMode === "emergency" ? "active" : ""}`}
            onClick={() => setViewMode("emergency")}
          >
            <AlertOctagon size={16} />
            {t.emergencyMode}
          </button>
          <button 
            className={`btn-glass ${viewMode === "profile" ? "active" : ""}`}
            onClick={() => setViewMode("profile")}
          >
            <SettingsIcon size={16} />
            Nastavení
          </button>

          {/* Lang switch */}
          <div className="lang-switch">
            <button 
              className={`lang-btn ${lang === "cs" ? "active" : ""}`}
              onClick={() => updateLanguage("cs")}
            >
              CS
            </button>
            <button 
              className={`lang-btn ${lang === "en" ? "active" : ""}`}
              onClick={() => updateLanguage("en")}
            >
              EN
            </button>
          </div>
        </nav>
      </header>

      {/* Main content body */}
      <div className="main-content">
        {/* VIEW 1: MAP AND PLACES LIST */}
        {viewMode === "map" && (
          <>
            <div className="sidebar">
              <div className="search-filter-section">
                <div className="search-input-wrap">
                  <Search size={18} className="search-icon-left" />
                  <input 
                    type="text" 
                    placeholder={t.searchPlaceholder} 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="category-tabs">
                  <button 
                    className={`category-tab ${selectedCategory === "ALL" ? "active" : ""}`}
                    onClick={() => setSelectedCategory("ALL")}
                  >
                    Všechna místa
                  </button>
                  {MARKER_CATEGORIES.map(cat => (
                    <button 
                      key={cat}
                      className={`category-tab ${selectedCategory === cat ? "active" : ""}`}
                      onClick={() => setSelectedCategory(cat)}
                    >
                      {MARKER_CATEGORY_LABELS[lang][cat]}
                    </button>
                  ))}
                </div>

                <div className="filter-row">
                  <label className="switch-label">
                    <input 
                      type="checkbox" 
                      className="switch-input"
                      checked={isOpenOnly}
                      onChange={(e) => setIsOpenOnly(e.target.checked)}
                    />
                    <span>Pouze otevřená místa</span>
                  </label>

                  <button 
                    className="btn-glass"
                    onClick={() => setIsAddPlaceOpen(true)}
                    style={{ padding: "6px 12px", fontSize: "12px", background: "rgba(56,189,248,0.06)", borderColor: "rgba(56,189,248,0.3)" }}
                  >
                    <Plus size={14} />
                    {t.addPlace}
                  </button>
                </div>
              </div>

              {/* Places List */}
              <div className="places-list-container">
                {sortedMarkers.length === 0 ? (
                  <div style={{ textAlign: "center", color: "#94a3b8", padding: "24px" }}>
                    {t.noResults}
                  </div>
                ) : (
                  sortedMarkers.map(marker => {
                    const isSelected = selectedMarker?.id === marker.id;
                    return (
                      <div 
                        key={marker.id}
                        className={`place-card ${isSelected ? "selected" : ""}`}
                        onClick={() => setSelectedMarker(marker)}
                      >
                        <div className="place-card-header">
                          <span className="place-card-title">{marker.title}</span>
                          <span className={`badge ${
                            marker.verificationStatus === "NEEDS_REVIEW" ? "badge-warning" : "badge-primary"
                          }`}>
                            {MARKER_CATEGORY_LABELS[lang][marker.category]}
                          </span>
                        </div>
                        
                        <p className="place-card-address">{marker.address}</p>

                        <div className="indicators-row">
                          <span className={`indicator-pill ${marker.hasElectricity ? "active" : "inactive"}`}>
                            <span style={{ fontSize: "16px" }}>⚡</span>
                            {t.electricity}: {marker.hasElectricity ? t.yes : t.no}
                          </span>
                          <span className={`indicator-pill ${marker.hasWater ? "active" : "inactive"}`}>
                            <span style={{ fontSize: "16px" }}>💧</span>
                            {t.water}: {marker.hasWater ? t.yes : t.no}
                          </span>
                          <span className={`indicator-pill ${marker.hasInternet ? "active" : "inactive"}`}>
                            <span style={{ fontSize: "16px" }}>📶</span>
                            {t.internet}: {marker.hasInternet ? t.yes : t.no}
                          </span>
                        </div>

                        <div className="place-card-footer">
                          <span>
                            {t.crowdLevel}: {
                              marker.crowdLevel === "LOW" ? t.crowdLow :
                              marker.crowdLevel === "MEDIUM" ? t.crowdMedium :
                              marker.crowdLevel === "HIGH" ? t.crowdHigh : t.crowdUnknown
                            }
                          </span>
                          {/* Marker warning badge */}
                          {marker.verificationStatus === "NEEDS_REVIEW" && (
                            <span style={{ color: "#f59e0b", fontSize: "10px", fontWeight: "bold" }}>⚠️ {t.needsReviewWarning}</span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Leaflet map wrapper */}
            <div className="map-container-wrapper">
              {typeof window !== "undefined" && MapContainer ? (
                <MapContainer 
                  center={[PRAGUE_CENTER.lat, PRAGUE_CENTER.lng]} 
                  zoom={13} 
                  style={{ width: "100%", height: "100%", zIndex: 1 }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  />

                  {/* Add Home Location Marker */}
                  {homeCoords && (
                    <MarkerLayer position={[homeCoords.lat, homeCoords.lng]}>
                      <Popup>
                        <div style={{ color: "#0f172a", fontWeight: "bold" }}>🏠 Můj domov / My Home</div>
                      </Popup>
                    </MarkerLayer>
                  )}

                  {/* Add Geolocation Marker */}
                  {userCoords && (
                    <MarkerLayer position={[userCoords.latitude, userCoords.longitude]}>
                      <Popup>
                        <div style={{ color: "#0f172a", fontWeight: "bold" }}>📍 Moje poloha / My Location</div>
                      </Popup>
                    </MarkerLayer>
                  )}

                  {/* Places Markers */}
                  {sortedMarkers.map(marker => (
                    <MarkerLayer 
                      key={marker.id} 
                      position={[marker.latitude, marker.longitude]}
                      eventHandlers={{
                        click: () => setSelectedMarker(marker)
                      }}
                    >
                      <Popup>
                        <div style={{ color: "#0f172a", width: "200px" }}>
                          <h4 style={{ margin: "0 0 6px 0", fontSize: "13px" }}>{marker.title}</h4>
                          <p style={{ margin: "0 0 8px 0", fontSize: "11px", color: "#64748b" }}>{marker.address}</p>
                          <span style={{ 
                            fontSize: "10px", 
                            backgroundColor: marker.verificationStatus === "NEEDS_REVIEW" ? "#fef3c7" : "#e0f2fe",
                            color: marker.verificationStatus === "NEEDS_REVIEW" ? "#d97706" : "#0369a1",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            fontWeight: "bold"
                          }}>
                            {MARKER_CATEGORY_LABELS[lang][marker.category]}
                          </span>
                        </div>
                      </Popup>
                    </MarkerLayer>
                  ))}
                </MapContainer>
              ) : (
                <div className="map-placeholder">
                  <div className="map-placeholder-icon">
                    <MapPin size={32} />
                  </div>
                  <h3>Mapa není v offline režimu dostupná</h3>
                  <p>Mapa se načítá pouze pokud jste připojeni k internetu. Níže v seznamu zobrazujeme všechna uložená místa.</p>
                </div>
              )}

              {/* Detail drawer for selected place */}
              {selectedMarker && (
                <div className="detail-drawer">
                  <div className="drawer-header">
                    <div>
                      <span className="badge badge-primary" style={{ marginBottom: "6px", display: "inline-block" }}>
                        {MARKER_CATEGORY_LABELS[lang][selectedMarker.category]}
                      </span>
                      <h2 style={{ fontSize: "20px", color: "white" }}>{selectedMarker.title}</h2>
                      <p style={{ color: "#94a3b8", fontSize: "13px", marginTop: "4px" }}>📍 {selectedMarker.address}</p>
                    </div>
                    <button className="drawer-close" onClick={() => setSelectedMarker(null)}>
                      <X size={20} />
                    </button>
                  </div>

                  {selectedMarker.description && (
                    <p style={{ fontSize: "13px", color: "#cbd5e1", lineHeight: "1.5" }}>{selectedMarker.description}</p>
                  )}

                  {selectedMarker.verificationStatus === "NEEDS_REVIEW" && (
                    <div style={{
                      backgroundColor: "rgba(245, 158, 11, 0.1)",
                      border: "1px solid rgba(245, 158, 11, 0.3)",
                      borderRadius: "8px",
                      padding: "10px 14px",
                      color: "#fbbf24",
                      fontSize: "12px",
                      display: "flex",
                      gap: "8px"
                    }}>
                      <span>⚠️</span>
                      <span><strong>{t.needsReviewWarning}</strong> Několik uživatelů nahlásilo změnu stavu tohoto místa.</span>
                    </div>
                  )}

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", background: "rgba(255,255,255,0.02)", padding: "14px", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
                    <div style={{ fontSize: "12px", display: "flex", flexDirection: "column", gap: "6px" }}>
                      <span>⚡ {t.electricity}: <strong>{selectedMarker.hasElectricity ? t.yes : t.no}</strong></span>
                      <span>💧 {t.water}: <strong>{selectedMarker.hasWater ? t.yes : t.no}</strong></span>
                    </div>
                    <div style={{ fontSize: "12px", display: "flex", flexDirection: "column", gap: "6px" }}>
                      <span>📶 {t.internet}: <strong>{selectedMarker.hasInternet ? t.yes : t.no}</strong></span>
                      <span>👥 {t.crowdLevel}: <strong>{
                        selectedMarker.crowdLevel === "LOW" ? t.crowdLow :
                        selectedMarker.crowdLevel === "MEDIUM" ? t.crowdMedium :
                        selectedMarker.crowdLevel === "HIGH" ? t.crowdHigh : t.crowdUnknown
                      }</strong></span>
                    </div>
                  </div>

                  {selectedMarker.lastVerifiedAt && (
                    <span style={{ fontSize: "11px", color: "#64748b" }}>
                      🕒 {t.lastVerified}: {new Date(selectedMarker.lastVerifiedAt).toLocaleString(lang === "cs" ? "cs-CZ" : "en-US")}
                    </span>
                  )}

                  <div className="drawer-actions">
                    <a 
                      href={buildGoogleDirectionsUrl(selectedMarker.latitude, selectedMarker.longitude)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary"
                      style={{ textDecoration: "none" }}
                    >
                      <Navigation size={14} />
                      {t.getDirections}
                    </a>
                    <button className="btn-secondary" onClick={() => setIsReportOpen(true)}>
                      <AlertOctagon size={14} />
                      {t.reportStatus}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

          {/* VIEW 2: EMERGENCY GUIDES */}
          {viewMode === "guides" && (
            <div style={{ display: "flex", flex: 1, height: "100%" }}>
              <div style={{ width: "360px", borderRight: "1px solid var(--border-color)", overflowY: "auto" }}>
                <div style={{ padding: "20px", borderBottom: "1px solid var(--border-color)" }}>
                  <h2 style={{ fontSize: "18px", color: "white" }}>Nouzové návody</h2>
                  <p style={{ color: "#94a3b8", fontSize: "12px" }}>Uložené návody pro řešení krizových situací</p>
                </div>
                <div style={{ padding: "12px" }}>
                  {guides.map(guide => {
                    const translation = guide.translations?.find(tr => tr.language === lang);
                    const isSelected = selectedGuide?.id === guide.id;
                    return (
                      <div 
                        key={guide.id}
                        onClick={() => setSelectedGuide(guide)}
                        style={{
                          padding: "16px",
                          borderRadius: "10px",
                          marginBottom: "8px",
                          cursor: "pointer",
                          backgroundColor: isSelected ? "rgba(56, 189, 248, 0.05)" : "transparent",
                          border: `1px solid ${isSelected ? "var(--color-primary)" : "transparent"}`
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <h4 style={{ color: isSelected ? "var(--color-primary)" : "white", fontSize: "14px" }}>
                            {translation?.title || guide.slug}
                          </h4>
                          <ChevronRight size={14} color="#94a3b8" />
                        </div>
                        <p style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
                          {translation?.shortDescription}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ flex: 1, overflowY: "auto" }}>
                {selectedGuide ? (
                  <div className="guide-detail-view">
                    <div>
                      <h1 style={{ fontSize: "28px", color: "white" }}>
                        {selectedGuide.translations?.find(tr => tr.language === lang)?.title}
                      </h1>
                      <p style={{ color: "#94a3b8", fontSize: "14px", marginTop: "4px" }}>
                        {selectedGuide.translations?.find(tr => tr.language === lang)?.shortDescription}
                      </p>
                    </div>

                    <div 
                      className="guide-markdown-content"
                      dangerouslySetInnerHTML={{
                        __html: (selectedGuide.translations?.find(tr => tr.language === lang)?.content || "")
                          .replace(/\n/g, "<br/>")
                          .replace(/### (.*)/g, "<h3>$1</h3>")
                          .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
                      }}
                    />

                    {selectedGuide.checklistItems && selectedGuide.checklistItems.length > 0 && (
                      <div className="checklist-section">
                        <h3 style={{ color: "white", fontSize: "16px", marginBottom: "8px" }}>📋 {t.checklistTitle}</h3>
                        {(selectedGuide.checklistItems || []).map(item => {
                          const isChecked = (checkedItems[selectedGuide.id] || []).includes(item.id);
                          return (
                            <div 
                              key={item.id}
                              className={`checklist-item ${isChecked ? "checked" : ""}`}
                              onClick={() => toggleChecklistItem(selectedGuide.id, item.id)}
                            >
                              <div style={{
                                width: "20px",
                                height: "20px",
                                border: `2px solid ${isChecked ? "var(--color-success)" : "rgba(255,255,255,0.2)"}`,
                                borderRadius: "4px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                backgroundColor: isChecked ? "var(--color-success)" : "transparent"
                              }}>
                                {isChecked && <Check size={14} color="white" />}
                              </div>
                              <span>{lang === "cs" ? item.textCs : item.textEn}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#64748b" }}>
                    Vyberte nouzový návod ze seznamu vlevo.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VIEW 3: EMERGENCY MODE */}
          {viewMode === "emergency" && (
            <div className="emergency-page">
              <div>
                <h1 style={{ fontSize: "32px", color: "#ef4444" }}>🚨 {t.emergencyMode}</h1>
                <p style={{ color: "#94a3b8", marginTop: "4px" }}>{t.emergencySubtitle}</p>
              </div>

              <div className="emergency-grid">
                <button 
                  className="emergency-btn pulse"
                  onClick={() => {
                    setSelectedCategory("ALL");
                    // Filter categories: EMERGENCY_SUPPORT_POINT, HOSPITAL, PHARMACY
                    // In a simpler way, filter using category tabs:
                    setSelectedCategory("EMERGENCY_SUPPORT_POINT");
                    setViewMode("map");
                  }}
                >
                  <span className="emergency-btn-title">🆘 {t.nearestHelp}</span>
                  <span className="emergency-btn-desc">Zobrazit nouzové body, nemocnice a odběrná místa vody na mapě.</span>
                </button>

                <button 
                  className="emergency-btn"
                  onClick={() => {
                    setViewMode("guides");
                  }}
                >
                  <span className="emergency-btn-title">📖 {t.emergencyGuides}</span>
                  <span className="emergency-btn-desc">Otevřít seznam krizových návodů a kontrolních seznamů pro přežití.</span>
                </button>

                <button 
                  className="emergency-btn"
                  onClick={() => {
                    alert(`Uložená data offline:\n\nMíst: ${markers.length}\nNávodů: ${guides.length}`);
                  }}
                >
                  <span className="emergency-btn-title">💾 {t.savedOfflineData}</span>
                  <span className="emergency-btn-desc">Prověřit data uložená lokálně pro případ úplného výpadku mobilní sítě.</span>
                </button>

                <button 
                  className="emergency-btn"
                  onClick={() => setIsAddPlaceOpen(true)}
                >
                  <span className="emergency-btn-title">➕ {t.reportAPlace}</span>
                  <span className="emergency-btn-desc">Nahlásit nové místo s náhradními zdroji (např. studna, generátor).</span>
                </button>
              </div>

              <div style={{
                background: "rgba(239, 68, 68, 0.05)",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                borderRadius: "16px",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                marginTop: "12px"
              }}>
                <h3 style={{ color: "white", fontSize: "16px" }}>⚠️ Tísňové linky (Emergency contacts)</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", fontSize: "13px" }}>
                  <div>📞 Jednotné evropské číslo: <strong>112</strong></div>
                  <div>📞 Hasiči (Fire Dept): <strong>150</strong></div>
                  <div>📞 Záchranka (Medical emergency): <strong>155</strong></div>
                  <div>📞 Policie (Police): <strong>158</strong></div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 4: SETTINGS / LOCAL PROFILE */}
          {viewMode === "profile" && (
            <div style={{ maxWidth: "600px", margin: "40px auto", width: "100%", padding: "0 24px", display: "flex", flexDirection: "column", gap: "24px" }}>
              <div>
                <h1 style={{ fontSize: "28px", color: "white" }}>⚙️ {t.settings}</h1>
                <p style={{ color: "#94a3b8", marginTop: "4px" }}>Správa místního profilu a nastavení aplikace</p>
              </div>

              <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-color)", borderRadius: "16px", padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "bold" }}>MŮJ ANONYMNÍ IDENTIFIKÁTOR (LOCAL ID)</span>
                  <code style={{ background: "rgba(255,255,255,0.05)", padding: "8px 12px", borderRadius: "6px", fontSize: "13px", color: "var(--color-primary)" }}>
                    {profile?.mockUserId || "-"}
                  </code>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "600", color: "white" }}>{t.homeAddress}</label>
                  <div style={{ display: "flex", gap: "12px" }}>
                    <input 
                      type="text" 
                      defaultValue={profile?.homeAddress || ""}
                      id="settingsHomeAddress"
                      placeholder="Např. Václavské náměstí 1, Praha"
                      style={{
                        flex: 1,
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid var(--border-color)",
                        padding: "10px 14px",
                        borderRadius: "8px",
                        color: "white"
                      }}
                    />
                    <button 
                      className="btn-primary"
                      onClick={() => {
                        const input = document.getElementById("settingsHomeAddress") as HTMLInputElement;
                        if (input) {
                          saveHomeAddress(input.value);
                          alert("Adresa byla uložena.");
                        }
                      }}
                    >
                      {t.save}
                    </button>
                  </div>
                  {profile?.homeLatitude && (
                    <span style={{ fontSize: "11px", color: "#10b981" }}>
                      ✓ Souřadnice zaměřeny: {profile.homeLatitude.toFixed(4)}, {profile.homeLongitude?.toFixed(4)}
                    </span>
                  )}
                  {profile?.homeAddress && (
                    <button 
                      onClick={() => {
                        clearHomeAddress();
                        const input = document.getElementById("settingsHomeAddress") as HTMLInputElement;
                        if (input) input.value = "";
                      }}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#ef4444",
                        fontSize: "12px",
                        cursor: "pointer",
                        alignSelf: "flex-start",
                        marginTop: "4px"
                      }}
                    >
                      {t.clearAddress}
                    </button>
                  )}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "600", color: "white" }}>{t.language}</label>
                  <select 
                    value={lang}
                    onChange={(e) => updateLanguage(e.target.value as "cs" | "en")}
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid var(--border-color)",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      color: "white"
                    }}
                  >
                    <option value="cs" style={{ color: "#000000" }}>Čeština (Czech)</option>
                    <option value="en" style={{ color: "#000000" }}>English</option>
                  </select>
                </div>

                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "13px", color: "white" }}>Zaměření GPS polohy:</span>
                  <button className="btn-secondary" onClick={requestLocation} disabled={locationLoading}>
                    <Navigation size={14} />
                    {locationLoading ? "Zaměřování..." : t.useMyLocation}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

      {/* MODAL 1: ADD / SUGGEST A PLACE */}
      {isAddPlaceOpen && (
        <div className="modal-overlay">
          <form className="modal-content" onSubmit={handleAddPlaceSubmit}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: "20px", color: "white" }}>📍 {t.addPlace}</h2>
              <button type="button" className="drawer-close" onClick={() => setIsAddPlaceOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="form-group">
              <label>{t.title}</label>
              <input 
                type="text" 
                required 
                placeholder="Název místa (např. Náhradní studna Mírák)" 
                value={addPlaceForm.title}
                onChange={e => setAddPlaceForm({ ...addPlaceForm, title: e.target.value })}
              />
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label>{t.category}</label>
                <select 
                  value={addPlaceForm.category}
                  onChange={e => setAddPlaceForm({ ...addPlaceForm, category: e.target.value as MarkerCategory })}
                  style={{ color: "#000000" }}
                >
                  {MARKER_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>
                      {MARKER_CATEGORY_LABELS[lang][cat]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>{t.address}</label>
                <input 
                  type="text" 
                  placeholder="Ulice, č.p., Městská část"
                  value={addPlaceForm.address}
                  onChange={e => setAddPlaceForm({ ...addPlaceForm, address: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label>{t.description}</label>
              <textarea 
                rows={3} 
                placeholder="Popište dostupnost náhradního zdroje, kapacity nebo provozní dobu..."
                value={addPlaceForm.description}
                onChange={e => setAddPlaceForm({ ...addPlaceForm, description: e.target.value })}
              />
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label>Zeměpisná šířka (Latitude)</label>
                <input 
                  type="number" 
                  step="0.00001" 
                  value={addPlaceForm.latitude}
                  onChange={e => setAddPlaceForm({ ...addPlaceForm, latitude: parseFloat(e.target.value) })}
                />
              </div>
              <div className="form-group">
                <label>Zeměpisná délka (Longitude)</label>
                <input 
                  type="number" 
                  step="0.00001" 
                  value={addPlaceForm.longitude}
                  onChange={e => setAddPlaceForm({ ...addPlaceForm, longitude: parseFloat(e.target.value) })}
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "10px" }}>
              <button type="button" className="btn-secondary" onClick={() => setIsAddPlaceOpen(false)}>
                {t.cancelBtn}
              </button>
              <button type="submit" className="btn-primary">
                {t.submitBtn}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 2: REPORT PLACE STATUS */}
      {isReportOpen && selectedMarker && (
        <div className="modal-overlay">
          <form className="modal-content" onSubmit={handleReportSubmit}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: "20px", color: "white" }}>⚠️ {t.reportStatus}</h2>
              <button type="button" className="drawer-close" onClick={() => setIsReportOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: "13px", color: "#94a3b8" }}>Hlášení stavu pro: <strong>{selectedMarker.title}</strong></p>

            <div className="form-row-2">
              <div className="form-group">
                <label>Stav provozu</label>
                <select 
                  value={reportForm.reportedStatus}
                  onChange={e => setReportForm({ ...reportForm, reportedStatus: e.target.value as any })}
                  style={{ color: "#000000" }}
                >
                  <option value="OPEN">{t.openStatus}</option>
                  <option value="CLOSED">{t.closedStatus}</option>
                  <option value="UNKNOWN">{t.unknownStatus}</option>
                </select>
              </div>

              <div className="form-group">
                <label>{t.issueType}</label>
                <select 
                  value={reportForm.issueType}
                  onChange={e => setReportForm({ ...reportForm, issueType: e.target.value as any })}
                  style={{ color: "#000000" }}
                >
                  <option value="CLOSED">Uzavřeno (CLOSED)</option>
                  <option value="NO_ELECTRICITY">Bez elektřiny (NO_ELECTRICITY)</option>
                  <option value="NO_WATER">Bez vody (NO_WATER)</option>
                  <option value="NO_INTERNET">Bez internetu (NO_INTERNET)</option>
                  <option value="TOO_CROWDED">Příliš obsazeno (TOO_CROWDED)</option>
                  <option value="WRONG_LOCATION">Chybná poloha (WRONG_LOCATION)</option>
                  <option value="OUTDATED_INFO">Neaktuální data (OUTDATED_INFO)</option>
                  <option value="OTHER">Jiné (OTHER)</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Dostupné sítě a služby</label>
              <div className="indicator-checkbox-group">
                <label className="indicator-checkbox">
                  <input 
                    type="checkbox" 
                    checked={reportForm.hasElectricity}
                    onChange={e => setReportForm({ ...reportForm, hasElectricity: e.target.checked })}
                  />
                  <span>⚡ Elektřina</span>
                </label>
                <label className="indicator-checkbox">
                  <input 
                    type="checkbox" 
                    checked={reportForm.hasWater}
                    onChange={e => setReportForm({ ...reportForm, hasWater: e.target.checked })}
                  />
                  <span>💧 Pitná voda</span>
                </label>
                <label className="indicator-checkbox">
                  <input 
                    type="checkbox" 
                    checked={reportForm.hasInternet}
                    onChange={e => setReportForm({ ...reportForm, hasInternet: e.target.checked })}
                  />
                  <span>📶 Internet</span>
                </label>
              </div>
            </div>

            <div className="form-group">
              <label>Obsazenost (Crowd level)</label>
              <select 
                value={reportForm.crowdLevel}
                onChange={e => setReportForm({ ...reportForm, crowdLevel: e.target.value as any })}
                style={{ color: "#000000" }}
              >
                <option value="LOW">{t.crowdLow}</option>
                <option value="MEDIUM">{t.crowdMedium}</option>
                <option value="HIGH">{t.crowdHigh}</option>
                <option value="UNKNOWN">{t.crowdUnknown}</option>
              </select>
            </div>

            <div className="form-group">
              <label>{t.comment}</label>
              <textarea 
                rows={2} 
                placeholder="Doplňující poznámka pro ostatní občany..."
                value={reportForm.comment}
                onChange={e => setReportForm({ ...reportForm, comment: e.target.value })}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "10px" }}>
              <button type="button" className="btn-secondary" onClick={() => setIsReportOpen(false)}>
                {t.cancelBtn}
              </button>
              <button type="submit" className="btn-primary">
                {t.submitBtn}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
