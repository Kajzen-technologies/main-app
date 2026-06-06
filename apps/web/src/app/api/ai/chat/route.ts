import { NextResponse } from "next/server";

const SYSTEM_PROMPT = `Jsi "Praha Odolná AI" – krizový asistent civilní ochrany a první pomoci pro obyvatele Prahy během výpadku proudu (blackoutu) nebo jiných mimořádných situací.

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

export async function POST(request: Request) {
  try {
    const { message } = await request.json();
    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "message is required" }, { status: 400 });
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const openrouterKey = process.env.OPENROUTER_API_KEY;

    const activeKey = anthropicKey || geminiKey || openrouterKey;
    if (!activeKey) {
      return NextResponse.json(
        { error: "No API key configured. Please set GEMINI_API_KEY, ANTHROPIC_API_KEY, or OPENROUTER_API_KEY." },
        { status: 500 }
      );
    }

    let reply = "";

    const isOpenRouterKey = (key: string) => key.startsWith("sk-or-v1-") || !!openrouterKey;
    const isAnthropicKey = (key: string) => key.startsWith("sk-") && !key.startsWith("sk-or-v1-");

    if (anthropicKey && isAnthropicKey(anthropicKey)) {
      try {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": anthropicKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-3-5-haiku-20241022",
            max_tokens: 800,
            system: SYSTEM_PROMPT,
            messages: [{ role: "user", content: message }],
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const text = data.content?.[0]?.text;
          if (text) reply = text.trim();
        } else {
          console.warn("Anthropic API returned error status:", response.status, await response.text().catch(() => ""));
        }
      } catch (error) {
        console.error("Error communicating with Anthropic API:", error);
      }
    } else if (geminiKey) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [{ parts: [{ text: message }] }],
              systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
              generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 800,
              },
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) reply = text.trim();
        } else {
          console.warn("Gemini API returned error status:", response.status, await response.text().catch(() => ""));
        }
      } catch (error) {
        console.error("Error communicating with Gemini API:", error);
      }
    } else if (openrouterKey || (activeKey && isOpenRouterKey(activeKey))) {
      try {
        const keyToUse = openrouterKey || activeKey;
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${keyToUse}`,
            "HTTP-Referer": "https://prague-resilience.vercel.app",
            "X-Title": "Prague Blackout Resilience App",
          },
          body: JSON.stringify({
            model: "anthropic/claude-3.5-haiku",
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              { role: "user", content: message },
            ],
            temperature: 0.3,
            max_tokens: 800,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const text = data.choices?.[0]?.message?.content;
          if (text) reply = text.trim();
        } else {
          console.warn("OpenRouter API returned error status:", response.status, await response.text().catch(() => ""));
        }
      } catch (error) {
        console.error("Error communicating with OpenRouter API:", error);
      }
    }

    if (!reply) {
      return NextResponse.json({ error: "Failed to generate response from AI provider." }, { status: 502 });
    }

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("API Route Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
