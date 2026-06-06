import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

// Traverse up to find the root .env first (highest priority)
const rootEnvPath = path.resolve(__dirname, "../../../.env");
const localEnvPath = path.resolve(process.cwd(), ".env");

if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
}
if (fs.existsSync(localEnvPath) && localEnvPath !== rootEnvPath) {
  dotenv.config({ path: localEnvPath });
}

console.log("========================================");
console.log(" Praha Odolná API Server Starting...");
console.log(" CWD:", process.cwd());
console.log(" Root Env loaded from:", rootEnvPath, "exists:", fs.existsSync(rootEnvPath));
console.log(" Local Env loaded from:", localEnvPath, "exists:", fs.existsSync(localEnvPath));
console.log(" ANTHROPIC_API_KEY:", process.env.ANTHROPIC_API_KEY ? `LOADED (${process.env.ANTHROPIC_API_KEY.substring(0, 12)}...)` : "NOT LOADED");
console.log(" GEMINI_API_KEY:", process.env.GEMINI_API_KEY ? `LOADED (${process.env.GEMINI_API_KEY.substring(0, 12)}...)` : "NOT LOADED");
console.log("========================================");

import { adminAuthRouter } from "./modules/admin-auth/admin-auth.controller";
import { markersRouter, adminMarkersRouter } from "./modules/markers/markers.controller";
import { reportsRouter } from "./modules/reports/reports.controller";
import { guidesRouter, adminGuidesRouter } from "./modules/guides/guides.controller";
import { analyticsRouter } from "./modules/analytics/analytics.controller";

const app = express();
const port = process.env.PORT || 3001;

