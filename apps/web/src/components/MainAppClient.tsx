"use client";

import React, { useState, useEffect, useRef } from "react";
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

// Copied premium components
import Sidebar from "./Sidebar";
import TopBanner from "./TopBanner";
import BottomNavbar, { TabType } from "./BottomNavbar";
import ActionButtons from "./ActionButtons";
import AIAdvisorCard from "./AIAdvisorCard";
import AuthForm from "./AuthForm";

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

interface User {
  name: string;
  isVolunteer: boolean;
  roles: string[];
  zone: string;
  phone: string;
  isGuest?: boolean;
}

const GUEST_USER: User = {
  name: "Host",
  isVolunteer: false,
  roles: [],
  zone: "Praha",
  phone: "",
  isGuest: true
};

const LATEST_MESSAGES = [
  {
    type: 'alert',
    badgeLabel: 'NEBEZPEČÍ',
    badgeColor: '#FF453A',
    badgeBg: 'rgba(255, 69, 58, 0.10)',
    badgeBorder: 'rgba(255, 69, 58, 0.20)',
    title: 'Kulminace toku řeky očekávána ve 20:00',
    time: 'Před 10 min • Městský rozhlas',
    desc: 'Hladina řeky stoupá. Evakuujte nízko položené oblasti a zabezpečte svůj majetek.'
  },
  {
    type: 'mesh',
    badgeLabel: 'PEER-TO-PEER',
    badgeColor: '#0A84FF',
    badgeBg: 'rgba(10, 132, 255, 0.10)',
    badgeBorder: 'rgba(10, 132, 255, 0.20)',
    title: 'Zprovozněno nouzové Wi-Fi u radnice',
    time: 'Před 45 min • Lokální mesh-nod',
    desc: 'Wi-Fi funguje lokálně bez internetu pro zprávy a stahování map. Připojení zdarma.'
  },
  {
    type: 'supply',
    badgeLabel: 'ZÁSOBOVÁNÍ',
    badgeColor: '#30D158',
    badgeBg: 'rgba(48, 209, 88, 0.10)',
    badgeBorder: 'rgba(48, 209, 88, 0.20)',
    title: 'Výdej pitné vody u hasičské zbrojnice',
    time: 'Před 2 hod • Krizové centrum',
    desc: 'Hasiči rozváží pitnou vodu. Množství na osobu je omezeno na 5 litrů na den.'
  },
  {
    type: 'infra',
    badgeLabel: 'OPRAVA SÍTĚ',
    badgeColor: '#FF9F0A',
    badgeBg: 'rgba(255, 159, 10, 0.10)',
    badgeBorder: 'rgba(255, 159, 10, 0.20)',
    title: 'Most v ulici Nádražní preventivně uzavřen',
    time: 'Před 3 hod • Policie ČR',
    desc: 'Statika mostu se prověřuje z důvodu vysokého průtoku. Využijte vyznačené objížďky.'
  }
];

function renderMessageIcon(type: string) {
  switch (type) {
    case 'alert':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF453A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" fill="rgba(255, 69, 58, 0.1)"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      );
    case 'mesh':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0A84FF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="5" r="2.5" fill="rgba(10, 132, 255, 0.15)"/>
          <circle cx="5" cy="18" r="2.5" fill="rgba(10, 132, 255, 0.15)"/>
          <circle cx="19" cy="18" r="2.5" fill="rgba(10, 132, 255, 0.15)"/>
          <line x1="12" y1="7.5" x2="6.5" y2="15.5"/>
          <line x1="12" y1="7.5" x2="17.5" y2="15.5"/>
          <line x1="7.5" y1="18" x2="16.5" y2="18"/>
        </svg>
      );
    case 'supply':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#30D158" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="6" width="18" height="14" rx="2" fill="rgba(48, 209, 88, 0.1)"/>
          <path d="M12 10v6M9 13h6"/>
          <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/>
        </svg>
      );
    case 'infra':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF9F0A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="rgba(255, 159, 10, 0.1)"/>
        </svg>
      );
    default:
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" strokeWidth="2.2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="16" x2="12" y2="12"/>
          <line x1="12" y1="8" x2="12.01" y2="8"/>
        </svg>
      );
  }
}

