import { useState, useEffect } from "react";
import {
  MessageCircle,
  Award,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  RefreshCw,
} from "lucide-react";
import type { MainTab, MentorMood } from "../types/finance";

interface MentorSidebarWidgetProps {
  activeTab: MainTab;
  mood?: MentorMood;
  isSpeaking?: boolean;
  tipText: string;
  levelLabel?: string;
  onNextTip?: () => void;
  onOpenAi?: () => void;
  compact?: boolean;
}

interface MiniCheckQuestion {
  prompt: string;
  options: [string, string];
  correctIdx: 0 | 1;
  feedback: string;
}

const CHECK_BY_TAB: Record<MainTab, MiniCheckQuestion> = {
  literacy: {
    prompt: "Қауіпсіз қаржылық жастық (подушка) кемінде қанша айлық шығынды жабуы тиіс?",
    options: ["3–6 айлық шығын", "1 апталық шығын"],
    correctIdx: 0,
    feedback: "Дұрыс! 3–6 айлық қор табыс уақытша тоқтағанда қиындықтан қорғайды.",
  },
  accounting: {
    prompt: "1С-те сатып алушыдан 1030 банк шотына ақша түскенде қандай проводка жасалады?",
    options: ["Дт 1210 — Кт 1030", "Дт 1030 — Кт 1210"],
    correctIdx: 1,
    feedback: "Дәл таптыңыз! 1030 активті шоты Дебет арқылы өсіп, 1210 берешек Кредитпен жабылады.",
  },
  banking: {
    prompt: "Эквайринг кезінде банк 2% комиссия ұстаса, сату кірісі (6010) қанша болады?",
    options: ["Толық сатылым сомасы (100%)", "Тек комиссиядан қалған 98%"],
    correctIdx: 0,
    feedback: "Өте дұрыс! 6010 шотына толық 100% кіріс, ал 2% комиссия Дт 7210-ға бөлек жазылады.",
  },
  assistant: {
    prompt: "Қаржылық есептілікте ақша қалдығын (касса алшақтығын) қай есеп көрсетеді?",
    options: ["ОПиУ (Ф.2)", "ДДС / АҚЕ (Ф.3)"],
    correctIdx: 1,
    feedback: "Дұрыс! ДДС (Ф.3) 1010 касса мен 1030 банктегі нақты ақша ағымын бақылайды.",
  },
  practice: {
    prompt: "Ай соңында 6010, 7010, 7210 шоттарын жабу үшін 1С-те не орындалады?",
    options: ["Айды жабу (Закрытие месяца)", "Касса кітабын өшіру"],
    correctIdx: 0,
    feedback: "Дәл солай! «Айды жабу» операциясы кіріс пен шығысты 5610 шотына аударады.",
  },
};

