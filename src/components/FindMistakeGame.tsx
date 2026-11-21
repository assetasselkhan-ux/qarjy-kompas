import { useState } from "react";
import {
  AlertOctagon,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  ArrowUpRight,
  X,
} from "lucide-react";
import type { AccountingTabId, CompassStructuredResponse, LiteracyTabId } from "../types/finance";
import { playSfx } from "../utils/sfx";
import { CompassFormatCard } from "./CompassFormatCard";

interface FindMistakeGameProps {
  sfxMuted: boolean;
  onTipChange?: (tip: string) => void;
  onSpeakingChange?: (speaking: boolean) => void;
  onScoreIncrement?: () => void;
  onOpenAccountingTab?: (tab: AccountingTabId) => void;
  onOpenLiteracyTab?: (tab: LiteracyTabId) => void;
  onOpenBankingTab?: () => void;
}

interface MistakeScenario {
  id: string;
  situation: string;
  title: string;
  options: Array<{ id: string; label: string }>;
  correctId: string;
  debriefCorrect: CompassStructuredResponse;
  debriefWrong: CompassStructuredResponse;
}

const SCENARIOS: MistakeScenario[] = [
  {
    id: "profit-vs-cash",
    title: "1-жағдай · Пайда мен Ақша қалдығын шатастыру",
    situation:
      "Дүкен иесі 1С-те ай соңында ОПиУ бойынша 2 500 000 ₸ таза пайда көріп, банк шотында (1030) бар болғаны 200 000 ₸ тұрғанына таңғалды. Тексергенде, тауардың басым бөлігі кейін төлеу шартымен (1210) сатылғаны анықталды.",
    options: [
      {
        id: "a",
        label:
          "ОПиУ (6010) сату сәтін көрсетеді, ал нақты ақша ДДС (1030) және 1210 берешекте жатыр",
      },
      { id: "b", label: "Банк ақшаны қате есептеген" },
      { id: "c", label: "Өзіндік құнды (7010) екі рет жазу керек еді" },
    ],
    correctId: "a",
    debriefCorrect: {
      explanation:
        "Қарапайым тілмен: тауарды қарызға сатсаңыз қағазда пайда бар, бірақ кассаға әлі ақша түспеді. Сондықтан клиенттен 1210 берешекті уақытылы жинау керек.",
      sceneDescription:
        "1210 шоттағы берешекті өндіру және ДДС (Ф.3) бақылауы ақша тапшылығын жояды.",
      sfxType: "coin",
      expertSummary:
        "Таза пайда (ОПиУ) мен шоттағы нақты ақша (ДДС) — екі бөлек көрсеткіш. Сатып алушы қарыздарын (1210) апта сайын тексеріңіз.",
      visualType: "dds",
      journalEntry: "Сату: Дт 1210 — Кт 6010 · Төлем келгенде: Дт 1030 — Кт 1210",
      doc1C: "Реализация ТМЗ + Банк көшірмесі + АСВ 1210 шоты",
      formulaLabel: "Операциялық ақша = Түскен төлем − Төленген шығыс",
      exampleCalculation: "Пайда 2.5 млн ₸, бірақ 2.3 млн ₸ — 1210 берешекте",
      keyMetricLabel: "Нақты ақша vs Берешек",
      keyMetricValue: "1030 vs 1210",
    },
    debriefWrong: {
      explanation:
        "Мұнда банк қатесі жоқ: сатып алушылар тауарды кейін төлеуге (Дт 1210) алғандықтан, ақша әлі 1030 шотқа түскен жоқ.",
      sceneDescription: "1210 шотындағы берешек өскенде ақша ағыны баяулайды.",
      sfxType: "worm_shield",
      expertSummary:
        "1С-те «Сату» (Реализация) жасағанда пайда пайда болады, ал ақша тек банк көшірмесі немесе ПКО өткізілгенде көрінеді.",
      visualType: "dds",
      journalEntry: "Дт 1210 — Кт 6010 → Дт 1030 — Кт 1210",
      doc1C: "АСВ (ОСВ) 1210 шоты · ДДС (Ф.3)",
      formulaLabel: "Түсім (6010) ≠ Нақты ақша түсімі (1030)",
      exampleCalculation: "Берешек қайтқанда 1030 шоты толады",
      keyMetricLabel: "Тексеру шоты",
      keyMetricValue: "1210 Дебиторлар",
    },
  },
  {
    id: "acquiring-commission",
    title: "2-жағдай · Эквайринг комиссиясын түсімнен шегеру",
    situation:
      "Кафе POS-терминал арқылы 1 000 000 ₸ сауда жасады. Банк 2% (20 000 ₸) комиссиясын ұстап, 1030 шотқа 980 000 ₸ аударды. Бухгалтер 1С-те 6010 кірісін 1 000 000 ₸ орнына 980 000 ₸ деп кіргізді.",
    options: [
      { id: "a", label: "POS-терминал қағазын сақтамау" },
      {
        id: "b",
        label:
          "Түсімді (6010) 1 000 000 ₸ деп толық көрсетпей, 20 000 ₸ комиссияны Дт 7210 шығысына бөлек жазбау",
      },
      { id: "c", label: "Ақшаны 1010 кассаға кіргізу керек еді" },
    ],
    correctId: "b",
    debriefCorrect: {
      explanation:
        "Дұрыс таптыңыз! Касса чегі 1 000 000 ₸ болғандықтан сату кірісі (6010) де 1 000 000 ₸ болуы керек, ал банктің 20 000 ₸ комиссиясы бөлек шығынға (Дт 7210) жазылады.",
      sceneDescription: "1022 транзит шоты арқылы сату мен банк комиссиясы нақты ажыратылды.",
      sfxType: "bricks",
      expertSummary:
        "Түсімді кемітіп көрсетсеңіз, фискалдық чек пен салық декларациясы сәйкес келмей, айыппұл қаупі туады.",
      visualType: "banking",
      journalEntry:
        "Дт 1022 — Кт 6010 (1 млн) · Дт 1030 — Кт 1022 (980 мың) · Дт 7210 — Кт 1022 (20 мың)",
      doc1C: "Төлем карталарымен төлем + Банк көшірмесі",
      formulaLabel: "Түсім (6010) = Таза түсім (1030) + Комиссия (7210)",
      exampleCalculation: "980 000 ₸ + 20 000 ₸ = 1 000 000 ₸",
      keyMetricLabel: "Дұрыс кіріс (6010)",
      keyMetricValue: "1 000 000 ₸",
    },
    debriefWrong: {
      explanation:
        "Фискалдық чек пен сату сомасы — 1 000 000 ₸. Сондықтан 6010 шотына толық 1 000 000 ₸ жазылып, 20 000 ₸ банк комиссиясы Дт 7210-ға бөлек көрсетіледі.",
      sceneDescription: "1022 және 7210 шоттары эквайринг сомасын теңестіреді.",
      sfxType: "worm_shield",
      expertSummary:
        "Эквайринг кезінде табысты комиссияға кемітпеңіз — салық органдары чек пен 6010 кірісін тексереді.",
      visualType: "banking",
      journalEntry: "Дт 1022 — Кт 6010 · Дт 7210 — Кт 1022",
      doc1C: "Оплата от покупателя платежной картой",
      formulaLabel: "Толық айналым = 6010 · Комиссия = 7210",
      exampleCalculation: "20 000 ₸ шығын ретінде шегерімге жатады",
      keyMetricLabel: "Шығыс шоты",
      keyMetricValue: "Дт 7210",
    },
  },
  {
    id: "close-month-1c",
    title: "3-жағдай · 1С-те «Айды жабу» операциясын ұмыту",
    situation:
      "Бухгалтер наурыз айының барлық түсімдері мен сату құжаттарын 1С-ке енгізіп, бірден АСВ (ОСВ) ашты. Бірақ 6010, 7010 және 7210 шоттарында қалдықтар ілініп тұр және Ф.2 (ОПиУ) есебінде таза пайда дұрыс жиналмады.",
    options: [
      { id: "a", label: "«Айды жабу» (Закрытие месяца) регламенттік құжаты өткізілмеген" },
      { id: "b", label: "1010 касса шотында ақша жетіспейді" },
      { id: "c", label: "Барлық шот-фактураларды қайта басып шығару керек" },
    ],
    correctId: "a",
    debriefCorrect: {
      explanation:
        "Дәл солай! 6010 (Кіріс) пен 7010–7210 (Шығыс) — ай сайын жабылатын уақытша шоттар. «Айды жабу» батырмасын басқанда ғана олар 5610 Қорытынды пайдаға аударылады.",
      sceneDescription:
        "Айды жабудан кейін 6010 және 7000-бөлім шоттары нөлденіп, ОПиУ мен Баланс теңесті.",
      sfxType: "harvest",
      expertSummary:
        "Ай соңында есеп тапсырмас бұрын «1С: Журнал» ішінде «Айды жабу» операциясын міндетті түрде орындаңыз.",
      visualType: "osv_1c",
      journalEntry: "Айды жабу: 6010, 7010, 7210 → 5610 (Қорытынды пайда)",
      doc1C: "Операции → Закрытие месяца → ОСВ",
      formulaLabel: "Транзиттік шоттар ай соңындағы сальдосы = 0 ₸",
      exampleCalculation: "5610 шоты таза пайданы Балансқа береді",
      keyMetricLabel: "Регламенттік қадам",
      keyMetricValue: "Айды жабу",
    },
    debriefWrong: {
      explanation:
        "Себебі — «Айды жабу» (Закрытие месяца) орындалмаған. Онсыз 6010 және 7010/7210 шоттары 5610-ға жабылмайды.",
      sceneDescription: "Транзиттік шоттар ай соңында нөлге жабылуы тиіс.",
      sfxType: "worm_shield",
      expertSummary:
        "1С-те есеп тапсырар алдында: 1) Құжаттарды өткізу, 2) Айды жабу, 3) АСВ тексеру ретін сақтаңыз.",
      visualType: "osv_1c",
      journalEntry: "Дт 6010 / Кт 5610 және Дт 5610 / Кт 7010, 7210",
      doc1C: "Закрытие месяца",
      formulaLabel: "6010 − (7010 + 7210) → 5610",
      exampleCalculation: "Қорытынды қалдық = 0 ₸ (6010–7210)",
      keyMetricLabel: "Міндетті операция",
      keyMetricValue: "Закрытие месяца",
    },
  },
  {
    id: "cash-withdraw-cc",
    title: "4-жағдай · Кредит картасынан банкоматтан ақша шешу",
    situation:
      "Әлия 55 күндік «пайызсыз» грейс-кезеңі бар несие картасынан банкомат арқылы 200 000 ₸ қолма-қол ақша шешіп алып, «55 күн ішінде қайтарсам тегін болады» деп ойлады. Ай соңында шотқа +20 000 ₸ артық қарыз қосылды. Неге?",
    options: [
      { id: "a", label: "Банкомат қателесіп екі рет шешкен" },
      {
        id: "b",
        label:
          "Қолма-қол ақша шешуге грейс-кезең жүрмейді: 4% комиссия және бірінші күннен 30%+ пайыз қосылады",
      },
      { id: "c", label: "Картаның PIN-коды ескірген" },
    ],
    correctId: "b",
    debriefCorrect: {
      explanation:
        "Өте дұрыс! Банктер грейс-кезеңді тек дүкенде немесе онлайн картамен төлегенде ғана береді. Ал банкоматтан шешсеңіз немесе P2P аударсаңыз — бірден комиссия мен жоғары пайыз қосылады.",
      sceneDescription: "Қолма-қолсыз төлем vs банкоматтан шешудің нақты айырмашылығы.",
      sfxType: "worm_shield",
      expertSummary:
        "Несие картасынан ешқашан қолма-қол ақша шешпеңіз — оны тек терминал немесе онлайн төлемге қолданыңыз.",
      visualType: "banking",
      journalEntry: "Төлем (POS/Онлайн) = 0% грейс · Ақша шешу = 4% + 32% жылдық",
      doc1C: "Карта тарифі · Қолма-қол шешу комиссиясы",
      formulaLabel: "Артық шығын = Комиссия 4% + Күнделікті пайыз",
      exampleCalculation: "200 000 ₸ шешкенде ~20 000 ₸ артық шығын",
      keyMetricLabel: "Алтын ереже",
      keyMetricValue: "Тек қолма-қолсыз төлем",
    },
    debriefWrong: {
      explanation:
        "Себебі — несие картасынан қолма-қол ақша шешу кезінде грейс-кезең істемейді! Бірден 3–4% комиссия және сол күннен бастап жылдық 30%+ пайыз есептеледі.",
      sceneDescription: "Грейс-кезең тек тауар мен қызметке картамен төлегенде ғана сақталады.",
      sfxType: "worm_shield",
      expertSummary: "Егер қолма-қол ақша керек болса, несие картасынан гөрі қарапайым қорды қолданыңыз.",
      visualType: "banking",
      journalEntry: "Ақша шешу = Грейс жойылады",
      doc1C: "Банк шарты",
      formulaLabel: "4% комиссия + 30%+ пайыз",
      exampleCalculation: "~20 000 ₸ артық төлем",
      keyMetricLabel: "Дұрыс жауап",
      keyMetricValue: "Грейс жүрмейді",
    },
  },
];