// CORS configuration supporting session credentials for web and admin dashboards
app.use(
  cors({
    origin: true, // Allow all origins for the MVP development environment
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser(process.env.ADMIN_SESSION_SECRET || "change-me-session-secret"));

// Public Health Check
app.get("/health", (_req, res) => {
  return res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

import { prisma } from "./modules/database/prisma";

// In-memory store for SOS signals for MVP dashboard/logging
let sosSignals: any[] = [];

// In-memory store for local mesh/feed messages (ZPRÁVY tab)
interface FeedMessage {
  id: string;
  type: 'alert' | 'mesh' | 'supply' | 'infra' | 'info';
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
  createdAt: string;
}

const feedMessages: FeedMessage[] = [
  {
    id: 'msg_seed_1',
    type: 'alert',
    badgeLabelCs: 'NEBEZPEČÍ',
    badgeLabelEn: 'DANGER',
    badgeColor: 'var(--badge-alert-fg)',
    badgeBg: 'var(--badge-alert-bg)',
    badgeBorder: 'var(--badge-alert-border)',
    titleCs: 'Kulminace toku řeky očekávána ve 20:00',
    titleEn: 'River peak flow expected at 20:00',
    timeCs: 'Před 10 min • Městský rozhlas',
    timeEn: '10 min ago • City Radio',
    descCs: 'Hladina řeky stoupá. Evakuujte nízko položené oblasti a zabezpečte svůj majetek.',
    descEn: 'The river level is rising. Evacuate low-lying areas and secure your property.',
    createdAt: new Date().toISOString()
  },
  {
    id: 'msg_seed_2',
    type: 'mesh',
    badgeLabelCs: 'PEER-TO-PEER',
    badgeLabelEn: 'PEER-TO-PEER',
    badgeColor: 'var(--badge-mesh-fg)',
    badgeBg: 'var(--badge-mesh-bg)',
    badgeBorder: 'var(--badge-mesh-border)',
    titleCs: 'Zprovozněno nouzové Wi-Fi u radnice',
    titleEn: 'Emergency Wi-Fi activated at the town hall',
    timeCs: 'Před 45 min • Lokální mesh-nod',
    timeEn: '45 min ago • Local mesh node',
    descCs: 'Wi-Fi funguje lokálně bez internetu pro zprávy a stahování map. Připojení zdarma.',
    descEn: 'Wi-Fi works locally without internet for messaging and downloading maps. Free connection.',
    createdAt: new Date().toISOString()
  },
  {
    id: 'msg_seed_3',
    type: 'supply',
    badgeLabelCs: 'ZÁSOBOVÁNÍ',
    badgeLabelEn: 'SUPPLY',
    badgeColor: 'var(--badge-supply-fg)',
    badgeBg: 'var(--badge-supply-bg)',
    badgeBorder: 'var(--badge-supply-border)',
    titleCs: 'Výdej pitné vody u hasičské zbrojnice',
    titleEn: 'Drinking water distribution at the fire station',
    timeCs: 'Před 2 hod • Krizové centrum',
    timeEn: '2 hours ago • Crisis Center',
    descCs: 'Hasiči rozváží pitnou vodu. Množství na osobu je omezeno na 5 litrů na den.',
    descEn: 'Firefighters are distributing drinking water. Amount per person is limited to 5 liters per day.',
    createdAt: new Date().toISOString()
  },
  {
    id: 'msg_seed_4',
    type: 'infra',
    badgeLabelCs: 'OPRAVA SÍTĚ',
    badgeLabelEn: 'GRID REPAIR',
    badgeColor: 'var(--badge-infra-fg)',
    badgeBg: 'var(--badge-infra-bg)',
    badgeBorder: 'var(--badge-infra-border)',
    titleCs: 'Most v ulici Nádražní preventivně uzavřen',
    titleEn: 'Bridge on Nadrazni street closed preventatively',
    timeCs: 'Před 3 hod • Policie ČR',
    timeEn: '3 hours ago • Police CR',
    descCs: 'Statika mostu se prověřuje z důvodu vysokého průtoku. Využijte vyznačené objížďky.',
    descEn: 'Bridge structural integrity is being checked due to high water flow. Use marked detours.',
    createdAt: new Date().toISOString()
  },
  {
    id: 'msg_seed_5',
    type: 'info',
    badgeLabelCs: 'INFO KANÁL',
    badgeLabelEn: 'INFO CHANNEL',
    badgeColor: 'var(--badge-info-fg)',
    badgeBg: 'var(--badge-info-bg)',
    badgeBorder: 'var(--badge-info-border)',
    titleCs: 'Prohlášení starosty k nouzovému stavu',
    titleEn: 'Mayors statement on the state of emergency',
    timeCs: 'Před 5 hod • Městský úřad',
    timeEn: '5 hours ago • Municipal Office',
    descCs: 'Starosta vyzývá obyvatele ke klidu. Zásoby potravin v obchodech jsou dostatečné na 3 dny.',
    descEn: 'The mayor urges residents to stay calm. Food supplies in stores are sufficient for 3 days.',
    createdAt: new Date().toISOString()
  }
];

const meshStatus = {
  startedAt: new Date().toISOString(),
  activeNodes: 5,
  mapSizeMb: 14.2,
  lastReplicationAt: new Date().toISOString()
};

// Mounting modules
app.use("/admin/auth", adminAuthRouter);
app.use("/markers", markersRouter);
app.use("/markers", reportsRouter);
app.use("/guides", guidesRouter);

app.post("/emergency/sos", (req, res) => {
  const { latitude, longitude, phone, name, localUserId } = req.body;
  const newSignal = {
    id: `sos_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    latitude,
    longitude,
    phone,
    name,
    localUserId,
    createdAt: new Date().toISOString()
  };
  sosSignals.push(newSignal);
  console.log(`[SOS Signal Received] User: ${name}, Phone: ${phone}, Coords: ${latitude}, ${longitude}`);
  return res.json({ success: true, signal: newSignal });
});

app.get("/emergency/sos", (_req, res) => {
  return res.json(sosSignals);
});

app.post("/users/volunteer", async (req, res) => {
  const { name, phone, roles, zone, localUserId } = req.body;
  try {
    const user = await prisma.user.upsert({
      where: { localUserId: localUserId || "anonymous" },
      update: { name, phone },
      create: { localUserId: localUserId || "anonymous", name, phone }
    });
    console.log(`[Volunteer registered] User: ${name}, Phone: ${phone}, Roles: ${roles?.join(", ")}, Zone: ${zone}`);
    return res.json({ success: true, user });
  } catch (err: any) {
    console.error("Failed to register volunteer:", err);
    return res.status(500).json({ error: "Internal Server Error", message: err.message });
  }
});

// Public messages feed (ZPRÁVY tab)
app.get("/messages", (_req, res) => {
  return res.json(feedMessages);
});

app.post("/messages", (req, res) => {
  const {
    type,
    badgeLabelCs,
    badgeLabelEn,
    badgeColor,
    badgeBg,
    badgeBorder,
    titleCs,
    titleEn,
    timeCs,
    timeEn,
    descCs,
    descEn
  } = req.body || {};

  if (!(titleCs || titleEn) || !(descCs || descEn)) {
    return res.status(400).json({ error: "title and desc (either Cs or En) are required" });
  }

  const newMessage: FeedMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    type: (type || 'info') as FeedMessage['type'],
    badgeLabelCs: badgeLabelCs || badgeLabelEn || 'INFO KANÁL',
    badgeLabelEn: badgeLabelEn || badgeLabelCs || 'INFO CHANNEL',
    badgeColor: badgeColor || 'var(--badge-info-fg)',
    badgeBg: badgeBg || 'var(--badge-info-bg)',
    badgeBorder: badgeBorder || 'var(--badge-info-border)',
    titleCs: titleCs || titleEn || '',
    titleEn: titleEn || titleCs || '',
    timeCs: timeCs || timeEn || 'Před chvílí',
    timeEn: timeEn || timeCs || 'Just now',
    descCs: descCs || descEn || '',
    descEn: descEn || descCs || '',
    createdAt: new Date().toISOString()
  };
  feedMessages.unshift(newMessage);
  return res.json({ success: true, message: newMessage });
});

// Mesh network status (SYNC modal)
app.get("/mesh/status", (_req, res) => {
  return res.json({
    ...meshStatus,
    sosSignalsCount: sosSignals.length,
    feedMessagesCount: feedMessages.length
  });
});

// Helper function for smart mock responses when Gemini API key is not configured
function getMockAiResponse(message: string): string {
  const lower = message.toLowerCase();
  
  // Czech keywords helper
  const hasCsKeywords = (keywords: string[]) => keywords.some(k => lower.includes(k));
  
  if (hasCsKeywords(['voda', 'pit', 'čistit', 'filtrov', 'desinfik'])) {
    return `### 🚰 Nouzové zajištění pitné vody:

Pro bezpečnou konzumaci vody v krizových podmínkách dodržujte tento postup:

1. **Hrubá filtrace:** Přefiltrujte vodu přes čistou látku (ručník, tričko) nebo kávový filtr, abyste odstranili hrubé nečistoty a zákal.
2. **Dezinfekce varem:** Přefiltrovanou vodu přiveďte k varu a nechte klokotat po dobu **1 až 3 minut**. Var spolehlivě zničí většinu patogenů.
3. **Chemická dezinfekce:** Pokud nemůžete vařit, použijte tablety na čištění vody (nappr. *Katadyn Micropur*) nebo 2-3 kapky obyčejného Sava (bez vůně) na 1 litr vody a nechte **30 minut** odstát.
4. **Skladování:** Uchovávejte v čistých, uzavřených nádobách ve stínu.

*Pokud máte pochybnosti, vodu nepijte a vyhledejte krizový distribuční bod označený na mapě.*`;
  }
  
  if (hasCsKeywords(['jistič', 'proud', 'elektř', 'světlo', 'tma', 'nabít', 'baterie', 'generátor'])) {
    return `### ⚡ Bezpečnost a správa elektrických zařízení:

Během blackoutu a při obnovování sítě dodržujte tato pravidla:

1. **Odpojení spotřebičů:** Vypojte ze zásuvky citlivou elektroniku (počítače, TV). Při náběhu sítě může dojít k přepětí.
2. **Hlavní jistič:** Pokud hrozí zatopení sklepa nebo domu, okamžitě odpojte hlavní jistič! Nikdy se nedotýkejte elektroinstalace ve vlhku.
3. **Svícení:** Přednostně používejte LED svítilny nebo čelovky. **Svíčky představují obrovské riziko požáru**, nenechávejte je bez dozoru.
4. **Úspora baterie:** Na telefonu zapněte úsporný režim, snižte jas a vypněte polohové služby a mobilní data (pokud není signál).
5. **Nouzové dobíjení:** Pokud potřebujete dobít telefon, vyhledejte na mapě **Komunitní centra** nebo **Městské úřady**, které mají nouzové generátory.`;
  }

  if (hasCsKeywords(['jídlo', 'potravin', 'lednic', 'mrazák', 'zkazit', 'vařit', 'plyn'])) {
    return `### 🍏 Uchování potravin při výpadku proudu:

Jak naložit s jídlem v chladničce a mrazáku:

1. **Neotvírejte dveře:** Zavřená chladnička udrží chlad přibližně **4 hodiny**, plný mrazák až **48 hodin** (poloprázdný 24 hodin).
2. **Pořadí spotřeby:** Nejprve spotřebujte potraviny podléhající rychlé zkáze z chladničky (maso, mléčné výrobky), poté jídlo z mrazáku.
3. **Kontrola kvality:** Potraviny, které byly vystaveny teplotě nad 5 °C po dobu delší než 2 hodiny, raději vyhoďte (zejména syrové maso a ryby).
4. **Nouzové vaření:** Používejte plynové kempingové vařiče pouze v dobře větraných prostorách, aby nedošlo k otravě oxidem uhelnatým (CO).`;
  }

  if (hasCsKeywords(['teplo', 'zima', 'chlad', 'topit', 'oblečen', 'izolac'])) {
    return `### 🌡️ Ochrana před chladem a udržení tepla:

Při výpadku topení v zimních měsících postupujte takto:

1. **Izolace místnosti:** Vyberte jednu menší místnost, kde se všichni zdržíte. Utěsněte spáry pod dveřmi a okny ručníky nebo dekam.
2. **Více vrstev:** Oblečte si více tenkých vrstev oblečení (ideálně termoprádlo, vlna), které lépe izolují teplo než jedna tlustá vrstva.
3. **Společné teplo:** Tělesné teplo je nejlepší zdroj. Využijte spacáky a sdílejte prostor. Zvláštní pozornost věnujte dětem a starším osobám.
4. **Bezpečné vytápění:** Nikdy neimprovizujte s vnitřním topením pomocí plynových trub nebo grilů na dřevěné uhlí! Hrozí udušení.`;
  }

  if (hasCsKeywords(['první pomoc', 'krev', 'zranění', 'rána', 'zlomen', 'dých', 'resuscit', 'infarkt', 'nemoc', 'lék'])) {
    return `### 🩺 Základní krizová první pomoc:

Při úrazech nebo náhlém zhoršení stavu:

1. **Záchranná služba (155 / 112):** Pokud funguje telefonní síť, okamžitě volejte. Pokud ne, vyšlete někoho k nejbližší hasičské stanici či policejní služebně.
2. **Masivní krvácení:** Tlačte přímo na ránu (ideálně přes sterilní obvaz nebo čistou látku). Končetinu držte nad úrovní srdce.
3. **Bezvědomí a resuscitace:** Pokud postižený nedýchá, zahajte resuscitaci: **30 stlačení hrudníku** (frekvence 100-120/min) a **2 vdechy** (pokud jste proškoleni, jinak pouze stlačujte).
4. **Léky:** Udržujte si zásobu životně důležitých léků alespoň na 14 dní. Záchranné body na mapě mohou poskytnout nouzovou distribuci.`;
  }

  if (hasCsKeywords(['evakuac', 'středisk', 'kam jít', 'kryt', 'přístřeš'])) {
    return `### 🏃 Evakuace a nouzové úkryty v Praze:

Pokud je nařízena evakuace nebo musíte opustit domov:

1. **Evakuační zavazadlo:** Sbalte si doklady, peníze, léky, náhradní oblečení, hygienické potřeby, vodu na 3 dny, trvanlivé jídlo a svítilnu.
2. **Zabezpečení domova:** Před odchodem vypněte plyn, elektřinu (hlavní jistič) a vodu. Zamkněte dveře.
3. **Kam se hlásit:** Sledujte pokyny Policie ČR a HZS. Na mapě vyhledejte **Evakuační support pointy** a **Komunitní centra**, kde získáte přístřeší a jídlo.
4. **Informace:** Poslouchejte nouzové vysílání Českého rozhlasu na vlnách FM (frekvence 91.3 MHz pro Prahu).`;
  }

  if (hasCsKeywords(['sos', 'pomoc', 'hasiči', 'polic', 'sanitka', 'zachránit'])) {
    return `### 🚨 Urgentní pomoc a SOS signály:

Pokud potřebujete akutní pomoc a standardní linky nefungují:

1. **Nouzový SOS signál:** V naší aplikaci stiskněte tlačítko **SOS** na hlavní obrazovce. Signál bude odeslán přes mesh síť.
2. **Fyzická pomoc:** Přesuňte se k nejbližšímu aktivnímu bodu na mapě:
   - **Hasičská stanice (HZS):** Vždy obsazena profesionály s nezávislým spojením a agregáty.
   - **Emergency Support Point:** Nouzová krizová místa zřízená magistrátem Prahy.
3. **Místní hlídky:** Vyhledejte policejní vozy nebo dobrovolníky s vysílačkami (označené reflexní vestou).`;
  }

  // English keywords helper
  const hasEnKeywords = (keywords: string[]) => keywords.some(k => lower.includes(k));

  if (hasEnKeywords(['water', 'drink', 'purify', 'filtr', 'disinfect'])) {
    return `### 🚰 Emergency Water Purification:

To ensure your water is safe to drink during a crisis:

1. **Coarse Filtration:** Filter water through a clean cloth (towel, t-shirt) or coffee filter to remove sediment.
2. **Boiling:** Bring the filtered water to a rolling boil and keep it boiling for **1 to 3 minutes**. This kills most pathogens.
3. **Chemical Treatment:** If boiling is not possible, use water purification tablets or add 2-3 drops of unscented household bleach per liter and let it sit for **30 minutes**.
4. **Storage:** Keep the clean water in sealed containers in a cool, dark place.

*If you are unsure about water safety, look for emergency distribution points on the crisis map.*`;
  }

  if (hasEnKeywords(['power', 'electr', 'breaker', 'charge', 'battery', 'generator', 'light', 'dark'])) {
    return `### ⚡ Electrical Safety & Power Outages:

Follow these rules during a blackout:

1. **Unplug Electronics:** Disconnect computers, TVs, and other sensitive electronics to protect them from power surges when power is restored.
2. **Main Breaker:** If flooding is imminent, turn off your home's main electrical breaker immediately. Never touch electrical systems in wet conditions.
3. **Lighting:** Use LED flashlights or headlamps. **Avoid candles due to the high risk of fire**.
4. **Save Battery:** Put your phone in power-saving mode, lower the brightness, and disable mobile data and location services if there is no signal.
5. **Recharging:** Look for **Community Centers** or municipal offices equipped with emergency generators on our map.`;
  }

  if (hasEnKeywords(['food', 'fridge', 'freeze', 'spoil', 'cook'])) {
    return `### 🍏 Food Safety During Blackouts:

How to handle refrigerated and frozen food:

1. **Keep Doors Closed:** A closed refrigerator keeps food cold for about **4 hours**. A full freezer lasts **48 hours** (24 hours if half full).
2. **Use Priority:** Consume perishable items from the fridge first (meat, dairy), then move to frozen foods.
3. **Discard if unsafe:** Discard perishable food exposed to temperatures above 5°C (40°F) for more than 2 hours (especially meat, fish, and soft cheeses).
4. **Safe Cooking:** Only use camping stoves outdoors or in extremely well-ventilated areas to prevent carbon monoxide poisoning.`;
  }

  if (hasEnKeywords(['first aid', 'blood', 'injur', 'wound', 'breath', 'cpr', 'med', 'heart'])) {
    return `### 🩺 Emergency First Aid:

Basic steps in case of medical issues:

1. **Emergency Services (112 / 155):** Call immediately if phones work. If they do not, send someone to the nearest Fire or Police station.
2. **Severe Bleeding:** Apply direct pressure to the wound with a clean cloth or bandage. Keep the limb elevated.
3. **Unconsciousness & CPR:** If the person is not breathing, start CPR: **30 chest compressions** (100-120 per minute) followed by **2 rescue breaths** (if trained).
4. **Medications:** Maintain a 14-day supply of essential medicines. Distribution points on our map may provide emergency medicine.`;
  }

  if (hasEnKeywords(['evacuat', 'shelter', 'where to go', 'camp'])) {
    return `### 🏃 Evacuation and Emergency Shelters in Prague:

If you are ordered to evacuate:

1. **Evacuation Bag:** Pack ID documents, cash, medicines, spare clothes, hygiene items, water for 3 days, non-perishable food, and a flashlight.
2. **Secure Your Home:** Turn off gas, water, and the main electricity breaker before leaving. Lock all doors.
3. **Where to report:** Follow instructions from police and rescue services. Look for **Emergency Support Points** or **Community Centers** on our map.
4. **Stay Informed:** Listen to emergency broadcasts on FM radio (91.3 MHz for Prague).`;
  }

  // General default response (bilingual menu)
  return `### 🤖 Krizový AI Rádce / Emergency AI Advisor

Jsem offline poradce pro civilní ochranu a první pomoc v Praze. Zeptejte se mě na konkrétní nouzové téma:

*   **Pitná voda / Water:** Filtrování, dezinfekce, krizové zásobování.
*   **Elektřina & Jističe / Power & Breakers:** Bezpečné zacházení, úspora baterie.
*   **Potraviny / Food safety:** Výpadek lednice, co vyhodit, nouzové vaření.
*   **Ochrana před chladem / Keeping warm:** Teplo bez topení, izolace.
*   **První pomoc / First Aid:** Krvácení, bezvědomí, léky.
*   **Evakuace & SOS / Evacuation & Urgent Help:** Evakuační zavazadlo, krizové body.

*V případě ohrožení života volejte tísňovou linku **112**.*`;
}

// Offline/Online AI advisor endpoint
app.post("/ai/chat", async (req, res) => {
  const { message } = req.body || {};
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: "message is required" });
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  let reply = '';

  const systemPrompt = `Jsi "Praha Odolná AI" – krizový asistent civilní ochrany a první pomoci pro obyvatele Prahy během výpadku proudu (blackoutu) nebo jiných mimořádných situací.

Tvé chování a tón:
- Mluv česky (případně anglicky, pokud se uživatel zeptá anglicky).
- Buď klidný, věcný, praktický, srozumitelný a ujišťující. Uživatelé mohou být pod stresem.
- Formátuj odpovědi přehledně pomocí odrážek (checklists) a tučného textu, aby se daly snadno číst na mobilu za špatného světla. Odpovědi piš stručně a k věci.

Odpovědi přizpůsob těmto okruhům civilní ochrany:
1. Pitná voda a jídlo: Jak filtrovat a dezinfikovat vodu svépomocí (vaření 1-3 minuty, filtrace přes látku), jak uchovat potraviny v chladu a které vyhodit při výpadku lednice.
2. Energie a teplo: Bezpečnost při zacházení s jističi (odpojit před zaplavením/obnovením), svíčky vs. svítilny (nebezpečí požáru), jak udržet teplo (více vrstev, izolace oken).
3. Komunikace a nouzové body: SOS signály, vyhledání nejbližšího Krizového bodu (emergency support point) na naší mapě, poslech rozhlasu na baterie.
4. První pomoc: Základní stabilizace, resuscitace, ošetření ran.

DŮLEŽITÉ:
- Pokud hrozí bezprostřední nebezpečí života, důrazně doporuč volat tísňové linky: 112 (Jednotné evropské číslo), 150 (Hasiči), 155 (Záchranná služba), 158 (Policie).
- Pokud se dotaz netýká bezpečnosti, přežití nebo blackoutu, zdvořile uživatele nasměruj zpět k tématům krizové připravenosti.`;

  // Determine key to use and routing logic
  const activeKey = anthropicKey || geminiKey;
  const isOpenRouterKey = (key?: string) => key && key.startsWith('sk-or-v1-');
  const isAnthropicKey = (key?: string) => key && key.startsWith('sk-') && !key.startsWith('sk-or-v1-');

  if (isOpenRouterKey(activeKey)) {
    try {
      const openRouterRes = await (global as any).fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${activeKey}`,
            "HTTP-Referer": "http://localhost:12360",
            "X-Title": "Prague Blackout Resilience App"
          },
          body: JSON.stringify({
            model: "anthropic/claude-3.5-haiku",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: message }
            ],
            temperature: 0.3,
            max_tokens: 800
          })
        }
      );

      if (openRouterRes.ok) {
        const data = await openRouterRes.json();
        const text = data.choices?.[0]?.message?.content;
        if (text) {
          reply = text.trim();
        }
      } else {
        console.warn("OpenRouter API returned error status:", openRouterRes.status, await openRouterRes.text().catch(() => ""));
      }
    } catch (error) {
      console.error("Error communicating with OpenRouter API:", error);
    }
  } else if (isAnthropicKey(activeKey)) {
    try {
      const anthropicRes = await (global as any).fetch(
        "https://api.anthropic.com/v1/messages",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": activeKey,
            "anthropic-version": "2023-06-01"
          },
          body: JSON.stringify({
            model: "claude-3-5-haiku-20241022",
            max_tokens: 800,
            system: systemPrompt,
            messages: [{ role: "user", content: message }]
          })
        }
      );

      if (anthropicRes.ok) {
        const data = await anthropicRes.json();
        const text = data.content?.[0]?.text;
        if (text) {
          reply = text.trim();
        }
      } else {
        console.warn("Anthropic API returned error status:", anthropicRes.status, await anthropicRes.text().catch(() => ""));
      }
    } catch (error) {
      console.error("Error communicating with Anthropic API:", error);
    }
  } else if (geminiKey && geminiKey !== "replace-with-your-key") {
    try {
      const geminiRes = await (global as any).fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: message }] }],
            systemInstruction: { parts: [{ text: systemPrompt }] },
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 800,
            }
          }),
        }
      );

      if (geminiRes.ok) {
        const data = await geminiRes.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          reply = text.trim();
        }
      } else {
        console.warn("Gemini API returned error status:", geminiRes.status);
      }
    } catch (error) {
      console.error("Error communicating with Gemini API:", error);
    }
  }

  // Fallback if API key is missing or call failed
  if (!reply) {
    reply = getMockAiResponse(message);
  }

  return res.json({
    success: true,
    reply,
    timestamp: new Date().toISOString()
  });
});

app.use("/admin/markers", adminMarkersRouter);
app.use("/admin/guides", adminGuidesRouter);
app.use("/admin/analytics", analyticsRouter);

// 404 Route handler
app.use((_req, res) => {
  res.status(404).json({ error: "Not Found" });
});

// Error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Unhandled API error:", err);
  return res.status(500).json({ error: "Internal Server Error", message: err.message });
});

app.listen(port, () => {
  console.log(`Prague Blackout Resilience API listening at http://localhost:${port}`);
});
