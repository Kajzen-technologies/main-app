"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  MapPin,
  Settings as SettingsIcon,
  AlertOctagon,
  Search,
  CheckSquare,
  Compass,
  Wifi,
  WifiOff,
  Plus,
  ChevronRight,
  ChevronLeft,
  ArrowLeft,
  Navigation,
  Globe,
  Check,
  X,
  RefreshCw,
  Clock,
  ExternalLink,
  Phone,
  PhoneCall,
  Send,
  ShieldAlert,
  Heart,
  AlertTriangle,
  Flame,
  Droplet,
  Utensils,
  Activity,
  ShieldCheck,
  LifeBuoy,
  Layers,
  Home,
  Star,
  Mic
} from "lucide-react";

// Local imports
import { cs } from "../lib/translations/cs";
import { en } from "../lib/translations/en";
import { useOfflineStatus } from "../features/offline/useOfflineStatus";
import { offlineStorage } from "../features/offline/offlineStorage";
import { offlineQueue } from "../features/offline/offlineQueue";
import { useLocalProfile } from "../features/profile/useLocalProfile";
import { useOptionalGeolocation } from "../features/location/useOptionalGeolocation";
import { useTheme } from "../lib/theme/ThemeProvider";
import { CategoryIcon, categoryIconSvg } from "../lib/theme/categoryIcons";
import { CATEGORY_COLORS } from "../lib/theme/tokens";

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
  buildGoogleDirectionsUrl,
  getHaversineDistance
} from "shared";

// Category → accent color. Identity-stable: same colours in both themes so
// users build memory for marker categories. Tokens defined under --cat-* in
// globals.css; mirror values in lib/theme/tokens.ts CATEGORY_COLORS for any
// place that needs a literal hex (Leaflet HTML, canvas, SVG attributes).
// The icon shape lives in lib/theme/categoryIcons.tsx — custom filled
// silhouettes, no stroke, no emoji.
const CATEGORY_VISUAL: Record<MarkerCategory, { color: string; hexColor: string }> = {
  HOSPITAL:                { color: 'var(--cat-hospital)',         hexColor: CATEGORY_COLORS.HOSPITAL },
  PHARMACY:                { color: 'var(--cat-pharmacy)',         hexColor: CATEGORY_COLORS.PHARMACY },
  GAS_STATION:             { color: 'var(--cat-gas-station)',      hexColor: CATEGORY_COLORS.GAS_STATION },
  POLICE_STATION:          { color: 'var(--cat-police)',           hexColor: CATEGORY_COLORS.POLICE_STATION },
  FIRE_STATION:            { color: 'var(--cat-fire)',             hexColor: CATEGORY_COLORS.FIRE_STATION },
  SUPERMARKET:             { color: 'var(--cat-supermarket)',      hexColor: CATEGORY_COLORS.SUPERMARKET },
  PUBLIC_TRANSPORT_HUB:    { color: 'var(--cat-transport)',        hexColor: CATEGORY_COLORS.PUBLIC_TRANSPORT_HUB },
  CITY_DISTRICT_OFFICE:    { color: 'var(--cat-district-office)',  hexColor: CATEGORY_COLORS.CITY_DISTRICT_OFFICE },
  COMMUNITY_CENTER:        { color: 'var(--cat-community)',        hexColor: CATEGORY_COLORS.COMMUNITY_CENTER },
  SCHOOL:                  { color: 'var(--cat-school)',           hexColor: CATEGORY_COLORS.SCHOOL },
  ELDERLY_CARE:            { color: 'var(--cat-elderly)',          hexColor: CATEGORY_COLORS.ELDERLY_CARE },
  EMERGENCY_SUPPORT_POINT: { color: 'var(--cat-emergency-point)',  hexColor: CATEGORY_COLORS.EMERGENCY_SUPPORT_POINT }
};

const LEAFLET_CATEGORY_ICON_CACHE = new Map<string, any>();

function getCategoryLeafletIcon(category: MarkerCategory, variant: "preview" | "full" = "full") {
  if (!L) return undefined;

  const visual = CATEGORY_VISUAL[category];
  const cacheKey = `${category}:${variant}`;
  const cached = LEAFLET_CATEGORY_ICON_CACHE.get(cacheKey);
  if (cached) return cached;

  const size = variant === "preview" ? 30 : 42;
  const height = variant === "preview" ? 36 : 50;
  const iconPx = variant === "preview" ? 16 : 22;
  const icon = L.divIcon({
    className: "enterprise-map-marker-shell",
    iconSize: [size, height],
    iconAnchor: [size / 2, height - 4],
    popupAnchor: [0, -height + 12],
    html: `
      <div class="enterprise-map-marker enterprise-map-marker--${variant}" style="--marker-color: ${visual.hexColor}">
        <span class="enterprise-map-marker__tail" aria-hidden="true"></span>
        <span class="enterprise-map-marker__badge" aria-hidden="true">${categoryIconSvg(category, iconPx)}</span>
      </div>
    `
  });

  LEAFLET_CATEGORY_ICON_CACHE.set(cacheKey, icon);
  return icon;
}

function formatDistance(km: number, lang: 'cs' | 'en'): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

// Imperative recenter inside a MapContainer child.
function MapFlyController({ target }: { target: { lat: number; lng: number; zoom?: number; key: number } | null }) {
  if (!useMapHook) return null;
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const map = useMapHook();
  // eslint-disable-next-line react-hooks/rules-of-hooks
  React.useEffect(() => {
    if (target && map) {
      map.flyTo([target.lat, target.lng], target.zoom ?? map.getZoom(), { duration: 0.8 });
    }
  }, [target?.key, map]);
  return null;
}

// App chrome components
import Sidebar from "./Sidebar";
import TopBanner from "./TopBanner";
import BottomNavbar, { TabType } from "./BottomNavbar";
import ActionButtons from "./ActionButtons";
import AIAdvisorCard from "./AIAdvisorCard";
import AuthForm from "./AuthForm";
import { MOCK_MARKERS, MOCK_GUIDES, getMockAiResponse } from "../lib/mockData";

// Leaflet styles
import "leaflet/dist/leaflet.css";

// Dynamic imports for Leaflet components
let MapContainer: any;
let TileLayer: any;
let MarkerLayer: any;
let Popup: any;
let useMapHook: any;
let L: any;

if (typeof window !== "undefined") {
  const Leaflet = require("react-leaflet");
  MapContainer = Leaflet.MapContainer;
  TileLayer = Leaflet.TileLayer;
  MarkerLayer = Leaflet.Marker;
  Popup = Leaflet.Popup;
  useMapHook = Leaflet.useMap;
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

interface FeedMessage {
  id?: string;
  type: string;
  badgeLabelCs: string;
  badgeLabelEn: string;
  badgeColor: string;
  badgeBg: string;
  badgeBorder: string;
  titleCs: string;
  titleEn: string;
  timeCs: string;
  timeEn: string;
  descCs: string;
  descEn: string;
}

const FALLBACK_MESSAGES: FeedMessage[] = [
  {
    type: 'alert',
    badgeLabelCs: 'NEBEZPEČÍ',
    badgeLabelEn: 'DANGER',
    badgeColor: 'var(--color-danger)',
    badgeBg: 'rgba(var(--color-danger-rgb), 0.1)',
    badgeBorder: 'rgba(var(--color-danger-rgb), 0.2)',
    titleCs: 'Kulminace toku řeky očekávána ve 20:00',
    titleEn: 'River peak flow expected at 20:00',
    timeCs: 'Před 10 min • Městský rozhlas',
    timeEn: '10 min ago • City Radio',
    descCs: 'Hladina řeky stoupá. Evakuujte nízko položené oblasti a zabezpečte svůj majetek.',
    descEn: 'The river level is rising. Evacuate low-lying areas and secure your property.'
  },
  {
    type: 'mesh',
    badgeLabelCs: 'PEER-TO-PEER',
    badgeLabelEn: 'PEER-TO-PEER',
    badgeColor: 'var(--color-info)',
    badgeBg: 'rgba(var(--color-info-rgb), 0.1)',
    badgeBorder: 'rgba(var(--color-info-rgb), 0.2)',
    titleCs: 'Zprovozněno nouzové Wi-Fi u radnice',
    titleEn: 'Emergency Wi-Fi activated at the town hall',
    timeCs: 'Před 45 min • Lokální mesh-nod',
    timeEn: '45 min ago • Local mesh node',
    descCs: 'Wi-Fi funguje lokálně bez internetu pro zprávy a stahování map. Připojení zdarma.',
    descEn: 'Wi-Fi works locally without internet for messaging and downloading maps. Free connection.'
  },
  {
    type: 'supply',
    badgeLabelCs: 'ZÁSOBOVÁNÍ',
    badgeLabelEn: 'SUPPLY',
    badgeColor: 'var(--color-success)',
    badgeBg: 'rgba(var(--color-success-rgb), 0.1)',
    badgeBorder: 'rgba(var(--color-success-rgb), 0.2)',
    titleCs: 'Výdej pitné vody u hasičské zbrojnice',
    titleEn: 'Drinking water distribution at the fire station',
    timeCs: 'Před 2 hod • Krizové centrum',
    timeEn: '2 hours ago • Crisis Center',
    descCs: 'Hasiči rozváží pitnou vodu. Množství na osobu je omezeno na 5 litrů na den.',
    descEn: 'Firefighters are distributing drinking water. Amount per person is limited to 5 liters per day.'
  },
  {
    type: 'infra',
    badgeLabelCs: 'OPRAVA SÍTĚ',
    badgeLabelEn: 'GRID REPAIR',
    badgeColor: 'var(--color-warning)',
    badgeBg: 'rgba(var(--color-warning-rgb), 0.1)',
    badgeBorder: 'rgba(var(--color-warning-rgb), 0.2)',
    titleCs: 'Most v ulici Nádražní preventivně uzavřen',
    titleEn: 'Bridge on Nadrazni street closed preventatively',
    timeCs: 'Před 3 hod • Policie ČR',
    timeEn: '3 hours ago • Police CR',
    descCs: 'Statika mostu se prověřuje z důvodu vysokého průtoku. Využijte vyznačené objížďky.',
    descEn: 'Bridge structural integrity is being checked due to high water flow. Use marked detours.'
  }
];

function renderMessageIcon(type: string) {
  switch (type) {
    case 'alert':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ stroke: "var(--color-danger)" }}>
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" fill="rgba(var(--color-danger-rgb), 0.1)"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      );
    case 'mesh':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ stroke: "var(--color-info)" }}>
          <circle cx="12" cy="5" r="2.5" fill="rgba(var(--color-info-rgb), 0.15)"/>
          <circle cx="5" cy="18" r="2.5" fill="rgba(var(--color-info-rgb), 0.15)"/>
          <circle cx="19" cy="18" r="2.5" fill="rgba(var(--color-info-rgb), 0.15)"/>
          <line x1="12" y1="7.5" x2="6.5" y2="15.5"/>
          <line x1="12" y1="7.5" x2="17.5" y2="15.5"/>
          <line x1="7.5" y1="18" x2="16.5" y2="18"/>
        </svg>
      );
    case 'supply':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ stroke: "var(--color-success)" }}>
          <rect x="3" y="6" width="18" height="14" rx="2" fill="rgba(var(--color-success-rgb), 0.1)"/>
          <path d="M12 10v6M9 13h6"/>
          <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/>
        </svg>
      );
    case 'infra':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ stroke: "var(--color-warning)" }}>
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="rgba(var(--color-warning-rgb), 0.1)"/>
        </svg>
      );
    default:
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="2.2" style={{ stroke: "var(--text-tertiary)" }}>
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="16" x2="12" y2="12"/>
          <line x1="12" y1="8" x2="12.01" y2="8"/>
        </svg>
      );
  }
}

const getGreetingText = (lang: 'cs' | 'en') => {
  const hour = new Date().getHours();
  if (hour >= 22 || hour < 5) {
    return {
      ua: "Тихої ночі!",
      translation: lang === "cs" ? "Klidnou noc!" : "Quiet night!"
    };
  } else if (hour >= 5 && hour < 12) {
    return {
      ua: "Доброго ранку!",
      translation: lang === "cs" ? "Dobré ráno!" : "Good morning!"
    };
  } else if (hour >= 12 && hour < 18) {
    return {
      ua: "Доброго дня!",
      translation: lang === "cs" ? "Dobrý den!" : "Good day!"
    };
  } else {
    return {
      ua: "Доброго вечора!",
      translation: lang === "cs" ? "Dobrý večer!" : "Good evening!"
    };
  }
};

