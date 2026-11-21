import { useState, useEffect } from "react";
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  Calculator,
  Trophy,
  AlertOctagon,
  ArrowUpRight,
  X,
} from "lucide-react";
import type { AccountingTabId, CompassStructuredResponse, LiteracyTabId } from "../types/finance";
import { formatTenge } from "../utils/financeMath";
import { KZ_ACCOUNTS } from "../utils/oneCEngine";
import { playSfx } from "../utils/sfx";
import { CompassFormatCard } from "./CompassFormatCard";
import { FormulaVaultSection } from "./FormulaVaultSection";
import { FindMistakeGame } from "./FindMistakeGame";
import { AnimatedCounter } from "./AnimatedCounter";

interface PracticeQuizSectionProps {
  sfxMuted: boolean;
  onOpenLiteracyTab: (tab: LiteracyTabId) => void;
  onOpenAccountingTab: (tab: AccountingTabId) => void;
  onOpenBankingTab: () => void;
  onTipChange?: (tip: string) => void;
  onSpeakingChange?: (speaking: boolean) => void;
  onLevelChange?: (levelText: string) => void;
}

interface PracticeChallenge {
  id: string;
  title: string;
  category: string;
  question: string;
  options: Array<{ id: string; label: string }>;
  correctOptionId: string;
  debriefCorrect: CompassStructuredResponse;
  debriefWrong: CompassStructuredResponse;
}

