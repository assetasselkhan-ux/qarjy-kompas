import { useState, useRef } from "react";
import {
  Volume2,
  Square,
  FileSpreadsheet,
  BookOpenCheck,
  Loader2,
  ArrowLeftRight,
  HelpCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Award,
  Scale,
} from "lucide-react";
import type { CompassStructuredResponse } from "../types/finance";
import { playSfx } from "../utils/sfx";
import { FinanceVisualStage } from "./FinanceVisualStage";

interface CompassFormatCardProps {
  data: CompassStructuredResponse;
  sfxMuted: boolean;
  showVisualStage?: boolean;
  stageProgress?: number;
  stageSecondaryRatio?: number;
  stageMetrics?: Array<{ label: string; value: number; color: string }>;
  onSpeakingChange?: (speaking: boolean) => void;
  onReplyToGuiding?: (replyText: string) => void;
  compactStage?: boolean;
  collapsibleDetails?: boolean;
}

function toConciseSentences(text: string, maxSentences = 2): { concise: string; wasTrimmed: boolean } {
  const clean = text.trim().replace(/\s+/g, " ");
  if (!clean) return { concise: "", wasTrimmed: false };
  // Split on sentence-ending punctuation followed by whitespace (without breaking decimals like 14.5 or 100.00)
  const parts = clean.split(/(?<=[.!?])\s+(?=[А-ЯӘІҢҒҮҰҚӨҺA-Z0-9«"(])/).filter(Boolean);
  if (parts.length <= maxSentences && clean.length <= 240) {
    return { concise: clean, wasTrimmed: false };
  }
  const joined = parts.slice(0, maxSentences).join(" ");
  if (joined.length <= 260) {
    return { concise: joined, wasTrimmed: parts.length > maxSentences };
  }
  const single = parts[0] || clean;
  if (single.length <= 240) {
    return { concise: single, wasTrimmed: true };
  }
  return { concise: `${single.slice(0, 220).trimEnd()}…`, wasTrimmed: true };
}

export function CompassFormatCard({
  data,
  sfxMuted,
  showVisualStage = true,
  stageProgress = 0.8,
  stageSecondaryRatio = 0.35,
  stageMetrics,
  onSpeakingChange,
  onReplyToGuiding,
  compactStage = false,
  collapsibleDetails = false,
}: CompassFormatCardProps) {
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [isLoadingVoice, setIsLoadingVoice] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(!collapsibleDetails);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const rawPrimaryText = data.shortAnswer?.trim() || data.explanation?.trim() || "";
  const { concise: conciseSummary, wasTrimmed } = collapsibleDetails
    ? toConciseSentences(rawPrimaryText, 2)
    : { concise: rawPrimaryText, wasTrimmed: false };

  const stopVoice = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingVoice(false);
    onSpeakingChange?.(false);
  };

  const handlePlayVoice = async () => {
    if (isPlayingVoice) {
      stopVoice();
      return;
    }

    playSfx(data.sfxType || "coin", sfxMuted);
    setIsLoadingVoice(true);
    const spokenText = data.shortAnswer
      ? `${data.shortAnswer} ${data.explanation}`
      : data.explanation;

    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: spokenText }),
      });

      if (!res.ok) {
        throw new Error("TTS API error");
      }

      const json = (await res.json()) as { audioBase64?: string; mimeType?: string };
      if (!json.audioBase64) {
        throw new Error("Empty audio");
      }

      const audio = new Audio(`data:${json.mimeType || "audio/wav"};base64,${json.audioBase64}`);
      audioRef.current = audio;
      audio.onended = () => {
        setIsPlayingVoice(false);
        onSpeakingChange?.(false);
        audioRef.current = null;
      };
      audio.onerror = () => {
        setIsPlayingVoice(false);
        onSpeakingChange?.(false);
        audioRef.current = null;
      };
      setIsPlayingVoice(true);
      onSpeakingChange?.(true);
      await audio.play();
    } catch {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(spokenText);
        utterance.lang = "kk-KZ";
        utterance.rate = 0.96;
        utterance.onend = () => {
          setIsPlayingVoice(false);
          onSpeakingChange?.(false);
        };
        utterance.onerror = () => {
          setIsPlayingVoice(false);
          onSpeakingChange?.(false);
        };
        setIsPlayingVoice(true);
        onSpeakingChange?.(true);
        window.speechSynthesis.speak(utterance);
      }
    } finally {
      setIsLoadingVoice(false);
    }
  };

  return (
    <div className="bg-white border border-emerald-900/10 rounded-2xl shadow-[0_4px_20px_rgba(6,78,59,0.05)] p-4 sm:p-5 space-y-3 anim-panel-enter">
      {showVisualStage && !collapsibleDetails && (
        <FinanceVisualStage
          visualType={data.visualType}
          progress={stageProgress}
          secondaryRatio={stageSecondaryRatio}
          primaryLabel={data.keyMetricLabel}
          secondaryLabel={data.keyMetricValue}
          compact={compactStage}
          metrics={stageMetrics}
        />
      )}

      {/* Concise Core Answer + Voice Control */}
      <div className="space-y-2 pb-2.5 border-b border-emerald-900/10">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-bold text-emerald-900">
            {collapsibleDetails ? "Қысқа жауап (1–2 сөйлем)" : data.shortAnswer ? "Қысқа түйін және нақты цифр" : "Тәлімгердің жауабы"}
          </span>
          <div className="flex items-center gap-2">
            {collapsibleDetails && (
              <button
                type="button"
                onClick={() => setDetailsOpen((v) => !v)}
                className="inline-flex items-center gap-1 px-3 py-1.5 min-h-[34px] text-xs font-bold rounded-xl border border-amber-300 bg-amber-50 text-amber-950 hover:bg-amber-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>{detailsOpen ? "Қысқарту" : "Толығырақ"}</span>
                {detailsOpen ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            )}

            <button
              type="button"
              onClick={handlePlayVoice}
              disabled={isLoadingVoice}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[34px] text-xs font-semibold rounded-xl border border-emerald-200 bg-emerald-50/80 text-emerald-950 hover:bg-emerald-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
            >
              {isLoadingVoice ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Дайындалуда...</span>
                </>
              ) : isPlayingVoice ? (
                <>
                  <Square className="w-3.5 h-3.5 text-red-600" />
                  <span>Тоқтату</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Тыңдау</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="rounded-xl bg-emerald-50/90 border border-emerald-200 px-3.5 py-2.5 text-sm font-bold text-emerald-950 leading-snug tabular-nums">
          {conciseSummary}
        </div>

        {!collapsibleDetails && data.shortAnswer && data.explanation && (
          <p className="text-sm leading-relaxed text-slate-800">{data.explanation}</p>
        )}

        {/* Compact Key Number / Calculation Strip */}
        {(data.keyMetricValue || data.exampleCalculation) && (
          <div className="flex flex-wrap items-center gap-2 text-xs tabular-nums">
            {data.keyMetricLabel && data.keyMetricValue && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#F6F8F7] border border-emerald-900/10 px-2.5 py-1 font-bold text-emerald-950">
                <span className="text-slate-500 font-semibold">{data.keyMetricLabel}:</span>
                <span>{data.keyMetricValue}</span>
              </span>
            )}
            {data.exampleCalculation && (
              <span className="inline-flex items-center rounded-lg bg-amber-50/85 border border-amber-200 px-2.5 py-1 font-bold text-amber-950">
                {data.exampleCalculation}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Compact Comparison Table/Block (Visible Directly When Comparison Needed) */}
      {data.comparison && data.comparison.options && data.comparison.options.length > 0 && (
        <div className="rounded-2xl bg-[#F6F8F7] border border-emerald-900/15 p-3 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-950">
              <Scale className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>{data.comparison.title}</span>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 bg-amber-100 border border-amber-300 rounded-lg px-2 py-0.5">
              <Award className="w-3 h-3 text-amber-700" />
              <span>{data.comparison.winnerLabel}</span>
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-emerald-900/10 bg-white">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-emerald-50/80 text-emerald-950 border-b border-emerald-900/10">
                  <th className="py-2 px-2.5 font-extrabold">Нұсқа</th>
                  <th className="py-2 px-2.5 font-extrabold">Құны / Табысы</th>
                  <th className="py-2 px-2.5 font-extrabold">Нәтиже</th>
                  <th className="py-2 px-2.5 font-extrabold hidden sm:table-cell">Артықшылығы / Кемшілігі</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 tabular-nums">
                {data.comparison.options.map((opt) => (
                  <tr
                    key={opt.name}
                    className={opt.isWinner ? "bg-emerald-50/45" : "bg-white"}
                  >
                    <td className="py-2 px-2.5 font-bold text-slate-900 align-top">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span>{opt.name}</span>
                        {opt.isWinner && (
                          <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 rounded-md px-1.5 py-0.5">
                            Тиімді
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-2.5 font-bold text-emerald-900 align-top">
                      {opt.costOrReturn}
                    </td>
                    <td className="py-2 px-2.5 font-semibold text-slate-800 align-top">
                      {opt.netBenefit}
                    </td>
                    <td className="py-2 px-2.5 text-[11px] text-slate-600 align-top hidden sm:table-cell">
                      <div><strong className="text-emerald-800">+</strong> {opt.pros}</div>
                      <div><strong className="text-slate-500">−</strong> {opt.cons}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-xl bg-emerald-800 text-white px-3 py-2 text-xs font-semibold leading-snug">
            <strong>Түйін:</strong> {data.comparison.verdict}
          </div>
        </div>
      )}

      {/* Detailed Breakdown (Hidden strictly under "Толығырақ" when collapsibleDetails=true) */}
      {detailsOpen && (
        <div className="space-y-3.5 anim-panel-enter">
          {showVisualStage && collapsibleDetails && (
            <FinanceVisualStage
              visualType={data.visualType}
              progress={stageProgress}
              secondaryRatio={stageSecondaryRatio}
              primaryLabel={data.keyMetricLabel}
              secondaryLabel={data.keyMetricValue}
              compact={compactStage}
              metrics={stageMetrics}
            />
          )}

          {collapsibleDetails && wasTrimmed && rawPrimaryText && (
            <div className="rounded-xl bg-emerald-50/60 border border-emerald-200 px-3.5 py-2.5 text-xs sm:text-[13px] leading-relaxed text-emerald-950 font-medium">
              {rawPrimaryText}
            </div>
          )}

          {collapsibleDetails && data.shortAnswer && data.explanation && (
            <div className="rounded-xl bg-[#F6F8F7] border border-emerald-900/10 px-3.5 py-2.5 text-xs sm:text-[13px] leading-relaxed text-slate-700">
              {data.explanation}
            </div>
          )}

          {data.stepByStep && data.stepByStep.length > 0 && (
            <div className="space-y-1">
              {data.stepByStep.map((step, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 text-xs text-slate-700 bg-[#F6F8F7] border border-emerald-900/8 rounded-lg px-2.5 py-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                  <span>{step}</span>
                </div>
              ))}
            </div>
          )}

          {data.guidingQuestion && (
            <div className="rounded-xl bg-amber-50/85 border border-amber-200/90 p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-900">
                  <HelpCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span>Түсінуді тексеру (Тәлімгер сұрағы)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {data.guidingHint && (
                    <button
                      type="button"
                      onClick={() => setShowHint((v) => !v)}
                      className="text-[11px] font-bold text-amber-900 underline underline-offset-2 cursor-pointer"
                    >
                      {showHint ? "Кілтті жасыру" : "Жауап кілтін көру"}
                    </button>
                  )}
                  {onReplyToGuiding && (
                    <button
                      type="button"
                      onClick={() => onReplyToGuiding(data.guidingQuestion || "")}
                      className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-500 text-white hover:bg-amber-600 transition-colors cursor-pointer"
                    >
                      Жауап беру
                    </button>
                  )}
                </div>
              </div>
              <p className="text-xs font-semibold text-slate-900 leading-relaxed">
                {data.guidingQuestion}
              </p>
              {showHint && data.guidingHint && (
                <div className="text-[11px] text-emerald-950 bg-white/90 border border-amber-200 rounded-lg px-2.5 py-1.5 font-medium">
                  <strong>Кілт:</strong> {data.guidingHint}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-5 rounded-xl bg-[#F6F8F7] border border-emerald-900/10 p-3 space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-800">
                <ArrowLeftRight className="w-3.5 h-3.5 text-emerald-700" />
                <span>1С жазбасы / Ереже</span>
              </div>
              {data.journalEntry && (
                <div className="text-xs font-bold text-emerald-950 bg-white border border-emerald-200/80 rounded-lg px-2.5 py-1.5 tabular-nums">
                  {data.journalEntry}
                </div>
              )}
              {data.doc1C && (
                <div className="flex items-start gap-1.5 text-[11px] font-medium text-amber-900">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span>{data.doc1C}</span>
                </div>
              )}
              <p className="text-[11px] leading-relaxed text-slate-600">{data.sceneDescription}</p>
            </div>

            <div className="md:col-span-7 rounded-xl bg-emerald-50/80 border border-emerald-200/90 p-3.5 flex flex-col justify-between gap-2">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-950">
                  <BookOpenCheck className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Қаржы сарапшысының түйіні</span>
                </div>
                <p className="text-xs sm:text-[13px] leading-relaxed font-semibold text-slate-900">
                  {data.expertSummary}
                </p>
              </div>
              {(data.formulaLabel || data.exampleCalculation) && (
                <div className="pt-2 border-t border-emerald-200/80 flex flex-wrap items-center justify-between gap-2 text-[11px] tabular-nums text-emerald-950">
                  {data.formulaLabel && <span className="font-medium">{data.formulaLabel}</span>}
                  {data.exampleCalculation && (
                    <span className="font-bold text-emerald-800">{data.exampleCalculation}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