type MistakeLabKind = "cases" | "dkQuick" | "reportsLink" | null;

export function FindMistakeGame({
  sfxMuted,
  onTipChange,
  onSpeakingChange,
  onScoreIncrement,
  onOpenAccountingTab,
  onOpenLiteracyTab,
  onOpenBankingTab,
}: FindMistakeGameProps) {
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [foundCount, setFoundCount] = useState(0);
  const [activeLab, setActiveLab] = useState<MistakeLabKind>(null);
  const [quickPick, setQuickPick] = useState<string | null>(null);

  const scenario = SCENARIOS[idx];
  const isAnswered = selected !== null;
  const isCorrect = selected === scenario.correctId;

  const handleChoose = (optId: string) => {
    if (isAnswered) return;
    setSelected(optId);
    const right = optId === scenario.correctId;
    if (right) {
      setFoundCount((c) => c + 1);
      onScoreIncrement?.();
      playSfx(scenario.debriefCorrect.sfxType, sfxMuted);
      onTipChange?.("Дұрыс таптыңыз! Қарапайым шешімі мен 1С проводкасы төменде көрсетілген.");
    } else {
      playSfx("worm_shield", sfxMuted);
      onTipChange?.("Талдауға назар аударыңыз — неліктен бұлай болғаны қарапайым түсіндірілді.");
    }
  };

  const handleNext = () => {
    setSelected(null);
    setIdx((prev) => (prev + 1) % SCENARIOS.length);
    onTipChange?.("Келесі нақты өмірлік жағдаяттағы қатені анықтап көріңіз.");
  };

  const handleReset = () => {
    setSelected(null);
    setIdx(0);
    setFoundCount(0);
    onTipChange?.("Кейстер жаңартылды. Қаржы, банк және 1С логикасын тексеріңіз.");
  };

  const toggleLab = (k: Exclude<MistakeLabKind, null>) => {
    setActiveLab((cur) => (cur === k ? null : k));
    playSfx("coin", sfxMuted);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
      <div className="xl:col-span-6 bg-white border border-emerald-900/10 rounded-2xl shadow-[0_4px_20px_rgba(6,78,59,0.05)] p-5 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1">
            <AlertOctagon className="w-3.5 h-3.5 text-amber-600" />
            <span>Есептегі қатені тап</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 tabular-nums">
            <span>Табылғаны: {foundCount}</span>
            <button
              type="button"
              onClick={handleReset}
              aria-label="Қайта бастау"
              className="p-1.5 rounded-xl border border-emerald-900/15 text-slate-500 hover:text-emerald-900 hover:bg-emerald-50 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="rounded-xl bg-[#F6F8F7] border border-emerald-900/10 p-4 space-y-1.5">
          <div className="text-xs font-bold text-emerald-900">{scenario.title}</div>
          <p className="text-sm text-slate-800 leading-relaxed font-medium">{scenario.situation}</p>
        </div>

        <div className="text-xs font-bold text-slate-700">Мұнда қандай басты қателік бар?</div>

        <div className="space-y-2">
          {scenario.options.map((opt) => {
            const isSel = selected === opt.id;
            const isRight = opt.id === scenario.correctId;

            let style =
              "border-emerald-900/15 bg-white text-slate-800 hover:border-emerald-500 hover:bg-emerald-50/40";
            if (isAnswered) {
              if (isRight) {
                style = "border-emerald-600 bg-emerald-50 text-emerald-950 font-bold";
              } else if (isSel) {
                style = "border-red-400 bg-red-50 text-red-900";
              } else {
                style = "border-slate-200 bg-slate-50 text-slate-400";
              }
            }

            return (
              <button
                key={opt.id}
                type="button"
                disabled={isAnswered}
                onClick={() => handleChoose(opt.id)}
                className={`w-full min-h-[46px] text-left px-4 py-2.5 rounded-xl border text-xs sm:text-sm transition-colors flex items-center justify-between gap-3 cursor-pointer disabled:cursor-default ${style}`}
              >
                <span>{opt.label}</span>
                {isAnswered && isRight && <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />}
                {isAnswered && isSel && !isRight && (
                  <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        <div className="pt-2 border-t border-emerald-900/10 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {SCENARIOS.map((sc, sIdx) => (
              <button
                key={sc.id}
                type="button"
                onClick={() => {
                  setIdx(sIdx);
                  setSelected(null);
                }}
                className={`w-7 h-7 rounded-lg text-xs font-bold tabular-nums cursor-pointer ${
                  sIdx === idx
                    ? "bg-emerald-800 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {sIdx + 1}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={handleNext}
            className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[38px] text-xs font-bold rounded-xl bg-emerald-800 text-white hover:bg-emerald-900 transition-colors cursor-pointer"
          >
            <span>Келесі жағдай</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="xl:col-span-6 anim-panel-enter">
        {!isAnswered ? (
          <div className="bg-gradient-to-br from-emerald-900 to-emerald-800 text-white rounded-2xl p-5 sm:p-6 space-y-3.5 shadow-[0_4px_20px_rgba(6,78,59,0.12)]">
            <div className="text-xs font-bold text-amber-300">
              Бухгалтерлік, Банк және 1С сараптама кейстері
            </div>
            <h3 className="text-lg font-extrabold leading-snug">
              Күнделікті ақша, карта және 1С қателерін табыңыз
            </h3>
            <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed">
              Төмендегі 3 карточканың кез келгенін басып, қарапайым түсіндірме мен шағын
              тренажерді ашыңыз немесе сол жақтағы жағдайға жауап беріңіз.
            </p>

            {/* 3 INTERACTIVE CLICKABLE CARDS */}
            <div className="pt-1 grid grid-cols-3 gap-2 text-center">
              <button
                type="button"
                onClick={() => toggleLab("cases")}
                className={`rounded-xl p-2.5 border transition-colors cursor-pointer ${
                  activeLab === "cases"
                    ? "bg-amber-500 text-white border-amber-300"
                    : "bg-white/10 hover:bg-white/20 border-white/15"
                }`}
              >
                <div
                  className={`text-base font-extrabold tabular-nums ${
                    activeLab === "cases" ? "text-white" : "text-amber-300"
                  }`}
                >
                  {SCENARIOS.length}
                </div>
                <div className="text-[11px] text-emerald-100">Нақты кейс · Ашу</div>
              </button>

              <button
                type="button"
                onClick={() => toggleLab("dkQuick")}
                className={`rounded-xl p-2.5 border transition-colors cursor-pointer ${
                  activeLab === "dkQuick"
                    ? "bg-amber-500 text-white border-amber-300"
                    : "bg-white/10 hover:bg-white/20 border-white/15"
                }`}
              >
                <div
                  className={`text-base font-extrabold tabular-nums ${
                    activeLab === "dkQuick" ? "text-white" : "text-amber-300"
                  }`}
                >
                  1С
                </div>
                <div className="text-[11px] text-emerald-100">Дт / Кт талдау</div>
              </button>

              <button
                type="button"
                onClick={() => toggleLab("reportsLink")}
                className={`rounded-xl p-2.5 border transition-colors cursor-pointer ${
                  activeLab === "reportsLink"
                    ? "bg-amber-500 text-white border-amber-300"
                    : "bg-white/10 hover:bg-white/20 border-white/15"
                }`}
              >
                <div
                  className={`text-base font-extrabold ${
                    activeLab === "reportsLink" ? "text-white" : "text-amber-300"
                  }`}
                >
                  Ф.1–Ф.3
                </div>
                <div className="text-[11px] text-emerald-100">Есеп байланысы</div>
              </button>
            </div>

            {activeLab === "cases" && (
              <div className="rounded-xl bg-white text-slate-900 p-4 space-y-2 text-xs anim-panel-enter">
                <div className="flex items-center justify-between font-extrabold text-emerald-950">
                  <span>Барлық {SCENARIOS.length} кейстің тізімі (Таңдау үшін басыңыз)</span>
                  <button
                    type="button"
                    onClick={() => setActiveLab(null)}
                    className="p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="space-y-1.5">
                  {SCENARIOS.map((sc, sIdx) => (
                    <button
                      key={sc.id}
                      type="button"
                      onClick={() => {
                        setIdx(sIdx);
                        setSelected(null);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg border font-semibold cursor-pointer ${
                        sIdx === idx
                          ? "bg-emerald-50 border-emerald-500 text-emerald-950"
                          : "bg-[#F6F8F7] border-slate-200 text-slate-700 hover:bg-emerald-50/40"
                      }`}
                    >
                      {sc.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeLab === "dkQuick" && (
              <div className="rounded-xl bg-white text-slate-900 p-4 space-y-2.5 text-xs anim-panel-enter">
                <div className="flex items-center justify-between font-extrabold text-emerald-950">
                  <span>1С Дт / Кт Жылдам мини-жаттығу</span>
                  <button
                    type="button"
                    onClick={() => setActiveLab(null)}
                    className="p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-slate-700">
                  Сұрақ: Жабдықтаушыға банк шотынан 500 000 ₸ төлегенде дұрыс проводка қайсы?
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "ok", label: "Дт 3310 — Кт 1030" },
                    { id: "no", label: "Дт 1030 — Кт 3310" },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setQuickPick(opt.id)}
                      className={`px-3 py-2 rounded-lg border font-bold cursor-pointer ${
                        quickPick === opt.id
                          ? opt.id === "ok"
                            ? "bg-emerald-700 text-white border-emerald-800"
                            : "bg-red-100 text-red-900 border-red-400"
                          : "bg-[#F6F8F7] border-slate-200 text-slate-800"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {quickPick && (
                  <div className="text-[11px] font-semibold text-emerald-900">
                    {quickPick === "ok"
                      ? "Дәл таптыңыз! Қарызымыз азайды (Дт 3310), банктен ақша кетті (Кт 1030)."
                      : "Қайта ойланайық: ақша банктен шыққанда 1030 Кредитке (Кт 1030) жазылады."}
                  </div>
                )}
                {onOpenAccountingTab && (
                  <button
                    type="button"
                    onClick={() => onOpenAccountingTab("trainer")}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-800 text-white font-bold hover:bg-emerald-900 cursor-pointer"
                  >
                    <span>10 операциялық Дт/Кт жаттығуына өту</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            {activeLab === "reportsLink" && (
              <div className="rounded-xl bg-white text-slate-900 p-4 space-y-2 text-xs anim-panel-enter">
                <div className="flex items-center justify-between font-extrabold text-emerald-950">
                  <span>Ф.1 (Баланс) · Ф.2 (ОПиУ) · Ф.3 (ДДС) байланысы</span>
                  <button
                    type="button"
                    onClick={() => setActiveLab(null)}
                    className="p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <ul className="space-y-1 text-slate-700">
                  <li>
                    • <strong>Ф.1 Баланс:</strong> Дәл бүгін бізде не бар (1010–2410) және кімге
                    қарызбыз (3310–5610).
                  </li>
                  <li>
                    • <strong>Ф.2 ОПиУ:</strong> Қанша сатып, қанша пайда таптық (6010 − 7010 − 7210).
                  </li>
                  <li>
                    • <strong>Ф.3 ДДС:</strong> Нақты касса мен банкке қанша теңге кіріп-шықты.
                  </li>
                </ul>
                <div className="flex flex-wrap gap-2 pt-1">
                  {onOpenAccountingTab && (
                    <button
                      type="button"
                      onClick={() => onOpenAccountingTab("oneC")}
                      className="px-3 py-1.5 rounded-lg bg-emerald-800 text-white font-bold cursor-pointer"
                    >
                      1С Журналда көру
                    </button>
                  )}
                  {onOpenLiteracyTab && (
                    <button
                      type="button"
                      onClick={() => onOpenLiteracyTab("debts")}
                      className="px-3 py-1.5 rounded-lg bg-amber-100 text-amber-950 font-bold cursor-pointer"
                    >
                      Қарыз & Тұзақтар
                    </button>
                  )}
                  {onOpenBankingTab && (
                    <button
                      type="button"
                      onClick={onOpenBankingTab}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-800 font-bold cursor-pointer"
                    >
                      Банк салыстыру
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <CompassFormatCard
            data={isCorrect ? scenario.debriefCorrect : scenario.debriefWrong}
            sfxMuted={sfxMuted}
            showVisualStage={true}
            stageProgress={isCorrect ? 0.92 : 0.45}
            onSpeakingChange={onSpeakingChange}
            compactStage={true}
          />
        )}
      </div>
    </div>
  );
}