const CHALLENGES: PracticeChallenge[] = [
  {
    id: "rule-72",
    title: "1-тапсырма · 72 ережесі",
    category: "Қаржылық сауаттылық",
    question:
      "1 000 000 ₸ жинағыңыз жылдық 12% күрделі пайызбен өсіп тұр. Қаражатыңыз шамамен неше жылда 2 000 000 ₸ болып екі еселенеді?",
    options: [
      { id: "a", label: "4 жылда (72 ÷ 18)" },
      { id: "b", label: "6 жылда (72 ÷ 12 = 6)" },
      { id: "c", label: "10 жылда" },
    ],
    correctOptionId: "b",
    debriefCorrect: {
      explanation:
        "Өте дұрыс! «72 ережесі» қарапайым: 72 санын жылдық пайызға (12) бөлсеңіз, ақшаңыздың дәл неше жылда екі есе өсетіні шығады — 6 жыл.",
      sceneDescription: "Күрделі пайыз есебі: уақыт өткен сайын пайызға пайыз қосылып өседі.",
      sfxType: "harvest",
      expertSummary:
        "Кез келген депозит немесе инвестицияның екі еселену мерзімін 72 / r формуласымен 3 секундта бағалай аласыз.",
      visualType: "literacy",
      journalEntry: "T_2x ≈ 72 / 12% = 6 жыл",
      doc1C: "Инвестициялық жоспар",
      formulaLabel: "FV = P · (1 + r)^n",
      exampleCalculation: "1 000 000 × (1.12)^6 ≈ 1 973 823 ₸",
      keyMetricLabel: "Екі еселену уақыты",
      keyMetricValue: "6 жыл",
    },
    debriefWrong: {
      explanation:
        "72 ережесін қолданайық: 72 ÷ 12 = 6 жыл. Бұл депозит пен инвестицияның қанша уақытта екі еселенетінін оңай тексеруге көмектеседі.",
      sceneDescription: "72 ережесі күрделі пайыздың жылдам бағалау тәсілі.",
      sfxType: "worm_shield",
      expertSummary: "Екі еселену уақытын табу үшін 72 санын жылдық мөлшерлемеге бөліңіз.",
      visualType: "literacy",
      journalEntry: "T_2x ≈ 72 / r",
      doc1C: "Күрделі пайыз кестесі",
      formulaLabel: "72 / 12 = 6 жыл",
      exampleCalculation: "6 жылда ~2 000 000 ₸",
      keyMetricLabel: "Дұрыс жауап",
      keyMetricValue: "6 жыл",
    },
  },
  {
    id: "installment-trap",
    title: "2-тапсырма · «0% Бөліп төлеу» тұзағы",
    category: "Күнделікті сауаттылық",
    question:
      "Дүкенде смартфон қолма-қол 350 000 ₸ тұрады, ал «0% бөліп төлеумен» бағасы — 410 000 ₸. Шын мәнінде қанша артық төлейсіз?",
    options: [
      { id: "a", label: "0 ₸, өйткені бөліп төлеу 0% деп жазылған" },
      { id: "b", label: "60 000 ₸ артық төлейсіз — пайыз тауар бағасына кіріп кеткен" },
      { id: "c", label: "Тек 10 000 ₸" },
    ],
    correctOptionId: "b",
    debriefCorrect: {
      explanation:
        "Дәл таптыңыз! «0%» деген жазуға алданбаңыз: егер қолма-қол бағасы 350 000 ₸, ал бөліп төлеу 410 000 ₸ болса, 60 000 ₸ үстеме — тауар ішіндегі жасырын пайыз.",
      sceneDescription: "Қолма-қол баға мен бөліп төлеу бағасының нақты айырмашылығы.",
      sfxType: "worm_shield",
      expertSummary:
        "Зат сатып аларда әрқашан «Қолма-қол төлесем қанша жеңілдік бар?» деп сұрап, нақты бағаны салыстырыңыз.",
      visualType: "banking",
      journalEntry: "Жасырын пайыз = 410 000 − 350 000 = 60 000 ₸",
      doc1C: "Тұтынушылық салыстыру",
      formulaLabel: "Үстеме = Бөліп төлеу бағасы − Қолма-қол баға",
      exampleCalculation: "60 000 ₸ үнемдеуге болады",
      keyMetricLabel: "Жасырын артық төлем",
      keyMetricValue: "60 000 ₸",
    },
    debriefWrong: {
      explanation:
        "Мұнда жасырын үстеме бар: 410 000 − 350 000 = 60 000 ₸. Көп дүкен банк комиссиясын алдын ала тауар бағасына қосып қояды.",
      sceneDescription: "Тауар бағасын бірнеше дүкеннен қолма-қол бағамен салыстырыңыз.",
      sfxType: "worm_shield",
      expertSummary: "«0%» сөзіне емес, соңғы төлейтін теңге сомасына қараңыз.",
      visualType: "banking",
      journalEntry: "410 000 − 350 000 = 60 000 ₸",
      doc1C: "Баға салыстыру ережесі",
      formulaLabel: "Шынайы құн = Қолма-қол баға",
      exampleCalculation: "Үнем: 60 000 ₸",
      keyMetricLabel: "Дұрыс жауап",
      keyMetricValue: "60 000 ₸",
    },
  },
  {
    id: "low-income-saving",
    category: "Қаржылық жастық",
    title: "3-тапсырма · Аз табыспен жинау",
    question:
      "Айлық табысыңыз 240 000 ₸ болса және 20% жинауға мүмкіндік болмаса, қаржылық жастық жинауды қалай бастаған дұрыс?",
    options: [
      { id: "a", label: "Айлық көбейгенше мүлде жинамай күту" },
      { id: "b", label: "Түскен күні бірден 5–10% (12 000–24 000 ₸) бөлек депозитке салу" },
      { id: "c", label: "Ай соңында қалған тиын-тебенді ғана қосу" },
    ],
    correctOptionId: "b",
    debriefCorrect: {
      explanation:
        "Керемет! Ақша түскен күні 10% (24 000 ₸) бөлек депозитке салсаңыз, 1 жылда сыйақысымен ~310 000 ₸ қор жиналады — бұл шұғыл жағдайда несие алмауға жетеді.",
      sceneDescription: "Шағын, бірақ тұрақты айлық аударым 1 жылда мықты қорға айналады.",
      sfxType: "water",
      expertSummary: "Бірінші өзіңізге төлеңіз: кішкентай 10% қадам бос күткеннен 10 есе артық.",
      visualType: "literacy",
      journalEntry: "Табыс күні: 10% (24 000 ₸) → Бөлек депозит",
      doc1C: "Жеке қаржы жастығы",
      formulaLabel: "24 000 ₸ × 12 ай + 14% ≈ 310 000 ₸",
      exampleCalculation: "Жылына ~310 000 ₸ қор",
      keyMetricLabel: "1 жылдық жинақ",
      keyMetricValue: "~310 000 ₸",
    },
    debriefWrong: {
      explanation:
        "Дұрысы — жалақы түскен күні бірден 5–10% (12 000–24 000 ₸) бөлек депозитке аудару. Ай соңына дейін күтсеңіз, ақша түгел жұмсалып кетеді.",
      sceneDescription: "Ақша түскен сәтте бөлінген қор ғана сақталады.",
      sfxType: "worm_shield",
      expertSummary: "Үлкен соманы күтпеңіз — айына 15–20 мың теңгеден бастау әдетті қалыптастырады.",
      visualType: "literacy",
      journalEntry: "Автоаударым 10% → Депозит",
      doc1C: "Қаржылық жастық жоспары",
      formulaLabel: "10% × 12 ай + %",
      exampleCalculation: "~310 000 ₸ / жыл",
      keyMetricLabel: "Дұрыс тәсіл",
      keyMetricValue: "Түскен күні 10%",
    },
  },
  {
    id: "posting-1030",
    title: "4-тапсырма · Банк көшірмесі",
    category: "1С проводкасы",
    question:
      "Сатып алушы бұрын жеткізілген тауар үшін есеп айырысу шотымызға 450 000 ₸ аударды. 1С:Бухгалтерияда қандай проводка жасалады?",
    options: [
      { id: "a", label: "Дт 1210 — Кт 1030" },
      { id: "b", label: "Дт 1030 — Кт 1210" },
      { id: "c", label: "Дт 1010 — Кт 6010" },
    ],
    correctOptionId: "b",
    debriefCorrect: {
      explanation:
        "Дәл таптыңыз! Есеп айырысу шотына (1030) ақша кіргендіктен ол Дебетке жазылады (Дт 1030), ал сатып алушының қарызы (1210) Кредитпен жабылады (Кт 1210).",
      sceneDescription:
        "Банк көшірмесі өткізілгенде 1030 шоты өсіп, 1210 дебиторлық берешек нөлденеді.",
      sfxType: "coin",
      expertSummary:
        "Оңай ереже: 1030 шотына ақша кірсе — Дт 1030, шықса — Кт 1030.",
      visualType: "osv_1c",
      journalEntry: "Дт 1030 (Есеп шот) — Кт 1210 (Сатып алушы)",
      doc1C: "Платежное поручение входящее (Банк көшірмесі)",
      formulaLabel: "1030 (Дт +) = 1210 (Кт −)",
      exampleCalculation: "Дт 1030 / Кт 1210: 450 000 ₸",
      keyMetricLabel: "Дұрыс проводка",
      keyMetricValue: "Дт 1030 — Кт 1210",
    },
    debriefWrong: {
      explanation:
        "Абай болыңыз: 1030 — банк шоты, ақша түскенде оның Дебеті көбейеді (Дт 1030), ал сатып алушы қарызы (1210) Кредитке кетіп азаяды (Кт 1210).",
      sceneDescription: "Банк шотына түскен қаражат 1030 дебетінде тіркеледі.",
      sfxType: "worm_shield",
      expertSummary: "Касса (1010) мен Банкке (1030) ақша кірісі әрдайым Дебет (Дт) жағына жазылады.",
      visualType: "osv_1c",
      journalEntry: "Дт 1030 — Кт 1210",
      doc1C: "Банк көшірмесі (Түсім)",
      formulaLabel: "Активті шот кірісі = Дебет",
      exampleCalculation: "450 000 ₸ Дт 1030 шотына түсті",
      keyMetricLabel: "Дұрыс жазба",
      keyMetricValue: "Дт 1030 — Кт 1210",
    },
  },
  {
    id: "balance-eq",
    title: "5-тапсырма · Баланс теңдігі",
    category: "Бухгалтерлік баланс (Ф.1)",
    question:
      "Компанияның барлық мүлкі мен ақшасы (Активтер) 18 000 000 ₸, ал қарыздары (Міндеттемелер) 6 500 000 ₸. Таза меншікті капитал қанша?",
    options: [
      { id: "a", label: "24 500 000 ₸" },
      { id: "b", label: "11 500 000 ₸" },
      { id: "c", label: "6 500 000 ₸" },
    ],
    correctOptionId: "b",
    debriefCorrect: {
      explanation:
        "Керемет! Бар мүліктен (18 000 000 ₸) барлық қарызды (6 500 000 ₸) алып тастасаңыз, иесіне тиесілі таза меншікті капитал — 11 500 000 ₸ қалады.",
      sceneDescription:
        "Баланс теңдігі: Актив 18 млн ₸ = Міндеттеме 6.5 млн ₸ + Капитал 11.5 млн ₸.",
      sfxType: "bricks",
      expertSummary:
        "Жеке өмірде де солай: Пәтер/жинақтан барлық несиені шегерсеңіз — сіздің таза капиталыңыз шығады.",
      visualType: "balance",
      journalEntry: "Активтер (18 млн) = Міндеттеме (6.5 млн) + Капитал (11.5 млн)",
      doc1C: "Бухгалтерлік баланс (Ф.1)",
      formulaLabel: "Капитал = Активтер − Міндеттемелер",
      exampleCalculation: "18 000 000 − 6 500 000 = 11 500 000 ₸",
      keyMetricLabel: "Меншікті капитал",
      keyMetricValue: "11 500 000 ₸",
    },
    debriefWrong: {
      explanation:
        "Меншікті капиталды табу үшін бар мүліктен қарызды алып тастаймыз: 18 000 000 − 6 500 000 = 11 500 000 ₸.",
      sceneDescription: "Баланс пассиві міндеттемелер мен меншікті капиталдан тұрады.",
      sfxType: "worm_shield",
      expertSummary: "Активтерден барлық қарызды шегергенде нақты меншікті капитал қалады.",
      visualType: "balance",
      journalEntry: "Капитал = Актив − Міндеттеме",
      doc1C: "Бухгалтерлік баланс (Ф.1)",
      formulaLabel: "E = A − L",
      exampleCalculation: "18 000 000 − 6 500 000 = 11 500 000 ₸",
      keyMetricLabel: "Дұрыс жауап",
      keyMetricValue: "11 500 000 ₸",
    },
  },
  {
    id: "overdraft-bank",
    title: "6-тапсырма · Банктік овердрафт",
    category: "Банктік қызметтер",
    question:
      "Шотта ақша жетпей қалғанда, шұғыл төлем жасау үшін тек нақты пайдаланылған күндерге ғана пайыз төленетін банктік өнім қалай аталады?",
    options: [
      { id: "a", label: "Мерзімді бизнес депозит" },
      { id: "b", label: "Овердрафт" },
      { id: "c", label: "Банктік кепілдік" },
    ],
    correctOptionId: "b",
    debriefCorrect: {
      explanation:
        "Дәл таптыңыз! Овердрафт — уақытша ақша жетпегенде 5–10 күнге қолданатын қысқа лимит. Пайыз тек сол 5–10 күнге ғана есептеледі.",
      sceneDescription:
        "Шотқа түсім түскен бойда овердрафт қарызы автоматты түрде жабылады.",
      sfxType: "water",
      expertSummary:
        "Бір апталық төлем үшін 1 жылға несие алғаннан гөрі, овердрафт әлдеқайда арзан түседі.",
      visualType: "banking",
      journalEntry: "Алу: Дт 1030 — Кт 3010 · Пайыз: Дт 7310 — Кт 3050",
      doc1C: "Банк көшірмесі (Овердрафт операциясы)",
      formulaLabel: "Пайыз = Сома × (Мөлшерлеме / 365) × Күн саны",
      exampleCalculation: "1 000 000 ₸ × 24% × (10 / 365) ≈ 6 575 ₸",
      keyMetricLabel: "Банк өнімі",
      keyMetricValue: "Овердрафт",
    },
    debriefWrong: {
      explanation:
        "Дұрыс жауап — Овердрафт. Депозит жинақ сақтауға, ал банктік кепілдік тендерге қатысуға арналған.",
      sceneDescription: "Овердрафт шоттағы уақытша ақша тапшылығын лезде жабады.",
      sfxType: "worm_shield",
      expertSummary: "Қысқа касса алшақтығы кезінде овердрафт арзанырақ түседі.",
      visualType: "banking",
      journalEntry: "Дт 1030 — Кт 3010 (Овердрафт)",
      doc1C: "Банк көшірмесі",
      formulaLabel: "Пайыз = Сома × (r / 365) × Күн",
      exampleCalculation: "Тек қолданған күндер үшін төлем",
      keyMetricLabel: "Дұрыс жауап",
      keyMetricValue: "Овердрафт",
    },
  },
];

