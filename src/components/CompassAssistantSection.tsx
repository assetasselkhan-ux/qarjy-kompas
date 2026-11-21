import { useState, useRef, useEffect } from "react";
import {
  Mic,
  MicOff,
  Send,
  Loader2,
  AlertCircle,
  X,
  Sparkles,
  ChevronDown,
  ChevronUp,
  MessageSquare,
} from "lucide-react";
import type { CompassStructuredResponse } from "../types/finance";
import { playSfx } from "../utils/sfx";
import { CompassFormatCard } from "./CompassFormatCard";
import {
  MENTOR_CATEGORY_TABS,
  MENTOR_PRESET_SCENARIOS,
  type MentorScenarioCategory,
  type MentorPresetScenario,
} from "../utils/mentorScenarios";

interface CompassAssistantSectionProps {
  sfxMuted: boolean;
  externalPrompt?: { text: string; topic: string; nonce: number } | null;
  onStatusTipChange?: (tip: string) => void;
  onSpeakingChange?: (speaking: boolean) => void;
}

interface InlineQuestionThread {
  id: string;
  question: string;
  response?: CompassStructuredResponse;
  error?: string;
  isLoading?: boolean;
}

export function CompassAssistantSection({
  sfxMuted,
  externalPrompt,
  onStatusTipChange,
  onSpeakingChange,
}: CompassAssistantSectionProps) {
  const [customThreads, setCustomThreads] = useState<InlineQuestionThread[]>([]);
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(
    MENTOR_PRESET_SCENARIOS[0]?.id ?? null
  );
  const [presetFollowUps, setPresetFollowUps] = useState<Record<string, InlineQuestionThread>>({});
  const [input, setInput] = useState("");
  const [activeCategory, setActiveCategory] = useState<MentorScenarioCategory>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const cancelPendingRequest = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsLoading(false);
    setCustomThreads((prev) =>
      prev.map((t) =>
        t.isLoading ? { ...t, isLoading: false, error: "Сұраныс тоқтатылды." } : t
      )
    );
    setPresetFollowUps((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(next)) {
        if (next[key].isLoading) {
          next[key] = { ...next[key], isLoading: false, error: "Сұраныс тоқтатылды." };
        }
      }
      return next;
    });
    onSpeakingChange?.(false);
    onStatusTipChange?.("Сұраныс тоқтатылды. Жаңа сұрақ жібере аласыз.");
  };

  const fetchStructuredAnswer = async (
    questionText: string,
    contextTopic?: string
  ): Promise<CompassStructuredResponse> => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const timeoutId = window.setTimeout(() => controller.abort(), 55000);

    try {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        throw new Error(
          "Офлайн режим: AI сұраулар үшін интернет қажет. Дайын сұрақ-үлгілер, Дт/Кт жаттығуы және калькуляторлар интернетсіз де жұмыс істейді."
        );
      }

      const historyPayload = customThreads
        .filter((t) => t.response?.shortAnswer)
        .slice(0, 2)
        .flatMap((t) => [
          { role: "user" as const, text: t.question },
          { role: "model" as const, text: t.response?.shortAnswer || "" },
        ]);

      const res = await fetch("/api/ask-compass", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          question: questionText,
          history: historyPayload,
          contextTopic,
        }),
      });

      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        throw new Error(
          "AI сервері уақытша қолжетімсіз. Дайын сұрақ-үлгілер, Дт/Кт жаттығуы және калькуляторлар офлайн түрде қолжетімді."
        );
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Серверден жауап алу мүмкін болмады.");
      }

      return data as CompassStructuredResponse;
    } finally {
      window.clearTimeout(timeoutId);
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
    }
  };

  const handleSelectScenario = (scenario: MentorPresetScenario) => {
    if (isLoading) return;
    setVoiceError(null);
    if (activeScenarioId === scenario.id) {
      setActiveScenarioId(null);
      return;
    }
    setActiveScenarioId(scenario.id);
    playSfx(scenario.response.sfxType || "coin", sfxMuted);
    onStatusTipChange?.(scenario.response.guidingQuestion || scenario.response.expertSummary);
  };

  const submitCustomQuestion = async (questionText: string, contextTopic?: string) => {
    const trimmed = questionText.trim();
    if (!trimmed || isLoading) return;

    setVoiceError(null);
    setActiveScenarioId(null);
    setInput("");
    const threadId = `q-${Date.now()}`;
    setCustomThreads((prev) => [
      { id: threadId, question: trimmed, isLoading: true },
      ...prev.slice(0, 3),
    ]);
    setIsLoading(true);
    onSpeakingChange?.(true);
    onStatusTipChange?.("Қысқа әрі нақты жауап дайындалуда...");

    try {
      const structured = await fetchStructuredAnswer(trimmed, contextTopic);
      playSfx(structured.sfxType || "coin", sfxMuted);
      onStatusTipChange?.(structured.guidingQuestion || structured.expertSummary);
      setCustomThreads((prev) =>
        prev.map((t) => (t.id === threadId ? { ...t, isLoading: false, response: structured } : t))
      );
    } catch (err) {
      const isAbort = err instanceof DOMException && err.name === "AbortError";
      const msg = isAbort
        ? "Сұраныс тоқтатылды немесе жауап уақыты бітті (55 сек). Қайта жіберіп көріңіз."
        : err instanceof Error
          ? err.message
          : "AI Тәлімгермен байланыс кезінде қате кетті.";
      onStatusTipChange?.("Сұрақты қайта жіберіп көріңіз.");
      setCustomThreads((prev) =>
        prev.map((t) => (t.id === threadId ? { ...t, isLoading: false, error: msg } : t))
      );
    } finally {
      setIsLoading(false);
      onSpeakingChange?.(false);
    }
  };

  const handlePresetFollowUp = async (scenario: MentorPresetScenario) => {
    if (isLoading) return;
    setVoiceError(null);
    const followId = `pf-${Date.now()}`;
    setPresetFollowUps((prev) => ({
      ...prev,
      [scenario.id]: {
        id: followId,
        question: scenario.aiFollowUpPrompt,
        isLoading: true,
      },
    }));
    setIsLoading(true);
    onSpeakingChange?.(true);
    onStatusTipChange?.("Жеке цифрларыңыз бойынша қысқа есеп дайындалуда...");

    try {
      const structured = await fetchStructuredAnswer(
        scenario.aiFollowUpPrompt,
        scenario.categoryLabel
      );
      playSfx(structured.sfxType || "coin", sfxMuted);
      onStatusTipChange?.(structured.guidingQuestion || structured.expertSummary);
      setPresetFollowUps((prev) => ({
        ...prev,
        [scenario.id]: {
          id: followId,
          question: scenario.aiFollowUpPrompt,
          isLoading: false,
          response: structured,
        },
      }));
    } catch (err) {
      const isAbort = err instanceof DOMException && err.name === "AbortError";
      const msg = isAbort
        ? "Сұраныс тоқтатылды немесе жауап уақыты бітті (55 сек)."
        : err instanceof Error
          ? err.message
          : "AI Тәлімгермен байланыс кезінде қате кетті.";
      setPresetFollowUps((prev) => ({
        ...prev,
        [scenario.id]: {
          id: followId,
          question: scenario.aiFollowUpPrompt,
          isLoading: false,
          error: msg,
        },
      }));
    } finally {
      setIsLoading(false);
      onSpeakingChange?.(false);
    }
  };

  useEffect(() => {
    if (externalPrompt && externalPrompt.text) {
      submitCustomQuestion(externalPrompt.text, externalPrompt.topic);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalPrompt?.nonce]);

  const toggleRecording = async () => {
    setVoiceError(null);
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setVoiceError("Браузерде микрофон жазу қолжетімсіз.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];

      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunksRef.current.push(ev.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((tr) => tr.stop());
        const blob = new Blob(chunksRef.current, { type: mimeType });
        if (blob.size < 400) return;

        setIsTranscribing(true);
        const transcribeCtrl = new AbortController();
        const tId = window.setTimeout(() => transcribeCtrl.abort(), 18000);
        try {
          const base64 = await blobToBase64(blob);
          const res = await fetch("/api/transcribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: transcribeCtrl.signal,
            body: JSON.stringify({ audioBase64: base64, mimeType }),
          });
          const json = (await res.json()) as { text?: string; error?: string };
          if (!res.ok || !json.text) {
            throw new Error(json.error || "Дауысты тану сәтсіз аяқталды.");
          }
          await submitCustomQuestion(json.text);
        } catch (err) {
          setVoiceError(
            err instanceof Error ? err.message : "Дауыстық сұрақты өңдеу мүмкін болмады."
          );
        } finally {
          window.clearTimeout(tId);
          setIsTranscribing(false);
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch {
      setVoiceError("Микрофонға рұқсат берілмеді. Мәтінмен жазып сұрауыңызға болады.");
    }
  };

  const handleReplyToGuiding = (questionAsked: string) => {
    setInput(`Менің жауабым («${questionAsked.slice(0, 42)}...»): `);
    inputRef.current?.focus();
  };

  const visibleScenarios =
    activeCategory === "all"
      ? MENTOR_PRESET_SCENARIOS
      : MENTOR_PRESET_SCENARIOS.filter((s) => s.category === activeCategory);

  return (
    <div className="space-y-4">
      {/* 1. Ask Custom Question Form */}
      <div className="bg-white border border-emerald-900/10 rounded-2xl shadow-[0_4px_20px_rgba(6,78,59,0.05)] p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-950">
            <MessageSquare className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>Тәлімгерге сұрақ қойыңыз — қысқа жауап пен есеп дәл астында шығады</span>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submitCustomQuestion(input);
          }}
          className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Қарыз, аз табыспен жинау, бөліп төлеу, банк немесе 1С сұрағын жазыңыз..."
            className="flex-1 min-h-[44px] bg-[#F6F8F7] border border-emerald-900/15 rounded-xl px-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-700/25 focus:border-emerald-700"
          />
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={toggleRecording}
              disabled={isLoading || isTranscribing}
              className={`inline-flex items-center justify-center gap-2 px-4 min-h-[44px] text-xs sm:text-sm font-semibold rounded-xl border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isRecording
                  ? "bg-red-600 text-white border-red-600 hover:bg-red-700"
                  : "bg-white text-slate-700 border-emerald-900/15 hover:bg-emerald-50"
              }`}
            >
              {isTranscribing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Танылуда...</span>
                </>
              ) : isRecording ? (
                <>
                  <MicOff className="w-4 h-4" />
                  <span>Тоқтату</span>
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 text-emerald-700" />
                  <span>Дауыс</span>
                </>
              )}
            </button>

            {isLoading ? (
              <button
                type="button"
                onClick={cancelPendingRequest}
                className="inline-flex items-center justify-center gap-1.5 px-4 min-h-[44px] text-xs sm:text-sm font-semibold rounded-xl bg-amber-500 text-white hover:bg-amber-600 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Талдау...</span>
                <X className="w-3.5 h-3.5 ml-0.5" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                className="inline-flex items-center justify-center gap-2 px-5 min-h-[44px] text-xs sm:text-sm font-semibold rounded-xl bg-emerald-800 text-white hover:bg-emerald-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>Сұрау</span>
              </button>
            )}
          </div>
        </form>

        {voiceError && (
          <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{voiceError}</span>
          </div>
        )}

        {/* STRICTLY INLINE CUSTOM QUESTION -> ANSWER RIGHT BELOW IT */}
        {customThreads.length > 0 && (
          <div className="space-y-3 pt-2 border-t border-emerald-900/10">
            {customThreads.map((entry) => (
              <div
                key={entry.id}
                className="rounded-2xl border-2 border-emerald-700/80 bg-[#F6F8F7] overflow-hidden anim-panel-enter"
              >
                <div className="flex items-start justify-between gap-2 px-3.5 py-2.5 bg-emerald-800 text-white">
                  <div className="text-xs sm:text-sm font-bold leading-snug">
                    <span className="text-amber-300 mr-1.5">Сұрағыңыз:</span>
                    <span>{entry.question}</span>
                  </div>
                  <button
                    type="button"
                    aria-label="Жабу"
                    onClick={() =>
                      setCustomThreads((prev) => prev.filter((item) => item.id !== entry.id))
                    }
                    className="p-1 rounded-lg hover:bg-white/15 text-emerald-100 shrink-0 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-3">
                  {entry.isLoading ? (
                    <div className="flex items-center justify-between gap-3 bg-white rounded-xl border border-emerald-900/10 p-3.5 text-xs font-semibold text-emerald-950">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
                        <span>Тәлімгер қысқа жауап пен цифрлық есепті дайындауда...</span>
                      </div>
                      <button
                        type="button"
                        onClick={cancelPendingRequest}
                        className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 font-bold hover:bg-amber-200 cursor-pointer"
                      >
                        Тоқтату
                      </button>
                    </div>
                  ) : entry.error ? (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <span>{entry.error}</span>
                    </div>
                  ) : entry.response ? (
                    <CompassFormatCard
                      data={entry.response}
                      sfxMuted={sfxMuted}
                      showVisualStage={true}
                      stageProgress={0.85}
                      stageSecondaryRatio={0.38}
                      onSpeakingChange={onSpeakingChange}
                      onReplyToGuiding={handleReplyToGuiding}
                      compactStage={true}
                      collapsibleDetails={true}
                    />
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Categorized Preset Scenarios: Clicking Any Question Opens Answer STRICTLY RIGHT BELOW IT */}
      <div className="bg-white border border-emerald-900/10 rounded-2xl shadow-[0_4px_20px_rgba(6,78,59,0.05)] p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-xs sm:text-sm font-extrabold text-emerald-950">
              Дайын сұрақ-үлгілер (таңдасаңыз, жауабы дәл астында ашылады)
            </h3>
            <p className="text-[11px] text-slate-500">
              Алдымен 1–2 қысқа сөйлем, негізгі цифр немесе салыстыру кестесі шығады; толық формула мен қадамдар «Толығырақ» ішінде
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {MENTOR_CATEGORY_TABS.map((cat) => {
              const isCat = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-colors cursor-pointer ${
                    isCat
                      ? "bg-emerald-800 text-white border-emerald-800"
                      : "bg-[#F6F8F7] text-slate-600 border-emerald-900/10 hover:bg-emerald-50 hover:text-emerald-950"
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {visibleScenarios.map((sc) => {
            const isSelected = activeScenarioId === sc.id;
            const followUp = presetFollowUps[sc.id];
            return (
              <div
                key={sc.id}
                className={`rounded-2xl border transition-all ${
                  isSelected
                    ? "md:col-span-2 border-2 border-emerald-600 bg-emerald-50/40 shadow-[0_4px_18px_rgba(6,95,70,0.08)]"
                    : "border-emerald-900/10 bg-[#F6F8F7] hover:bg-emerald-50/60 hover:border-emerald-300"
                }`}
              >
                <button
                  type="button"
                  disabled={isLoading && !isSelected}
                  onClick={() => handleSelectScenario(sc)}
                  className="w-full text-left p-3.5 flex items-start justify-between gap-2.5 cursor-pointer disabled:opacity-60"
                >
                  <div className="space-y-1 min-w-0">
                    <span className="inline-block text-[10px] font-extrabold text-emerald-800 bg-white border border-emerald-200 rounded-md px-1.5 py-0.5">
                      {sc.categoryLabel}
                    </span>
                    <div className="text-xs sm:text-sm font-extrabold text-slate-900 leading-snug">
                      {sc.title}
                    </div>
                    <div className="text-[11px] text-slate-600 leading-snug">{sc.subtitle}</div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg shrink-0 ${
                      isSelected
                        ? "bg-emerald-800 text-white"
                        : "bg-white text-slate-600 border border-emerald-900/10"
                    }`}
                  >
                    <span>{isSelected ? "Жабу" : "Ашу"}</span>
                    {isSelected ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </span>
                </button>

                {/* ANSWER STRICTLY DIRECTLY UNDER THIS CLICKED PRESET QUESTION */}
                {isSelected && (
                  <div className="px-3.5 pb-3.5 pt-2 border-t border-emerald-200/80 space-y-2.5 anim-panel-enter">
                    <CompassFormatCard
                      data={sc.response}
                      sfxMuted={sfxMuted}
                      showVisualStage={true}
                      stageProgress={0.85}
                      stageSecondaryRatio={0.38}
                      onSpeakingChange={onSpeakingChange}
                      onReplyToGuiding={handleReplyToGuiding}
                      compactStage={true}
                      collapsibleDetails={true}
                    />

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                      <span className="text-[11px] text-slate-600 font-medium">
                        Өз жалақыңыз немесе несие сомаңызбен есептегіңіз келе ме?
                      </span>
                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => handlePresetFollowUp(sc)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 transition-colors shrink-0 cursor-pointer disabled:opacity-60"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>AI Тәлімгерден өз цифрларыммен сұрау</span>
                      </button>
                    </div>

                    {/* Personalized AI Answer strictly inside the same preset card */}
                    {followUp && (
                      <div className="rounded-xl border border-amber-300 bg-amber-50/50 p-3 space-y-2 anim-panel-enter">
                        <div className="text-xs font-bold text-amber-950">
                          <span className="text-amber-700 mr-1">Жеке сұраныс:</span>
                          {followUp.question}
                        </div>
                        {followUp.isLoading ? (
                          <div className="flex items-center justify-between gap-2 bg-white rounded-xl border border-amber-200 p-3 text-xs font-semibold text-emerald-950">
                            <div className="flex items-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                              <span>AI Тәлімгер жеке есеп дайындауда...</span>
                            </div>
                            <button
                              type="button"
                              onClick={cancelPendingRequest}
                              className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 font-bold cursor-pointer"
                            >
                              Тоқтату
                            </button>
                          </div>
                        ) : followUp.error ? (
                          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                            <span>{followUp.error}</span>
                          </div>
                        ) : followUp.response ? (
                          <CompassFormatCard
                            data={followUp.response}
                            sfxMuted={sfxMuted}
                            showVisualStage={true}
                            stageProgress={0.85}
                            stageSecondaryRatio={0.38}
                            onSpeakingChange={onSpeakingChange}
                            onReplyToGuiding={handleReplyToGuiding}
                            compactStage={true}
                            collapsibleDetails={true}
                          />
                        ) : null}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      const commaIndex = result.indexOf(",");
      resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
