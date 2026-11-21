import { useState } from "react";
import type { VisualDomainType } from "../types/finance";

interface FinanceVisualStageProps {
  visualType: VisualDomainType;
  progress?: number; // 0 to 1
  secondaryRatio?: number; // 0 to 1
  primaryLabel?: string;
  secondaryLabel?: string;
  compact?: boolean;
  metrics?: Array<{ label: string; value: number; color: string }>;
}

const OSV_BOX_TIPS: Record<"dt" | "doc" | "ct", string> = {
  dt: "ДЕБЕТ (Дт) — шотқа ақша немесе тауар кіргенін (1010, 1030, 1330 өсті) не шығын жиналғанын (7010, 7210) көрсетеді.",
  doc: "1С ҚҰЖАТ — операцияны растайтын бастапқы құжат (Поступление, Реализация, ПКО, Выписка). Онсыз проводка жүрмейді!",
  ct: "КРЕДИТ (Кт) — ақшаның қайдан кеткенін (1030, 1330), тауар сату кірісін (6010) немесе қарыздың өскенін (3310) көрсетеді.",
};

const BANK_BOX_TIPS: Record<"s1" | "s2" | "s3", string> = {
  s1: "1-ҚАДАМ (Банк / POS): Клиент картамен не QR арқылы төлегенде банк 0.9–2% комиссиясын бөліп алады.",
  s2: "2-ҚАДАМ (Көшірме / XML): Интернет-банкингтен .txt/.xml көшірме жүктеп, 1С 1030 шотына автоматты импорттайсыз.",
  s3: "3-ҚАДАМ (1С Есеп): Толық түсім 6010-ға, банк комиссиясы Дт 7210-ға түсіп, АСВ (ОСВ) теңеседі.",
};