type PreviewLabKind = "rule72" | "accounts1c" | "bankLab" | null;

export function PracticeQuizSection({
  sfxMuted,
  onOpenLiteracyTab,
  onOpenAccountingTab,
  onOpenBankingTab,
  onTipChange,
  onSpeakingChange,
  onLevelChange,
}: PracticeQuizSectionProps) {
  const [subTab, setSubTab] = useState<"quiz" | "mistakes" | "formulas">("quiz");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [solvedIds, setSolvedIds] = useState<string[]>([]);
  const [mistakeScore, setMistakeScore] = useState(0);

  // Interactive preview lab when clicking any of the 3 thematic cards
  const [activeLab, setActiveLab] = useState<PreviewLabKind>(null);
  const [labRatePct, setLabRatePct] = useState(14);
  const [labAccountIdx, setLabAccountIdx] = useState(0);
  const [labOverdraftDays, setLabOverdraftDays] = useState(7);

  const challenge = CHALLENGES[currentIdx];
  const isAnswered = selectedOption !== null;
  const isCorrect = selectedOption === challenge.correctOptionId;

  const totalPoints = solvedIds.length + mistakeScore;
  const levelNum = 1 + Math.floor(totalPoints / 2);
  const levelTitle = `${levelNum}-деңгей`;

  useEffect(() => {
    onLevelChange?.(levelTitle);
  }, [levelTitle, onLevelChange]);

  const progressPct = Math.round((solvedIds.length / CHALLENGES.length) * 100);

  const handleSelectOption = (optionId: string) => {
    if (isAnswered) return;
    setSelectedOption(optionId);
    const right = optionId === challenge.correctOptionId;
    if (right) {
      const nextSolved = solvedIds.includes(challenge.id)
        ? solvedIds
        : [...solvedIds, challenge.id];
      setSolvedIds(nextSolved);
      playSfx(challenge.debriefCorrect.sfxType, sfxMuted);
      onTipChange?.("Тамаша! Дұрыс жауап пен қаржылық логиканы таңдадыңыз.");
    } else {
      playSfx("worm_shield", sfxMuted);
      onTipChange?.("Талдауды оқып, қарапайым формула мен мысалды бекітіп алыңыз.");
    }
  };

  const handleNext = () => {
    setSelectedOption(null);
    setCurrentIdx((prev) => (prev + 1) % CHALLENGES.length);
    onTipChange?.("Келесі тапсырманы орындап, біліміңізді тексеріңіз.");
  };

  const handleReset = () => {
    setSolvedIds([]);
    setSelectedOption(null);
    setCurrentIdx(0);
    onTipChange?.("Тест қайта басталды.");
  };

  const openLabCard = (kind: Exclude<PreviewLabKind, null>) => {
    setActiveLab((cur) => (cur === kind ? null : kind));
    playSfx("coin", sfxMuted);
  };

  const labAccount = KZ_ACCOUNTS[labAccountIdx % 6];
  const rule72Years = (72 / Math.max(1, labRatePct)).toFixed(1);
  const labOverdraftFee = Math.round(1_000_000 * 0.24 * (labOverdraftDays / 365));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="inline-flex flex-wrap items-center gap-1 p-1.5 bg-white border border-emerald-900/10 rounded-2xl shadow-[0_2px_10px_rgba(6,78,59,0.04)]">
          <button
            type="button"
            onClick={() => setSubTab("quiz")}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] text-xs font-bold rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              subTab === "quiz"
                ? "bg-emerald-800 text-white"
                : "text-slate-600 hover:text-emerald-950 hover:bg-emerald-50/80"
            }`}
          >
            <Trophy className={`w-3.5 h-3.5 ${subTab === "quiz" ? "text-amber-300" : "text-emerald-700"}`} />
            <span>Білім тесті</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab("mistakes")}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] text-xs font-bold rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              subTab === "mistakes"
                ? "bg-emerald-800 text-white"
                : "text-slate-600 hover:text-emerald-950 hover:bg-emerald-50/80"
            }`}
          >
            <AlertOctagon
              className={`w-3.5 h-3.5 ${subTab === "mistakes" ? "text-amber-300" : "text-amber-600"}`}
            />
            <span>Есептегі қатені тап</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab("formulas")}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] text-xs font-bold rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              subTab === "formulas"
                ? "bg-emerald-800 text-white"
                : "text-slate-600 hover:text-emerald-950 hover:bg-emerald-50/80"
            }`}
          >
            <Calculator
              className={`w-3.5 h-3.5 ${subTab === "formulas" ? "text-amber-300" : "text-emerald-700"}`}
            />
            <span>Формулалар</span>
          </button>
        </div>

        <div className="flex items-center gap-2.5 bg-white border border-emerald-900/10 rounded-2xl px-3.5 py-2 shadow-[0_2px_10px_rgba(6,78,59,0.04)] text-xs font-bold text-emerald-950 tabular-nums">
          <span>
            Шешілгені: {solvedIds.length}/{CHALLENGES.length}
          </span>
          <span className="text-slate-300">·</span>
          <span className="text-amber-700">{levelTitle}</span>
          <button
            type="button"
            onClick={handleReset}
            aria-label="Қайта бастау"
            className="p-1 rounded-lg border border-emerald-900/15 text-slate-500 hover:text-emerald-900 hover:bg-emerald-50 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {subTab === "formulas" ? (
        <FormulaVaultSection
          onOpenLiteracyTab={onOpenLiteracyTab}
          onOpenAccountingTab={onOpenAccountingTab}
          onOpenBankingTab={onOpenBankingTab}
        />
      ) : subTab === "mistakes" ? (
        <FindMistakeGame
          sfxMuted={sfxMuted}
          onTipChange={onTipChange}
          onSpeakingChange={onSpeakingChange}
          onScoreIncrement={() => setMistakeScore((s) => s + 1)}
          onOpenAccountingTab={onOpenAccountingTab}
          onOpenLiteracyTab={onOpenLiteracyTab}
          onOpenBankingTab={onOpenBankingTab}
        />
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
          <div className="xl:col-span-6 bg-white border border-emerald-900/10 rounded-2xl shadow-[0_4px_20px_rgba(6,78,59,0.05)] p-5 space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-0.5">
                {challenge.title}
              </span>
              <span className="font-semibold text-slate-500">{challenge.category}</span>
            </div>

            <div className="rounded-xl bg-[#F6F8F7] border border-emerald-900/10 p-3 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                <span>Тәжірибелік дайындық деңгейі ({levelTitle})</span>
                <AnimatedCounter
                  value={progressPct}
                  formatter={(v) => `${Math.round(v)}%`}
                  className="text-emerald-900"
                />
              </div>
              <div className="h-2.5 w-full rounded-full bg-emerald-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-700 to-amber-500"
                  style={{
                    width: `${progressPct}%`,
                    transition: "width 550ms cubic-bezier(0.22, 1, 0.36, 1)",
                  }}
                />
              </div>
            </div>

            <h3 className="text-base font-extrabold text-slate-900 leading-snug">
              {challenge.question}
            </h3>

            <div className="space-y-2">
              {challenge.options.map((opt) => {
                const isSelected = selectedOption === opt.id;
                const isRightChoice = opt.id === challenge.correctOptionId;

                let btnStyle =
                  "border-emerald-900/15 bg-white text-slate-800 hover:border-emerald-500 hover:bg-emerald-50/40";
                if (isAnswered) {
                  if (isRightChoice) {
                    btnStyle = "border-emerald-600 bg-emerald-50 text-emerald-950 font-bold";
                  } else if (isSelected) {
                    btnStyle = "border-red-400 bg-red-50 text-red-900";
                  } else {
                    btnStyle = "border-slate-200 bg-slate-50 text-slate-400";
                  }
                }

                return (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={isAnswered}
                    onClick={() => handleSelectOption(opt.id)}
                    className={`w-full min-h-[46px] text-left px-4 py-2.5 rounded-xl border text-xs sm:text-sm transition-colors flex items-center justify-between gap-3 cursor-pointer disabled:cursor-default ${btnStyle}`}
                  >
                    <span>{opt.label}</span>
                    {isAnswered && isRightChoice && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    )}
                    {isAnswered && isSelected && !isRightChoice && (
                      <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-emerald-900/10 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                {CHALLENGES.map((c, idx) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setCurrentIdx(idx);
                      setSelectedOption(null);
                    }}
                    className={`w-8 h-8 rounded-xl text-xs tabular-nums font-bold transition-colors cursor-pointer ${
                      idx === currentIdx
                        ? "bg-emerald-800 text-white"
                        : solvedIds.includes(c.id)
                          ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[40px] text-xs font-bold rounded-xl bg-amber-500 text-white hover:bg-amber-600 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>Келесі тапсырма</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="xl:col-span-6 anim-panel-enter space-y-3.5">
            {!isAnswered ? (
              <div className="bg-gradient-to-br from-emerald-900 to-emerald-800 text-white rounded-2xl p-5 sm:p-6 space-y-3.5 shadow-[0_4px_20px_rgba(6,78,59,0.12)]">
                <div className="text-xs font-bold text-amber-300">
                  Қаржы, Банк және 1С тәжірибесі — Басып тексеріңіз
                </div>
                <h3 className="text-lg font-extrabold leading-snug">
                  Төмендегі 3 карточканың кез келгенін басып, интерактивті мысалды ашыңыз
                </h3>
                <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed">
                  Әр карточка тірі мини-тренажер мен нақты цифрлық есепті көрсетеді. Ал сол жақтағы
                  тестке жауап берсеңіз — толық талдау бірден ашылады.
                </p>

                {/* 3 FULLY INTERACTIVE CLICKABLE CARDS (No dead placeholders!) */}
                <div className="pt-1 grid grid-cols-1 sm:grid-cols-3 gap-2 text-center">
                  <button
                    type="button"
                    onClick={() => openLabCard("rule72")}
                    className={`rounded-xl p-3 border transition-colors cursor-pointer text-left sm:text-center ${
                      activeLab === "rule72"
                        ? "bg-amber-500 text-white border-amber-300"
                        : "bg-white/10 hover:bg-white/20 border-white/15"
                    }`}
                  >
                    <div
                      className={`text-sm font-extrabold tabular-nums ${
                        activeLab === "rule72" ? "text-white" : "text-amber-300"
                      }`}
                    >
                      72 ережесі
                    </div>
                    <div className="text-[11px] text-emerald-100 mt-0.5">
                      Қаржы сауаты · Ашу
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => openLabCard("accounts1c")}
                    className={`rounded-xl p-3 border transition-colors cursor-pointer text-left sm:text-center ${
                      activeLab === "accounts1c"
                        ? "bg-amber-500 text-white border-amber-300"
                        : "bg-white/10 hover:bg-white/20 border-white/15"
                    }`}
                  >
                    <div
                      className={`text-sm font-extrabold tabular-nums ${
                        activeLab === "accounts1c" ? "text-white" : "text-amber-300"
                      }`}
                    >
                      1010–7210
                    </div>
                    <div className="text-[11px] text-emerald-100 mt-0.5">
                      1С шоттары · Ашу
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => openLabCard("bankLab")}
                    className={`rounded-xl p-3 border transition-colors cursor-pointer text-left sm:text-center ${
                      activeLab === "bankLab"
                        ? "bg-amber-500 text-white border-amber-300"
                        : "bg-white/10 hover:bg-white/20 border-white/15"
                    }`}
                  >
                    <div
                      className={`text-sm font-extrabold ${
                        activeLab === "bankLab" ? "text-white" : "text-amber-300"
                      }`}
                    >
                      Банк
                    </div>
                    <div className="text-[11px] text-emerald-100 mt-0.5">
                      Овердрафт · Эквайринг
                    </div>
                  </button>
                </div>

                {/* Live Interactive Lab Drawer Inside Card */}
                {activeLab === "rule72" && (
                  <div className="rounded-xl bg-white text-slate-900 p-4 space-y-2.5 text-xs anim-panel-enter">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-emerald-950">
                        «72 ережесі» — Қарапайым мини-калькулятор
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveLab(null)}
                        aria-label="Жабу"
                        className="p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      Өмірлік мысал: ақшаңыз депозитте немесе қорда жатса, 72 санын жылдық пайызға
                      бөлгенде жинағыңыз неше жылда <strong>2 есе</strong> өсетінін көресіз.
                    </p>
                    <label className="block space-y-1">
                      <div className="flex justify-between font-bold">
                        <span>Жылдық пайыздық табыс:</span>
                        <span className="tabular-nums text-emerald-900">{labRatePct}%</span>
                      </div>
                      <input
                        type="range"
                        min={4}
                        max={24}
                        step={1}
                        value={labRatePct}
                        onChange={(e) => setLabRatePct(Number(e.target.value))}
                        className="w-full compass-slider"
                      />
                    </label>
                    <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 font-bold text-emerald-950 tabular-nums">
                      Нәтиже: 72 ÷ {labRatePct}% = {rule72Years} жылда ақшаңыз 2 еселенеді!
                    </div>
                    <div className="flex justify-between items-center pt-1">
                      <button
                        type="button"
                        onClick={() => openLabCard("accounts1c")}
                        className="text-[11px] font-bold text-amber-700 hover:underline cursor-pointer"
                      >
                        Келесі: 1010–7210 шоттары →
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenLiteracyTab("compound")}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-800 text-white font-bold hover:bg-emerald-900 cursor-pointer"
                      >
                        <span>Толық калькулятор</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {activeLab === "accounts1c" && (
                  <div className="rounded-xl bg-white text-slate-900 p-4 space-y-2.5 text-xs anim-panel-enter">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-emerald-950">
                        1010–7210 Шоттар жоспары — Жылдам анықтама
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveLab(null)}
                        aria-label="Жабу"
                        className="p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {KZ_ACCOUNTS.slice(0, 6).map((a, i) => (
                        <button
                          key={a.code}
                          type="button"
                          onClick={() => setLabAccountIdx(i)}
                          className={`px-2.5 py-1 rounded-lg font-extrabold tabular-nums cursor-pointer ${
                            i === labAccountIdx
                              ? "bg-emerald-800 text-white"
                              : "bg-slate-100 text-slate-700 hover:bg-emerald-50"
                          }`}
                        >
                          {a.code}
                        </button>
                      ))}
                    </div>
                    <div className="rounded-lg bg-[#F6F8F7] border border-emerald-900/10 p-3 space-y-1">
                      <div className="font-extrabold text-emerald-950">
                        {labAccount.code} · {labAccount.name}
                      </div>
                      <div className="text-[11px] text-slate-600">
                        Түрі: <strong>{labAccount.natureLabel}</strong> · Аналитика:{" "}
                        {labAccount.subcontoType}
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-1">
                      <button
                        type="button"
                        onClick={() => openLabCard("bankLab")}
                        className="text-[11px] font-bold text-amber-700 hover:underline cursor-pointer"
                      >
                        Келесі: Банк есебі →
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenAccountingTab("trainer")}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-800 text-white font-bold hover:bg-emerald-900 cursor-pointer"
                      >
                        <span>Дт/Кт Жаттығуына өту</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {activeLab === "bankLab" && (
                  <div className="rounded-xl bg-white text-slate-900 p-4 space-y-2.5 text-xs anim-panel-enter">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-emerald-950">
                        Банк: Овердрафт және Эквайринг — Нақты есеп
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveLab(null)}
                        aria-label="Жабу"
                        className="p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      Шотта ақша жетпегенде 1 000 000 ₸ овердрафтты 24%-бен қысқа күнге алсаңыз, тек
                      пайдаланған күнге төлейсіз:
                    </p>
                    <label className="block space-y-1">
                      <div className="flex justify-between font-bold">
                        <span>Овердрафт күн саны:</span>
                        <span className="tabular-nums text-emerald-900">{labOverdraftDays} күн</span>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={20}
                        step={1}
                        value={labOverdraftDays}
                        onChange={(e) => setLabOverdraftDays(Number(e.target.value))}
                        className="w-full compass-slider"
                      />
                    </label>
                    <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 font-bold text-amber-950 tabular-nums">
                      Төленетін пайыз: {formatTenge(labOverdraftFee)} (ал 1 млн ₸ несиеден әлдеқайда арзан!)
                    </div>
                    <div className="flex justify-between items-center pt-1">
                      <button
                        type="button"
                        onClick={() => openLabCard("rule72")}
                        className="text-[11px] font-bold text-amber-700 hover:underline cursor-pointer"
                      >
                        Басына: 72 ережесі →
                      </button>
                      <button
                        type="button"
                        onClick={onOpenBankingTab}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-800 text-white font-bold hover:bg-emerald-900 cursor-pointer"
                      >
                        <span>Банк салыстыруына өту</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <CompassFormatCard
                data={isCorrect ? challenge.debriefCorrect : challenge.debriefWrong}
                sfxMuted={sfxMuted}
                showVisualStage={true}
                stageProgress={isCorrect ? 0.92 : 0.48}
                onSpeakingChange={onSpeakingChange}
                compactStage={true}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
