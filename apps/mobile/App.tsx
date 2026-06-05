import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  StatusBar,
  SafeAreaView
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Shared library imports
import {
  Marker,
  Guide,
  MarkerCategory,
  MARKER_CATEGORIES,
  MARKER_CATEGORY_LABELS,
  GUIDE_CATEGORIES,
  GUIDE_CATEGORY_LABELS,
  searchMarkers,
  sortMarkersForDisplay,
  buildGoogleDirectionsUrl,
  createAnonymousUser
} from "shared";

const API_BASE = "http://localhost:3001";
const PREFIX = "prague_resilience_mobile_";

export default function App() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"map" | "guides" | "emergency" | "settings">("map");
  const [lang, setLang] = useState<"cs" | "en">("cs");

  // Local storage profile / User
  const [mockUserId, setMockUserId] = useState<string>("");
  const [homeAddress, setHomeAddress] = useState<string>("");
  const [homeCoordinates, setHomeCoordinates] = useState<{ lat: number; lng: number } | null>(null);

  // Data
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [lastSyncText, setLastSyncText] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [isOpenOnly, setIsOpenOnly] = useState<boolean>(false);

  // Selections
  const [selectedMarker, setSelectedMarker] = useState<Marker | null>(null);
  const [selectedGuide, setSelectedGuide] = useState<Guide | null>(null);

  // Checklists
  const [checkedItems, setCheckedItems] = useState<Record<string, string[]>>({});

  // Modals
  const [isAddPlaceOpen, setIsAddPlaceOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);

  // Forms
  const [addPlaceForm, setAddPlaceForm] = useState({
    title: "",
    category: "EMERGENCY_SUPPORT_POINT" as MarkerCategory,
    address: "",
    description: "",
    latitude: "50.0755",
    longitude: "14.4378"
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

  // Offline Sync Queue
  const [offlineQueueCount, setOfflineQueueCount] = useState<number>(0);

  // Initialization
  useEffect(() => {
    initUser();
  }, []);

  const initUser = async () => {
    try {
      const storedLang = await AsyncStorage.getItem(`${PREFIX}lang`);
      if (storedLang) setLang(storedLang as "cs" | "en");

      let storedUserId = await AsyncStorage.getItem(`${PREFIX}user_id`);
      if (!storedUserId) {
        const anon = createAnonymousUser("mobile", "cs");
        storedUserId = anon.id;
        await AsyncStorage.setItem(`${PREFIX}user_id`, anon.id);
      }
      setMockUserId(storedUserId);

      const storedAddress = await AsyncStorage.getItem(`${PREFIX}home_address`);
      if (storedAddress) setHomeAddress(storedAddress);

      const storedCoords = await AsyncStorage.getItem(`${PREFIX}home_coords`);
      if (storedCoords) setHomeCoordinates(JSON.parse(storedCoords));

      // Load initial checklist progress
      const keys = await AsyncStorage.getAllKeys();
      const progressKeys = keys.filter(k => k.startsWith(`${PREFIX}checklist_`));
      const progress: Record<string, string[]> = {};
      for (const key of progressKeys) {
        const val = await AsyncStorage.getItem(key);
        const guideId = key.substring(`${PREFIX}checklist_`.length);
        if (val) progress[guideId] = JSON.parse(val);
      }
      setCheckedItems(progress);

      fetchData();
    } catch (e) {
      console.warn("AsyncStorage loading failed:", e);
    }
  };

  // Fetch data with offline fallbacks
  const fetchData = async () => {
    setLoading(true);
    let success = false;
    try {
      // Basic connectivity test
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 3000);
      const testRes = await fetch(`${API_BASE}/health`, { signal: controller.signal });
      clearTimeout(id);

      if (testRes.ok) {
        setIsOnline(true);
        const markersRes = await fetch(`${API_BASE}/markers`);
        const guidesRes = await fetch(`${API_BASE}/guides`);

        if (markersRes.ok && guidesRes.ok) {
          const markersData = await markersRes.json();
          const guidesData = await guidesRes.json();

          setMarkers(markersData);
          setGuides(guidesData);

          await AsyncStorage.setItem(`${PREFIX}markers`, JSON.stringify(markersData));
          await AsyncStorage.setItem(`${PREFIX}guides`, JSON.stringify(guidesData));
          
          const now = new Date().toLocaleTimeString();
          setLastSyncText(now);
          await AsyncStorage.setItem(`${PREFIX}last_sync`, now);
          success = true;

          // Attempt sync queue
          processOfflineQueue();
        }
      }
    } catch (e) {
      console.warn("API offline fallback triggering", e);
    }

    if (!success) {
      setIsOnline(false);
      const cachedMarkers = await AsyncStorage.getItem(`${PREFIX}markers`);
      const cachedGuides = await AsyncStorage.getItem(`${PREFIX}guides`);
      if (cachedMarkers) setMarkers(JSON.parse(cachedMarkers));
      if (cachedGuides) setGuides(JSON.parse(cachedGuides));

      const lastSync = await AsyncStorage.getItem(`${PREFIX}last_sync`);
      setLastSyncText(lastSync || "-");
    }
    
    // Read queue count
    const queueData = await AsyncStorage.getItem(`${PREFIX}queue`);
    const queue = queueData ? JSON.parse(queueData) : [];
    setOfflineQueueCount(queue.length);
    setLoading(false);
  };

  // Process offline sync queue
  const processOfflineQueue = async () => {
    try {
      const queueData = await AsyncStorage.getItem(`${PREFIX}queue`);
      if (!queueData) return;
      const queue = JSON.parse(queueData);
      if (queue.length === 0) return;

      const remaining = [];
      for (const item of queue) {
        try {
          let url = "";
          let body = item.payload;

          if (item.type === "CREATE_MARKER") {
            url = `${API_BASE}/markers`;
          } else if (item.type === "CREATE_MARKER_REPORT") {
            const { markerId, ...reportPayload } = item.payload;
            url = `${API_BASE}/markers/${markerId}/reports`;
            body = reportPayload;
          }

          const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
          });

          if (!res.ok) {
            remaining.push(item);
          }
        } catch {
          remaining.push(item);
        }
      }

      await AsyncStorage.setItem(`${PREFIX}queue`, JSON.stringify(remaining));
      setOfflineQueueCount(remaining.length);
    } catch {}
  };

  // Local actions queueing helper
  const enqueueOffline = async (type: "CREATE_MARKER" | "CREATE_MARKER_REPORT", payload: any) => {
    try {
      const queueData = await AsyncStorage.getItem(`${PREFIX}queue`);
      const queue = queueData ? JSON.parse(queueData) : [];
      queue.push({ type, payload, id: Date.now() });
      await AsyncStorage.setItem(`${PREFIX}queue`, JSON.stringify(queue));
      setOfflineQueueCount(queue.length);
    } catch {}
  };

  // Localization translator helper
  const t = (csText: string, enText: string) => {
    return lang === "cs" ? csText : enText;
  };

  // Sorting / filtering markers
  const filteredMarkers = searchMarkers(markers, {
    query: searchQuery,
    category: selectedCategory === "ALL" ? undefined : selectedCategory as MarkerCategory,
    isOpenOnly: isOpenOnly
  }, lang);

  const sortedMarkers = sortMarkersForDisplay(filteredMarkers, homeCoordinates ? { latitude: homeCoordinates.lat, longitude: homeCoordinates.lng } : null);

  // Settings handlers
  const saveHomeSettings = async (addr: string) => {
    try {
      await AsyncStorage.setItem(`${PREFIX}home_address`, addr);
      setHomeAddress(addr);

      // Simple mock geocoding if offline, OSM fetch if online
      let lat = 50.0755;
      let lng = 14.4378;

      if (isOnline && addr.trim()) {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(addr + ", Praha")}&format=json&limit=1`, {
            headers: { "User-Agent": "PragueMobileResilience/1.0" }
          });
          const data = await res.json();
          if (data && data[0]) {
            lat = parseFloat(data[0].lat);
            lng = parseFloat(data[0].lon);
          }
        } catch {}
      }

      const coords = { lat, lng };
      await AsyncStorage.setItem(`${PREFIX}home_coords`, JSON.stringify(coords));
      setHomeCoordinates(coords);
      Alert.alert(t("Nastavení", "Settings"), t("Adresa byla uložena.", "Address was successfully saved."));
    } catch {}
  };

  const deleteHomeSettings = async () => {
    await AsyncStorage.removeItem(`${PREFIX}home_address`);
    await AsyncStorage.removeItem(`${PREFIX}home_coords`);
    setHomeAddress("");
    setHomeCoordinates(null);
  };

  const changeAppLanguage = async (newLang: "cs" | "en") => {
    await AsyncStorage.setItem(`${PREFIX}lang`, newLang);
    setLang(newLang);
  };

  // Checklist toggles
  const handleToggleChecklist = async (guideId: string, itemId: string) => {
    const list = checkedItems[guideId] || [];
    let updated: string[];
    if (list.includes(itemId)) {
      updated = list.filter(id => id !== itemId);
    } else {
      updated = [...list, itemId];
    }
    setCheckedItems({ ...checkedItems, [guideId]: updated });
    await AsyncStorage.setItem(`${PREFIX}checklist_${guideId}`, JSON.stringify(updated));
  };

  // Submit Suggest Place
  const submitAddPlace = async () => {
    const payload = {
      title: addPlaceForm.title,
      category: addPlaceForm.category,
      address: addPlaceForm.address,
      description: addPlaceForm.description,
      latitude: parseFloat(addPlaceForm.latitude) || 50.0755,
      longitude: parseFloat(addPlaceForm.longitude) || 14.4378,
      submittedByLocalUserId: mockUserId
    };

    if (isOnline) {
      try {
        const res = await fetch(`${API_BASE}/markers`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          Alert.alert("Děkujeme", t("Místo odesláno ke kontrole.", "Place submitted for review."));
          setIsAddPlaceOpen(false);
          fetchData();
          return;
        }
      } catch {}
    }

    await enqueueOffline("CREATE_MARKER", payload);
    Alert.alert("Offline", t("Uloženo lokálně do fronty.", "Saved locally to sync queue."));
    setIsAddPlaceOpen(false);
  };

  // Submit status report
  const submitStatusReport = async () => {
    if (!selectedMarker) return;
    const payload = {
      markerId: selectedMarker.id,
      reportedStatus: reportForm.reportedStatus,
      hasElectricity: reportForm.hasElectricity,
      hasWater: reportForm.hasWater,
      hasInternet: reportForm.hasInternet,
      crowdLevel: reportForm.crowdLevel,
      issueType: reportForm.issueType,
      comment: reportForm.comment,
      localUserId: mockUserId
    };

    if (isOnline) {
      try {
        const res = await fetch(`${API_BASE}/markers/${selectedMarker.id}/reports`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          Alert.alert("Děkujeme", t("Hlášení bylo odesláno.", "Your report was successfully submitted."));
          setIsReportOpen(false);
          fetchData();
          return;
        }
      } catch {}
    }

    await enqueueOffline("CREATE_MARKER_REPORT", payload);
    Alert.alert("Offline", t("Hlášení uloženo offline.", "Report saved offline to sync queue."));
    setIsReportOpen(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Network banner */}
      <View style={[styles.networkBanner, { backgroundColor: isOnline ? "#10b981" : "#b91c1c" }]}>
        <Text style={styles.networkText}>
          {isOnline ? "🟢 Online" : "🔴 Offline. Zobrazujeme poslední uložená data."}
        </Text>
        <TouchableOpacity style={styles.syncBtn} onPress={fetchData}>
          <Text style={styles.syncBtnText}>🔄 {t("Aktualizovat", "Refresh")}</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Screen Contents */}
      <View style={styles.workspace}>
        {loading && <ActivityIndicator size="large" color="#38bdf8" style={{ marginVertical: 20 }} />}

        {/* TAB 1: PLACES MAP LIST */}
        {activeTab === "map" && !selectedMarker && (
          <View style={{ flex: 1 }}>
            {/* Header & filters */}
            <View style={styles.searchSection}>
              <TextInput 
                style={styles.searchInput}
                placeholder={t("Hledat místo...", "Search place or category...")}
                placeholderTextColor="#64748b"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              
              <View style={styles.tabFilters}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <TouchableOpacity 
                    style={[styles.filterTab, selectedCategory === "ALL" && styles.filterTabActive]}
                    onPress={() => setSelectedCategory("ALL")}
                  >
                    <Text style={[styles.filterTabText, selectedCategory === "ALL" && styles.filterTabTextActive]}>Vše</Text>
                  </TouchableOpacity>
                  {MARKER_CATEGORIES.map(cat => (
                    <TouchableOpacity 
                      key={cat}
                      style={[styles.filterTab, selectedCategory === cat && styles.filterTabActive]}
                      onPress={() => setSelectedCategory(cat)}
                    >
                      <Text style={[styles.filterTabText, selectedCategory === cat && styles.filterTabTextActive]}>
                        {MARKER_CATEGORY_LABELS[lang][cat]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                <TouchableOpacity onPress={() => setIsOpenOnly(!isOpenOnly)} style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text style={{ color: isOpenOnly ? "#10b981" : "#64748b", fontSize: 12 }}>
                    {isOpenOnly ? "✓ " : "◽ "}Pouze otevřená místa
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={() => setIsAddPlaceOpen(true)}
                  style={{ backgroundColor: "rgba(56, 189, 248, 0.1)", borderWidth: 1, borderColor: "rgba(56, 189, 248, 0.3)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 }}
                >
                  <Text style={{ color: "#38bdf8", fontSize: 12, fontWeight: "bold" }}>+ {t("Přidat", "Add")}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Offline map fallback notice */}
            <View style={styles.mapNotice}>
              <Text style={{ color: "#94a3b8", fontSize: 11, textAlign: "center" }}>
                🗺️ Mapa se načítá pouze online. Níže jsou zobrazena offline uložená místa.
              </Text>
            </View>

            {/* List */}
            <ScrollView style={{ flex: 1, padding: 12 }}>
              {sortedMarkers.map(m => (
                <TouchableOpacity key={m.id} style={styles.card} onPress={() => setSelectedMarker(m)}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <Text style={styles.cardTitle}>{m.title}</Text>
                    <Text style={styles.cardBadge}>{MARKER_CATEGORY_LABELS[lang][m.category]}</Text>
                  </View>
                  <Text style={styles.cardAddress}>{m.address}</Text>
                  <View style={{ flexDirection: "row", gap: 12, marginTop: 8 }}>
                    <Text style={{ fontSize: 11, color: m.hasElectricity ? "#10b981" : "#ef4444" }}>⚡ El: {m.hasElectricity ? "Ano" : "Ne"}</Text>
                    <Text style={{ fontSize: 11, color: m.hasWater ? "#10b981" : "#ef4444" }}>💧 Voda: {m.hasWater ? "Ano" : "Ne"}</Text>
                    <Text style={{ fontSize: 11, color: m.hasInternet ? "#10b981" : "#ef4444" }}>📶 Net: {m.hasInternet ? "Ano" : "Ne"}</Text>
                  </View>
                  {m.verificationStatus === "NEEDS_REVIEW" && (
                    <Text style={{ color: "#fbbf24", fontSize: 10, fontWeight: "bold", marginTop: 8 }}>⚠️ Vyžaduje ověření stavu</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Marker Detail View */}
        {selectedMarker && (
          <ScrollView style={{ flex: 1, padding: 20 }}>
            <TouchableOpacity onPress={() => setSelectedMarker(null)} style={{ marginBottom: 16 }}>
              <Text style={{ color: "#38bdf8", fontSize: 14 }}>← Zpět na seznam</Text>
            </TouchableOpacity>

            <Text style={{ color: "#a855f7", fontSize: 12, fontWeight: "bold" }}>{MARKER_CATEGORY_LABELS[lang][selectedMarker.category]}</Text>
            <Text style={{ color: "white", fontSize: 24, fontWeight: "bold", marginTop: 4 }}>{selectedMarker.title}</Text>
            <Text style={{ color: "#94a3b8", fontSize: 14, marginTop: 4 }}>📍 {selectedMarker.address}</Text>

            {selectedMarker.description && (
              <Text style={{ color: "#cbd5e1", fontSize: 13, marginVertical: 12 }}>{selectedMarker.description}</Text>
            )}

            <View style={styles.detailBox}>
              <Text style={styles.detailItem}>⚡ Elektřina: {selectedMarker.hasElectricity ? "Ano" : "Ne"}</Text>
              <Text style={styles.detailItem}>💧 Pitná voda: {selectedMarker.hasWater ? "Ano" : "Ne"}</Text>
              <Text style={styles.detailItem}>📶 Internet: {selectedMarker.hasInternet ? "Ano" : "Ne"}</Text>
              <Text style={styles.detailItem}>👥 Lidí: {selectedMarker.crowdLevel}</Text>
            </View>

            {selectedMarker.verificationStatus === "NEEDS_REVIEW" && (
              <View style={styles.warningBox}>
                <Text style={{ color: "#fbbf24", fontSize: 12 }}>⚠️ Uživatelé hlásí výpadky nebo uzavření tohoto místa. Vyžaduje prověření.</Text>
              </View>
            )}

            <View style={{ flexDirection: "row", gap: 12, marginTop: 20 }}>
              <TouchableOpacity 
                style={styles.btnPrimary}
                onPress={() => Alert.alert("Navigace", "Otevírám navigaci Google Maps...")}
              >
                <Text style={{ color: "white", fontWeight: "bold" }}>🗺️ {t("Navigovat", "Get Directions")}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.btnSecondary}
                onPress={() => setIsReportOpen(true)}
              >
                <Text style={{ color: "white" }}>⚠️ {t("Nahlásit stav", "Report status")}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}

        {/* TAB 2: GUIDES LIST */}
        {activeTab === "guides" && !selectedGuide && (
          <ScrollView style={{ flex: 1, padding: 16 }}>
            <Text style={{ color: "white", fontSize: 22, fontWeight: "bold", marginBottom: 12 }}>Nouzové návody</Text>
            {guides.map(g => {
              const trans = g.translations?.find(tr => tr.language === lang);
              return (
                <TouchableOpacity key={g.id} style={styles.card} onPress={() => setSelectedGuide(g)}>
                  <Text style={{ color: "white", fontSize: 16, fontWeight: "bold" }}>{trans?.title || g.slug}</Text>
                  <Text style={{ color: "#64748b", fontSize: 11, marginTop: 4 }}>{trans?.shortDescription}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* Guide Detail view */}
        {selectedGuide && (
          <ScrollView style={{ flex: 1, padding: 20 }}>
            <TouchableOpacity onPress={() => setSelectedGuide(null)} style={{ marginBottom: 16 }}>
              <Text style={{ color: "#38bdf8", fontSize: 14 }}>← Zpět na návody</Text>
            </TouchableOpacity>

            <Text style={{ color: "white", fontSize: 24, fontWeight: "bold" }}>
              {selectedGuide.translations?.find(tr => tr.language === lang)?.title}
            </Text>

            <Text style={{ color: "#94a3b8", fontSize: 13, marginVertical: 12 }}>
              {selectedGuide.translations?.find(tr => tr.language === lang)?.content}
            </Text>

            {/* Checklist */}
            {selectedGuide.checklistItems && selectedGuide.checklistItems.length > 0 && (
              <View style={{ marginTop: 16 }}>
                <Text style={{ color: "white", fontSize: 16, fontWeight: "bold", marginBottom: 10 }}>📋 {t("Kontrolní seznam", "Checklist")}</Text>
                {selectedGuide.checklistItems.map(item => {
                  const isChecked = (checkedItems[selectedGuide.id] || []).includes(item.id);
                  return (
                    <TouchableOpacity 
                      key={item.id} 
                      style={[styles.checkItem, isChecked && styles.checkItemChecked]}
                      onPress={() => handleToggleChecklist(selectedGuide.id, item.id)}
                    >
                      <Text style={{ color: "white", fontSize: 13 }}>
                        {isChecked ? "✅ " : "⬜ "}
                        {lang === "cs" ? item.textCs : item.textEn}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </ScrollView>
        )}

        {/* TAB 3: EMERGENCY MODE */}
        {activeTab === "emergency" && (
          <ScrollView style={{ flex: 1, padding: 20 }}>
            <Text style={{ color: "#ef4444", fontSize: 26, fontWeight: "bold" }}>🚨 Nouzový režim (Emergency)</Text>
            <Text style={{ color: "#94a3b8", fontSize: 13, marginTop: 4 }}>Rychlá krizová pomoc pro občany</Text>

            <View style={{ marginTop: 24, gap: 16 }}>
              <TouchableOpacity 
                style={styles.emergencyBtn}
                onPress={() => {
                  setSelectedCategory("EMERGENCY_SUPPORT_POINT");
                  setActiveTab("map");
                }}
              >
                <Text style={styles.emergencyBtnTitle}>🆘 Nejbližší pomoc</Text>
                <Text style={{ color: "#fda4af", fontSize: 11 }}>Nouzové body, nemocnice, pitná voda.</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.emergencyBtn, { backgroundColor: "rgba(168,85,247,0.1)", borderColor: "rgba(168,85,247,0.3)" }]}
                onPress={() => setActiveTab("guides")}
              >
                <Text style={[styles.emergencyBtnTitle, { color: "#c084fc" }]}>📖 Nouzové návody</Text>
                <Text style={{ color: "#d8b4fe", fontSize: 11 }}>Instrukce, první pomoc, chování.</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.emergencyBtn, { backgroundColor: "rgba(16,185,129,0.1)", borderColor: "rgba(16,185,129,0.3)" }]}
                onPress={() => {
                  Alert.alert("Uložená data", `Stažených míst: ${markers.length}\nNouzových návodů: ${guides.length}\nFronta k odeslání: ${offlineQueueCount}`);
                }}
              >
                <Text style={[styles.emergencyBtnTitle, { color: "#10b981" }]}>💾 Uložená offline data</Text>
                <Text style={{ color: "#a7f3d0", fontSize: 11 }}>Ověřit lokální úložiště a stav synchronizace.</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.emergencyBtn, { backgroundColor: "rgba(56,189,248,0.1)", borderColor: "rgba(56,189,248,0.3)" }]}
                onPress={() => setIsAddPlaceOpen(true)}
              >
                <Text style={[styles.emergencyBtnTitle, { color: "#38bdf8" }]}>➕ Nahlásit místo</Text>
                <Text style={{ color: "#bae6fd", fontSize: 11 }}>Navrhnout nový zdroj pomoci v Praze.</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.contactsBox}>
              <Text style={{ color: "white", fontWeight: "bold", fontSize: 14, marginBottom: 8 }}>⚠️ Tísňové linky</Text>
              <Text style={{ color: "#cbd5e1", fontSize: 12 }}>📞 Integrovaný záchranný systém: 112</Text>
              <Text style={{ color: "#cbd5e1", fontSize: 12 }}>📞 Záchranná služba: 155</Text>
              <Text style={{ color: "#cbd5e1", fontSize: 12 }}>📞 Hasiči: 150 | Policie: 158</Text>
            </View>
          </ScrollView>
        )}

        {/* TAB 4: SETTINGS */}
        {activeTab === "settings" && (
          <ScrollView style={{ flex: 1, padding: 20 }}>
            <Text style={{ color: "white", fontSize: 24, fontWeight: "bold", marginBottom: 12 }}>⚙️ Nastavení</Text>

            <View style={styles.settingsSection}>
              <Text style={{ color: "#64748b", fontSize: 11, fontWeight: "bold" }}>LOKÁLNÍ IDENTIFIKÁTOR UŽIVATELE</Text>
              <Text style={{ color: "#c084fc", fontSize: 13, backgroundColor: "rgba(255,255,255,0.05)", padding: 8, borderRadius: 6, marginVertical: 6 }}>
                {mockUserId}
              </Text>
            </View>

            <View style={styles.settingsSection}>
              <Text style={{ color: "white", fontWeight: "bold", fontSize: 14, marginBottom: 6 }}>Domácí adresa</Text>
              <TextInput 
                style={styles.searchInput}
                defaultValue={homeAddress}
                id="nativeHomeAddr"
                placeholder="Vložte adresu v Praze..."
                placeholderTextColor="#64748b"
                onSubmitEditing={(e) => saveHomeSettings(e.nativeEvent.text)}
              />
              {homeCoordinates && (
                <Text style={{ color: "#10b981", fontSize: 11, marginTop: 4 }}>✓ Souřadnice uloženy: {homeCoordinates.lat.toFixed(4)}, {homeCoordinates.lng.toFixed(4)}</Text>
              )}
              {homeAddress !== "" && (
                <TouchableOpacity onPress={deleteHomeSettings} style={{ marginTop: 8 }}>
                  <Text style={{ color: "#ef4444", fontSize: 12 }}>Smazat adresu</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.settingsSection}>
              <Text style={{ color: "white", fontWeight: "bold", fontSize: 14, marginBottom: 6 }}>Jazyk (Language)</Text>
              <View style={{ flexDirection: "row", gap: 12 }}>
                <TouchableOpacity 
                  style={[styles.btnSecondary, lang === "cs" && { backgroundColor: "rgba(56,189,248,0.2)" }]}
                  onPress={() => changeAppLanguage("cs")}
                >
                  <Text style={{ color: "white" }}>Čeština</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.btnSecondary, lang === "en" && { backgroundColor: "rgba(56,189,248,0.2)" }]}
                  onPress={() => changeAppLanguage("en")}
                >
                  <Text style={{ color: "white" }}>English</Text>
                </TouchableOpacity>
              </View>
            </View>

            {offlineQueueCount > 0 && (
              <View style={{ marginTop: 24, padding: 16, backgroundColor: "rgba(245,158,11,0.1)", borderWidth: 1, borderColor: "rgba(245,158,11,0.3)", borderRadius: 10 }}>
                <Text style={{ color: "#fbbf24", fontWeight: "bold" }}>⚠️ Čekající synchronizace</Text>
                <Text style={{ color: "#cbd5e1", fontSize: 12, marginTop: 4 }}>Ve frontě čeká {offlineQueueCount} položek na odeslání při připojení k internetu.</Text>
              </View>
            )}
          </ScrollView>
        )}
      </View>

      {/* Tab Navigation bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={[styles.tabItem, activeTab === "map" && styles.tabItemActive]} onPress={() => { setSelectedMarker(null); setActiveTab("map"); }}>
          <Text style={styles.tabIcon}>🗺️</Text>
          <Text style={styles.tabText}>{t("Mapa", "Map")}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.tabItem, activeTab === "guides" && styles.tabItemActive]} onPress={() => { setSelectedGuide(null); setActiveTab("guides"); }}>
          <Text style={styles.tabIcon}>📖</Text>
          <Text style={styles.tabText}>{t("Návody", "Guides")}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.tabItem, activeTab === "emergency" && styles.tabItemActive]} onPress={() => setActiveTab("emergency")}>
          <Text style={styles.tabIcon}>🚨</Text>
          <Text style={[styles.tabText, activeTab === "emergency" && { color: "#ef4444" }]}>{t("Nouzový", "Emergency")}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.tabItem, activeTab === "settings" && styles.tabItemActive]} onPress={() => setActiveTab("settings")}>
          <Text style={styles.tabIcon}>⚙️</Text>
          <Text style={styles.tabText}>{t("Nastavení", "Settings")}</Text>
        </TouchableOpacity>
      </View>

      {/* MODAL 1: ADD PLACE */}
      <Modal visible={isAddPlaceOpen} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modalBody}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={styles.modalTitle}>📍 {t("Přidat místo", "Add place")}</Text>
              <TouchableOpacity onPress={() => setIsAddPlaceOpen(false)}>
                <Text style={{ color: "#ef4444", fontSize: 20 }}>✕</Text>
              </TouchableOpacity>
            </View>

            <TextInput 
              style={styles.modalInput}
              placeholder="Název místa"
              placeholderTextColor="#64748b"
              onChangeText={val => setAddPlaceForm({ ...addPlaceForm, title: val })}
            />

            <TextInput 
              style={styles.modalInput}
              placeholder="Adresa"
              placeholderTextColor="#64748b"
              onChangeText={val => setAddPlaceForm({ ...addPlaceForm, address: val })}
            />

            <TextInput 
              style={styles.modalInput}
              placeholder="Popis náhradního zdroje"
              placeholderTextColor="#64748b"
              onChangeText={val => setAddPlaceForm({ ...addPlaceForm, description: val })}
            />

            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity style={styles.btnSecondary} onPress={() => setIsAddPlaceOpen(false)}>
                <Text style={{ color: "white" }}>Zrušit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnPrimary} onPress={submitAddPlace}>
                <Text style={{ color: "white", fontWeight: "bold" }}>Odeslat</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: REPORT STATUS */}
      <Modal visible={isReportOpen} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modalBody}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={styles.modalTitle}>⚠️ {t("Nahlásit stav", "Report status")}</Text>
              <TouchableOpacity onPress={() => setIsReportOpen(false)}>
                <Text style={{ color: "#ef4444", fontSize: 20 }}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={{ color: "white", fontSize: 12, marginBottom: 8 }}>Hlášení změn pro: {selectedMarker?.title}</Text>

            <TextInput 
              style={styles.modalInput}
              placeholder="Doplňující komentář..."
              placeholderTextColor="#64748b"
              onChangeText={val => setReportForm({ ...reportForm, comment: val })}
            />

            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity style={styles.btnSecondary} onPress={() => setIsReportOpen(false)}>
                <Text style={{ color: "white" }}>Zrušit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnPrimary} onPress={submitStatusReport}>
                <Text style={{ color: "white", fontWeight: "bold" }}>Odeslat</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#060913"
  },
  networkBanner: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  networkText: {
    color: "white",
    fontSize: 11,
    fontWeight: "bold"
  },
  syncBtn: {
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4
  },
  syncBtnText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold"
  },
  workspace: {
    flex: 1
  },
  tabBar: {
    height: 60,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(6,9,19,0.9)",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center"
  },
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1
  },
  tabItemActive: {
    backgroundColor: "rgba(255,255,255,0.02)"
  },
  tabIcon: {
    fontSize: 18
  },
  tabText: {
    color: "#64748b",
    fontSize: 10,
    marginTop: 2,
    fontWeight: "600"
  },
  searchSection: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)"
  },
  searchInput: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 8,
    padding: 10,
    color: "white",
    fontSize: 13
  },
  tabFilters: {
    marginTop: 8
  },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 8,
    backgroundColor: "rgba(255,255,255,0.02)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)"
  },
  filterTabActive: {
    backgroundColor: "rgba(56,189,248,0.1)",
    borderColor: "#38bdf8"
  },
  filterTabText: {
    color: "#94a3b8",
    fontSize: 11
  },
  filterTabTextActive: {
    color: "#38bdf8",
    fontWeight: "bold"
  },
  mapNotice: {
    backgroundColor: "#090e1a",
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.04)"
  },
  card: {
    backgroundColor: "rgba(13,20,38,0.7)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 16,
    borderRadius: 10,
    marginBottom: 12
  },
  cardTitle: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
    flex: 1
  },
  cardBadge: {
    fontSize: 9,
    color: "#38bdf8",
    backgroundColor: "rgba(56,189,248,0.1)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: "hidden"
  },
  cardAddress: {
    color: "#64748b",
    fontSize: 11,
    marginTop: 4
  },
  detailBox: {
    backgroundColor: "rgba(255,255,255,0.02)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 10,
    padding: 16,
    marginVertical: 12,
    gap: 8
  },
  detailItem: {
    color: "white",
    fontSize: 13
  },
  warningBox: {
    backgroundColor: "rgba(245,158,11,0.1)",
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.3)",
    padding: 12,
    borderRadius: 8
  },
  btnPrimary: {
    backgroundColor: "#38bdf8",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    alignItems: "center"
  },
  btnSecondary: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    alignItems: "center"
  },
  checkItem: {
    padding: 12,
    backgroundColor: "rgba(255,255,255,0.02)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 8,
    marginBottom: 8
  },
  checkItemChecked: {
    backgroundColor: "rgba(16,185,129,0.05)",
    borderColor: "rgba(16,185,129,0.2)"
  },
  emergencyBtn: {
    backgroundColor: "rgba(239,68,68,0.05)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.2)",
    borderRadius: 12,
    padding: 16,
    gap: 4
  },
  emergencyBtnTitle: {
    color: "#f87171",
    fontSize: 16,
    fontWeight: "bold"
  },
  contactsBox: {
    backgroundColor: "rgba(239,68,68,0.03)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.15)",
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    gap: 6
  },
  settingsSection: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
    paddingBottom: 16
  },
  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    padding: 20
  },
  modalBody: {
    backgroundColor: "#0f1424",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 20,
    gap: 16
  },
  modalTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold"
  },
  modalInput: {
    backgroundColor: "rgba(255,255,255,0.02)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 8,
    padding: 10,
    color: "white"
  }
});