const getFormattedDate = (lang: 'cs' | 'en') => {
  const date = new Date();
  if (lang === 'cs') {
    const days = ['Neděle', 'Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota'];
    const months = ['ledna', 'února', 'března', 'dubna', 'května', 'června', 'července', 'srpna', 'září', 'října', 'listopadu', 'prosince'];
    return `${days[date.getDay()]}, ${date.getDate()}. ${months[date.getMonth()]}`;
  } else {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`;
  }
};

const groupFeedMessages = (messages: FeedMessage[]): { dateCs: string; dateEn: string; items: FeedMessage[] }[] => {
  const groups: Record<string, { dateCs: string; dateEn: string; items: FeedMessage[] }> = {};
  
  messages.forEach((msg, idx) => {
    let key = "today";
    let dateCs = "Dnes";
    let dateEn = "Today";
    
    const id = msg.id || `msg_${idx}`;
    if (id.includes("seed_3") || id.includes("seed_4") || idx === 2 || idx === 3) {
      key = "yesterday";
      dateCs = "Včera";
      dateEn = "Yesterday";
    } else if (id.includes("seed_5") || idx >= 4) {
      key = "june4";
      dateCs = "04. června";
      dateEn = "June 4";
    }
    
    if (!groups[key]) {
      groups[key] = { dateCs, dateEn, items: [] };
    }
    groups[key].items.push(msg);
  });
  
  return Object.values(groups);
};

export default function MainAppClient() {
  const { resolved: resolvedTheme, toggle: toggleTheme } = useTheme();
  const { isOnline } = useOfflineStatus(API_BASE);
  const { profile, updateLanguage, clearHomeAddress, saveHomeAddress, toggleFavoriteMarker, isFavorite } = useLocalProfile(isOnline);
  const { coords: userCoords, requestLocation, loading: locationLoading } = useOptionalGeolocation();

  const helpChatEndRef = useRef<HTMLDivElement>(null);

  // Translations
  const lang = profile?.preferredLanguage || "en";
  const t = lang === "cs" ? cs : en;

  // Active Tab ('MAPA' | 'NÁVODY' | 'POMOC' | 'ZPRÁVY' | 'PROFIL')
  const [activeTab, setActiveTab] = useState<TabType>("ZPRÁVY");

  // Premium modal states
  const [modalType, setModalType] = useState<'NONE' | 'SYNC' | 'LEGEND' | 'MAP_FULL' | 'SOS' | 'VOLUNTEER' | 'AI' | 'AUTH'>('NONE');
  const [activeMarker, setActiveMarker] = useState<{ title: string; desc: string } | null>(null);

  // Apple-Maps fullscreen sheet state
  const [mapSheetState, setMapSheetState] = useState<'PEEK' | 'EXPANDED'>('PEEK');
  const [recenterTarget, setRecenterTarget] = useState<{ lat: number; lng: number; zoom?: number; key: number } | null>(null);

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

  const isLightTheme = resolvedTheme === "light";

  // Data states
  const [markers, setMarkers] = useState<Marker[]>(() => {
    const cached = offlineStorage.getCachedMarkers();
    return cached.length > 0 ? cached : MOCK_MARKERS;
  });
  const [guides, setGuides] = useState<Guide[]>(() => {
    const cached = offlineStorage.getCachedGuides();
    return cached.length > 0 ? cached : MOCK_GUIDES;
  });
  const [feedMessages, setFeedMessages] = useState<FeedMessage[]>(FALLBACK_MESSAGES);
  
  // Local Mesh Chat & Contact state
  interface Contact {
    id: string;
    name: string;
    phone: string;
    avatarColor: string;
    avatarBg: string;
    lastMessageText: string;
    lastMessageTime: string;
    messages: { id: string; sender: string; text: string; time: string; isMe: boolean }[];
  }
  
  const [contacts, setContacts] = useState<Contact[]>([
    {
      id: '1',
      name: 'Honza (Koordinátor)',
      phone: '+420 777 123 456',
      avatarColor: 'var(--color-info)',
      avatarBg: 'var(--color-info-soft)',
      lastMessageText: lang === 'cs' ? 'Nemáš za co. Dej vědět, jestli potřebuješ další palivo.' : 'You are welcome. Let me know if you need more fuel.',
      lastMessageTime: '10:24',
      messages: [
        { id: '1b', sender: 'Honza', text: 'Ano, agregát v bloku B už běží na nouzový režim.', time: '10:20', isMe: false },
        { id: '1c', sender: 'Me', text: 'Děkujeme za zprovoznění!', time: '10:22', isMe: true },
        { id: '1d', sender: 'Honza', text: lang === 'cs' ? 'Nemáš za co. Dej vědět, jestli potřebuješ další palivo.' : 'You are welcome. Let me know if you need more fuel.', time: '10:24', isMe: false }
      ]
    },
    {
      id: '2',
      name: 'Marie (Dobrovolník)',
      phone: '+420 608 987 654',
      avatarColor: 'var(--color-success)',
      avatarBg: 'var(--color-success-soft)',
      lastMessageText: lang === 'cs' ? 'U hasičárny stále vodu rozdávají, fronta je asi na 15 minut.' : 'They are still giving out water at the fire station, the line is about 15 minutes.',
      lastMessageTime: '10:27',
      messages: [
        { id: '2a', sender: 'Marie', text: lang === 'cs' ? 'U hasičárny stále vodu rozdávají, fronta je asi na 15 minut.' : 'They are still giving out water at the fire station, the line is about 15 minutes.', time: '10:27', isMe: false }
      ]
    },
    {
      id: '3',
      name: 'Petr (Soused)',
      phone: '+420 723 456 789',
      avatarColor: 'var(--color-warning)',
      avatarBg: 'var(--color-accent-soft)',
      lastMessageText: lang === 'cs' ? 'U radnice funguje nabíjecí stanice, můžete si dobít telefony.' : 'Charging station is working at the town hall, you can charge your phones.',
      lastMessageTime: '10:31',
      messages: [
        { id: '3a', sender: 'Petr', text: lang === 'cs' ? 'U radnice funguje nabíjecí stanice, můžete si dobít telefony.' : 'Charging station is working at the town hall, you can charge your phones.', time: '10:31', isMe: false }
      ]
    }
  ]);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState("");

  const [meshStatus, setMeshStatus] = useState<{ activeNodes: number; mapSizeMb: number; lastReplicationAt?: string } | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<Marker | null>(null);
  const [selectedGuide, setSelectedGuide] = useState<Guide | null>(null);
  const [lastSyncText, setLastSyncText] = useState<string>("");
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Advisor chat state
  const [aiInput, setAiInput] = useState("");
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [aiSending, setAiSending] = useState(false);
  const [aiMessages, setAiMessages] = useState<{ role: 'assistant' | 'user'; text: string }[]>([
    {
      role: 'assistant',
      text: 'Dobrý den. Tady je offline poradce s uloženými nouzovými postupy pro blackout, první pomoc a základní civilní ochranu. S čím potřebujete pomoct?'
    }
  ]);

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
        const [markersRes, guidesRes, messagesRes, meshRes] = await Promise.all([
          fetch(`${API_BASE}/markers`),
          fetch(`${API_BASE}/guides`),
          fetch(`${API_BASE}/messages`).catch(() => null),
          fetch(`${API_BASE}/mesh/status`).catch(() => null)
        ]);

        if (markersRes.ok && guidesRes.ok) {
          const markersData = await markersRes.json();
          const guidesData = await guidesRes.json();

          setMarkers(markersData);
          setGuides(guidesData);

          offlineStorage.saveCachedMarkers(markersData);
          offlineStorage.saveCachedGuides(guidesData);

          if (messagesRes && messagesRes.ok) {
            const messagesData = await messagesRes.json();
            if (Array.isArray(messagesData) && messagesData.length > 0) {
              setFeedMessages(messagesData);
            }
          }

          if (meshRes && meshRes.ok) {
            const meshData = await meshRes.json();
            setMeshStatus(meshData);
          }

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
      setMarkers(cachedMarkers.length > 0 ? cachedMarkers : MOCK_MARKERS);
      setGuides(cachedGuides.length > 0 ? cachedGuides : MOCK_GUIDES);

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

  // Localize advisor greeting when language changes (if conversation hasn't started yet)
  useEffect(() => {
    if (aiMessages.length === 1 && aiMessages[0].role === 'assistant') {
      setAiMessages([
        {
          role: 'assistant',
          text: lang === 'cs'
            ? 'Dobrý den. Tady je offline poradce s uloženými postupy pro blackout, první pomoc a civilní ochranu. S čím potřebujete pomoct?'
            : 'Hello. This offline advisor has saved blackout, first aid, and civil defense guidance. What do you need help with?'
        }
      ]);
    }
  }, [lang]);

  // Smooth scroll to bottom of chat when new messages arrive
  useEffect(() => {
    if (activeTab === 'POMOC' && helpChatEndRef.current) {
      helpChatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [aiMessages, aiSending, activeTab]);

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
      } catch (err) {
        // Queue offline
        offlineQueue.enqueue("CREATE_MARKER", payload, profile?.mockUserId || "anonymous");
        
        // Add to local state for instant mock feedback
        const newMarker: Marker = {
          id: `marker-mock-${Date.now()}`,
          title: addPlaceForm.title,
          description: addPlaceForm.description,
          category: addPlaceForm.category,
          latitude: addPlaceForm.latitude,
          longitude: addPlaceForm.longitude,
          address: addPlaceForm.address || null,
          publicStatus: "OPEN",
          verificationStatus: "APPROVED",
          hasElectricity: null,
          hasWater: null,
          hasInternet: null,
          crowdLevel: "UNKNOWN",
          submittedByLocalUserId: profile?.mockUserId || "anonymous",
          approvedByAdminId: null,
          lastVerifiedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setMarkers(prev => {
          const updated = [...prev, newMarker];
          offlineStorage.saveCachedMarkers(updated);
          return updated;
        });

        alert(t.submittedSuccess + (lang === 'cs' ? " (Uloženo lokálně)" : " (Saved locally)"));
        setIsAddPlaceOpen(false);
      }
    } else {
      offlineQueue.enqueue("CREATE_MARKER", payload, profile?.mockUserId || "anonymous");
      
      const newMarker: Marker = {
        id: `marker-mock-${Date.now()}`,
        title: addPlaceForm.title,
        description: addPlaceForm.description,
        category: addPlaceForm.category,
        latitude: addPlaceForm.latitude,
        longitude: addPlaceForm.longitude,
        address: addPlaceForm.address || null,
        publicStatus: "OPEN",
        verificationStatus: "APPROVED",
        hasElectricity: null,
        hasWater: null,
        hasInternet: null,
        crowdLevel: "UNKNOWN",
        submittedByLocalUserId: profile?.mockUserId || "anonymous",
        approvedByAdminId: null,
        lastVerifiedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setMarkers(prev => {
        const updated = [...prev, newMarker];
        offlineStorage.saveCachedMarkers(updated);
        return updated;
      });

      alert(t.submittedSuccess + (lang === 'cs' ? " (Uloženo lokálně)" : " (Saved locally)"));
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
      } catch (err) {
        offlineQueue.enqueue("CREATE_MARKER_REPORT", payload, profile?.mockUserId || "anonymous");
        
        // Apply changes locally for instant mock feedback
        setMarkers(prev => {
          const updated = prev.map(m => {
            if (m.id === selectedMarker.id) {
              return {
                ...m,
                publicStatus: reportForm.reportedStatus,
                hasElectricity: reportForm.hasElectricity,
                hasWater: reportForm.hasWater,
                hasInternet: reportForm.hasInternet,
                crowdLevel: reportForm.crowdLevel,
                lastVerifiedAt: new Date().toISOString()
              };
            }
            return m;
          });
          offlineStorage.saveCachedMarkers(updated);
          return updated;
        });

        alert(t.reportSuccess + (lang === 'cs' ? " (Uloženo lokálně)" : " (Saved locally)"));
        setIsReportOpen(false);
      }
    } else {
      offlineQueue.enqueue("CREATE_MARKER_REPORT", payload, profile?.mockUserId || "anonymous");
      
      setMarkers(prev => {
        const updated = prev.map(m => {
          if (m.id === selectedMarker.id) {
            return {
              ...m,
              publicStatus: reportForm.reportedStatus,
              hasElectricity: reportForm.hasElectricity,
              hasWater: reportForm.hasWater,
              hasInternet: reportForm.hasInternet,
              crowdLevel: reportForm.crowdLevel,
              lastVerifiedAt: new Date().toISOString()
            };
          }
          return m;
        });
        offlineStorage.saveCachedMarkers(updated);
        return updated;
      });

      alert(t.reportSuccess + (lang === 'cs' ? " (Uloženo lokálně)" : " (Saved locally)"));
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
  const handleSosSubmit = async () => {
    const payload = {
      latitude: userCoords?.latitude || PRAGUE_CENTER.lat,
      longitude: userCoords?.longitude || PRAGUE_CENTER.lng,
      phone: user.phone || 'anonymous',
      name: user.name || 'anonymous',
      localUserId: profile?.mockUserId || "anonymous",
      timestamp: new Date().toISOString()
    };

    if (isOnline) {
      try {
        const res = await fetch(`${API_BASE}/emergency/sos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          alert(lang === 'cs' ? "SOS signál byl úspěšně registrován a odeslán na server." : "SOS signal was successfully registered and sent to the server.");
          setModalType('NONE');
          return;
        }
        throw new Error(`Server status ${res.status}`);
      } catch (e) {
        console.warn("SOS POST failed, queueing offline", e);
        offlineQueue.enqueue("SEND_SOS", payload, profile?.mockUserId || "anonymous");
        alert(lang === 'cs' ? "SOS nebylo možné odeslat přímo, byl uložen do fronty a odešle se po obnovení sítě." : "SOS could not be sent directly. It has been queued and will be sent when the network is restored.");
        setModalType('NONE');
        return;
      }
    }

    offlineQueue.enqueue("SEND_SOS", payload, profile?.mockUserId || "anonymous");
    alert(lang === 'cs' ? "SOS signál byl uložen offline a bude odeslán okamžitě po obnovení sítě." : "SOS signal was saved offline and will be sent immediately after the network is restored.");
    setModalType('NONE');
  };

  // Volunteer registration submission
  const handleVolunteerRegister = async (role: string) => {
    const updatedRoles = Array.from(new Set([...user.roles, role]));
    const updatedUser = {
      ...user,
      isVolunteer: true,
      roles: updatedRoles
    };
    setUser(updatedUser);

    const payload = {
      name: user.name || (lang === 'cs' ? "Jan Dvořák" : "John Doe"),
      phone: user.phone || "+420 777 123 456",
      roles: updatedRoles,
      zone: user.zone || (lang === 'cs' ? "Praha 4 (Zóna A - Pankrác)" : "Prague 4 (Zone A - Pankrac)"),
      localUserId: profile?.mockUserId || "anonymous"
    };

    if (isOnline) {
      try {
        const res = await fetch(`${API_BASE}/users/volunteer`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          alert(lang === 'cs' ? `Byl(a) jste úspěšně registrován(a) jako dobrovolník pro roli: ${role}.` : `You have been successfully registered as a volunteer for role: ${role}.`);
          setModalType('NONE');
          return;
        }
        throw new Error(`Server status ${res.status}`);
      } catch (e) {
        console.warn("Volunteer register failed, queueing offline", e);
        offlineQueue.enqueue("REGISTER_VOLUNTEER", payload, profile?.mockUserId || "anonymous");
        alert(lang === 'cs' ? `Role ${role} byla uložena do fronty a bude odeslána po obnovení sítě.` : `Role ${role} was queued and will be sent after the network is restored.`);
        setModalType('NONE');
        return;
      }
    }

    offlineQueue.enqueue("REGISTER_VOLUNTEER", payload, profile?.mockUserId || "anonymous");
    alert(lang === 'cs' ? `Role ${role} byla uložena lokálně a bude odeslána na backend po připojení k síti.` : `Role ${role} was saved locally and will be sent to the backend after connecting to the network.`);
    setModalType('NONE');
  };

  // Send message to selected contact
  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = chatInput.trim();
    if (!text || !selectedContactId) return;

    const timeStr = new Date().toLocaleTimeString(lang === 'cs' ? 'cs-CZ' : 'en-US', { hour: '2-digit', minute: '2-digit' });

    setContacts((prev) =>
      prev.map((c) => {
        if (c.id === selectedContactId) {
          return {
            ...c,
            lastMessageText: text,
            lastMessageTime: timeStr,
            messages: [
              ...c.messages,
              {
                id: Date.now().toString(),
                sender: user.isGuest ? (lang === 'cs' ? 'Já' : 'Me') : user.name,
                text,
                time: timeStr,
                isMe: true
              }
            ]
          };
        }
        return c;
      })
    );

    setChatInput("");
  };

  // Tab switching action
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    if (tab === 'MAPA') {
      setModalType('MAP_FULL');
    } else if (modalType === 'MAP_FULL') {
      setModalType('NONE');
    }
  };

  const closeModal = () => setModalType('NONE');

  return (
    <div className="app-layout">
      {/* ─── SIDEBAR PANE (Desktop layout) ─── */}
      <Sidebar activeTab={activeTab} onTabChange={handleTabChange} lang={lang} />

      {/* ─── MAIN CONTENT PANE ─── */}
      <div className="main-content-pane">
        
        {/* Top Status Banner */}
        <TopBanner 
          onClick={() => setModalType('SYNC')} 
          statusText={isOnline ? (lang === 'cs' ? "Nouzová Síť: Online" : "Network Status: Online") : (lang === 'cs' ? "Nouzový Offline Režim" : "Offline Mode")}
          updateTime={lastSyncText || "08:12"}
          onProfileClick={() => handleTabChange('SETTINGS')}
          lang={lang}
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
            <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--color-primary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {t.appName}
            </span>
            <h1 style={{ fontSize: '28px', fontWeight: '800', margin: 0, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              {activeTab === 'MAPA' && (lang === 'cs' ? 'Krizová Mapa' : 'Crisis Map')}
              {activeTab === 'NÁVODY' && (lang === 'cs' ? 'Návody a Příručky' : 'Emergency Guides')}
              {activeTab === 'POMOC' && (lang === 'cs' ? 'Centrum Pomoci' : 'Help Center')}
              {activeTab === 'ZPRÁVY' && (lang === 'cs' ? 'Místní Kanály' : 'Local Feed')}
              {activeTab === 'PROFIL' && (lang === 'cs' ? 'Krizový Profil' : 'Crisis Profile')}
              {activeTab === 'SETTINGS' && (lang === 'cs' ? 'Nastavení' : 'Settings')}
              {activeTab === 'CHAT' && (lang === 'cs' ? 'Sousedský Chat' : 'Offline mesh network of chats')}
            </h1>
          </div>

          {/* Tab 1: MAPA – preview screen. Search/list lives inside fullscreen. */}
          {activeTab === 'MAPA' && (
            <div className="mapa-preview-column">
              {/* Preview map card */}
              <button
                type="button"
                className="map-preview-card scale-active-click"
                onClick={() => setModalType('MAP_FULL')}
                aria-label={lang === 'cs' ? 'Otevřít celoobrazovkovou mapu' : 'Open fullscreen map'}
              >
                <div className="map-preview-leaflet">
                  {typeof window !== "undefined" && MapContainer ? (
                    <MapContainer
                      center={[PRAGUE_CENTER.lat, PRAGUE_CENTER.lng]}
                      zoom={12}
                      dragging={false}
                      zoomControl={false}
                      scrollWheelZoom={false}
                      doubleClickZoom={false}
                      touchZoom={false}
                      style={{ width: "100%", height: "100%", zIndex: 1, pointerEvents: 'none' }}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
                        url={isLightTheme ? "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"}
                      />
                      {sortedMarkers.slice(0, 30).map(marker => (
                        <MarkerLayer
                          key={marker.id}
                          position={[marker.latitude, marker.longitude]}
                          icon={getCategoryLeafletIcon(marker.category as MarkerCategory, "preview")}
                        />
                      ))}
                    </MapContainer>
                  ) : (
                    <div className="map-placeholder">
                      <h3>{lang === 'cs' ? 'Mapa se načítá…' : 'Loading map…'}</h3>
                    </div>
                  )}
                </div>
                <div className="map-preview-overlay">
                  <span className="map-preview-cta">
                    <Search size={14} strokeWidth={2.4} />
                    {lang === 'cs' ? 'Otevřít a hledat na mapě' : 'Open & search on map'}
                  </span>
                  <span className="map-preview-meta">
                    {sortedMarkers.length} {lang === 'cs' ? 'krizových bodů poblíž' : 'crisis points nearby'}
                  </span>
                </div>
              </button>



              {/* Inline selected-marker detail (when user picks one from fullscreen) */}
              {selectedMarker && (
                <div className="marker-detail-card">
                  <div className="marker-detail-head">
                    <div className="marker-detail-head-text">
                      <span className="badge badge-primary marker-detail-cat">
                        {MARKER_CATEGORY_LABELS[lang][selectedMarker.category as MarkerCategory]}
                      </span>
                      <h2 className="marker-detail-title">{selectedMarker.title}</h2>
                      {selectedMarker.address && (
                        <span className="marker-detail-address">📍 {selectedMarker.address}</span>
                      )}
                    </div>
                    <div className="marker-detail-head-actions">
                      <button
                        type="button"
                        className={`marker-fav-toggle ${isFavorite(selectedMarker.id) ? 'on' : ''}`}
                        onClick={() => toggleFavoriteMarker(selectedMarker.id)}
                        title={isFavorite(selectedMarker.id)
                          ? (lang === 'cs' ? 'Odebrat z oblíbených' : 'Remove from favorites')
                          : (lang === 'cs' ? 'Přidat do oblíbených' : 'Add to favorites')}
                        aria-pressed={isFavorite(selectedMarker.id)}
                      >
                        {isFavorite(selectedMarker.id) ? '★' : '☆'}
                      </button>
                      <button
                        type="button"
                        className="marker-detail-close"
                        onClick={() => setSelectedMarker(null)}
                        aria-label="Close"
                      >
                        ×
                      </button>
                    </div>
                  </div>

                  {selectedMarker.description && (
                    <p className="marker-detail-desc">{selectedMarker.description}</p>
                  )}

                  <div className="marker-detail-grid">
                    <div>
                      <span style={{ color: selectedMarker.hasElectricity ? 'var(--color-success)' : 'var(--color-danger)' }}>
                        ⚡ {t.electricity}: <strong>{selectedMarker.hasElectricity ? t.yes : t.no}</strong>
                      </span>
                      <span style={{ color: selectedMarker.hasWater ? 'var(--color-success)' : 'var(--color-danger)' }}>
                        💧 {t.water}: <strong>{selectedMarker.hasWater ? t.yes : t.no}</strong>
                      </span>
                    </div>
                    <div>
                      <span style={{ color: selectedMarker.hasInternet ? 'var(--color-success)' : 'var(--color-danger)' }}>
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

                  <div className="marker-detail-actions">
                    <a
                      href={buildGoogleDirectionsUrl(selectedMarker.latitude, selectedMarker.longitude)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="scale-active-click marker-action-primary"
                    >
                      <Navigation size={14} />
                      {t.getDirections}
                    </a>
                    <button
                      type="button"
                      className="scale-active-click marker-action-secondary"
                      onClick={() => setIsReportOpen(true)}
                    >
                      <AlertOctagon size={14} />
                      {t.reportStatus}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}


          {/* Tab 2: NÁVODY */}
          {activeTab === 'NÁVODY' && (
            selectedGuide === null ? (
              <div style={{ display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '640px', margin: '0 auto', fontFamily: 'var(--font-sans), sans-serif' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    background: 'var(--bg-secondary, rgba(255,255,255,0.04))',
                    border: '1px solid var(--border-subtle, rgba(255,255,255,0.06))',
                    borderRadius: '16px',
                    overflow: 'hidden'
                  }}>
                    {guides.map((guide, idx) => {
                      const translation = guide.translations?.find(tr => tr.language === lang);
                      return (
                        <div 
                          key={guide.id}
                          onClick={() => setSelectedGuide(guide)}
                          className="scale-active-click"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '14px 16px',
                            borderBottom: idx === guides.length - 1 ? 'none' : '1px solid var(--border-subtle, rgba(255,255,255,0.06))',
                            gap: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          {/* Middle Content */}
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3px', minWidth: 0 }}>
                            <h4 style={{
                              fontSize: '14.5px',
                              fontWeight: '750',
                              color: 'var(--text-primary, #FFFFFF)',
                              lineHeight: '1.25',
                              margin: 0,
                              textOverflow: 'ellipsis',
                              overflow: 'hidden',
                              whiteSpace: 'nowrap'
                            }}>
                              {translation?.title || guide.slug}
                            </h4>
                            <p style={{
                              fontSize: '12.5px',
                              color: 'var(--text-secondary, #AEAEB2)',
                              lineHeight: '1.4',
                              fontWeight: '400',
                              margin: 0,
                              textOverflow: 'ellipsis',
                              overflow: 'hidden',
                              whiteSpace: 'nowrap'
                            }}>
                              {translation?.shortDescription}
                            </p>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '640px', margin: '0 auto', fontFamily: 'var(--font-sans), sans-serif' }}>
                {/* Header Back & Guide Title */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px 8px 4px' }}>
                  <button 
                    onClick={() => setSelectedGuide(null)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-primary)',
                      cursor: 'pointer',
                      fontSize: '14.5px',
                      fontWeight: '750',
                      padding: '8px 0',
                      outline: 'none'
                    }}
                  >
                    <ArrowLeft size={16} strokeWidth={2.5} />
                    {lang === 'cs' ? 'Zpět' : 'Back'}
                  </button>

                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {lang === 'cs' ? 'Příručka' : 'Emergency Guide'}
                    </span>
                  </div>
                </div>

                {/* Guide content panel */}
                <div className="liquid-glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', background: 'rgba(var(--rgb-surface-sidebar), 0.4)' }}>
                  <div>
                    <h2 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                      {selectedGuide.translations?.find(tr => tr.language === lang)?.title}
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '6px', margin: 0 }}>
                      {selectedGuide.translations?.find(tr => tr.language === lang)?.shortDescription}
                    </p>
                  </div>

                  <div 
                    className="guide-markdown-content"
                    style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--text-secondary)' }}
                    dangerouslySetInnerHTML={{
                      __html: (selectedGuide.translations?.find(tr => tr.language === lang)?.content || "")
                        .replace(/\n/g, "<br/>")
                        .replace(/### (.*)/g, "<h3 style='font-size:16px;font-weight:750;color:var(--text-primary);margin-top:16px;margin-bottom:8px;'>$1</h3>")
                        .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
                    }}
                  />

                  {selectedGuide.checklistItems && selectedGuide.checklistItems.length > 0 && (
                    <div style={{ borderTop: '1px solid rgba(var(--rgb-overlay), 0.05)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
                              background: isChecked ? 'rgba(var(--color-success-rgb), 0.05)' : 'rgba(var(--rgb-scrim), 0.15)',
                              border: `1px solid ${isChecked ? 'rgba(var(--color-success-rgb), 0.3)' : 'rgba(var(--rgb-overlay), 0.06)'}`,
                              padding: '12px 14px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <div style={{
                              width: '18px',
                              height: '18px',
                              border: `1.5px solid ${isChecked ? 'var(--color-success)' : 'rgba(var(--rgb-overlay), 0.2)'}`,
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: isChecked ? 'var(--color-success)' : 'transparent'
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
              </div>
            )
          )}

          {/* Tab 3: POMOC */}
          {activeTab === 'POMOC' && (
            <div style={{ 
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
              width: '100%', 
              maxWidth: '1100px',
              margin: '0 auto',
              animation: 'fadeIn 0.4s ease-out'
            }}>
              {/* 2 Action Buttons (SOS / Volunteer) moved to the top of the HELP tab! */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', width: '100%', boxSizing: 'border-box' }}>
                {/* SOS Emergency button */}
                <button 
                  onClick={() => {
                    if (user.isGuest) setModalType('AUTH'); else setModalType('SOS');
                  }}
                  className="glass-btn-red scale-active-click"
                  style={{
                    padding: '16px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    textAlign: 'left',
                    alignItems: 'flex-start',
                    justifyContent: 'center',
                    background: 'var(--color-danger-soft, rgba(255, 69, 58, 0.08))',
                    border: '1px solid var(--color-danger-glow, rgba(255, 69, 58, 0.25))',
                    borderRadius: '12px',
                    color: 'var(--color-danger, #FF453A)',
                    cursor: 'pointer',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                >
                  <span style={{ fontSize: '15px', fontWeight: '800', letterSpacing: '0.01em' }}>SOS EMERGENCY</span>
                  <span style={{ fontSize: '10.5px', opacity: 0.85, fontWeight: '600' }}>
                    {lang === 'cs' ? 'Potřebuji pomoc' : 'I need help'}
                  </span>
                </button>

                {/* Volunteer button */}
                <button 
                  onClick={() => {
                    if (user.isGuest) setModalType('AUTH'); else setModalType('VOLUNTEER');
                  }}
                  className="glass-btn-green scale-active-click"
                  style={{
                    padding: '16px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    textAlign: 'left',
                    alignItems: 'flex-start',
                    justifyContent: 'center',
                    background: 'var(--color-success-soft, rgba(48, 209, 88, 0.08))',
                    border: '1px solid var(--color-success-glow, rgba(48, 209, 88, 0.25))',
                    borderRadius: '12px',
                    color: 'var(--color-success, #30D158)',
                    cursor: 'pointer',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                >
                  <span style={{ fontSize: '15px', fontWeight: '800', letterSpacing: '0.01em' }}>VOLUNTEER</span>
                  <span style={{ fontSize: '10.5px', opacity: 0.85, fontWeight: '600' }}>
                    {lang === 'cs' ? 'Mohu pomoci' : 'I can help'}
                  </span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setModalType('AI')}
                className="scale-active-click"
                style={{
                  width: '100%',
                  padding: '15px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  background: 'rgba(var(--color-info-rgb), 0.08)',
                  border: '1px solid rgba(var(--color-info-rgb), 0.24)',
                  borderRadius: '12px',
                  color: 'var(--color-primary)',
                  cursor: 'pointer',
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontSize: '14px',
                  fontWeight: '800',
                  letterSpacing: '0.01em'
                }}
              >
                <LifeBuoy size={17} strokeWidth={2.4} />
                {lang === 'cs' ? 'Chat s nouzovým poradcem' : 'Chat with the emergency advisor'}
              </button>

              {/* Main Help Grid */}
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column',
                gap: '32px', 
                width: '100%',
                maxWidth: '640px',
                margin: '0 auto'
              }}>
              {/* Left Column: Emergency Contacts */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <PhoneCall size={20} style={{ color: 'var(--color-primary)' }} />
                    <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-main)', fontFamily: 'var(--font-display)' }}>
                      {lang === 'cs' ? 'Důležitá nouzová čísla' : 'Important Emergency Numbers'}
                    </h2>
                  </div>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    {lang === 'cs' ? 'Kontakty a linky pomoci v případě krize a výpadku infrastruktury.' : 'Contacts and help lines in case of a crisis or infrastructure blackout.'}
                  </span>
                </div>

                {/* Card 1: HZS */}
                <div 
                  className="liquid-glass-panel help-glow-card" 
                  style={{ 
                    padding: '22px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '10px', 
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '16px',
                    boxShadow: 'var(--shadow-premium)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(var(--color-info-rgb), 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Phone size={16} style={{ color: 'var(--color-primary)' }} />
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {lang === 'cs' ? 'Informační linka HZS' : 'Fire Rescue Info Line'}
                    </span>
                  </div>
                  <span style={{ 
                    fontSize: '26px', 
                    fontWeight: '800', 
                    color: 'var(--color-primary)', 
                    fontFamily: 'var(--font-display)',
                    letterSpacing: '0.02em',
                    textShadow: '0 0 10px rgba(var(--color-info-rgb), 0.15)'
                  }}>
                    950 800 111
                  </span>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.45' }}>
                    {lang === 'cs' 
                      ? 'Informační podpora Hasičského záchranného sboru pro veřejnost při krizových stavech a blackoutu.' 
                      : 'Information support of the Fire Rescue Service for the public during crisis situations.'}
                  </span>
                </div>

                {/* Card 2: Psychological Support */}
                <div 
                  className="liquid-glass-panel help-glow-card-success" 
                  style={{ 
                    padding: '22px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '10px', 
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '16px',
                    boxShadow: 'var(--shadow-premium)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(var(--color-success-rgb), 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Heart size={16} style={{ color: 'var(--color-success)' }} />
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {lang === 'cs' ? 'Krizová psychologická pomoc' : 'Psychological Support'}
                    </span>
                  </div>
                  <span style={{ 
                    fontSize: '26px', 
                    fontWeight: '800', 
                    color: 'var(--color-success)', 
                    fontFamily: 'var(--font-display)',
                    letterSpacing: '0.02em',
                    textShadow: '0 0 10px rgba(var(--color-success-rgb), 0.15)'
                  }}>
                    116 123
                  </span>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.45' }}>
                    {lang === 'cs' 
                      ? 'Linka důvěry a psychologické pomoci v nouzi, funguje nonstop, anonymně a zdarma.' 
                      : 'Helpline and crisis mental health support, available 24/7, anonymously and for free.'}
                  </span>
                </div>

                {/* Card 3: JZS */}
                <div 
                  className="liquid-glass-panel" 
                  style={{ 
                    padding: '22px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '14px', 
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '16px',
                    boxShadow: 'var(--shadow-premium)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(var(--color-danger-rgb), 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ShieldAlert size={16} style={{ color: 'var(--color-danger)' }} />
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {lang === 'cs' ? 'Tísňové linky (Integrovaný záchranný systém)' : 'Emergency Servicess'}
                    </span>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '4px' }}>
                    {/* 112 */}
                    <div style={{
                      padding: '12px',
                      background: 'rgba(var(--rgb-overlay), 0.02)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-warning)' }} />
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>{lang === 'cs' ? 'Jednotné č.' : 'Europe'}</div>
                        <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-main)' }}>112</div>
                      </div>
                    </div>
                    {/* 150 */}
                    <div style={{
                      padding: '12px',
                      background: 'rgba(var(--rgb-overlay), 0.02)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-danger)' }} />
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>{lang === 'cs' ? 'Hasiči' : 'Fire'}</div>
                        <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-main)' }}>150</div>
                      </div>
                    </div>
                    {/* 155 */}
                    <div style={{
                      padding: '12px',
                      background: 'rgba(var(--rgb-overlay), 0.02)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-success)' }} />
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>{lang === 'cs' ? 'Záchranka' : 'Medical'}</div>
                        <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-main)' }}>155</div>
                      </div>
                    </div>
                    {/* 158 */}
                    <div style={{
                      padding: '12px',
                      background: 'rgba(var(--rgb-overlay), 0.02)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-info)' }} />
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>{lang === 'cs' ? 'Policie' : 'Police'}</div>
                        <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-main)' }}>158</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
            </div>
          )}

          {/* Tab 4: ZPRÁVY (HOME) */}
          {activeTab === 'ZPRÁVY' && (
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '640px', margin: '0 auto', fontFamily: 'var(--font-sans), sans-serif' }}>
              
              {/* Kyiv Digital Style Blue Header */}
              <div style={{
                // background: '#e00700',
                padding: '24px 20px 48px 20px',
                // color: '#FFFFFF',
                borderRadius: '0 0 24px 24px',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                // boxShadow: '0 8px 30px rgba(10, 132, 255, 0.15)',
                // margin: '-24px -16px 0 -16px',
                boxSizing: 'border-box'
              }}>
                {/* Pills bar */}
                {/*<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>*/}
                {/*  <div style={{ display: 'flex', gap: '8px' }}>*/}
                {/*    /!* Temperature Pill *!/*/}
                {/*    <div style={{*/}
                {/*      display: 'flex',*/}
                {/*      alignItems: 'center',*/}
                {/*      gap: '4px',*/}
                {/*      background: 'rgba(255, 255, 255, 0.18)',*/}
                {/*      padding: '6px 12px',*/}
                {/*      borderRadius: '20px',*/}
                {/*      fontSize: '12.5px',*/}
                {/*      fontWeight: '700',*/}
                {/*      backdropFilter: 'blur(10px)',*/}
                {/*      WebkitBackdropFilter: 'blur(10px)',*/}
                {/*      border: '1px solid rgba(255, 255, 255, 0.1)'*/}
                {/*    }}>*/}
                {/*      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">*/}
                {/*        <path d="M17.5 19A3.5 3.5 0 0 0 21 15.5c0-2.79-2.54-4.5-5-4.5-.42-1.89-1.74-3.5-3.5-3.5a5.5 5.5 0 0 0-5.5 5.5c0 .32.02.64.06.95C5.1 14.21 4 15.72 4 17.5A2.5 2.5 0 0 0 6.5 20h11" />*/}
                {/*      </svg>*/}
                {/*      <span>17°</span>*/}
                {/*    </div>*/}

                {/*    /!* AQI Pill *!/*/}
                {/*    <div style={{*/}
                {/*      display: 'flex',*/}
                {/*      alignItems: 'center',*/}
                {/*      gap: '6px',*/}
                {/*      background: 'rgba(255, 255, 255, 0.18)',*/}
                {/*      padding: '6px 12px',*/}
                {/*      borderRadius: '20px',*/}
                {/*      fontSize: '12.5px',*/}
                {/*      fontWeight: '700',*/}
                {/*      backdropFilter: 'blur(10px)',*/}
                {/*      WebkitBackdropFilter: 'blur(10px)',*/}
                {/*      border: '1px solid rgba(255, 255, 255, 0.1)'*/}
                {/*    }}>*/}
                {/*      <span>AQI 27</span>*/}
                {/*      <span style={{ */}
                {/*        width: '12px', */}
                {/*        height: '2px', */}
                {/*        background: '#30D158', */}
                {/*        borderRadius: '1px',*/}
                {/*        display: 'inline-block'*/}
                {/*      }} />*/}
                {/*    </div>*/}

                {/*    /!* Energy Pill *!/*/}
                {/*    /!*<div style={{*!/*/}
                {/*    /!*  display: 'flex',*!/*/}
                {/*    /!*  alignItems: 'center',*!/*/}
                {/*    /!*  justifyContent: 'center',*!/*/}
                {/*    /!*  background: 'rgba(255, 255, 255, 0.18)',*!/*/}
                {/*    /!*  width: '28px',*!/*/}
                {/*    /!*  height: '28px',*!/*/}
                {/*    /!*  borderRadius: '50%',*!/*/}
                {/*    /!*  backdropFilter: 'blur(10px)',*!/*/}
                {/*    /!*  WebkitBackdropFilter: 'blur(10px)',*!/*/}
                {/*    /!*  border: '1px solid rgba(255, 255, 255, 0.1)',*!/*/}
                {/*    /!*  color: '#30D158'*!/*/}
                {/*    /!*}}>*!/*/}
                {/*    /!*  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">*!/*/}
                {/*    /!*    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />*!/*/}
                {/*    /!*  </svg>*!/*/}
                {/*    /!*</div>*!/*/}
                {/*  </div>*/}

                  {/*<button */}
                  {/*  onClick={() => setModalType('SYNC')}*/}
                  {/*  style={{*/}
                  {/*    display: 'flex',*/}
                  {/*    alignItems: 'center',*/}
                  {/*    gap: '6px',*/}
                  {/*    background: 'rgba(255, 255, 255, 0.18)',*/}
                  {/*    padding: '6px 14px',*/}
                  {/*    borderRadius: '20px',*/}
                  {/*    fontSize: '12.5px',*/}
                  {/*    fontWeight: '700',*/}
                  {/*    color: '#FFFFFF',*/}
                  {/*    border: '1px solid rgba(255, 255, 255, 0.1)',*/}
                  {/*    cursor: 'pointer',*/}
                  {/*    outline: 'none',*/}
                  {/*    backdropFilter: 'blur(10px)',*/}
                  {/*    WebkitBackdropFilter: 'blur(10px)'*/}
                  {/*  }}*/}
                  {/*>*/}
                  {/*  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">*/}
                  {/*    <circle cx="11" cy="11" r="8"></circle>*/}
                  {/*    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>*/}
                  {/*  </svg>*/}
                  {/*  <span>{lang === 'cs' ? 'Status' : 'Status'}</span>*/}
                  {/*</button>*/}
                {/*</div>*/}

                {/* Greeting section */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '4px' }}>
                  <div>
                    <span style={{ fontSize: '11.5px', fontWeight: '700', opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {getFormattedDate(lang)}
                    </span>
                    <h2 style={{ fontSize: '32px', fontWeight: '800', margin: '4px 0 0 0', letterSpacing: '-0.02em', lineHeight: '1.1' }}>
                      {getGreetingText(lang).translation}
                    </h2>
                    {/*<span style={{ fontSize: '13px', fontWeight: '600', opacity: 0.8, marginTop: '2px', display: 'block' }}>*/}
                    {/*  {getGreetingText(lang).translation}*/}
                    {/*</span>*/}
                  </div>

                </div>

                {/* Horizontal scrolling menu cards */}
                <div style={{
                  display: 'flex',
                  overflowX: 'auto',
                  gap: '10px',
                  margin: '8px -20px -20px -20px',
                  padding: '4px 20px 20px 20px',
                  scrollbarWidth: 'none'
                }} className="hide-scrollbar">
                  {/* Card 1: Profile */}
                  <div 
                    onClick={() => handleTabChange('PROFIL')}
                    className="scale-active-click"
                    style={{
                      width: '120px',
                      height: '110px',
                      background: 'var(--bg-primary, #FFFFFF)',
                      border: '1px solid var(--border-subtle, rgba(0,0,0,0.06))',
                      borderRadius: '16px',
                      padding: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      flexShrink: 0,
                      cursor: 'pointer',
                      boxSizing: 'border-box',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                    }}
                  >
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '8px',
                      background: 'rgba(var(--rgb-overlay), 0.06)',
                      border: '1.5px solid var(--border-strong, rgba(0,0,0,0.1))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-primary, #000000)'
                    }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-primary, #1C1C1E)', lineHeight: '1.2' }}>
                      {lang === 'cs' ? 'Profil' : 'Profile'}
                    </span>
                  </div>

                  {/* Card 2: Become a volunteer */}
                  <div 
                    onClick={() => handleTabChange('PROFIL')}
                    className="scale-active-click"
                    style={{
                      width: '120px',
                      height: '110px',
                      background: 'var(--bg-primary, #FFFFFF)',
                      border: '1px solid var(--border-subtle, rgba(0,0,0,0.06))',
                      borderRadius: '16px',
                      padding: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      flexShrink: 0,
                      cursor: 'pointer',
                      boxSizing: 'border-box',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                    }}
                  >
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '8px',
                      background: 'rgba(var(--rgb-overlay), 0.06)',
                      border: '1.5px solid var(--border-strong, rgba(0,0,0,0.1))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-primary, #000000)'
                    }}>
                      <Heart size={15} strokeWidth={2.5} />
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-primary, #1C1C1E)', lineHeight: '1.2' }}>
                      {lang === 'cs' ? 'Stát se dobrovolníkem' : 'Become a volunteer'}
                    </span>
                  </div>

                  {/* Card 3: Other city services */}
                  <div 
                    className="scale-active-click"
                    style={{
                      width: '120px',
                      height: '110px',
                      background: 'var(--bg-primary, #FFFFFF)',
                      border: '1px solid var(--border-subtle, rgba(0,0,0,0.06))',
                      borderRadius: '16px',
                      padding: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      flexShrink: 0,
                      boxSizing: 'border-box',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                    }}
                  >
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '8px',
                      background: 'rgba(var(--rgb-overlay), 0.06)',
                      border: '1.5px solid var(--border-strong, rgba(0,0,0,0.1))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-primary, #000000)'
                    }}>
                      <Globe size={15} strokeWidth={2.5} />
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-primary, #1C1C1E)', lineHeight: '1.2' }}>
                      {lang === 'cs' ? 'Další městské služby' : 'Other city services'}
                    </span>
                  </div>

                  {/* Card 4: Digital Democracy */}
                  <div 
                    className="scale-active-click"
                    style={{
                      width: '120px',
                      height: '110px',
                      background: 'var(--bg-primary, #FFFFFF)',
                      border: '1px solid var(--border-subtle, rgba(0,0,0,0.06))',
                      borderRadius: '16px',
                      padding: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      flexShrink: 0,
                      boxSizing: 'border-box',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                    }}
                  >
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '8px',
                      background: 'rgba(var(--rgb-overlay), 0.06)',
                      border: '1.5px solid var(--border-strong, rgba(0,0,0,0.1))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-primary, #000000)'
                    }}>
                      <CheckSquare size={15} strokeWidth={2.5} />
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-primary, #1C1C1E)', lineHeight: '1.2' }}>
                      {lang === 'cs' ? 'Digitální demokracie' : 'Digital Democracy'}
                    </span>
                  </div>
                </div>
              </div>

              {/* White rounded bottom content container */}
              <div style={{
                background: 'var(--bg-primary, #FFFFFF)',
                borderRadius: '24px 24px 0 0',
                padding: '24px 16px 80px 16px',
                marginTop: '12px',
                boxShadow: '0 -6px 20px rgba(0,0,0,0.04)',
                position: 'relative',
                zIndex: 5,
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
                marginRight: '-16px',
                marginLeft: '-16px',
                boxSizing: 'border-box'
              }}>


                {/* Feed Messages List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {groupFeedMessages(feedMessages).map((section, sIdx) => (
                    <div key={sIdx} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <span style={{ fontSize: '12.5px', fontWeight: '750', color: 'var(--text-tertiary, #8E8E93)', textTransform: 'capitalize', letterSpacing: '0.03em', paddingLeft: '4px' }}>
                        {lang === 'cs' ? section.dateCs : section.dateEn}
                      </span>
                      
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        background: 'var(--bg-secondary, rgba(255,255,255,0.04))',
                        border: '1px solid var(--border-subtle, rgba(255,255,255,0.06))',
                        borderRadius: '16px',
                        overflow: 'hidden'
                      }}>
                        {section.items.map((msg, idx) => (
                          <div 
                            key={msg.id || idx}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              padding: '14px 16px',
                              borderBottom: idx === section.items.length - 1 ? 'none' : '1px solid var(--border-subtle, rgba(255,255,255,0.06))',
                              gap: '14px'
                            }}
                          >
                            {/* Circle icon on the left */}
                            <div style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: msg.type === 'alert' ? 'var(--color-danger-soft, rgba(255, 69, 58, 0.12))' : msg.type === 'supply' ? 'var(--color-success-soft, rgba(48, 209, 88, 0.12))' : 'var(--color-info-soft, rgba(10, 132, 255, 0.12))',
                              border: `1.5px solid ${msg.type === 'alert' ? 'var(--color-danger-glow, rgba(255, 69, 58, 0.2))' : msg.type === 'supply' ? 'var(--color-success-glow, rgba(48, 209, 88, 0.2))' : 'var(--color-info-glow, rgba(10, 132, 255, 0.2))'}`,
                              color: msg.type === 'alert' ? 'var(--color-danger, #FF453A)' : msg.type === 'supply' ? 'var(--color-success, #30D158)' : 'var(--color-info, #0A84FF)',
                              flexShrink: 0
                            }}>
                              {msg.type === 'alert' ? (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                  <line x1="12" y1="9" x2="12" y2="13" />
                                  <line x1="12" y1="17" x2="12.01" y2="17" />
                                </svg>
                              ) : (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              )}
                            </div>

                            {/* Middle content (dot + time + title, description) */}
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                {/* Small green/red dot */}
                                <span style={{
                                  width: '8px',
                                  height: '8px',
                                  borderRadius: '50%',
                                  background: msg.type === 'alert' ? 'var(--color-danger, #FF453A)' : 'var(--color-success, #30D158)',
                                  display: 'inline-block',
                                  flexShrink: 0
                                }} />
                                {/* Bold Time */}
                                <span style={{
                                  fontSize: '13px',
                                  fontWeight: '800',
                                  color: msg.type === 'alert' ? 'var(--color-danger, #FF453A)' : 'var(--color-success, #30D158)',
                                  letterSpacing: '0.02em',
                                  marginRight: '2px',
                                  whiteSpace: 'nowrap'
                                }}>
                                  {lang === 'cs' ? msg.timeCs.split(' • ')[0] : msg.timeEn.split(' • ')[0]}
                                </span>
                                {/* Title */}
                                <span style={{
                                  fontSize: '14.5px',
                                  fontWeight: '750',
                                  color: 'var(--text-primary, #FFFFFF)',
                                  lineHeight: '1.25'
                                }}>
                                  {lang === 'cs' ? msg.titleCs : msg.titleEn}
                                </span>
                              </div>
                              {/* Description */}
                              <span style={{
                                  fontSize: '12.5px',
                                  color: 'var(--text-secondary, #AEAEB2)',
                                  lineHeight: '1.4',
                                  fontWeight: '400'
                              }}>
                                {lang === 'cs' ? msg.descCs : msg.descEn}
                              </span>
                            </div>

                            {/* Right chevron */}
                            <div style={{ color: 'var(--text-tertiary, #8E8E93)', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                              <ChevronRight size={18} strokeWidth={2.2} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 6: CHAT */}
          {activeTab === 'CHAT' && (
            selectedContactId === null ? (
              <div style={{ display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '640px', margin: '0 auto', fontFamily: 'var(--font-sans), sans-serif' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '12.5px', fontWeight: '750', color: 'var(--text-tertiary, #8E8E93)', textTransform: 'capitalize', letterSpacing: '0.03em', paddingLeft: '4px' }}>
                    {lang === 'cs' ? 'Kontakty v nouzové síti' : 'Contacts'}
                  </span>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    background: 'var(--bg-secondary, rgba(255,255,255,0.04))',
                    border: '1px solid var(--border-subtle, rgba(255,255,255,0.06))',
                    borderRadius: '16px',
                    overflow: 'hidden'
                  }}>
                    {contacts.map((contact, idx) => (
                      <div 
                        key={contact.id}
                        onClick={() => setSelectedContactId(contact.id)}
                        className="scale-active-click"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '14px 16px',
                          borderBottom: '1px solid var(--border-subtle, rgba(255,255,255,0.06))',
                          gap: '14px',
                          cursor: 'pointer'
                        }}
                      >
                        {/* Contact Avatar */}
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: contact.avatarBg,
                          border: `1.5px solid ${contact.avatarColor}`,
                          color: contact.avatarColor,
                          fontWeight: '750',
                          fontSize: '14px',
                          flexShrink: 0
                        }}>
                          {contact.name.substring(0, 2).toUpperCase()}
                        </div>

                        {/* Middle Content */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3px', minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            {/* Bold Name */}
                            <span style={{
                              fontSize: '14.5px',
                              fontWeight: '750',
                              color: 'var(--text-primary, #FFFFFF)',
                              lineHeight: '1.25',
                              textOverflow: 'ellipsis',
                              overflow: 'hidden',
                              whiteSpace: 'nowrap'
                            }}>
                              {contact.name}
                            </span>
                            {/* Last Message Time */}
                            <span style={{
                              fontSize: '11px',
                              color: 'var(--text-tertiary, #8E8E93)',
                              marginLeft: 'auto',
                              fontWeight: '600'
                            }}>
                              {contact.lastMessageTime}
                            </span>
                          </div>

                          {/* Phone number */}
                          <span style={{
                            fontSize: '11px',
                            color: 'var(--text-tertiary, #8E8E93)',
                            fontWeight: '600',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <Phone size={10} />
                            {contact.phone}
                          </span>

                          {/* Last Message */}
                          <span style={{
                            fontSize: '12.5px',
                            color: 'var(--text-secondary, #AEAEB2)',
                            lineHeight: '1.4',
                            fontWeight: '400',
                            textOverflow: 'ellipsis',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap'
                          }}>
                            {contact.lastMessageText}
                          </span>
                        </div>

                        {/* Chevron Right */}
                        <div style={{ color: 'var(--text-tertiary, #8E8E93)', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                          <ChevronRight size={18} strokeWidth={2.2} />
                        </div>
                      </div>
                    ))}

                    {/* New Chat Button */}
                    <div 
                      onClick={() => {
                        const name = prompt(lang === 'cs' ? 'Zadejte jméno nového kontaktu:' : 'Enter name for new contact:');
                        if (name) {
                          const newContact = {
                            id: String(contacts.length + 1),
                            name: name,
                            phone: '+420 ' + Math.floor(100000000 + Math.random() * 900000000),
                            avatarColor: 'var(--color-primary)',
                            avatarBg: 'var(--color-primary-soft)',
                            lastMessageText: lang === 'cs' ? 'Nová konverzace zahájena.' : 'New conversation started.',
                            lastMessageTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                            messages: []
                          };
                          setContacts([...contacts, newContact]);
                        }
                      }}
                      className="scale-active-click"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '14px 16px',
                        borderBottom: 'none',
                        gap: '14px',
                        cursor: 'pointer'
                      }}
                    >
                      {/* Plus Avatar */}
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(var(--prague-red-rgb), 0.08)',
                        border: '1.5px solid var(--color-primary, #E10600)',
                        color: 'var(--color-primary, #E10600)',
                        fontWeight: '750',
                        fontSize: '18px',
                        flexShrink: 0
                      }}>
                        +
                      </div>

                      {/* Middle Content */}
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3px', minWidth: 0 }}>
                        <span style={{
                          fontSize: '14.5px',
                          fontWeight: '750',
                          color: 'var(--color-primary, #E10600)',
                          lineHeight: '1.25'
                        }}>
                          {lang === 'cs' ? 'Nový chat...' : 'New chat...'}
                        </span>
                        <span style={{
                          fontSize: '11px',
                          color: 'var(--text-tertiary, #8E8E93)',
                          fontWeight: '600'
                        }}>
                          {lang === 'cs' ? 'Přidat nový kontakt do mesh sítě' : 'Add new contact to the mesh network'}
                        </span>
                      </div>

                      {/* Chevron Right */}
                      <div style={{ color: 'var(--color-primary, #E10600)', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                        <Plus size={18} strokeWidth={2.5} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              (() => {
                const contact = contacts.find(c => c.id === selectedContactId);
                if (!contact) return null;
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '640px', margin: '0 auto', fontFamily: 'var(--font-sans), sans-serif' }}>
                    {/* Header Back & Contact Info */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px 8px 4px' }}>
                      <button 
                        onClick={() => setSelectedContactId(null)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: 'none',
                          border: 'none',
                          color: 'var(--color-primary)',
                          cursor: 'pointer',
                          fontSize: '14.5px',
                          fontWeight: '750',
                          padding: '8px 0',
                          outline: 'none'
                        }}
                      >
                        <ArrowLeft size={16} strokeWidth={2.5} />
                        {lang === 'cs' ? 'Zpět' : 'Back'}
                      </button>

                      <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)' }}>
                          {contact.name}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                          <Phone size={10} />
                          {contact.phone}
                        </span>
                      </div>
                    </div>

                    {/* Chat Messages and Input Card */}
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      background: 'var(--bg-secondary, rgba(255,255,255,0.04))',
                      border: '1px solid var(--border-subtle, rgba(255,255,255,0.06))',
                      borderRadius: '16px',
                      overflow: 'hidden'
                    }}>
                      {contact.messages.length === 0 ? (
                        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                          {lang === 'cs' ? 'Žádné zprávy' : 'No messages'}
                        </div>
                      ) : (
                        contact.messages.map((msg, idx) => (
                          <div 
                            key={msg.id || idx}
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              padding: '14px 16px',
                              borderBottom: idx === contact.messages.length - 1 ? 'none' : '1px solid var(--border-subtle, rgba(255,255,255,0.06))',
                              gap: '14px'
                            }}
                          >
                            {/* Avatar */}
                            <div style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: msg.isMe ? 'var(--color-info-soft, rgba(10, 132, 255, 0.12))' : contact.avatarBg,
                              border: `1.5px solid ${msg.isMe ? 'var(--color-info-glow, rgba(10, 132, 255, 0.2))' : contact.avatarColor}`,
                              color: msg.isMe ? 'var(--color-info, #0A84FF)' : contact.avatarColor,
                              fontWeight: '750',
                              fontSize: '12.5px',
                              flexShrink: 0
                            }}>
                              {msg.isMe ? 'JA' : msg.sender.substring(0, 2).toUpperCase()}
                            </div>

                            {/* Message Details */}
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                {/* Small status dot */}
                                <span style={{
                                  width: '8px',
                                  height: '8px',
                                  borderRadius: '50%',
                                  background: msg.isMe ? 'var(--color-info, #0A84FF)' : 'var(--color-success, #30D158)',
                                  display: 'inline-block',
                                  flexShrink: 0
                                }} />
                                {/* Bold Time */}
                                <span style={{
                                  fontSize: '13px',
                                  fontWeight: '800',
                                  color: msg.isMe ? 'var(--color-info, #0A84FF)' : 'var(--color-success, #30D158)',
                                  letterSpacing: '0.02em',
                                  marginRight: '2px',
                                  whiteSpace: 'nowrap'
                                }}>
                                  {msg.time}
                                </span>
                                {/* Sender */}
                                <span style={{
                                  fontSize: '14.5px',
                                  fontWeight: '750',
                                  color: 'var(--text-primary, #FFFFFF)',
                                  lineHeight: '1.25'
                                }}>
                                  {msg.isMe ? (lang === 'cs' ? 'Já' : 'Me') : msg.sender}
                                </span>
                              </div>

                              {/* Plain text content */}
                              <span style={{
                                fontSize: '12.5px',
                                color: 'var(--text-secondary, #AEAEB2)',
                                lineHeight: '1.4',
                                fontWeight: '400',
                                wordBreak: 'break-word'
                              }}>
                                {msg.text}
                              </span>
                            </div>
                          </div>
                        ))
                      )}

                      {/* Input form styled to match the container */}
                      <form 
                        onSubmit={handleSendMessage}
                        style={{
                          padding: '12px 16px',
                          borderTop: '1px solid var(--border-subtle, rgba(255,255,255,0.06))',
                          background: 'var(--bg-secondary, rgba(255,255,255,0.04))',
                          display: 'flex',
                          gap: '10px',
                          boxSizing: 'border-box'
                        }}
                      >
                        <input 
                          type="text"
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          placeholder={lang === 'cs' ? 'Napište zprávu...' : 'Type message...'}
                          style={{
                            flex: 1,
                            background: 'var(--bg-primary, #FFFFFF)',
                            border: '1px solid var(--border-subtle, rgba(255,255,255,0.06))',
                            borderRadius: '10px',
                            padding: '10px 14px',
                            color: 'var(--text-primary, #000000)',
                            fontSize: '13px',
                            outline: 'none',
                            boxSizing: 'border-box'
                          }}
                        />
                        <button 
                          type="submit"
                          disabled={!chatInput.trim()}
                          className="scale-active-click"
                          style={{
                            background: chatInput.trim() ? 'var(--color-primary, #0A84FF)' : 'var(--bg-primary, #FFFFFF)',
                            border: '1px solid var(--border-subtle, rgba(255,255,255,0.06))',
                            borderRadius: '10px',
                            padding: '0 16px',
                            color: chatInput.trim() ? '#FFFFFF' : 'var(--text-tertiary, #8E8E93)',
                            fontSize: '13px',
                            fontWeight: '750',
                            cursor: chatInput.trim() ? 'pointer' : 'not-allowed',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {lang === 'cs' ? 'Odeslat' : 'Send'}
                        </button>
                      </form>
                    </div>
                  </div>
                );
              })()
            )
          )}

          {/* Tab 5: PROFIL */}
          {activeTab === 'PROFIL' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '600px' }}>
              {user.isGuest ? (
                /* Guest Profile Card */
                <div className="liquid-glass-panel" style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '18px', textAlign: 'center', alignItems: 'center', background: 'rgba(var(--rgb-surface-sidebar), 0.4)' }}>
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
                      background: 'var(--color-info)',
                      border: 'none',
                      borderRadius: '10px',
                      color: 'var(--text-on-info)',
                      fontSize: '13px',
                      fontWeight: '750',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(var(--color-info-rgb), 0.2)',
                      marginTop: '8px'
                    }}
                  >
                    {lang === 'cs' ? 'Vytvořit profil / Přihlásit se ↗' : 'Create Profile / Log In ↗'}
                  </button>
                </div>
              ) : (
                /* Normal Registered User Profile Card */
                <>
                  <div className="liquid-glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '20px', background: 'rgba(var(--rgb-surface-sidebar), 0.4)' }}>
                    <div style={{ 
                      width: '54px', 
                      height: '54px', 
                      borderRadius: '50%', 
                      background: 'rgba(var(--color-info-rgb), 0.12)', 
                      border: '1px solid rgba(var(--color-info-rgb), 0.25)',
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      fontSize: '20px', 
                      fontWeight: '700',
                      color: 'var(--color-info)',
                      textTransform: 'uppercase'
                    }}>
                      {(user.name === "Host" ? (lang === "cs" ? "Host" : "Guest") : user.name).split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '17px', fontWeight: '750' }}>{user.name === "Host" ? (lang === "cs" ? "Host" : "Guest") : user.name}</span>
                      <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>📞 {user.phone}</span>
                        <span style={{ fontSize: '12px', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', marginTop: '2px' }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-success)' }}></span>
                          {lang === 'cs' ? 'Identifikátor ověřen offline (Mesh-ID)' : 'Identifier verified offline (Mesh-ID)'}
                        </span>
                      </span>
                    </div>
                  </div>

                  <div className="liquid-glass-panel" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(var(--rgb-surface-sidebar), 0.4)' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>
                      {lang === 'cs' ? 'Moje Skupiny & Role' : 'My Groups & Roles'}
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {user.isVolunteer && user.roles.length > 0 ? (
                        user.roles.map((role, rIdx) => (
                          <span 
                            key={rIdx} 
                            style={{ 
                              background: 'rgba(var(--color-success-rgb), 0.1)', 
                              border: '1px solid rgba(var(--color-success-rgb), 0.25)', 
                              color: 'var(--color-success)', 
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
                      <span style={{ background: 'rgba(var(--color-info-rgb), 0.1)', border: '1px solid rgba(var(--color-info-rgb), 0.25)', color: 'var(--color-info)', fontSize: '11px', fontWeight: '700', padding: '6px 12px', borderRadius: '8px' }}>
                        📍 {user.zone.split(' - ')[1] || user.zone}
                      </span>
                    </div>
                  </div>
                </>
              )}

              {!user.isGuest && (
                <button 
                  onClick={() => setUser(GUEST_USER)}
                  className="glass-btn-red scale-active-click"
                  style={{
                    padding: '12px 20px',
                    fontSize: '13px',
                    fontWeight: '750',
                    border: '1px solid rgba(var(--color-danger-rgb), 0.25)',
                    borderRadius: '10px',
                    color: 'var(--color-danger)',
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

          {/* Tab 6: SETTINGS */}
          {activeTab === 'SETTINGS' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '600px' }}>
              {/* Global Settings (address, language, GPS) */}
              <div className="liquid-glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', background: 'rgba(var(--rgb-surface-sidebar), 0.4)' }}>
                <span style={{ fontSize: '14px', fontWeight: '750', color: 'var(--text-primary)', borderBottom: '1px solid rgba(var(--rgb-overlay), 0.05)', paddingBottom: '8px' }}>
                  {t.settings}
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: "11px", color: "var(--text-tertiary)", fontWeight: "bold" }}>{t.localId}</span>
                  <code style={{ background: "rgba(var(--rgb-overlay), 0.05)", padding: "8px 12px", borderRadius: "6px", fontSize: "13px", color: "var(--color-info)", display: 'block' }}>
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
                      placeholder={t.addressPlaceholder}
                      style={{ flex: 1 }}
                    />
                    <button 
                      className="scale-active-click"
                      onClick={() => {
                        const input = document.getElementById("settingsHomeAddress") as HTMLInputElement;
                        if (input) {
                          saveHomeAddress(input.value);
                          alert(t.addressSaved);
                        }
                      }}
                      style={{
                        padding: '10px 18px',
                        background: 'var(--color-info)',
                        border: 'none',
                        borderRadius: '10px',
                        color: 'var(--text-on-info)',
                        fontSize: '13px',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      {t.save}
                    </button>
                  </div>
                  {profile?.homeLatitude && (
                    <span style={{ fontSize: "11px", color: "var(--color-success)" }}>
                      {t.coordinatesSet}{profile.homeLatitude.toFixed(4)}, {profile.homeLongitude?.toFixed(4)}
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
                        color: "var(--color-danger)",
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

                <div style={{ borderTop: "1px solid rgba(var(--rgb-overlay), 0.06)", paddingTop: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "13px", color: "white" }}>{lang === "cs" ? "Světlý / Tmavý režim" : "Light / Dark Mode"}</span>
                  <button 
                    className="scale-active-click"
                    onClick={(e) => {
                      e.preventDefault();
                      toggleTheme();
                    }} 
                    style={{
                      padding: '8px 14px',
                      background: 'rgba(var(--rgb-overlay), 0.08)',
                      border: '1px solid rgba(var(--rgb-overlay), 0.12)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    {resolvedTheme === 'light' ? (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                        </svg>
                        <span>{lang === 'cs' ? 'Tmavý' : 'Dark'}</span>
                      </>
                    ) : (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="5"/>
                          <line x1="12" y1="1" x2="12" y2="3"/>
                          <line x1="12" y1="21" x2="12" y2="23"/>
                        </svg>
                        <span>{lang === 'cs' ? 'Světlý' : 'Light'}</span>
                      </>
                    )}
                  </button>
                </div>

                <div style={{ borderTop: "1px solid rgba(var(--rgb-overlay), 0.06)", paddingTop: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "13px", color: "white" }}>{t.gpsTracking}</span>
                  <button 
                    className="scale-active-click"
                    onClick={requestLocation} 
                    disabled={locationLoading}
                    style={{
                      padding: '8px 14px',
                      background: 'rgba(var(--rgb-overlay), 0.08)',
                      border: '1px solid rgba(var(--rgb-overlay), 0.12)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Navigation size={14} />
                    {locationLoading ? t.tracking : t.useMyLocation}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* ─── MOBILE BOTTOM NAVIGATION BAR ─── */}
        <BottomNavbar activeTab={activeTab} onTabChange={handleTabChange} lang={lang} />

      </div>

      {/* ─── INTERACTIVE MODALS (APPLE STRICT UI) ─── */}
      
      {/* 1. Offline Sync Status Modal */}
      {modalType === 'SYNC' && (
        <div className="glass-modal-backdrop" onClick={closeModal}>
          <div className="glass-modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '24px' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '17px', color: 'var(--color-accent)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-accent)' }} />
              Nouzová synchronizace
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5', margin: '0 0 20px 0' }}>
              Jste v nouzovém režimu bez připojení k internetu. Aplikace udržuje krizovou databázi zpráv a mapových podkladů sdílením s ostatními telefony v bezprostřední blízkosti (Mesh Network).
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', margin: '0 0 24px 0', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: '6px' }}>
                <span style={{ color: 'var(--text-tertiary)' }}>Spojení v okolí (P2P Mesh):</span>
                <span style={{ fontWeight: '700', color: 'var(--color-success)' }}>
                  {meshStatus?.activeNodes ?? 5} aktivních uzlů
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: '6px' }}>
                <span style={{ color: 'var(--text-tertiary)' }}>Velikost offline mapy:</span>
                <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{(meshStatus?.mapSizeMb ?? 14.2).toFixed(1)} MB</span>
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
                  background: 'var(--color-info)',
                  border: 'none',
                  borderRadius: '10px',
                  color: 'var(--text-on-info)',
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
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" strokeWidth="2.2" style={{ stroke: "var(--color-success)" }}>
                  <path d="M12 22a7 7 0 0 0 7-7c0-4.3-7-13-7-13S5 10.7 5 15a7 7 0 0 0 7 7z"/>
                </svg>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-success)' }}>Odběrné místo pitné vody</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Zde je k dispozici nouzová pitná voda z cisteren nebo studní.</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" strokeWidth="2.2" style={{ stroke: "var(--color-info)" }}>
                  <path d="M19 10.5h-5.5V5h-3v5.5H5v3h5.5V19h3v-5.5H19v-3z"/>
                </svg>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-info)' }}>Záchranná stanice / Pomoc</span>
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

      {/* 3. Fullscreen Map — Apple Maps style */}
      {modalType === 'MAP_FULL' && (
        <div
          className="apple-map-modal"
          role="dialog"
          aria-modal="true"
        >
          {/* Full-bleed Leaflet */}
          <div className="apple-map-canvas">
            {typeof window !== "undefined" && MapContainer ? (
              <MapContainer
                center={[PRAGUE_CENTER.lat, PRAGUE_CENTER.lng]}
                zoom={13}
                zoomControl={false}
                style={{ width: "100%", height: "100%", zIndex: 1 }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
                  url={isLightTheme ? "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"}
                />

                <MapFlyController target={recenterTarget} />

                {homeCoords && (
                  <MarkerLayer position={[homeCoords.lat, homeCoords.lng]}>
                    <Popup>
                      <div style={{ color: "var(--text-inverse)", fontWeight: "bold" }}>🏠 {lang === 'cs' ? 'Můj domov' : 'My Home'}</div>
                    </Popup>
                  </MarkerLayer>
                )}

                {userCoords && (
                  <MarkerLayer position={[userCoords.latitude, userCoords.longitude]}>
                    <Popup>
                      <div style={{ color: "var(--text-inverse)", fontWeight: "bold" }}>📍 {lang === 'cs' ? 'Moje poloha' : 'My Location'}</div>
                    </Popup>
                  </MarkerLayer>
                )}

                {sortedMarkers.map(marker => (
                  <MarkerLayer
                    key={marker.id}
                    position={[marker.latitude, marker.longitude]}
                    icon={getCategoryLeafletIcon(marker.category as MarkerCategory, "full")}
                    eventHandlers={{
                      click: () => {
                        setSelectedMarker(marker);
                        setMapSheetState('PEEK');
                      }
                    }}
                  />
                ))}
              </MapContainer>
            ) : (
              <div className="map-placeholder">
                <h3>{lang === 'cs' ? 'Mapa není k dispozici' : 'Map unavailable'}</h3>
              </div>
            )}
          </div>

          {/* Close button — top-right */}
          <button
            type="button"
            className="apple-map-close scale-active-click"
            onClick={() => { setActiveMarker(null); setMapSheetState('PEEK'); closeModal(); handleTabChange('ZPRÁVY'); }}
            aria-label={lang === 'cs' ? 'Zavřít mapu' : 'Close map'}
          >
            <X size={18} strokeWidth={2.6} />
          </button>

          {/* Floating vertical pill — bottom-right */}
          <div className="apple-map-pill" role="group">
            <button
              type="button"
              className="apple-map-pill-btn"
              onClick={() => setModalType('LEGEND')}
              title={lang === 'cs' ? 'Vrstvy a legenda' : 'Layers & legend'}
            >
              <Layers size={20} strokeWidth={2} />
            </button>
            <div className="apple-map-pill-divider" />
            <button
              type="button"
              className="apple-map-pill-btn"
              onClick={() => {
                const target = userCoords
                  ? { lat: userCoords.latitude, lng: userCoords.longitude, zoom: 15 }
                  : homeCoords
                    ? { lat: homeCoords.lat, lng: homeCoords.lng, zoom: 15 }
                    : { lat: PRAGUE_CENTER.lat, lng: PRAGUE_CENTER.lng, zoom: 13 };
                setRecenterTarget({ ...target, key: Date.now() });
                if (!userCoords) requestLocation();
              }}
              title={lang === 'cs' ? 'Moje poloha' : 'My location'}
            >
              <Navigation size={20} strokeWidth={2} />
            </button>
          </div>

          {/* Bottom Sheet — Apple Maps style */}
          <div
            className={`apple-sheet ${mapSheetState === 'EXPANDED' ? 'expanded' : 'peek'}`}
            role="region"
            aria-label={lang === 'cs' ? 'Hledání a oblíbená' : 'Search & favorites'}
          >
            <button
              type="button"
              className="apple-sheet-handle"
              onClick={() => setMapSheetState(prev => prev === 'EXPANDED' ? 'PEEK' : 'EXPANDED')}
              aria-label={mapSheetState === 'EXPANDED'
                ? (lang === 'cs' ? 'Sbalit panel' : 'Collapse')
                : (lang === 'cs' ? 'Rozbalit panel' : 'Expand')}
            >
              <span className="apple-sheet-handle-grip" />
            </button>

            <div className="apple-sheet-scroll">
              {/* Search bar pill */}
              <div className="apple-sheet-searchbar">
                <Search size={16} strokeWidth={2.4} className="apple-sheet-searchbar-icon" />
                <input
                  type="text"
                  className="apple-sheet-searchbar-input"
                  placeholder={lang === 'cs' ? 'Hledat krizová místa…' : 'Search crisis points…'}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (e.target.value && mapSheetState !== 'EXPANDED') setMapSheetState('EXPANDED');
                  }}
                  onFocus={() => setMapSheetState('EXPANDED')}
                />
                <button
                  type="button"
                  className="apple-sheet-searchbar-mic"
                  title={lang === 'cs' ? 'Diktovat (offline)' : 'Dictate (offline)'}
                >
                  <Mic size={15} strokeWidth={2.2} />
                </button>
              </div>

              {/* Places */}
              <div className="apple-sheet-section">
                <div className="apple-sheet-section-header">
                  <span>{lang === 'cs' ? 'Místa' : 'Places'}</span>
                  <ChevronRight size={14} strokeWidth={2.4} />
                </div>
                <div className="apple-places-row">
                  {/* Home shortcut */}
                  {profile?.homeLatitude && profile?.homeLongitude ? (
                    <button
                      type="button"
                      className="apple-place-shortcut"
                      onClick={() => {
                        setRecenterTarget({ lat: profile.homeLatitude!, lng: profile.homeLongitude!, zoom: 15, key: Date.now() });
                        setMapSheetState('PEEK');
                      }}
                    >
                      <span className="apple-place-circle" style={{ background: 'var(--cat-school)' }}>
                        <Home size={22} strokeWidth={2.2} color="currentColor" />
                      </span>
                      <span className="apple-place-label">{lang === 'cs' ? 'Domov' : 'Home'}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="apple-place-shortcut"
                      onClick={() => { setActiveTab('PROFIL'); closeModal(); }}
                    >
                      <span className="apple-place-circle ghost">
                        <Home size={22} strokeWidth={2.2} />
                      </span>
                      <span className="apple-place-label apple-place-label-muted">{lang === 'cs' ? 'Domov' : 'Home'}</span>
                    </button>
                  )}

                  {/* Quick category shortcuts (curated 4 from priority order) */}
                  {(['HOSPITAL', 'PHARMACY', 'EMERGENCY_SUPPORT_POINT', 'FIRE_STATION'] as MarkerCategory[]).map(cat => {
                    const vis = CATEGORY_VISUAL[cat];
                    const isActive = selectedCategory === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        className={`apple-place-shortcut ${isActive ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedCategory(isActive ? 'ALL' : cat);
                          setMapSheetState('EXPANDED');
                        }}
                      >
                        <span className="apple-place-circle" style={{ background: vis.color }}>
                          <CategoryIcon category={cat} size={26} className="apple-place-glyph" />
                        </span>
                        <span className="apple-place-label">
                          {MARKER_CATEGORY_LABELS[lang][cat].split(' ')[0]}
                        </span>
                      </button>
                    );
                  })}

                  {/* Favorite markers */}
                  {markers
                    .filter(m => profile?.favoriteMarkerIds?.includes(m.id))
                    .slice(0, 4)
                    .map(m => {
                      const vis = CATEGORY_VISUAL[m.category as MarkerCategory] || { color: 'var(--text-tertiary)', hexColor: CATEGORY_COLORS.CITY_DISTRICT_OFFICE };
                      return (
                        <button
                          key={m.id}
                          type="button"
                          className="apple-place-shortcut"
                          onClick={() => {
                            setSelectedMarker(m);
                            setRecenterTarget({ lat: m.latitude, lng: m.longitude, zoom: 16, key: Date.now() });
                            setMapSheetState('PEEK');
                          }}
                        >
                          <span className="apple-place-circle" style={{ background: vis.color }}>
                            <Star size={18} strokeWidth={2.4} color="currentColor" fill="currentColor" />
                          </span>
                          <span className="apple-place-label">
                            {m.title.split(' ')[0]}
                          </span>
                        </button>
                      );
                    })}

                  {/* Add */}
                  <button
                    type="button"
                    className="apple-place-shortcut"
                    onClick={() => { setIsAddPlaceOpen(true); }}
                  >
                    <span className="apple-place-circle add-ghost">
                      <span style={{ color: "var(--color-info)", display: "inline-flex" }}><Plus size={22} strokeWidth={2.4} color="currentColor" /></span>
                    </span>
                    <span className="apple-place-label apple-place-label-muted">{lang === 'cs' ? 'Přidat' : 'Add'}</span>
                  </button>
                </div>
              </div>

              {/* Crisis points list (only when expanded) */}
              {mapSheetState === 'EXPANDED' && (
                <div className="apple-sheet-section">
                  <div className="apple-sheet-section-header">
                    <span>{lang === 'cs' ? 'Krizové body' : 'Crisis Points'}</span>
                    <span className="apple-sheet-count">{sortedMarkers.length}</span>
                  </div>

                  {/* Open-only filter chip */}
                  <div className="apple-sheet-filters">
                    <label className="apple-filter-chip">
                      <input
                        type="checkbox"
                        checked={isOpenOnly}
                        onChange={(e) => setIsOpenOnly(e.target.checked)}
                      />
                      <span>{lang === 'cs' ? 'Pouze otevřená' : 'Open only'}</span>
                    </label>
                    {selectedCategory !== 'ALL' && (
                      <button
                        type="button"
                        className="apple-filter-chip apple-filter-clear"
                        onClick={() => setSelectedCategory('ALL')}
                      >
                        × {MARKER_CATEGORY_LABELS[lang][selectedCategory as MarkerCategory]}
                      </button>
                    )}
                  </div>

                  <div className="apple-results-list">
                    {sortedMarkers.length === 0 ? (
                      <div className="apple-empty">
                        <Search size={22} strokeWidth={1.6} />
                        <span>{lang === 'cs' ? 'Žádné výsledky' : 'No results'}</span>
                      </div>
                    ) : (
                      sortedMarkers.map(marker => {
                        const vis = CATEGORY_VISUAL[marker.category as MarkerCategory] || { color: 'var(--text-tertiary)', hexColor: CATEGORY_COLORS.CITY_DISTRICT_OFFICE };
                        const refCoords = userCoords
                          ? { lat: userCoords.latitude, lng: userCoords.longitude }
                          : (profile?.homeLatitude && profile?.homeLongitude
                              ? { lat: profile.homeLatitude, lng: profile.homeLongitude }
                              : null);
                        const distanceKm = refCoords
                          ? getHaversineDistance(refCoords.lat, refCoords.lng, marker.latitude, marker.longitude)
                          : null;
                        return (
                          <button
                            key={marker.id}
                            type="button"
                            className="apple-result-row"
                            onClick={() => {
                              setSelectedMarker(marker);
                              setRecenterTarget({ lat: marker.latitude, lng: marker.longitude, zoom: 16, key: Date.now() });
                              setMapSheetState('PEEK');
                            }}
                          >
                            <span
                              className="apple-result-icon"
                              style={{ background: `color-mix(in srgb, ${vis.color} 18%, transparent)`, color: vis.color }}
                            >
                              <CategoryIcon category={marker.category as MarkerCategory} size={20} />
                            </span>
                            <span className="apple-result-text">
                              <span className="apple-result-title">{marker.title}</span>
                              <span className="apple-result-sub">
                                {MARKER_CATEGORY_LABELS[lang][marker.category as MarkerCategory]}
                                {marker.address ? ` • ${marker.address}` : ''}
                              </span>
                            </span>
                            {distanceKm !== null && (
                              <span className="apple-result-distance">{formatDistance(distanceKm, lang)}</span>
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. SOS Emergency Modal */}
      {modalType === 'SOS' && (
        <div className="glass-modal-backdrop" onClick={closeModal}>
          <div className="glass-modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '24px', border: '1px solid rgba(var(--color-danger-rgb), 0.3)' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '17px', color: 'var(--color-danger)', fontWeight: '700' }}>Vyslat SOS signál?</h3>
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
                  background: 'var(--color-danger)',
                  border: 'none',
                  borderRadius: '10px',
                  color: 'var(--text-primary)',
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
          <div className="glass-modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '24px', border: '1px solid rgba(var(--color-success-rgb), 0.3)' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '17px', color: 'var(--color-success)', fontWeight: '700' }}>Registrovat pomoc</h3>
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
                  background: 'rgba(var(--color-success-rgb), 0.08)',
                  border: '1px solid rgba(var(--color-success-rgb), 0.2)',
                  borderRadius: '10px',
                  color: 'var(--color-success)',
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
                  background: 'rgba(var(--color-info-rgb), 0.08)',
                  border: '1px solid rgba(var(--color-info-rgb), 0.2)',
                  borderRadius: '10px',
                  color: 'var(--color-info)',
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
                  background: 'rgba(var(--badge-info-rgb), 0.08)',
                  border: '1px solid rgba(var(--badge-info-rgb), 0.2)',
                  borderRadius: '10px',
                  color: 'var(--badge-info-fg)',
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

      {/* 6. Fullscreen Advisor Chat */}
      {modalType === 'AI' && (
        <div
          className="apple-map-modal"
          role="dialog"
          aria-modal="true"
          aria-label={lang === 'cs' ? 'Nouzový poradce' : 'Emergency advisor'}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              background: 'var(--bg-main)',
              color: 'var(--text-main)',
              padding: 'clamp(18px, 4vw, 36px)',
              boxSizing: 'border-box'
            }}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '900px',
                margin: '0 auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '18px',
                flex: 1,
                minHeight: 0
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '16px',
                  paddingRight: '52px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'rgba(var(--color-info-rgb), 0.1)',
                      color: 'var(--color-primary)',
                      border: '1px solid rgba(var(--color-info-rgb), 0.18)',
                      flexShrink: 0
                    }}
                  >
                    <LifeBuoy size={21} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <h2
                      style={{
                        margin: 0,
                        fontSize: 'clamp(20px, 3vw, 30px)',
                        fontWeight: '850',
                        color: 'var(--text-main)',
                        fontFamily: 'var(--font-display)',
                        lineHeight: 1.1
                      }}
                    >
                      {lang === 'cs' ? 'Nouzový poradce' : 'Emergency advisor'}
                    </h2>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '5px' }}>
                      <span style={{ display: 'inline-block', width: '7px', height: '7px', borderRadius: '50%', background: isOnline ? 'var(--color-success)' : 'var(--color-warning)' }} />
                      {isOnline
                        ? (lang === 'cs' ? 'Připojeno k neuronové síti' : 'Connected to neural network')
                        : (lang === 'cs' ? 'Offline režim s uloženými postupy' : 'Offline mode with saved guidance')
                      }
                    </div>
                  </div>
                </div>

                <span
                  style={{
                    fontSize: '11px',
                    color: isOnline ? 'var(--color-primary)' : 'var(--color-warning)',
                    background: isOnline ? 'rgba(var(--color-info-rgb), 0.08)' : 'rgba(var(--color-warning-rgb), 0.08)',
                    border: isOnline ? '1px solid rgba(var(--color-info-rgb), 0.15)' : '1px solid rgba(var(--color-warning-rgb), 0.15)',
                    padding: '5px 10px',
                    borderRadius: '20px',
                    fontWeight: '800',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    flexShrink: 0
                  }}
                >
                  {isOnline ? 'Active' : 'Standby'}
                </span>
              </div>

              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  padding: '18px',
                  background: 'rgba(var(--rgb-surface-elevated), 0.42)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '18px',
                  minHeight: 0
                }}
              >
                {aiMessages.map((m, i) => (
                  <div
                    key={i}
                    style={{
                      alignSelf: m.role === 'assistant' ? 'flex-start' : 'flex-end',
                      display: 'flex',
                      gap: '10px',
                      maxWidth: 'min(78%, 680px)',
                      flexDirection: m.role === 'assistant' ? 'row' : 'row-reverse'
                    }}
                  >
                    {m.role === 'assistant' && (
                      <div
                        style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '50%',
                          background: 'rgba(var(--color-info-rgb), 0.08)',
                          border: '1px solid rgba(var(--color-info-rgb), 0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          marginTop: '2px'
                        }}
                      >
                        <LifeBuoy size={14} style={{ color: 'var(--color-primary)' }} />
                      </div>
                    )}

                    <div
                      style={{
                        background: m.role === 'assistant' ? 'rgba(var(--rgb-overlay), 0.04)' : 'var(--color-primary)',
                        color: m.role === 'assistant' ? 'var(--text-main)' : 'var(--text-on-info)',
                        padding: '13px 16px',
                        borderRadius: m.role === 'assistant' ? '0 16px 16px 16px' : '16px 0 16px 16px',
                        fontSize: '13.5px',
                        lineHeight: '1.55',
                        whiteSpace: 'pre-wrap',
                        border: m.role === 'assistant' ? '1px solid rgba(var(--rgb-overlay), 0.06)' : 'none',
                        fontFamily: 'var(--font-sans)',
                        fontWeight: m.role === 'assistant' ? '400' : '550'
                      }}
                      dangerouslySetInnerHTML={{
                        __html: m.text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>").replace(/\n/g, '<br/>')
                      }}
                    />
                  </div>
                ))}
                {aiSending && (
                  <div style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', fontSize: '13px', fontStyle: 'italic', paddingLeft: '40px' }}>
                    <LifeBuoy size={14} style={{ color: 'var(--color-primary)' }} />
                    {lang === 'cs' ? 'Připravuji doporučení…' : 'Preparing guidance…'}
                  </div>
                )}
                <div ref={helpChatEndRef} />
              </div>

              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '2px', scrollbarWidth: 'none' }}>
                {[
                  { labelCs: 'Čištění vody', labelEn: 'Water', icon: <Droplet size={12} style={{ color: 'var(--color-info)' }} />, id: 'water' },
                  { labelCs: 'Bezpečné teplo', labelEn: 'Warmth', icon: <Flame size={12} style={{ color: 'var(--color-warning)' }} />, id: 'warm' },
                  { labelCs: 'Jídlo bez proudu', labelEn: 'Food Safety', icon: <Utensils size={12} style={{ color: 'var(--color-warning)' }} />, id: 'food' },
                  { labelCs: 'První pomoc', labelEn: 'First Aid', icon: <Activity size={12} style={{ color: 'var(--color-success)' }} />, id: 'aid' }
                ].map((pill) => (
                  <button
                    key={pill.id}
                    type="button"
                    className="quick-pill"
                    onClick={() => {
                      const prompts = lang === 'cs' ? {
                        water: 'Jak bezpečně vyčistit a desinfikovat vodu?',
                        warm: 'Jak bezpečně udržet teplo při výpadku topení?',
                        food: 'Jak uchovat potraviny při výpadku lednice?',
                        aid: 'Jak ošetřit zranění a poskytnout první pomoc?'
                      } : {
                        water: 'How to safely purify and disinfect water?',
                        warm: 'How to stay warm safely when heating is out?',
                        food: 'How to keep food safe when the fridge is off?',
                        aid: 'How to treat injuries and give basic first aid?'
                      };
                      setAiInput(prompts[pill.id as keyof typeof prompts]);
                    }}
                    style={{
                      padding: '8px 14px',
                      background: 'rgba(var(--rgb-overlay), 0.02)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '20px',
                      color: 'var(--text-muted)',
                      fontSize: '11px',
                      fontWeight: '650',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      outline: 'none'
                    }}
                  >
                    {pill.icon}
                    {lang === 'cs' ? pill.labelCs : pill.labelEn}
                  </button>
                ))}
              </div>

              <form
                style={{ display: 'flex', gap: '10px' }}
                onSubmit={async (e) => {
                  e.preventDefault();
                  const message = aiInput.trim();
                  if (!message || aiSending) return;
                  setAiMessages(prev => [...prev, { role: 'user', text: message }]);
                  setAiInput("");
                  setAiSending(true);
                  try {
                    const res = await fetch(`/api/ai/chat`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ message })
                    });
                    if (res.ok) {
                      const data = await res.json();
                      setAiMessages(prev => [...prev, { role: 'assistant', text: data.reply || '...' }]);
                    } else {
                      throw new Error(`Server status ${res.status}`);
                    }
                  } catch (err) {
                    const reply = getMockAiResponse(message, lang);
                    setAiMessages(prev => [...prev, {
                      role: 'assistant',
                      text: reply
                    }]);
                  } finally {
                    setAiSending(false);
                  }
                }}
              >
                <input
                  type="text"
                  placeholder={lang === 'cs' ? "Zeptejte se poradce..." : "Ask the advisor..."}
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  disabled={aiSending}
                  className="glass-input"
                  style={{
                    flex: 1,
                    minWidth: 0,
                    background: 'rgba(var(--rgb-overlay), 0.03)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '14px 16px',
                    color: 'var(--text-main)',
                    fontSize: '13.5px',
                    outline: 'none'
                  }}
                />
                <button
                  type="submit"
                  disabled={aiSending || !aiInput.trim()}
                  className="scale-active-click"
                  style={{
                    width: '48px',
                    height: '48px',
                    background: aiInput.trim() && !aiSending ? 'var(--color-primary)' : 'var(--segmented-bg)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    color: aiInput.trim() && !aiSending ? 'var(--text-on-info)' : 'var(--text-secondary)',
                    cursor: aiInput.trim() && !aiSending ? 'pointer' : 'not-allowed',
                    opacity: aiInput.trim() && !aiSending ? 1 : 0.65,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <Send size={17} strokeWidth={2.4} />
                </button>
              </form>
            </div>
          </div>

          <button
            type="button"
            className="apple-map-close scale-active-click"
            onClick={closeModal}
            aria-label={lang === 'cs' ? 'Zavřít poradce' : 'Close advisor'}
          >
            <X size={18} strokeWidth={2.6} />
          </button>
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
              lang={lang}
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
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" style={{ stroke: "var(--text-primary)" }}>
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <span style={{ fontSize: '12.5px' }}>⚡ Elektřina</span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => setReportForm({ ...reportForm, hasWater: !reportForm.hasWater })}>
                  <div className={`glass-checkbox ${reportForm.hasWater ? 'checked' : ''}`}>
                    {reportForm.hasWater && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" style={{ stroke: "var(--text-primary)" }}>
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <span style={{ fontSize: '12.5px' }}>💧 Pitná voda</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => setReportForm({ ...reportForm, hasInternet: !reportForm.hasInternet })}>
                  <div className={`glass-checkbox ${reportForm.hasInternet ? 'checked' : ''}`}>
                    {reportForm.hasInternet && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" style={{ stroke: "var(--text-primary)" }}>
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