export default function MainAppClient() {
  const { isOnline } = useOfflineStatus(API_BASE);
  const { profile, updateLanguage, clearHomeAddress, saveHomeAddress } = useLocalProfile(isOnline);
  const { coords: userCoords, requestLocation, loading: locationLoading } = useOptionalGeolocation();

  // Translations
  const lang = profile?.preferredLanguage || "cs";
  const t = lang === "cs" ? cs : en;

  // Active Tab ('MAPA' | 'NÁVODY' | 'POMOC' | 'ZPRÁVY' | 'PROFIL')
  const [activeTab, setActiveTab] = useState<TabType>("MAPA");

  // Premium modal states
  const [modalType, setModalType] = useState<'NONE' | 'SYNC' | 'LEGEND' | 'MAP_FULL' | 'SOS' | 'VOLUNTEER' | 'AI' | 'AUTH'>('NONE');
  const [activeMarker, setActiveMarker] = useState<{ title: string; desc: string } | null>(null);

  // Authenticated user state
  const [user, setUser] = useState<User>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("prague_resilience_user");
      return stored ? JSON.parse(stored) : GUEST_USER;
    }
    return GUEST_USER;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("prague_resilience_user", JSON.stringify(user));
    }
  }, [user]);

  // Theme support
  const [isLightTheme, setIsLightTheme] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("prague_resilience_theme") === "light";
    }
    return false;
  });

  const toggleTheme = () => {
    setIsLightTheme((prev) => {
      const newVal = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("prague_resilience_theme", newVal ? "light" : "dark");
        if (newVal) {
          document.body.classList.add('light-theme');
        } else {
          document.body.classList.remove('light-theme');
        }
      }
      return newVal;
    });
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("prague_resilience_theme");
      if (savedTheme === "light") {
        document.body.classList.add('light-theme');
      } else {
        document.body.classList.remove('light-theme');
      }
    }
  }, []);

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

  // SOS Signalling submission
  const handleSosSubmit = () => {
    const payload = {
      latitude: userCoords?.latitude || PRAGUE_CENTER.lat,
      longitude: userCoords?.longitude || PRAGUE_CENTER.lng,
      phone: user.phone || 'anonymous',
      name: user.name || 'anonymous',
      timestamp: new Date().toISOString()
    };
    
    // Save to the real offlineQueue
    offlineQueue.enqueue("SEND_SOS", payload, profile?.mockUserId || "anonymous");
    
    if (isOnline) {
      alert("SOS signál byl úspěšně registrován a odeslán na server.");
    } else {
      alert("SOS signál byl uložen offline a bude odeslán okamžitě po obnovení sítě.");
    }
    setModalType('NONE');
  };

  // Volunteer registration submission
  const handleVolunteerRegister = (role: string) => {
    const updatedRoles = Array.from(new Set([...user.roles, role]));
    const updatedUser = {
      ...user,
      isVolunteer: true,
      roles: updatedRoles
    };
    setUser(updatedUser);

    const payload = {
      name: user.name || "Jan Dvořák",
      phone: user.phone || "+420 777 123 456",
      roles: updatedRoles,
      zone: user.zone || "Praha 4 (Zóna A - Pankrác)",
      localUserId: profile?.mockUserId || "anonymous"
    };
    
    offlineQueue.enqueue("REGISTER_VOLUNTEER", payload, profile?.mockUserId || "anonymous");

    if (isOnline) {
      alert(`Byl(a) jste úspěšně registrován(a) jako dobrovolník pro roli: ${role}.`);
    } else {
      alert(`Role ${role} byla uložena lokálně a bude odeslána na backend po připojení k síti.`);
    }
    setModalType('NONE');
  };

  // Tab switching action
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  const closeModal = () => setModalType('NONE');

  return (
    <div className="app-layout">
      {/* ─── DESKTOP NAVIGATION SIDEBAR ─── */}
      <Sidebar activeTab={activeTab} onTabChange={handleTabChange} />

      {/* ─── MAIN CONTENT PANE ─── */}
      <div className="main-content-pane">
        
        {/* Top Status Banner */}
        <TopBanner 
          onClick={() => setModalType('SYNC')} 
          statusText={isOnline ? "Nouzová Síť: Online" : "Nouzový Offline Režim"}
          updateTime={lastSyncText || "08:12"}
          isLightTheme={isLightTheme}
          onThemeToggle={toggleTheme}
        />

        {/* Scrollable Main Area */}
        <div style={{
          flex: 1,
          padding: '24px',
          overflowY: 'auto',
          paddingBottom: '100px', /* Extra space for bottom nav on mobile */
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}>

          {/* Heading */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#0A84FF', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {t.appName}
            </span>
            <h1 style={{ fontSize: '28px', fontWeight: '800', margin: 0, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              {activeTab === 'MAPA' && (lang === 'cs' ? 'Krizová Mapa' : 'Crisis Map')}
              {activeTab === 'NÁVODY' && (lang === 'cs' ? 'Návody a Příručky' : 'Emergency Guides')}
              {activeTab === 'POMOC' && (lang === 'cs' ? 'Centrum Pomoci' : 'Help Center')}
              {activeTab === 'ZPRÁVY' && (lang === 'cs' ? 'Místní Kanály' : 'Local Feed')}
              {activeTab === 'PROFIL' && (lang === 'cs' ? 'Krizový Profil' : 'Crisis Profile')}
            </h1>
          </div>

          {/* Tab 1: MAPA */}
          {activeTab === 'MAPA' && (
            <div className="grid-desktop-two-col" style={{ width: '100%' }}>
              
              {/* Left Column: Search, filters, place list, ActionButtons, AIAdvisorCard */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Search & Filter segment */}
                <div className="liquid-glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px', background: 'rgba(30, 30, 30, 0.4)' }}>
                  <div className="search-input-wrap">
                    <Search size={18} className="search-icon-left" />
                    <input 
                      type="text" 
                      className="glass-input"
                      placeholder={t.searchPlaceholder} 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{ paddingLeft: '42px' }}
                    />
                  </div>

                  {/* Horizontal Categories Filter */}
                  <div className="category-tabs" style={{ margin: '4px 0' }}>
                    <button 
                      className={`category-tab ${selectedCategory === "ALL" ? "active" : ""}`}
                      onClick={() => setSelectedCategory("ALL")}
                    >
                      {lang === 'cs' ? 'Všechna místa' : 'All Places'}
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

                  {/* Filter actions row */}
                  <div className="filter-row">
                    <label className="switch-label">
                      <input 
                        type="checkbox" 
                        className="switch-input"
                        checked={isOpenOnly}
                        onChange={(e) => setIsOpenOnly(e.target.checked)}
                      />
                      <span>{lang === 'cs' ? 'Pouze otevřená místa' : 'Open places only'}</span>
                    </label>

                    <button 
                      className="scale-active-click"
                      onClick={() => setIsAddPlaceOpen(true)}
                      style={{
                        padding: '8px 14px',
                        background: 'rgba(10, 132, 255, 0.08)',
                        border: '1px solid rgba(10, 132, 255, 0.2)',
                        borderRadius: '8px',
                        color: '#0A84FF',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Plus size={14} />
                      {t.addPlace}
                    </button>
                  </div>
                </div>

                {/* SOS & Volunteer ActionButtons */}
                <ActionButtons 
                  onSosClick={() => {
                    if (user.isGuest) {
                      setModalType('AUTH');
                    } else {
                      setModalType('SOS');
                    }
                  }}
                  onVolunteerClick={() => {
                    if (user.isGuest) {
                      setModalType('AUTH');
                    } else {
                      setModalType('VOLUNTEER');
                    }
                  }}
                />

                {/* AIAdvisorCard */}
                <AIAdvisorCard onOpen={() => setModalType('AI')} />

                {/* Places list feed */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-secondary)', letterSpacing: '0.06em', textTransform: 'uppercase', paddingLeft: '4px' }}>
                    {lang === 'cs' ? 'Dostupné krizové body' : 'Available Crisis Points'}
                  </span>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '450px', overflowY: 'auto', paddingRight: '4px' }}>
                    {sortedMarkers.length === 0 ? (
                      <div className="liquid-glass-panel" style={{ textAlign: "center", color: "#8E8E93", padding: "24px", fontSize: '13px', background: 'rgba(30, 30, 30, 0.4)' }}>
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
                            style={{
                              background: isSelected ? 'rgba(10, 132, 255, 0.04)' : 'rgba(30, 30, 30, 0.4)',
                              border: isSelected ? '1px solid #0A84FF' : '1px solid var(--glass-border)',
                              borderRadius: '12px',
                              padding: '16px',
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '8px',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <div className="place-card-header">
                              <span className="place-card-title" style={{ fontSize: '15px', fontWeight: '750' }}>{marker.title}</span>
                              <span className={`badge ${marker.verificationStatus === "NEEDS_REVIEW" ? "badge-warning" : "badge-primary"}`}>
                                {MARKER_CATEGORY_LABELS[lang][marker.category]}
                              </span>
                            </div>
                            
                            <p className="place-card-address" style={{ margin: 0, fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                              📍 {marker.address}
                            </p>

                            <div className="indicators-row" style={{ display: 'flex', gap: '10px', fontSize: '11px' }}>
                              <span style={{ color: marker.hasElectricity ? '#30D158' : '#FF453A' }}>
                                ⚡ {t.electricity}: {marker.hasElectricity ? t.yes : t.no}
                              </span>
                              <span style={{ color: marker.hasWater ? '#30D158' : '#FF453A' }}>
                                💧 {t.water}: {marker.hasWater ? t.yes : t.no}
                              </span>
                              <span style={{ color: marker.hasInternet ? '#30D158' : '#FF453A' }}>
                                📶 {t.internet}: {marker.hasInternet ? t.yes : t.no}
                              </span>
                            </div>

                            <div className="place-card-footer" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-tertiary)' }}>
                              <span>
                                {t.crowdLevel}: {
                                  marker.crowdLevel === "LOW" ? t.crowdLow :
                                  marker.crowdLevel === "MEDIUM" ? t.crowdMedium :
                                  marker.crowdLevel === "HIGH" ? t.crowdHigh : t.crowdUnknown
                                }
                              </span>
                              {marker.verificationStatus === "NEEDS_REVIEW" && (
                                <span style={{ color: "#FF9F0A" }}>⚠️ {t.needsReviewWarning}</span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
              
              {/* Right Column: Leaflet Map and Detail Drawer */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }}>
                
                {/* macOS styled Leaflet map wrapper */}
                <div 
                  className="liquid-glass-panel"
                  style={{
                    width: '100%',
                    height: '420px',
                    position: 'relative',
                    overflow: 'hidden',
                    boxSizing: 'border-box',
                    background: 'rgba(30, 30, 30, 0.4)',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: '14px'
                  }}
                >
                  {/* macOS Title Bar */}
                  <div style={{
                    height: '32px',
                    background: 'var(--segmented-bg, rgba(30, 30, 30, 0.6))',
                    borderBottom: '1px solid var(--glass-border, rgba(255, 255, 255, 0.08))',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 12px',
                    position: 'relative',
                    zIndex: 10,
                    flexShrink: 0
                  }}>
                    <div style={{ display: 'flex', gap: '8px', position: 'absolute', left: '12px' }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#FF5F56' }} />
                      <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#FFBD2E' }} />
                      <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#27C93F' }} />
                    </div>
                    <div style={{
                      margin: '0 auto',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: 'var(--text-secondary)',
                      fontFamily: 'var(--font-display)'
                    }}>
                      {lang === 'cs' ? 'Krizová Mapa Praha (Offline)' : 'Prague Crisis Map (Offline)'}
                    </div>
                  </div>

                  <div style={{ flex: 1, position: 'relative' }}>
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

                        {homeCoords && (
                          <MarkerLayer position={[homeCoords.lat, homeCoords.lng]}>
                            <Popup>
                              <div style={{ color: "#0f172a", fontWeight: "bold" }}>🏠 Můj domov / My Home</div>
                            </Popup>
                          </MarkerLayer>
                        )}

                        {userCoords && (
                          <MarkerLayer position={[userCoords.latitude, userCoords.longitude]}>
                            <Popup>
                              <div style={{ color: "#0f172a", fontWeight: "bold" }}>📍 Moje poloha / My Location</div>
                            </Popup>
                          </MarkerLayer>
                        )}

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
                        <h3>Mapa se načítá...</h3>
                      </div>
                    )}

                    {/* Legend Overlay Button */}
                    <button 
                      className="scale-active-click"
                      onClick={() => setModalType('LEGEND')}
                      style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#FFFFFF',
                        zIndex: 5,
                        cursor: 'pointer',
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                      }} 
                    >
                      ?
                    </button>

                    {/* Fullscreen Overlay Button */}
                    <button 
                      className="scale-active-click"
                      onClick={() => setModalType('MAP_FULL')}
                      style={{
                        position: 'absolute',
                        bottom: '12px',
                        right: '12px',
                        zIndex: 5,
                        background: 'rgba(255, 255, 255, 0.08)',
                        color: '#FFFFFF',
                        fontSize: '11px',
                        fontWeight: '600',
                        padding: '6px 14px',
                        borderRadius: '8px',
                        border: '1px solid rgba(255,255,255,0.12)',
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      {lang === 'cs' ? 'Celoobrazovková mapa' : 'Fullscreen Map'}
                    </button>
                  </div>
                </div>

                {/* Place Detail Card */}
                {selectedMarker && (
                  <div className="liquid-glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', background: 'rgba(30, 30, 30, 0.85)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span className="badge badge-primary" style={{ alignSelf: 'flex-start' }}>
                          {MARKER_CATEGORY_LABELS[lang][selectedMarker.category]}
                        </span>
                        <h2 style={{ fontSize: '18px', fontWeight: '800', margin: '4px 0 0 0' }}>{selectedMarker.title}</h2>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>📍 {selectedMarker.address}</span>
                      </div>
                      <button 
                        onClick={() => setSelectedMarker(null)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '20px', cursor: 'pointer' }}
                      >
                        ×
                      </button>
                    </div>

                    {selectedMarker.description && (
                      <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                        {selectedMarker.description}
                      </p>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '12.5px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <span style={{ color: selectedMarker.hasElectricity ? '#30D158' : '#FF453A' }}>
                          ⚡ {t.electricity}: <strong>{selectedMarker.hasElectricity ? t.yes : t.no}</strong>
                        </span>
                        <span style={{ color: selectedMarker.hasWater ? '#30D158' : '#FF453A' }}>
                          💧 {t.water}: <strong>{selectedMarker.hasWater ? t.yes : t.no}</strong>
                        </span>
                      </div>
                      <div style={{ fontSize: '12.5px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <span style={{ color: selectedMarker.hasInternet ? '#30D158' : '#FF453A' }}>
                          📶 {t.internet}: <strong>{selectedMarker.hasInternet ? t.yes : t.no}</strong>
                        </span>
                        <span>
                          👥 {t.crowdLevel}: <strong>{
                            selectedMarker.crowdLevel === "LOW" ? t.crowdLow :
                            selectedMarker.crowdLevel === "MEDIUM" ? t.crowdMedium :
                            selectedMarker.crowdLevel === "HIGH" ? t.crowdHigh : t.crowdUnknown
                          }</strong>
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '14px' }}>
                      <a 
                        href={buildGoogleDirectionsUrl(selectedMarker.latitude, selectedMarker.longitude)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="scale-active-click"
                        style={{
                          flex: 1,
                          padding: '10px',
                          background: '#0A84FF',
                          borderRadius: '8px',
                          color: '#FFFFFF',
                          fontSize: '12px',
                          fontWeight: '700',
                          textAlign: 'center',
                          textDecoration: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                      >
                        <Navigation size={14} />
                        {t.getDirections}
                      </a>
                      <button 
                        className="scale-active-click"
                        onClick={() => setIsReportOpen(true)}
                        style={{
                          flex: 1,
                          padding: '10px',
                          background: 'rgba(255,255,255,0.08)',
                          border: '1px solid rgba(255,255,255,0.12)',
                          borderRadius: '8px',
                          color: '#FFFFFF',
                          fontSize: '12px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                      >
                        <AlertOctagon size={14} />
                        {t.reportStatus}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 2: NÁVODY */}
          {activeTab === 'NÁVODY' && (
            <div style={{ display: 'flex', gap: '20px', flex: 1, height: '100%', minHeight: '500px' }}>
              {/* Guides sidebar */}
              <div className="liquid-glass-panel" style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px', background: 'rgba(30, 30, 30, 0.4)' }}>
                <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-secondary)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '8px' }}>
                  {lang === 'cs' ? 'Dostupné krizové příručky' : 'Available Guides'}
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', flex: 1 }}>
                  {guides.map(guide => {
                    const translation = guide.translations?.find(tr => tr.language === lang);
                    const isSelected = selectedGuide?.id === guide.id;
                    return (
                      <div 
                        key={guide.id}
                        onClick={() => setSelectedGuide(guide)}
                        style={{
                          padding: '14px',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          backgroundColor: isSelected ? 'rgba(10, 132, 255, 0.06)' : 'transparent',
                          border: `1px solid ${isSelected ? '#0A84FF' : 'rgba(255, 255, 255, 0.04)'}`,
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <h4 style={{ color: isSelected ? '#0A84FF' : '#FFFFFF', fontSize: '13.5px', fontWeight: '750', margin: 0 }}>
                            {translation?.title || guide.slug}
                          </h4>
                          <ChevronRight size={14} color={isSelected ? '#0A84FF' : '#8E8E93'} />
                        </div>
                        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', margin: 0, lineHeight: '1.4' }}>
                          {translation?.shortDescription}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Guide content area */}
              <div className="liquid-glass-panel" style={{ flex: 1, padding: '24px', overflowY: 'auto', background: 'rgba(30, 30, 30, 0.4)' }}>
                {selectedGuide ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                      <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                        {selectedGuide.translations?.find(tr => tr.language === lang)?.title}
                      </h2>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px', margin: 0 }}>
                        {selectedGuide.translations?.find(tr => tr.language === lang)?.shortDescription}
                      </p>
                    </div>

                    <div 
                      className="guide-markdown-content"
                      style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--text-secondary)' }}
                      dangerouslySetInnerHTML={{
                        __html: (selectedGuide.translations?.find(tr => tr.language === lang)?.content || "")
                          .replace(/\n/g, "<br/>")
                          .replace(/### (.*)/g, "<h3 style='font-size:16px;font-weight:750;color:#FFFFFF;margin-top:16px;margin-bottom:8px;'>$1</h3>")
                          .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
                      }}
                    />

                    {selectedGuide.checklistItems && selectedGuide.checklistItems.length > 0 && (
                      <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <h3 style={{ color: 'var(--text-primary)', fontSize: '15px', fontWeight: '750', margin: 0 }}>📋 {t.checklistTitle}</h3>
                        {selectedGuide.checklistItems.map(item => {
                          const isChecked = (checkedItems[selectedGuide.id] || []).includes(item.id);
                          return (
                            <div 
                              key={item.id}
                              onClick={() => toggleChecklistItem(selectedGuide.id, item.id)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                background: isChecked ? 'rgba(48, 209, 88, 0.05)' : 'rgba(0,0,0,0.15)',
                                border: `1px solid ${isChecked ? 'rgba(48, 209, 88, 0.3)' : 'rgba(255,255,255,0.06)'}`,
                                padding: '12px 14px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <div style={{
                                width: '18px',
                                height: '18px',
                                border: `1.5px solid ${isChecked ? '#30D158' : 'rgba(255,255,255,0.2)'}`,
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: isChecked ? '#30D158' : 'transparent'
                              }}>
                                {isChecked && <Check size={12} color="white" />}
                              </div>
                              <span style={{ fontSize: '12.5px', textDecoration: isChecked ? 'line-through' : 'none', color: isChecked ? 'var(--text-tertiary)' : 'var(--text-primary)' }}>
                                {lang === "cs" ? item.textCs : item.textEn}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-tertiary)", fontSize: '13px' }}>
                    {lang === 'cs' ? 'Vyberte nouzový návod ze seznamu vlevo.' : 'Select a guide from the left panel.'}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 3: POMOC */}
          {activeTab === 'POMOC' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', maxWidth: '850px' }}>
              <div className="liquid-glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(30, 30, 30, 0.4)' }}>
                <span style={{ fontSize: '13px', fontWeight: '750', color: 'var(--text-tertiary)' }}>{lang === 'cs' ? 'Informační linka HZS' : 'Fire Rescue Info Line'}</span>
                <span style={{ fontSize: '20px', fontWeight: '800', color: '#0A84FF' }}>950 800 111</span>
                <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  {lang === 'cs' ? 'Pro obecné neurgentní dotazy během povodňových stavů.' : 'For general non-emergency questions during flood states.'}
                </span>
              </div>
              <div className="liquid-glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(30, 30, 30, 0.4)' }}>
                <span style={{ fontSize: '13px', fontWeight: '750', color: 'var(--text-tertiary)' }}>{lang === 'cs' ? 'Krizová psychologická pomoc' : 'Crisis Psychological Help'}</span>
                <span style={{ fontSize: '20px', fontWeight: '800', color: '#30D158' }}>116 123</span>
                <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  {lang === 'cs' ? 'Linka důvěry, k dispozici nonstop zdarma z celé ČR.' : 'Trust line, available 24/7 free of charge in the Czech Republic.'}
                </span>
              </div>
              <div className="liquid-glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(30, 30, 30, 0.4)' }}>
                <span style={{ fontSize: '13px', fontWeight: '750', color: 'var(--text-tertiary)' }}>{lang === 'cs' ? 'Jednotný záchranný systém' : 'Unified Rescue System'}</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px', color: 'var(--text-primary)', marginTop: '4px' }}>
                  <div>📞 {lang === 'cs' ? 'Evropské číslo' : 'European line'}: <strong>112</strong></div>
                  <div>📞 {lang === 'cs' ? 'Hasiči' : 'Fire'}: <strong>150</strong></div>
                  <div>📞 {lang === 'cs' ? 'Záchranka' : 'Medical'}: <strong>155</strong></div>
                  <div>📞 {lang === 'cs' ? 'Policie' : 'Police'}: <strong>158</strong></div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: ZPRÁVY */}
          {activeTab === 'ZPRÁVY' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '750px' }}>
              {LATEST_MESSAGES.map((msg, idx) => (
                <div 
                  key={idx}
                  className="message-card-premium"
                  style={{ 
                    '--accent-color': msg.badgeColor,
                    alignItems: 'flex-start',
                    cursor: 'default'
                  } as React.CSSProperties}
                >
                  {msg.type === 'alert' && <div className="pulse-indicator" style={{ top: '6px', right: '6px' }} />}
                  
                  <div className="message-icon-wrapper" style={{
                    background: msg.badgeBg,
                    border: `1.5px solid ${msg.badgeBorder}`,
                    marginTop: '2px'
                  }}>
                    {renderMessageIcon(msg.type)}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ 
                        fontSize: '9px', 
                        fontWeight: '800', 
                        textTransform: 'uppercase', 
                        color: msg.badgeColor,
                        letterSpacing: '0.05em'
                      }}>
                        {msg.badgeLabel}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>• {msg.time}</span>
                    </div>
                    
                    <span style={{ fontSize: '15.5px', fontWeight: '750', color: 'var(--text-primary)', lineHeight: '1.3' }}>
                      {msg.title}
                    </span>
                    
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.45', fontWeight: '400' }}>
                      {msg.desc}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab 5: PROFIL */}
          {activeTab === 'PROFIL' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '600px' }}>
              {user.isGuest ? (
                /* Guest Profile Card */
                <div className="liquid-glass-panel" style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '18px', textAlign: 'center', alignItems: 'center', background: 'rgba(30, 30, 30, 0.4)' }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'var(--segmented-bg)',
                    border: '1.5px solid var(--glass-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-tertiary)',
                    fontSize: '24px'
                  }}>
                    👤
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)' }}>
                      {lang === 'cs' ? 'Host (Nepřihlášený)' : 'Guest (Unauthenticated)'}
                    </span>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.45' }}>
                      {lang === 'cs' ? 'Pro odesílání SOS signálů, registraci pomoci a komunikaci v síti je vyžadován ověřený krizový profil.' : 'An authenticated profile is required to send SOS signals, register volunteer assistance, and communicate in the mesh network.'}
                    </span>
                  </div>
                  <button 
                    onClick={() => setModalType('AUTH')}
                    className="scale-active-click"
                    style={{
                      width: '100%',
                      maxWidth: '280px',
                      padding: '12px 20px',
                      background: '#0A84FF',
                      border: 'none',
                      borderRadius: '10px',
                      color: '#FFFFFF',
                      fontSize: '13px',
                      fontWeight: '750',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(10, 132, 255, 0.2)',
                      marginTop: '8px'
                    }}
                  >
                    {lang === 'cs' ? 'Vytvořit profil / Přihlásit se ↗' : 'Create Profile / Log In ↗'}
                  </button>
                </div>
              ) : (
                /* Normal Registered User Profile Card */
                <>
                  <div className="liquid-glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '20px', background: 'rgba(30, 30, 30, 0.4)' }}>
                    <div style={{ 
                      width: '54px', 
                      height: '54px', 
                      borderRadius: '50%', 
                      background: 'rgba(10, 132, 255, 0.12)', 
                      border: '1px solid rgba(10, 132, 255, 0.25)',
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      fontSize: '20px', 
                      fontWeight: '700',
                      color: '#0A84FF',
                      textTransform: 'uppercase'
                    }}>
                      {user.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '17px', fontWeight: '750' }}>{user.name}</span>
                      <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>📞 {user.phone}</span>
                        <span style={{ fontSize: '12px', color: '#30D158', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', marginTop: '2px' }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#30D158' }}></span>
                          {lang === 'cs' ? 'Identifikátor ověřen offline (Mesh-ID)' : 'Identifier verified offline (Mesh-ID)'}
                        </span>
                      </span>
                    </div>
                  </div>

                  <div className="liquid-glass-panel" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(30, 30, 30, 0.4)' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>
                      {lang === 'cs' ? 'Moje Skupiny & Role' : 'My Groups & Roles'}
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {user.isVolunteer && user.roles.length > 0 ? (
                        user.roles.map((role, rIdx) => (
                          <span 
                            key={rIdx} 
                            style={{ 
                              background: 'rgba(48, 209, 88, 0.1)', 
                              border: '1px solid rgba(48, 209, 88, 0.25)', 
                              color: '#30D158', 
                              fontSize: '11px', 
                              fontWeight: '700', 
                              padding: '6px 12px', 
                              borderRadius: '8px' 
                            }}
                          >
                            {role}
                          </span>
                        ))
                      ) : (
                        <span style={{ background: 'var(--segmented-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)', fontSize: '11px', fontWeight: '700', padding: '6px 12px', borderRadius: '8px' }}>
                          {lang === 'cs' ? 'Běžný Uživatel' : 'Standard Citizen'}
                        </span>
                      )}
                      <span style={{ background: 'rgba(10, 132, 255, 0.1)', border: '1px solid rgba(10, 132, 255, 0.25)', color: '#0A84FF', fontSize: '11px', fontWeight: '700', padding: '6px 12px', borderRadius: '8px' }}>
                        📍 {user.zone.split(' - ')[1] || user.zone}
                      </span>
                    </div>
                  </div>
                </>
              )}

              {/* Global Settings (address, language, GPS) */}
              <div className="liquid-glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', background: 'rgba(30, 30, 30, 0.4)' }}>
                <span style={{ fontSize: '14px', fontWeight: '750', color: 'var(--text-primary)', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                  {t.settings}
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: "11px", color: "var(--text-tertiary)", fontWeight: "bold" }}>MŮJ ANONYMNÍ IDENTIFIKÁTOR (LOCAL ID)</span>
                  <code style={{ background: "rgba(255,255,255,0.05)", padding: "8px 12px", borderRadius: "6px", fontSize: "13px", color: "#0A84FF", display: 'block' }}>
                    {profile?.mockUserId || "-"}
                  </code>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: "13px", fontWeight: "600", color: "white" }}>{t.homeAddress}</label>
                  <div style={{ display: "flex", gap: "12px" }}>
                    <input 
                      type="text" 
                      className="glass-input"
                      defaultValue={profile?.homeAddress || ""}
                      id="settingsHomeAddress"
                      placeholder="Např. Václavské náměstí 1, Praha"
                      style={{ flex: 1 }}
                    />
                    <button 
                      className="scale-active-click"
                      onClick={() => {
                        const input = document.getElementById("settingsHomeAddress") as HTMLInputElement;
                        if (input) {
                          saveHomeAddress(input.value);
                          alert("Adresa byla uložena.");
                        }
                      }}
                      style={{
                        padding: '10px 18px',
                        background: '#0A84FF',
                        border: 'none',
                        borderRadius: '10px',
                        color: '#FFFFFF',
                        fontSize: '13px',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      {t.save}
                    </button>
                  </div>
                  {profile?.homeLatitude && (
                    <span style={{ fontSize: "11px", color: "#30D158" }}>
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
                        color: "#FF453A",
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

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: "13px", fontWeight: "600", color: "white" }}>{t.language}</label>
                  <select 
                    className="glass-input glass-select"
                    value={lang}
                    onChange={(e) => updateLanguage(e.target.value as "cs" | "en")}
                    style={{ cursor: 'pointer' }}
                  >
                    <option value="cs">Čeština (Czech)</option>
                    <option value="en">English</option>
                  </select>
                </div>

                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "13px", color: "white" }}>Zaměření GPS polohy:</span>
                  <button 
                    className="scale-active-click"
                    onClick={requestLocation} 
                    disabled={locationLoading}
                    style={{
                      padding: '8px 14px',
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: '8px',
                      color: '#FFFFFF',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Navigation size={14} />
                    {locationLoading ? "Zaměřování..." : t.useMyLocation}
                  </button>
                </div>
              </div>

              {!user.isGuest && (
                <button 
                  onClick={() => setUser(GUEST_USER)}
                  className="glass-btn-red scale-active-click"
                  style={{
                    padding: '12px 20px',
                    fontSize: '13px',
                    fontWeight: '750',
                    border: '1px solid rgba(255, 69, 58, 0.25)',
                    borderRadius: '10px',
                    color: '#FF453A',
                    cursor: 'pointer',
                    width: '100%',
                    maxWidth: '180px',
                    marginTop: '10px'
                  }}
                >
                  {lang === 'cs' ? 'Odhlásit se' : 'Log Out'}
                </button>
              )}
            </div>
          )}

        </div>

        {/* ─── MOBILE BOTTOM NAVIGATION BAR ─── */}
        <BottomNavbar activeTab={activeTab} onTabChange={handleTabChange} />

      </div>

      {/* ─── INTERACTIVE MODALS (APPLE STRICT UI) ─── */}
      
      {/* 1. Offline Sync Status Modal */}
      {modalType === 'SYNC' && (
        <div className="glass-modal-backdrop" onClick={closeModal}>
          <div className="glass-modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '24px' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '17px', color: '#FFD60A', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#FFD60A' }} />
              Nouzová synchronizace
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5', margin: '0 0 20px 0' }}>
              Jste v nouzovém režimu bez připojení k internetu. Aplikace udržuje krizovou databázi zpráv a mapových podkladů sdílením s ostatními telefony v bezprostřední blízkosti (Mesh Network).
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', margin: '0 0 24px 0', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: '6px' }}>
                <span style={{ color: 'var(--text-tertiary)' }}>Spojení v okolí (P2P Mesh):</span>
                <span style={{ fontWeight: '700', color: '#30D158' }}>5 aktivních uzlů</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: '6px' }}>
                <span style={{ color: 'var(--text-tertiary)' }}>Uložených míst:</span>
                <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{markers.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: '6px' }}>
                <span style={{ color: 'var(--text-tertiary)' }}>Nouzových návodů:</span>
                <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{guides.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px' }}>
                <span style={{ color: 'var(--text-tertiary)' }}>Poslední offline ověření:</span>
                <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{lastSyncText ? `Dnes ${lastSyncText}` : "-"}</span>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                className="scale-active-click"
                onClick={handleManualRefresh}
                disabled={refreshing}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#0A84FF',
                  border: 'none',
                  borderRadius: '10px',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  fontWeight: '750',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <RefreshCw size={14} className={refreshing ? "spin-animation" : ""} />
                Synchronizovat
              </button>
              <button 
                className="scale-active-click"
                onClick={closeModal}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'var(--segmented-bg)',
                  border: '1px solid var(--input-border)',
                  borderRadius: '10px',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                Hotovo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Map Legend Modal */}
      {modalType === 'LEGEND' && (
        <div className="glass-modal-backdrop" onClick={closeModal}>
          <div className="glass-modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '17px', fontWeight: '700' }}>Legenda mapy</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', margin: '0 0 24px 0' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#30D158" strokeWidth="2.2">
                  <path d="M12 22a7 7 0 0 0 7-7c0-4.3-7-13-7-13S5 10.7 5 15a7 7 0 0 0 7 7z"/>
                </svg>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#30D158' }}>Odběrné místo pitné vody</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Zde je k dispozici nouzová pitná voda z cisteren nebo studní.</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0A84FF" strokeWidth="2.2">
                  <path d="M19 10.5h-5.5V5h-3v5.5H5v3h5.5V19h3v-5.5H19v-3z"/>
                </svg>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#0A84FF' }}>Záchranná stanice / Pomoc</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Distribuce materiální a lékařské pomoci, přítomnost HZS.</span>
                </div>
              </div>
            </div>
            <button 
              className="scale-active-click"
              onClick={closeModal}
              style={{
                width: '100%',
                padding: '12px',
                background: 'var(--segmented-bg)',
                border: '1px solid var(--input-border)',
                borderRadius: '10px',
                color: 'var(--text-primary)',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              Zavřít
            </button>
          </div>
        </div>
      )}

      {/* 3. Fullscreen Map Simulator Modal */}
      {modalType === 'MAP_FULL' && (
        <div className="glass-modal-backdrop" onClick={() => { setActiveMarker(null); closeModal(); }} style={{ padding: 0 }}>
          <div 
            className="glass-modal-content" 
            onClick={(e) => e.stopPropagation()} 
            style={{ 
              width: '100vw', 
              height: '100vh', 
              maxWidth: 'none', 
              borderRadius: 0, 
              border: 'none', 
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              background: 'var(--bg-primary)'
            }}
          >
            {/* macOS Title Bar */}
            <div style={{
              height: '36px',
              background: 'var(--segmented-bg, rgba(30, 30, 30, 0.8))',
              borderBottom: '1px solid var(--glass-border, rgba(255, 255, 255, 0.08))',
              display: 'flex',
              alignItems: 'center',
              padding: '0 16px',
              position: 'relative',
              zIndex: 10,
              flexShrink: 0
            }}>
              <div style={{ display: 'flex', gap: '8px', position: 'absolute', left: '16px' }}>
                <button 
                  onClick={() => { setActiveMarker(null); closeModal(); }}
                  style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#FF5F56', border: 'none', cursor: 'pointer', padding: 0 }} 
                  title={lang === 'cs' ? 'Zavřít' : 'Close'}
                />
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#FFBD2E' }} />
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#27C93F' }} />
              </div>
              <div style={{
                margin: '0 auto',
                fontSize: '13px',
                fontWeight: '700',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-display)'
              }}>
                {lang === 'cs' ? 'Interaktivní Krizová Mapa (Celoobrazovkový režim)' : 'Interactive Crisis Map (Fullscreen)'}
              </div>
            </div>
            {/* Full Leaflet Map */}
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
              {typeof window !== "undefined" && MapContainer ? (
                <MapContainer 
                  center={[PRAGUE_CENTER.lat, PRAGUE_CENTER.lng]} 
                  zoom={14} 
                  style={{ width: "100%", height: "100%", zIndex: 1 }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  />

                  {homeCoords && (
                    <MarkerLayer position={[homeCoords.lat, homeCoords.lng]}>
                      <Popup>
                        <div style={{ color: "#0f172a", fontWeight: "bold" }}>🏠 Můj domov / My Home</div>
                      </Popup>
                    </MarkerLayer>
                  )}

                  {userCoords && (
                    <MarkerLayer position={[userCoords.latitude, userCoords.longitude]}>
                      <Popup>
                        <div style={{ color: "#0f172a", fontWeight: "bold" }}>📍 Moje poloha / My Location</div>
                      </Popup>
                    </MarkerLayer>
                  )}

                  {sortedMarkers.map(marker => (
                    <MarkerLayer 
                      key={marker.id} 
                      position={[marker.latitude, marker.longitude]}
                      eventHandlers={{
                        click: () => {
                          setSelectedMarker(marker);
                          setActiveMarker({ title: marker.title, desc: marker.address || "" });
                        }
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
                  <h3>Mapa není k dispozici</h3>
                </div>
              )}
            </div>

            {/* Bottom floating banner inside fullscreen map */}
            <div 
              style={{ 
                padding: '16px 20px', 
                background: 'var(--modal-bg)', 
                backdropFilter: 'blur(20px)', 
                WebkitBackdropFilter: 'blur(20px)',
                borderTop: '1px solid var(--glass-border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                zIndex: 10
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {activeMarker ? (
                  <>
                    <span style={{ fontSize: '13.5px', fontWeight: '800', color: '#0A84FF', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      📍 {activeMarker.title}
                    </span>
                    <span style={{ fontSize: '12.5px', color: 'var(--text-primary)', fontWeight: '500' }}>
                      {activeMarker.desc}
                    </span>
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: '13px', fontWeight: '750', color: 'var(--text-primary)' }}>Nouzový Režim Mapy (Celoobrazovková)</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Kliknutím na body na mapě zobrazíte informace • 50.0755° N, 14.4378° E</span>
                  </>
                )}
              </div>
              <button 
                className="scale-active-click"
                onClick={() => {
                  setActiveMarker(null);
                  closeModal();
                }}
                style={{
                  padding: '8px 16px',
                  background: '#0A84FF',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  outline: 'none',
                  flexShrink: 0
                }}
              >
                Zavřít Mapu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. SOS Emergency Modal */}
      {modalType === 'SOS' && (
        <div className="glass-modal-backdrop" onClick={closeModal}>
          <div className="glass-modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '24px', border: '1px solid rgba(255, 69, 58, 0.3)' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '17px', color: '#FF453A', fontWeight: '700' }}>Vyslat SOS signál?</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5', margin: '0 0 20px 0' }}>
              Tato akce okamžitě odešle nouzový signál s vaší aktuální polohou všem uživatelům v mesh síti a záchranným složkám. Použijte pouze v případě přímého ohrožení.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                className="scale-active-click"
                onClick={closeModal}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'var(--segmented-bg)',
                  border: '1px solid var(--input-border)',
                  borderRadius: '10px',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                Storno
              </button>
              <button 
                className="scale-active-click"
                onClick={handleSosSubmit}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#FF453A',
                  border: 'none',
                  borderRadius: '10px',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                Vyslat SOS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Volunteer Modal */}
      {modalType === 'VOLUNTEER' && (
        <div className="glass-modal-backdrop" onClick={closeModal}>
          <div className="glass-modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '24px', border: '1px solid rgba(48, 209, 88, 0.3)' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '17px', color: '#30D158', fontWeight: '700' }}>Registrovat pomoc</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5', margin: '0 0 20px 0' }}>
              Chcete nabídnout své síly či prostředky v okolí? Vaše přihlášení a zvolená role budou sdíleny s krizovým štábem a ostatními koordinátory přes mesh síť.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '0 0 20px 0' }}>
              <button 
                className="scale-active-click"
                onClick={() => handleVolunteerRegister('Aktivní Dobrovolník')}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(48, 209, 88, 0.08)',
                  border: '1px solid rgba(48, 209, 88, 0.2)',
                  borderRadius: '10px',
                  color: '#30D158',
                  fontSize: '13px',
                  fontWeight: '700',
                  textAlign: 'left',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                🙋‍♂️ Fyzická pomoc (odklízení zátarasů)
              </button>
              <button 
                className="scale-active-click"
                onClick={() => handleVolunteerRegister('Transport')}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(10, 132, 255, 0.08)',
                  border: '1px solid rgba(10, 132, 255, 0.2)',
                  borderRadius: '10px',
                  color: '#0A84FF',
                  fontSize: '13px',
                  fontWeight: '700',
                  textAlign: 'left',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                🚗 Transport osob (4x4 vozidlo)
              </button>
              <button 
                className="scale-active-click"
                onClick={() => handleVolunteerRegister('První Pomoc')}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(191, 90, 242, 0.08)',
                  border: '1px solid rgba(191, 90, 242, 0.2)',
                  borderRadius: '10px',
                  color: '#BF5AF2',
                  fontSize: '13px',
                  fontWeight: '700',
                  textAlign: 'left',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                🚑 Zdravotník / První pomoc
              </button>
            </div>
            <button 
              className="scale-active-click"
              onClick={closeModal}
              style={{
                width: '100%',
                padding: '8px',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-tertiary)',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              Zrušit
            </button>
          </div>
        </div>
      )}

      {/* 6. AI Advisor Chat Modal */}
      {modalType === 'AI' && (
        <div className="glass-modal-backdrop" onClick={closeModal}>
          <div className="glass-modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '24px', width: '95%', maxWidth: '450px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 0 16px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0A84FF' }} />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>Offline AI Advisor</h3>
              </div>
              <button onClick={closeModal} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
            </div>

            {/* Chat Simulator Content */}
            <div style={{ height: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', margin: '0 0 20px 0', paddingRight: '4px' }}>
              <div style={{ alignSelf: 'flex-start', background: 'var(--segmented-bg)', padding: '10px 14px', borderRadius: '12px 12px 12px 0', fontSize: '12.5px', lineHeight: '1.45', maxWidth: '85%' }}>
                Dobrý den. Jsem lokální model běžící přímo ve Vašem zařízení. Mám uložené kompletní offline příručky civilní ochrany a první pomoci. S čím Vám mohu pomoci?
              </div>
              <div style={{ alignSelf: 'flex-end', background: '#0A84FF', padding: '10px 14px', borderRadius: '12px 12px 0 12px', fontSize: '12.5px', lineHeight: '1.45', maxWidth: '85%' }}>
                Jak si připravit pitnou vodu?
              </div>
              <div style={{ alignSelf: 'flex-start', background: 'var(--segmented-bg)', padding: '10px 14px', borderRadius: '12px 12px 12px 0', fontSize: '12.5px', lineHeight: '1.45', maxWidth: '85%' }}>
                1. <strong>Hrubá filtrace:</strong> Přefiltrujte surovou vodu přes čistou látku k odstranění hrubého sedimentu.<br/>
                2. <strong>Dezinfekce varem:</strong> Nechte přefiltrovanou vodu projít varem po dobu minimálně 1-3 minut.<br/>
                3. Alternativně lze využít certifikované chlorové tablety.
              </div>
            </div>

            {/* Input block */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                placeholder="Zeptejte se offline AI..." 
                disabled
                style={{
                  flex: 1,
                  background: 'var(--input-bg)',
                  border: '1px solid var(--input-border)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  color: 'var(--text-primary)',
                  fontSize: '12.5px',
                  outline: 'none'
                }}
              />
              <button 
                style={{
                  background: 'var(--segmented-bg)',
                  border: '1px solid var(--input-border)',
                  borderRadius: '10px',
                  width: '38px',
                  height: '38px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'not-allowed',
                  opacity: 0.6,
                  color: 'var(--text-secondary)'
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Auth Modal */}
      {modalType === 'AUTH' && (
        <div className="glass-modal-backdrop" onClick={closeModal}>
          <div className="glass-modal-content" onClick={(e) => e.stopPropagation()} style={{ border: 'none', background: 'transparent' }}>
            <AuthForm 
              onSuccess={(u) => {
                setUser(u);
                closeModal();
              }}
              onClose={closeModal}
            />
          </div>
        </div>
      )}

      {/* MODAL 8: ADD / SUGGEST A PLACE */}
      {isAddPlaceOpen && (
        <div className="glass-modal-backdrop" onClick={() => setIsAddPlaceOpen(false)}>
          <form 
            className="glass-modal-content" 
            onSubmit={handleAddPlaceSubmit}
            onClick={(e) => e.stopPropagation()}
            style={{ padding: '28px', maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '16px' }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: "18px", color: "white", margin: 0, fontWeight: '800' }}>📍 {t.addPlace}</h2>
              <button type="button" style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '20px', cursor: 'pointer' }} onClick={() => setIsAddPlaceOpen(false)}>
                ×
              </button>
            </div>

            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '700' }}>{t.title}</label>
              <input 
                type="text" 
                className="glass-input"
                required 
                placeholder="Název místa (např. Náhradní studna Mírák)" 
                value={addPlaceForm.title}
                onChange={e => setAddPlaceForm({ ...addPlaceForm, title: e.target.value })}
              />
            </div>

            <div className="form-row-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '700' }}>{t.category}</label>
                <select 
                  className="glass-input glass-select"
                  value={addPlaceForm.category}
                  onChange={e => setAddPlaceForm({ ...addPlaceForm, category: e.target.value as MarkerCategory })}
                  style={{ cursor: 'pointer' }}
                >
                  {MARKER_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>
                      {MARKER_CATEGORY_LABELS[lang][cat]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '700' }}>{t.address}</label>
                <input 
                  type="text" 
                  className="glass-input"
                  placeholder="Ulice, č.p., Městská část"
                  value={addPlaceForm.address}
                  onChange={e => setAddPlaceForm({ ...addPlaceForm, address: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '700' }}>{t.description}</label>
              <textarea 
                className="glass-input"
                rows={3} 
                placeholder="Popište dostupnost náhradního zdroje, kapacity nebo provozní dobu..."
                value={addPlaceForm.description}
                onChange={e => setAddPlaceForm({ ...addPlaceForm, description: e.target.value })}
              />
            </div>

            <div className="form-row-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '700' }}>Zeměpisná šířka (Latitude)</label>
                <input 
                  type="number" 
                  step="0.00001" 
                  className="glass-input"
                  value={addPlaceForm.latitude}
                  onChange={e => setAddPlaceForm({ ...addPlaceForm, latitude: parseFloat(e.target.value) })}
                />
              </div>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '700' }}>Zeměpisná délka (Longitude)</label>
                <input 
                  type="number" 
                  step="0.00001" 
                  className="glass-input"
                  value={addPlaceForm.longitude}
                  onChange={e => setAddPlaceForm({ ...addPlaceForm, longitude: parseFloat(e.target.value) })}
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "10px" }}>
              <button type="button" className="btn-secondary" style={{ padding: '10px 18px', borderRadius: '10px' }} onClick={() => setIsAddPlaceOpen(false)}>
                {t.cancelBtn}
              </button>
              <button type="submit" className="btn-primary" style={{ padding: '10px 18px', borderRadius: '10px' }}>
                {t.submitBtn}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 9: REPORT PLACE STATUS */}
      {isReportOpen && selectedMarker && (
        <div className="glass-modal-backdrop" onClick={() => setIsReportOpen(false)}>
          <form 
            className="glass-modal-content" 
            onSubmit={handleReportSubmit}
            onClick={(e) => e.stopPropagation()}
            style={{ padding: '28px', maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '16px' }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: "18px", color: "white", margin: 0, fontWeight: '800' }}>⚠️ {t.reportStatus}</h2>
              <button type="button" style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '20px', cursor: 'pointer' }} onClick={() => setIsReportOpen(false)}>
                ×
              </button>
            </div>

            <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0 }}>Hlášení stavu pro: <strong>{selectedMarker.title}</strong></p>

            <div className="form-row-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '700' }}>Stav provozu</label>
                <select 
                  className="glass-input glass-select"
                  value={reportForm.reportedStatus}
                  onChange={e => setReportForm({ ...reportForm, reportedStatus: e.target.value as any })}
                  style={{ cursor: 'pointer' }}
                >
                  <option value="OPEN">{t.openStatus}</option>
                  <option value="CLOSED">{t.closedStatus}</option>
                  <option value="UNKNOWN">{t.unknownStatus}</option>
                </select>
              </div>

              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '700' }}>{t.issueType}</label>
                <select 
                  className="glass-input glass-select"
                  value={reportForm.issueType}
                  onChange={e => setReportForm({ ...reportForm, issueType: e.target.value as any })}
                  style={{ cursor: 'pointer' }}
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

            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '700' }}>Dostupné sítě a služby</label>
              <div className="glass-checkbox-container" style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => setReportForm({ ...reportForm, hasElectricity: !reportForm.hasElectricity })}>
                  <div className={`glass-checkbox ${reportForm.hasElectricity ? 'checked' : ''}`}>
                    {reportForm.hasElectricity && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <span style={{ fontSize: '12.5px' }}>⚡ Elektřina</span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => setReportForm({ ...reportForm, hasWater: !reportForm.hasWater })}>
                  <div className={`glass-checkbox ${reportForm.hasWater ? 'checked' : ''}`}>
                    {reportForm.hasWater && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <span style={{ fontSize: '12.5px' }}>💧 Pitná voda</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => setReportForm({ ...reportForm, hasInternet: !reportForm.hasInternet })}>
                  <div className={`glass-checkbox ${reportForm.hasInternet ? 'checked' : ''}`}>
                    {reportForm.hasInternet && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <span style={{ fontSize: '12.5px' }}>📶 Internet</span>
                </div>
              </div>
            </div>

            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '700' }}>Obsazenost (Crowd level)</label>
              <select 
                className="glass-input glass-select"
                value={reportForm.crowdLevel}
                onChange={e => setReportForm({ ...reportForm, crowdLevel: e.target.value as any })}
                style={{ cursor: 'pointer' }}
              >
                <option value="LOW">{t.crowdLow}</option>
                <option value="MEDIUM">{t.crowdMedium}</option>
                <option value="HIGH">{t.crowdHigh}</option>
                <option value="UNKNOWN">{t.crowdUnknown}</option>
              </select>
            </div>

            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '700' }}>{t.comment}</label>
              <textarea 
                className="glass-input"
                rows={2} 
                placeholder="Doplňující poznámka pro ostatní občany..."
                value={reportForm.comment}
                onChange={e => setReportForm({ ...reportForm, comment: e.target.value })}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "10px" }}>
              <button type="button" className="btn-secondary" style={{ padding: '10px 18px', borderRadius: '10px' }} onClick={() => setIsReportOpen(false)}>
                {t.cancelBtn}
              </button>
              <button type="submit" className="btn-primary" style={{ padding: '10px 18px', borderRadius: '10px' }}>
                {t.submitBtn}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