export function MentorSidebarWidget({
  activeTab,
  mood = "idle",
  isSpeaking = false,
  tipText,
  levelLabel,
  onNextTip,
  onOpenAi,
  compact = false,
}: MentorSidebarWidgetProps) {
  const [isBlinking, setIsBlinking] = useState(false);
  const [pickedAnswer, setPickedAnswer] = useState<number | null>(null);

  useEffect(() => {
    setPickedAnswer(null);
  }, [activeTab]);

  useEffect(() => {
    let blinkTimeout: number;
    const interval = window.setInterval(() => {
      setIsBlinking(true);
      blinkTimeout = window.setTimeout(() => setIsBlinking(false), 150);
    }, 3800);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(blinkTimeout);
    };
  }, []);

  const check = CHECK_BY_TAB[activeTab];
  const isActive = isSpeaking || mood === "explaining" || mood === "guiding";
  const isRight = pickedAnswer === check.correctIdx;

  return (
    <div
      className={`bg-white border border-emerald-900/10 rounded-2xl shadow-[0_4px_20px_rgba(6,78,59,0.06)] ${
        compact ? "p-3.5" : "p-4"
      } space-y-3`}
    >
      {/* Header + Activity Indicator */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`w-2 h-2 rounded-full shrink-0 transition-colors ${
              isActive ? "bg-amber-500 animate-pulse" : "bg-emerald-600"
            }`}
            aria-hidden="true"
          />
          <span className="text-xs font-extrabold text-emerald-950 truncate">
            AI Тәлімгер
          </span>
          <span className="text-[11px] font-medium text-slate-500 truncate">
            · Ұстаз-кеңесші
          </span>
        </div>
        {levelLabel && (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2 py-0.5 shrink-0 tabular-nums">
            <Award className="w-3 h-3 text-amber-600" />
            <span>{levelLabel}</span>
          </span>
        )}
      </div>

      {/* Calm Mentor Portrait (No arms, no hands, only gentle blink & nod) + Guidance */}
      <div className={`flex ${compact ? "items-center gap-3" : "flex-col items-center gap-2.5"}`}>
        <button
          type="button"
          onClick={() => onNextTip?.()}
          aria-label="AI Тәлімгер — келесі кеңес"
          className={`relative cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 rounded-full shrink-0 transition-transform duration-200 active:scale-[0.98] ${
            compact ? "w-16 h-16" : "w-24 h-24"
          }`}
        >
          <svg
            viewBox="0 0 160 160"
            className="w-full h-full rounded-full border border-emerald-900/12 shadow-[0_2px_10px_rgba(6,78,59,0.07)]"
            role="img"
            aria-label="Қаржы Компас AI Тәлімгері"
          >
            <defs>
              <clipPath id="mentorPortraitClip">
                <circle cx="80" cy="80" r="78" />
              </clipPath>
            </defs>
            <g clipPath="url(#mentorPortraitClip)">
              <circle
                cx="80"
                cy="80"
                r="78"
                fill={isActive ? "#ECFDF5" : "#F6F8F7"}
                style={{ transition: "fill 350ms ease" }}
              />
              <circle
                cx="80"
                cy="80"
                r="73"
                fill="none"
                stroke="#059669"
                strokeWidth="1.2"
                opacity="0.28"
              />

              {/* Shoulders & Formal Jacket Collar (No arms/hands) */}
              <g>
                <path
                  d="M 20 162 C 22 126, 40 112, 80 112 C 120 112, 138 126, 140 162 Z"
                  fill="#064E3B"
                />
                <path d="M 62 112 L 80 144 L 98 112 Z" fill="#FFFFFF" />
                <path d="M 55 113 L 80 148 L 65 152 L 47 122 Z" fill="#065F46" />
                <path d="M 105 113 L 80 148 L 95 152 L 113 122 Z" fill="#065F46" />
                <path d="M 77 120 L 83 120 L 84 142 L 80 148 L 76 142 Z" fill="#D97706" />
                {/* Compass Pin on Lapel */}
                <circle cx="102" cy="134" r="3.5" fill="#FBBF24" />
                <rect x="70" y="94" width="20" height="20" rx="8" fill="#E3AF8B" />
              </g>

              {/* Head with gentle nod when speaking/guiding */}
              <g
                className={isActive ? "anim-head-nod" : ""}
                style={{ transformOrigin: "80px 100px" }}
              >
                <ellipse cx="51" cy="70" rx="4.5" ry="7.5" fill="#DDA681" />
                <ellipse cx="109" cy="70" rx="4.5" ry="7.5" fill="#DDA681" />
                <path
                  d="M 54 50 C 54 35, 106 35, 106 50 L 105 78 C 105 95, 93 104, 80 104 C 67 104, 55 95, 55 78 Z"
                  fill="#F0C3A0"
                />
                {/* Neat Hair */}
                <path
                  d="M 52 62 C 50 32, 64 21, 80 21 C 96 21, 110 32, 108 62 C 104 48, 96 40, 80 40 C 64 40, 56 48, 52 62 Z"
                  fill="#1E293B"
                />
                {/* Glasses (Pedagogical Expert look) */}
                <rect
                  x="59"
                  y="60"
                  width="16"
                  height="11"
                  rx="4"
                  fill="rgba(255,255,255,0.22)"
                  stroke="#0F172A"
                  strokeWidth="1.6"
                />
                <rect
                  x="85"
                  y="60"
                  width="16"
                  height="11"
                  rx="4"
                  fill="rgba(255,255,255,0.22)"
                  stroke="#0F172A"
                  strokeWidth="1.6"
                />
                <path d="M 75 65 H 85" stroke="#0F172A" strokeWidth="1.5" />

                {/* Calm Blinking Eyes */}
                {isBlinking ? (
                  <>
                    <path d="M 63 65 Q 67 68 71 65" fill="none" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" />
                    <path d="M 89 65 Q 93 68 97 65" fill="none" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" />
                  </>
                ) : (
                  <>
                    <circle cx="67" cy="65" r="2.7" fill="#0F172A" />
                    <circle cx="93" cy="65" r="2.7" fill="#0F172A" />
                  </>
                )}

                {/* Warm Smile */}
                <path
                  d={isActive ? "M 73 84 Q 80 89 87 84" : "M 72 84 Q 80 90 88 84"}
                  fill="none"
                  stroke="#7C2D12"
                  strokeWidth="2.1"
                  strokeLinecap="round"
                />
              </g>
            </g>
          </svg>
        </button>

        <div className="flex-1 w-full rounded-xl bg-emerald-50/75 border border-emerald-200/90 px-3 py-2.5 text-xs leading-relaxed text-slate-800">
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="font-bold text-[11px] text-emerald-900">
              {isActive ? "Қадамдық бағыт" : "Тәлімгер кеңесі"}
            </span>
            <Sparkles className="w-3 h-3 text-amber-600 shrink-0" />
          </div>
          <p className="font-medium text-slate-800">{tipText}</p>
        </div>
      </div>

      {/* Mini Understanding Check inside Mentor Widget (Desktop & Tablet) */}
      {!compact && (
        <div className="rounded-xl bg-[#F6F8F7] border border-emerald-900/10 p-3 space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-900">
            <HelpCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>Түсінуді тексеру сұрағы</span>
          </div>
          <p className="text-[11px] font-semibold text-slate-800 leading-snug">{check.prompt}</p>
          <div className="space-y-1.5">
            {check.options.map((opt, idx) => {
              const chosen = pickedAnswer === idx;
              const right = idx === check.correctIdx;
              let cls =
                "bg-white border-emerald-900/10 text-slate-700 hover:border-emerald-500 hover:bg-emerald-50/40";
              if (pickedAnswer !== null) {
                if (right) cls = "bg-emerald-50 border-emerald-600 text-emerald-950 font-bold";
                else if (chosen) cls = "bg-red-50 border-red-300 text-red-900";
              }
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setPickedAnswer(idx)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg border text-[11px] transition-colors flex items-center justify-between gap-1.5 cursor-pointer ${cls}`}
                >
                  <span>{opt}</span>
                  {pickedAnswer !== null && right && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
          {pickedAnswer !== null && (
            <p
              className={`text-[11px] leading-snug font-medium pt-0.5 ${
                isRight ? "text-emerald-800" : "text-amber-900"
              }`}
            >
              {check.feedback}
            </p>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setPickedAnswer(null);
            onNextTip?.();
          }}
          className="flex-1 min-h-[38px] inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Келесі кеңес</span>
        </button>
        {onOpenAi && (
          <button
            type="button"
            onClick={onOpenAi}
            className="min-h-[38px] inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-amber-500 text-white hover:bg-amber-600 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Тәлімгер AI</span>
          </button>
        )}
      </div>
    </div>
  );
}