export function FinanceVisualStage({
  visualType,
  progress = 0.78,
  secondaryRatio = 0.35,
  primaryLabel,
  secondaryLabel,
  compact = false,
  metrics,
}: FinanceVisualStageProps) {
  const [activeOsvTip, setActiveOsvTip] = useState<"dt" | "doc" | "ct" | null>(null);
  const [activeBankTip, setActiveBankTip] = useState<"s1" | "s2" | "s3" | null>(null);

  const clamped = Math.max(0.08, Math.min(1, progress));
  const clampedSec = Math.max(0.05, Math.min(0.95, secondaryRatio));
  const heightClass = compact ? "min-h-[195px]" : "min-h-[225px]";

  if (visualType === "literacy") {
    const bars = metrics || [
      { label: "Негізгі салым / Міндетті бөлік", value: Math.round(clamped * 100), color: "#065F46" },
      { label: "Күрделі пайыз / Қор өсімі", value: Math.round(clampedSec * 100), color: "#D97706" },
      { label: "Инфляциядан қорғалған нақты құн", value: Math.round(clamped * 82), color: "#10B981" },
    ];
    const maxVal = Math.max(1, ...bars.map((b) => Math.abs(b.value)));

    return (
      <div
        className={`relative w-full ${heightClass} rounded-2xl bg-gradient-to-br from-emerald-50/75 via-[#F6F8F7] to-amber-50/45 border border-emerald-900/10 overflow-hidden flex flex-col justify-between p-4 gap-3`}
      >
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="font-bold text-emerald-950 truncate">
            {primaryLabel || "Қаржылық сауаттылық моделі"}
          </span>
          {secondaryLabel && (
            <span className="tabular-nums font-bold text-emerald-900 bg-white border border-emerald-200 rounded-lg px-2 py-0.5 shrink-0">
              {secondaryLabel}
            </span>
          )}
        </div>

        <div className="space-y-2.5 my-auto">
          {bars.map((bar) => {
            const pct = Math.max(8, Math.round((Math.abs(bar.value) / maxVal) * 100));
            return (
              <div key={bar.label} className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
                  <span>{bar.label}</span>
                  <span className="tabular-nums font-bold text-slate-900">{pct}%</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-slate-200/70 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: bar.value < 0 ? "#DC2626" : bar.color,
                      transition: "width 550ms cubic-bezier(0.22, 1, 0.36, 1)",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-600 font-medium">
          <span>Бюджет · Қор · Күрделі пайыз · Инфляциядан қорғау</span>
          <span className="text-emerald-800 font-bold">Көрнекі динамика</span>
        </div>
      </div>
    );
  }

  if (visualType === "balance") {
    const debtWidth = Math.round(clampedSec * 100);
    const equityWidth = Math.max(0, 100 - debtWidth);

    return (
      <div
        className={`relative w-full ${heightClass} rounded-2xl bg-gradient-to-br from-emerald-50/75 via-[#F6F8F7] to-slate-50 border border-emerald-900/10 overflow-hidden flex flex-col justify-between p-4 gap-3`}
      >
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="font-bold text-emerald-950 truncate">
            {primaryLabel || "Бухгалтерлік баланс теңдігі (Ф.1)"}
          </span>
          {secondaryLabel && (
            <span className="tabular-nums font-bold text-emerald-900 bg-white border border-emerald-200 rounded-lg px-2 py-0.5 shrink-0">
              {secondaryLabel}
            </span>
          )}
        </div>

        <div className="space-y-3 my-auto">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
              <span>АКТИВТЕР (1010, 1030, 1210, 1330, 2410)</span>
              <span className="tabular-nums font-bold text-emerald-900">100%</span>
            </div>
            <div className="h-7 w-full rounded-xl bg-emerald-100/70 overflow-hidden flex p-0.5 border border-emerald-900/10">
              <div
                className="h-full rounded-lg bg-emerald-800 flex items-center justify-center text-[10px] font-bold text-white"
                style={{
                  width: `${Math.round(clamped * 100)}%`,
                  transition: "width 550ms cubic-bezier(0.22, 1, 0.36, 1)",
                }}
              >
                Актив қоры
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
              <span>ПАССИВТЕР = Міндеттемелер + Меншікті капитал</span>
              <span className="tabular-nums font-bold text-slate-800">
                {debtWidth}% / {equityWidth}%
              </span>
            </div>
            <div className="h-7 w-full rounded-xl bg-slate-100 overflow-hidden flex gap-0.5 p-0.5 border border-emerald-900/10">
              <div
                className="h-full rounded-l-lg bg-amber-500 flex items-center justify-center text-[10px] font-bold text-white truncate px-1"
                style={{
                  width: `${Math.max(8, debtWidth)}%`,
                  transition: "width 550ms cubic-bezier(0.22, 1, 0.36, 1)",
                }}
              >
                Қарыз {debtWidth}%
              </div>
              <div
                className="h-full rounded-r-lg bg-emerald-600 flex items-center justify-center text-[10px] font-bold text-white truncate px-1"
                style={{
                  width: `${Math.max(8, equityWidth)}%`,
                  transition: "width 550ms cubic-bezier(0.22, 1, 0.36, 1)",
                }}
              >
                Капитал {equityWidth}%
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-600 font-medium">
          <span>Активтер = Міндеттемелер + Капитал</span>
          <span className="text-emerald-800 font-bold">Теңдік тексерілді</span>
        </div>
      </div>
    );
  }

  if (visualType === "opiu") {
    const bars = metrics || [
      { label: "Түсім (6010)", value: 100, color: "#065F46" },
      { label: "Өзіндік құн (7010)", value: Math.round(clampedSec * 100), color: "#D97706" },
      { label: "Шығындар (7210)", value: 18, color: "#64748B" },
      { label: "Таза пайда", value: Math.max(8, Math.round(clamped * 45)), color: "#10B981" },
    ];
    const maxVal = Math.max(1, ...bars.map((b) => Math.abs(b.value)));

    return (
      <div
        className={`relative w-full ${heightClass} rounded-2xl bg-gradient-to-br from-emerald-50/75 via-[#F6F8F7] to-amber-50/40 border border-emerald-900/10 overflow-hidden flex flex-col justify-between p-4 gap-3`}
      >
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="font-bold text-emerald-950 truncate">
            {primaryLabel || "Пайда мен залал есебі (ОПиУ · Ф.2)"}
          </span>
          {secondaryLabel && (
            <span className="tabular-nums font-bold text-emerald-900 bg-white border border-emerald-200 rounded-lg px-2 py-0.5 shrink-0">
              {secondaryLabel}
            </span>
          )}
        </div>

        <div className="space-y-2 my-auto">
          {bars.map((bar) => {
            const pct = Math.max(6, Math.round((Math.abs(bar.value) / maxVal) * 100));
            return (
              <div key={bar.label} className="space-y-0.5">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
                  <span>{bar.label}</span>
                  <span className="tabular-nums font-bold text-slate-900">
                    {bar.value < 0 ? "-" : ""}
                    {Math.round(pct)}%
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-slate-200/70 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: bar.value < 0 ? "#DC2626" : bar.color,
                      transition: "width 550ms cubic-bezier(0.22, 1, 0.36, 1)",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-600 font-medium">
          <span>6010 − 7010 − 7210 − Салық = Таза пайда</span>
          <span className="text-emerald-800 font-bold">Айды жабу</span>
        </div>
      </div>
    );
  }

  if (visualType === "dds") {
    const flowBars = metrics || [
      { label: "Операциялық ағын", value: Math.round(clamped * 100), color: "#059669" },
      { label: "Инвестициялық ағын", value: -Math.round(clampedSec * 40), color: "#DC2626" },
      { label: "Қаржылық ағын", value: 25, color: "#0284C7" },
    ];
    const maxVal = Math.max(1, ...flowBars.map((b) => Math.abs(b.value)));

    return (
      <div
        className={`relative w-full ${heightClass} rounded-2xl bg-gradient-to-br from-sky-50/70 via-[#F6F8F7] to-emerald-50/60 border border-emerald-900/10 overflow-hidden flex flex-col justify-between p-4 gap-3`}
      >
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="font-bold text-emerald-950 truncate">
            {primaryLabel || "Ақша қозғалысы (ДДС · Ф.3)"}
          </span>
          {secondaryLabel && (
            <span className="tabular-nums font-bold text-sky-900 bg-white border border-sky-200 rounded-lg px-2 py-0.5 shrink-0">
              {secondaryLabel}
            </span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2.5 items-end h-28 pt-2">
          {flowBars.map((item) => {
            const hPct = Math.max(14, Math.round((Math.abs(item.value) / maxVal) * 100));
            const isNeg = item.value < 0;
            return (
              <div key={item.label} className="flex flex-col items-center justify-end h-full gap-1.5">
                <div className="w-full flex-1 flex items-end justify-center bg-white/70 rounded-xl border border-emerald-900/10 p-1.5">
                  <div
                    className="w-full rounded-lg"
                    style={{
                      height: `${hPct}%`,
                      backgroundColor: isNeg ? "#EF4444" : item.color,
                      transition: "height 550ms cubic-bezier(0.22, 1, 0.36, 1)",
                    }}
                  />
                </div>
                <span className="text-[10px] font-bold text-slate-700 text-center leading-tight">
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-600 font-medium">
          <span>1010 Касса + 1030 Банк нақты ақша ағымы</span>
          <span className="text-sky-800 font-bold">Касса алшақтығын бақылау</span>
        </div>
      </div>
    );
  }

  if (visualType === "osv_1c") {
    return (
      <div
        className={`relative w-full ${heightClass} rounded-2xl bg-gradient-to-br from-amber-50/70 via-[#F6F8F7] to-emerald-50/70 border border-emerald-900/10 overflow-hidden flex flex-col justify-between p-4 gap-2.5`}
      >
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="font-bold text-emerald-950 truncate">
            {primaryLabel || "1С:Бухгалтерия · Дебет / Кредит сұлбасы"}
          </span>
          {secondaryLabel && (
            <span className="tabular-nums font-bold text-amber-900 bg-amber-100/80 border border-amber-200 rounded-lg px-2 py-0.5 shrink-0">
              {secondaryLabel}
            </span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 items-center my-auto">
          <button
            type="button"
            onClick={() => setActiveOsvTip((cur) => (cur === "dt" ? null : "dt"))}
            className={`rounded-xl border p-2.5 text-center space-y-1 transition-colors cursor-pointer ${
              activeOsvTip === "dt"
                ? "bg-emerald-800 text-white border-emerald-900"
                : "bg-white border-emerald-200 hover:bg-emerald-50"
            }`}
          >
            <div
              className={`text-[10px] font-bold uppercase ${
                activeOsvTip === "dt" ? "text-amber-300" : "text-emerald-700"
              }`}
            >
              ДЕБЕТ (Дт)
            </div>
            <div
              className={`text-xs font-extrabold ${
                activeOsvTip === "dt" ? "text-white" : "text-slate-900"
              }`}
            >
              1030 / 1330
            </div>
            <div
              className={`text-[10px] ${
                activeOsvTip === "dt" ? "text-emerald-100" : "text-slate-500"
              }`}
            >
              Басып түсініңіз
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveOsvTip((cur) => (cur === "doc" ? null : "doc"))}
            className="flex flex-col items-center gap-1.5 cursor-pointer group"
          >
            <div className="w-full h-1.5 rounded-full bg-emerald-100 overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full"
                style={{
                  width: `${Math.round(clamped * 100)}%`,
                  transition: "width 550ms cubic-bezier(0.22, 1, 0.36, 1)",
                }}
              />
            </div>
            <span
              className={`text-[10px] font-bold rounded-md px-2.5 py-1 border transition-colors ${
                activeOsvTip === "doc"
                  ? "bg-amber-500 text-white border-amber-600"
                  : "text-emerald-900 bg-white border-emerald-200 group-hover:bg-amber-50"
              }`}
            >
              1С Құжат
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveOsvTip((cur) => (cur === "ct" ? null : "ct"))}
            className={`rounded-xl border p-2.5 text-center space-y-1 transition-colors cursor-pointer ${
              activeOsvTip === "ct"
                ? "bg-amber-600 text-white border-amber-700"
                : "bg-white border-amber-200 hover:bg-amber-50"
            }`}
          >
            <div
              className={`text-[10px] font-bold uppercase ${
                activeOsvTip === "ct" ? "text-amber-100" : "text-amber-700"
              }`}
            >
              КРЕДИТ (Кт)
            </div>
            <div
              className={`text-xs font-extrabold ${
                activeOsvTip === "ct" ? "text-white" : "text-slate-900"
              }`}
            >
              6010 / 3310
            </div>
            <div
              className={`text-[10px] ${
                activeOsvTip === "ct" ? "text-amber-100" : "text-slate-500"
              }`}
            >
              Басып түсініңіз
            </div>
          </button>
        </div>

        {activeOsvTip ? (
          <div className="rounded-xl bg-white/95 border border-emerald-200 px-3 py-2 text-[11px] font-semibold text-emerald-950 leading-snug">
            {OSV_BOX_TIPS[activeOsvTip]}
          </div>
        ) : (
          <div className="flex items-center justify-between text-[11px] text-slate-600 font-medium">
            <span>Бастапқы сальдо + Айналым = Соңғы сальдо</span>
            <span className="text-emerald-800 font-bold">Блокты басып оқыңыз</span>
          </div>
        )}
      </div>
    );
  }

  // banking
  return (
    <div
      className={`relative w-full ${heightClass} rounded-2xl bg-gradient-to-br from-emerald-50/80 via-[#F6F8F7] to-sky-50/70 border border-emerald-900/10 overflow-hidden flex flex-col justify-between p-4 gap-2.5`}
    >
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="font-bold text-emerald-950 truncate">
          {primaryLabel || "Банктік сервис және 1С интеграциясы"}
        </span>
        {secondaryLabel && (
          <span className="tabular-nums font-bold text-emerald-900 bg-white border border-emerald-200 rounded-lg px-2 py-0.5 shrink-0">
            {secondaryLabel}
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 items-center my-auto">
        <button
          type="button"
          onClick={() => setActiveBankTip((cur) => (cur === "s1" ? null : "s1"))}
          className={`rounded-xl border p-2.5 text-center space-y-1 transition-colors cursor-pointer ${
            activeBankTip === "s1"
              ? "bg-sky-700 text-white border-sky-800"
              : "bg-white border-emerald-900/10 hover:bg-sky-50"
          }`}
        >
          <div
            className={`text-[10px] font-bold ${
              activeBankTip === "s1" ? "text-sky-100" : "text-sky-700"
            }`}
          >
            1-ҚАДАМ
          </div>
          <div
            className={`text-xs font-extrabold ${
              activeBankTip === "s1" ? "text-white" : "text-slate-900"
            }`}
          >
            Банк / POS
          </div>
          <div
            className={`text-[10px] ${
              activeBankTip === "s1" ? "text-sky-100" : "text-slate-500"
            }`}
          >
            Төлем · Басу
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveBankTip((cur) => (cur === "s2" ? null : "s2"))}
          className={`rounded-xl p-2.5 text-center space-y-1 transition-colors cursor-pointer border ${
            activeBankTip === "s2"
              ? "bg-amber-600 text-white border-amber-700"
              : "bg-emerald-800 text-white border-emerald-900 hover:bg-emerald-900"
          }`}
        >
          <div className="text-[10px] font-bold text-amber-300">2-ҚАДАМ</div>
          <div className="text-xs font-extrabold">XML / Көшірме</div>
          <div className="text-[10px] text-emerald-100">ИИК 1030 · Басу</div>
        </button>

        <button
          type="button"
          onClick={() => setActiveBankTip((cur) => (cur === "s3" ? null : "s3"))}
          className={`rounded-xl border p-2.5 text-center space-y-1 transition-colors cursor-pointer ${
            activeBankTip === "s3"
              ? "bg-emerald-800 text-white border-emerald-900"
              : "bg-white border-emerald-900/10 hover:bg-emerald-50"
          }`}
        >
          <div
            className={`text-[10px] font-bold ${
              activeBankTip === "s3" ? "text-amber-300" : "text-emerald-700"
            }`}
          >
            3-ҚАДАМ
          </div>
          <div
            className={`text-xs font-extrabold ${
              activeBankTip === "s3" ? "text-white" : "text-slate-900"
            }`}
          >
            1С Есеп
          </div>
          <div
            className={`text-[10px] ${
              activeBankTip === "s3" ? "text-emerald-100" : "text-slate-500"
            }`}
          >
            АСВ · Басу
          </div>
        </button>
      </div>

      {activeBankTip ? (
        <div className="rounded-xl bg-white/95 border border-emerald-200 px-3 py-2 text-[11px] font-semibold text-emerald-950 leading-snug">
          {BANK_BOX_TIPS[activeBankTip]}
        </div>
      ) : (
        <div className="space-y-1">
          <div className="h-2 w-full rounded-full bg-emerald-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-700 to-amber-500"
              style={{
                width: `${Math.round(clamped * 100)}%`,
                transition: "width 550ms cubic-bezier(0.22, 1, 0.36, 1)",
              }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-600 font-medium">
            <span>Қадамды басып түсіндірмесін ашыңыз</span>
            <span className="tabular-nums font-bold text-emerald-900">
              {Math.round(clamped * 100)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
