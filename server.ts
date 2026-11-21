import "dotenv/config";
import express from "express";
import { createServer as createHttpServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in environment secrets.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

function withTimeout<T>(promise: Promise<T>, ms: number, errorMessage: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(errorMessage)), ms);
    promise
      .then((val) => {
        clearTimeout(timer);
        resolve(val);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

const COMPASS_MENTOR_SYSTEM_INSTRUCTION = `Сен — «Қаржы Компас: Банк, Есеп және 1С» платформасының кәсіби AI-тәлімгері, бас бухгалтер (1С сарапшысы) және банктік аналитигісің.

БАСТЫ ТАЛАП — ҚЫСҚА ЖӘНЕ НАҚТЫ ЖАУАП (су мен ұзақ кіріспе жоқ):
- Қазақ тілінің барлық әріптерін (ә, і, ң, ғ, ү, ұ, қ, ө, һ) сауатты қолдан.
- shortAnswer өрісі: МАКСИМУМ 1–2 қысқа сөйлем (180 таңбаға дейін)! Кіріспе сөзсіз, бірден негізгі қорытынды мен нақты цифр/пайызды жаз.
- keyMetricLabel, keyMetricValue және exampleCalculation: негізгі цифр мен есепті өте қысқа бер (мысалы: «25 000 ₸ × 12 = 322 000 ₸»).
- Барлық толық түсіндірмені, аналогияны, формуланы (formulaLabel), 1С проводкасын (journalEntry) және қадамдарды (stepByStep) бөлек өрістерге сал — олар интерфейсте «Толығырақ» батырмасының астында ашылады.
- Егер сұрақ салыстыру, банк таңдау, қарыз стратегиясы (Көшкін vs Қар кесегі), «0% бөліп төлеу» vs жеңілдік, несие vs депозит, грейс-кезең немесе «қайсысы тиімді?» туралы болса — МІНДЕТТІ түрде comparison объектісін қысқа цифрлармен толтыр.

Сенің 3 сараптама бағытың:
1. ЖЕКЕ ҚАРЖЫ ЖӘНЕ АНТИ-ҚАРЫЗ:
   - Аз табыспен жинау (5–10% табыс түскен күні депозитке, 1→6 айлық жастық).
   - Қарыздан шығу: Көшкін (жоғары % бірінші) vs Қар кесегі (ұсақ қарыз бірінші).
   - Маркетинг тұзақтары: «0% бөліп төлеу» жасырын үстемесі, несие картасынан ақша шешу комиссиясы, инфляция (Фишер формуласы), 72 ережесі.
2. ҚАЗАҚСТАН ЖӘНЕ ӘЛЕМ БАНКТЕРІ + БИЗНЕС:
   - Kaspi, Halyk, Forte, BCC, Freedom, Bereke, Отбасы банк және Wise, Revolut, Chase, HSBC: РКО, SWIFT/SEPA, эквайринг (1022/1030/7210), овердрафт, несие картасы (грейс 50–55 күн, ТПМ/ГЭСВ), депозит, кепілдік.
3. 1С:БУХГАЛТЕРИЯ ЖӘНЕ ҚР ЕСЕПТІЛІГІ:
   - Дебет = «қайда келді / не өсті», Кредит = «қайдан шықты / не азайды».
   - Негізгі құжаттар мен проводкалар: Поступление (Дт 1330/1420 Кт 3310), Реализация (Дт 1210 Кт 6010 + Дт 7010 Кт 1330), ПКО/РКО (1010), Выписка (1030), Аванс (1251→7210), Зарплата (7210/3350, ЖТС 3120, МЗЖ 3220, ӘА/ӘС 3150/3210), Закрытие месяца (→ 5610), ЭШФ, СНТ, ФНО (100/200/300/910), АСВ, Баланс, ОПиУ, ДДС.

JSON өрістері:
- shortAnswer: Тек 1–2 қысқа сөйлем — тікелей жауап + нақты цифр/қорытынды (су жоқ!).
- explanation: Толық түсіндірме мен өмірлік мысал (2–3 сөйлем, «Толығырақ» ішіне).
- stepByStep: Нақты 3 қысқа қадам («Толығырақ» ішіне).
- guidingQuestion: Тақырыпты бекітуге арналған 1 сұрақ («Толығырақ» ішіне).
- guidingHint: Сұрақтың қысқа кілті.
- sceneDescription: 1 сөйлемдік схема сипаттамасы.
- sfxType: 'coin' | 'water' | 'bricks' | 'harvest' | 'worm_shield' | 'travel'
- expertSummary: Басты тәжірибелік түйін (1 сөйлем).
- visualType: 'literacy' | 'balance' | 'opiu' | 'dds' | 'osv_1c' | 'banking'
- journalEntry: Нақты Дт/Кт проводкасы немесе қаржы формуласы.
- doc1C: Сәйкес 1С құжаты / есеп немесе банк өнімі.
- formulaLabel: Формула немесе тексеру ережесі.
- exampleCalculation: Нақты цифрмен қысқа есеп (₸/$).
- keyMetricLabel: Негізгі көрсеткіш атауы.
- keyMetricValue: Негізгі цифр/мән.
- comparison: (Салыстыру/тиімділік сұрақтарында міндетті) { title, winnerLabel, verdict, options: [{ name, costOrReturn, netBenefit, pros, cons, isWinner }] }.`;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "15mb" }));

  // Health endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  // Redirect /manifest.webmanifest to /manifest.json
  app.get("/manifest.webmanifest", (_req, res) => {
    res.redirect(302, "/manifest.json");
  });

  // Ask Financial Compass AI Mentor endpoint (Fast + Non-Hanging)
  app.post("/api/ask-compass", async (req, res) => {
    try {
      const { question, history = [], contextTopic } = req.body as {
        question?: string;
        history?: Array<{ role: "user" | "model"; text: string }>;
        contextTopic?: string;
      };

      if (!question || !question.trim()) {
        res.status(400).json({ error: "Сұрақ мәтіні бос болмауы тиіс." });
        return;
      }

      const ai = getAiClient();

      const recentHistory = history
        .slice(-3)
        .map((h) => `${h.role === "user" ? "Оқушы" : "Тәлімгер"}: ${h.text.slice(0, 320)}`)
        .join("\n");

      const promptParts = [
        contextTopic ? `Ағымдағы тақырып контексті: ${contextTopic}` : "",
        recentHistory ? `Алдыңғы диалог:\n${recentHistory}` : "",
        `Оқушының сұрағы немесе жауабы (қысқа, нақты және қарапайым тілде жауап бер): ${question.trim()}`,
      ]
        .filter(Boolean)
        .join("\n\n");

      const responseSchemaConfig = {
        type: Type.OBJECT,
        properties: {
          shortAnswer: { type: Type.STRING },
          explanation: { type: Type.STRING },
          stepByStep: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          guidingQuestion: { type: Type.STRING },
          guidingHint: { type: Type.STRING },
          sceneDescription: { type: Type.STRING },
          sfxType: {
            type: Type.STRING,
            enum: ["coin", "water", "bricks", "harvest", "worm_shield", "travel"],
          },
          expertSummary: { type: Type.STRING },
          visualType: {
            type: Type.STRING,
            enum: ["literacy", "balance", "opiu", "dds", "osv_1c", "banking"],
          },
          journalEntry: { type: Type.STRING },
          doc1C: { type: Type.STRING },
          formulaLabel: { type: Type.STRING },
          exampleCalculation: { type: Type.STRING },
          keyMetricLabel: { type: Type.STRING },
          keyMetricValue: { type: Type.STRING },
          comparison: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              winnerLabel: { type: Type.STRING },
              verdict: { type: Type.STRING },
              options: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    costOrReturn: { type: Type.STRING },
                    netBenefit: { type: Type.STRING },
                    pros: { type: Type.STRING },
                    cons: { type: Type.STRING },
                    isWinner: { type: Type.BOOLEAN },
                  },
                  required: ["name", "costOrReturn", "netBenefit", "pros", "cons"],
                },
              },
            },
            required: ["title", "winnerLabel", "verdict", "options"],
          },
        },
        required: [
          "shortAnswer",
          "explanation",
          "stepByStep",
          "guidingQuestion",
          "expertSummary",
          "visualType",
          "keyMetricLabel",
          "keyMetricValue",
        ],
      };

      const callModel = async (
        modelName: string,
        thinkingLevel: ThinkingLevel,
        timeoutMs: number
      ) => {
        return withTimeout(
          ai.models.generateContent({
            model: modelName,
            contents: promptParts,
            config: {
              thinkingConfig: { thinkingLevel },
              systemInstruction: COMPASS_MENTOR_SYSTEM_INSTRUCTION,
              responseMimeType: "application/json",
              responseSchema: responseSchemaConfig,
            },
          }),
          timeoutMs,
          `TIMEOUT_${modelName}`
        );
      };

      const isTransientError = (err: unknown) => {
        const errText = err instanceof Error ? err.message : String(err);
        return (
          errText.includes("TIMEOUT_") ||
          errText.includes("503") ||
          errText.includes("UNAVAILABLE") ||
          errText.includes("429") ||
          errText.includes("RESOURCE_EXHAUSTED")
        );
      };

      let response;
      try {
        response = await callModel("gemini-3.1-flash-lite", ThinkingLevel.MINIMAL, 10000);
      } catch (primaryErr) {
        if (!isTransientError(primaryErr)) {
          throw primaryErr;
        }
        const errText = primaryErr instanceof Error ? primaryErr.message : String(primaryErr);
        console.warn("Primary flash-lite busy/timed out, switching to gemini-4-hydrogen:", errText);
        try {
          response = await callModel("gemini-4-hydrogen", ThinkingLevel.LOW, 35000);
        } catch (fallbackErr) {
          if (!isTransientError(fallbackErr)) {
            throw fallbackErr;
          }
          console.warn("gemini-4-hydrogen busy/timed out, final retry on flash-lite");
          response = await callModel("gemini-3.1-flash-lite", ThinkingLevel.MINIMAL, 12000);
        }
      }

      const rawText = (response.text ?? "{}")
        .trim()
        .replace(/^```json\s*/i, "")
        .replace(/```$/i, "")
        .trim();
      const parsed = JSON.parse(rawText);
      res.json(parsed);
    } catch (err) {
      const rawMessage = err instanceof Error ? err.message : String(err);
      let friendlyMessage =
        "Қаржы Компас AI тәлімгерімен байланыс кезінде қате орын алды. Қайталап көріңіз.";
      if (rawMessage.includes("TIMEOUT_")) {
        friendlyMessage =
          "AI сервері қазір жүктемеге байланысты баяу жауап беруде. Бірнеше секундтан кейін қайта жіберіңіз.";
      } else if (rawMessage.includes("503") || rawMessage.includes("UNAVAILABLE")) {
        friendlyMessage =
          "AI үлгісіне уақытша жоғары жүктеме түсіп тұр. 5–10 секундтан соң қайта сұрап көріңіз.";
      } else if (rawMessage.includes("429") || rawMessage.includes("RESOURCE_EXHAUSTED")) {
        friendlyMessage =
          "Сұраныстар лимиті уақытша толықты. Біраз күтіп, қайта жіберіңіз.";
      } else if (rawMessage) {
        friendlyMessage = rawMessage;
      }
      console.error("ask-compass error:", err);
      res.status(500).json({ error: friendlyMessage });
    }
  });

  // Audio transcription endpoint for voice questions
  app.post("/api/transcribe", async (req, res) => {
    try {
      const { audioBase64, mimeType } = req.body as {
        audioBase64?: string;
        mimeType?: string;
      };

      if (!audioBase64) {
        res.status(400).json({ error: "Аудио деректері табылмады." });
        return;
      }

      const cleanMimeType = (mimeType || "audio/webm").split(";")[0].trim();
      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: cleanMimeType,
                data: audioBase64,
              },
            },
            {
              text: "Transcribe this spoken financial literacy, banking, accounting, or 1C question accurately in the language spoken (primarily Kazakh, or Russian/English if spoken). Return only the clean transcript text without commentary.",
            },
          ],
        },
      });

      res.json({ text: (response.text ?? "").trim() });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Дауысты мәтінге айналдыру кезінде қате кетті.";
      console.error("transcribe error:", err);
      res.status(500).json({ error: message });
    }
  });

  // Text-to-Speech endpoint
  app.post("/api/tts", async (req, res) => {
    try {
      const { text } = req.body as { text?: string };
      if (!text || !text.trim()) {
        res.status(400).json({ error: "Оқылатын мәтін бос." });
        return;
      }

      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash-lite-tts",
        contents: [
          {
            role: "user",
            parts: [
              {
                text: text.trim().slice(0, 1200),
                speechMetadata: {
                  style: "Warm, patient, clear Kazakh financial teacher and mentor speaking naturally",
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: "Charon" },
            },
          },
        },
      });

      const base64Audio =
        response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

      if (!base64Audio) {
        res.status(502).json({ error: "Дыбыстық файл генерацияланбады." });
        return;
      }

      res.json({ audioBase64: base64Audio, mimeType: "audio/wav" });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Дыбыстау қызметінде қате орын алды.";
      console.error("tts error:", err);
      res.status(500).json({ error: message });
    }
  });

  const httpServer = createHttpServer(app);

  // Vite middleware for development or static dist for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        ws: { server: httpServer },
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
