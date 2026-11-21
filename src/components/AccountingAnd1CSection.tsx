import { useMemo, useState } from "react";
import {
  Scale,
  TrendingUp,
  ArrowLeftRight,
  TableProperties,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  Search,
  Sparkles,
  RotateCcw,
  GraduationCap,
  Lock,
} from "lucide-react";
import type { AccountingTabId, CompassStructuredResponse } from "../types/finance";
import {
  calculateBalanceSheet,
  calculateOpiu,
  calculateDds,
  formatTenge,
  formatPercent,
} from "../utils/financeMath";
import {
  DK_DRILL_CASES,
  INITIAL_ONEC_JOURNAL,
  KZ_ACCOUNTS,
  ONEC_DOC_TEMPLATES,
  computeOsvFromEntries,
  computeReportsFromEntries,
  getAccountByCode,
  type OneCDocKind,
  type OneCJournalItem,
} from "../utils/oneCEngine";
import { playSfx } from "../utils/sfx";
import { CompassFormatCard } from "./CompassFormatCard";
import { AnimatedCounter } from "./AnimatedCounter";

interface AccountingAnd1CSectionProps {
  activeSubTab: AccountingTabId;
  onChangeSubTab: (tab: AccountingTabId) => void;
  sfxMuted: boolean;
  onAskCompass: (prompt: string, topic: string) => void;
  onTipChange?: (tip: string) => void;
  onSpeakingChange?: (speaking: boolean) => void;
}

const ACCOUNTING_TABS: Array<{
  id: AccountingTabId;
  label: string;
  code: string;
  icon: typeof Scale;
}> = [
  { id: "trainer", label: "Дт/Кт Жаттығуы", code: "Тренажер", icon: GraduationCap },
  { id: "oneC", label: "1С: Журнал", code: "Құжаттар", icon: FileSpreadsheet },
  { id: "osv", label: "АСВ (ОСВ)", code: "Шоттар", icon: TableProperties },
  { id: "balance", label: "Баланс", code: "Ф.1", icon: Scale },
  { id: "opiu", label: "ОПиУ", code: "Ф.2", icon: TrendingUp },
  { id: "dds", label: "ДДС (АҚЕ)", code: "Ф.3", icon: ArrowLeftRight },
];

export function AccountingAnd1CSection({
  activeSubTab,
  onChangeSubTab,
  sfxMuted,
  onAskCompass,
  onTipChange,
  onSpeakingChange,
}: AccountingAnd1CSectionProps) {
  // --- Live Unlimited 1C Journal State ---
  const [journal, setJournal] = useState<OneCJournalItem[]>(INITIAL_ONEC_JOURNAL);
  const [docKindFilter, setDocKindFilter] = useState<OneCDocKind | "all">("all");
  const [journalSearch, setJournalSearch] = useState("");

  // New 1C Document Form State
  const [newKind, setNewKind] = useState<OneCDocKind>("receipt");
  const [newDocName, setNewDocName] = useState(ONEC_DOC_TEMPLATES[0].doc1C);
  const [newDebit, setNewDebit] = useState(ONEC_DOC_TEMPLATES[0].defaultDebit);
  const [newCredit, setNewCredit] = useState(ONEC_DOC_TEMPLATES[0].defaultCredit);
  const [newAmount, setNewAmount] = useState(ONEC_DOC_TEMPLATES[0].defaultAmount);
  const [newSubconto, setNewSubconto] = useState(ONEC_DOC_TEMPLATES[0].defaultSubconto);
  const [newComment, setNewComment] = useState(ONEC_DOC_TEMPLATES[0].defaultComment);

  // --- Interactive Дт/Кт Trainer State ---
  const [drillIdx, setDrillIdx] = useState(0);
  const [pickedDebit, setPickedDebit] = useState<string | null>(null);
  const [pickedCredit, setPickedCredit] = useState<string | null>(null);
  const [drillChecked, setDrillChecked] = useState(false);
  const [solvedDrillIds, setSolvedDrillIds] = useState<string[]>([]);

  // --- OSV Filter State ---
  const [osvGroupFilter, setOsvGroupFilter] = useState<string>("Барлығы");
  const [osvSearch, setOsvSearch] = useState("");

  // --- Balance / OPIU / DDS Simulator Mode ("1C Live" vs "What-if Sliders") ---
  const [useLive1CData, setUseLive1CData] = useState(true);
  const [cashBank, setCashBank] = useState(3_200_000);
  const [recvInventory, setRecvInventory] = useState(4_800_000);
  const [fixedAssets, setFixedAssets] = useState(12_000_000);
  const [shortDebt, setShortDebt] = useState(2_900_000);
  const [longDebt, setLongDebt] = useState(4_500_000);

  const [revenue, setRevenue] = useState(8_500_000);
  const [cogs, setCogs] = useState(4_900_000);
  const [opex, setOpex] = useState(1_650_000);
  const [taxRate, setTaxRate] = useState(20);

  const [openCash, setOpenCash] = useState(1_800_000);
  const [opInflow, setOpInflow] = useState(7_400_000);
  const [opOutflow, setOpOutflow] = useState(5_900_000);
  const [investNet, setInvestNet] = useState(-850_000);
  const [financeNet, setFinanceNet] = useState(-350_000);

  // Live computed 1C OSV & Reports
  const liveOsv = useMemo(() => computeOsvFromEntries(journal), [journal]);
  const live1CReports = useMemo(() => computeReportsFromEntries(journal), [journal]);

  const balance = useLive1CData
    ? calculateBalanceSheet(
        live1CReports.cashBalance,
        live1CReports.receivablesAndInventory,
        live1CReports.fixedAssets,
        live1CReports.shortLiabilities,
        live1CReports.longLiabilities
      )
    : calculateBalanceSheet(cashBank, recvInventory, fixedAssets, shortDebt, longDebt);

  const opiu = useLive1CData
    ? calculateOpiu(live1CReports.revenue, live1CReports.cogs, live1CReports.opex, taxRate)
    : calculateOpiu(revenue, cogs, opex, taxRate);

  const dds = useLive1CData
    ? calculateDds(
        0,
        live1CReports.operatingInflow,
        live1CReports.operatingOutflow,
        0,
        live1CReports.financingNet
      )
    : calculateDds(openCash, opInflow, opOutflow, investNet, financeNet);

  const drill = DK_DRILL_CASES[drillIdx];
  const isDrillCorrect =
    drillChecked && pickedDebit === drill.correctDebit && pickedCredit === drill.correctCredit;

  // --- Handlers ---
  const handleSelectTemplateKind = (kind: OneCDocKind) => {
    setNewKind(kind);
    const tpl = ONEC_DOC_TEMPLATES.find((t) => t.kind === kind) || ONEC_DOC_TEMPLATES[0];
    setNewDocName(tpl.doc1C);
    setNewDebit(tpl.defaultDebit);
    setNewCredit(tpl.defaultCredit);
    setNewAmount(tpl.defaultAmount);
    setNewSubconto(tpl.defaultSubconto);
    setNewComment(tpl.defaultComment);
  };

  const handleAddJournalEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (newAmount <= 0 || !newDebit || !newCredit || newDebit === newCredit) return;
    const tpl = ONEC_DOC_TEMPLATES.find((t) => t.kind === newKind);
    const today = new Date();
    const dateStr = `${String(today.getDate()).padStart(2, "0")}.${String(
      today.getMonth() + 1
    ).padStart(2, "0")}`;

    const entry: OneCJournalItem = {
      id: `op-${Date.now()}`,
      date: dateStr,
      docKind: newKind,
      docName: newDocName.trim() || tpl?.doc1C || "1С Операциясы",
      debit: newDebit,
      credit: newCredit,
      amount: Math.round(newAmount),
      subconto: newSubconto.trim() || "Негізгі аналитика",
      comment: newComment.trim() || "Құжат сәтті өткізілді",
      posted: true,
      cashFlowTag: tpl?.cashFlowTag || "none",
    };

    setJournal((prev) => [entry, ...prev]);
    playSfx("coin", sfxMuted);
    onTipChange?.(
      `«${entry.docName}» өткізілді: Дт ${entry.debit} — Кт ${entry.credit} (${formatTenge(entry.amount)}). АСВ, Баланс және ОПиУ жаңартылды!`
    );
  };

  const handleTogglePosted = (id: string) => {
    setJournal((prev) =>
      prev.map((item) => (item.id === id ? { ...item, posted: !item.posted } : item))
    );
    playSfx("coin", sfxMuted);
  };

  const handleDeleteEntry = (id: string) => {
    setJournal((prev) => prev.filter((item) => item.id !== id));
    playSfx("worm_shield", sfxMuted);
  };

  const handleCloseMonthIn1C = () => {
    const revRow = liveOsv.rows.find((r) => r.code === "6010");
    const cogsRow = liveOsv.rows.find((r) => r.code === "7010");
    const opexRow = liveOsv.rows.find((r) => r.code === "7210");
    const intRow = liveOsv.rows.find((r) => r.code === "7310");

    const closingEntries: OneCJournalItem[] = [];
    const stamp = Date.now();
    const revBal = revRow ? revRow.closingCt - revRow.closingDt : 0;
    const cogsBal = cogsRow ? cogsRow.closingDt - cogsRow.closingCt : 0;
    const opexBal = opexRow ? opexRow.closingDt - opexRow.closingCt : 0;
    const intBal = intRow ? intRow.closingDt - intRow.closingCt : 0;

    if (revBal > 0) {
      closingEntries.push({
        id: `close-6010-${stamp}`,
        date: "30.11",
        docKind: "closing",
        docName: "Закрытие месяца (6010 жабу)",
        debit: "6010",
        credit: "5610",
        amount: revBal,
        subconto: "Айды жабу · Кіріс реформациясы",
        comment: "6010 түсім шоты 5610 қорытынды пайдаға аударылды",
        posted: true,
        cashFlowTag: "none",
      });
    }
    if (cogsBal > 0) {
      closingEntries.push({
        id: `close-7010-${stamp}`,
        date: "30.11",
        docKind: "closing",
        docName: "Закрытие месяца (7010 жабу)",
        debit: "5610",
        credit: "7010",
        amount: cogsBal,
        subconto: "Айды жабу · Өзіндік құнды жабу",
        comment: "7010 өзіндік құн 5610 қорытынды пайдаға есептен шығарылды",
        posted: true,
        cashFlowTag: "none",
      });
    }
    if (opexBal > 0) {
      closingEntries.push({
        id: `close-7210-${stamp}`,
        date: "30.11",
        docKind: "closing",
        docName: "Закрытие месяца (7210 жабу)",
        debit: "5610",
        credit: "7210",
        amount: opexBal,
        subconto: "Айды жабу · Әкімшілік шығындар",
        comment: "7210 әкімшілік шығыстар 5610-ға жабылды",
        posted: true,
        cashFlowTag: "none",
      });
    }
    if (intBal > 0) {
      closingEntries.push({
        id: `close-7310-${stamp}`,
        date: "30.11",
        docKind: "closing",
        docName: "Закрытие месяца (7310 жабу)",
        debit: "5610",
        credit: "7310",
        amount: intBal,
        subconto: "Айды жабу · Сыйақы шығыстары",
        comment: "7310 пайыз шығыстары 5610-ға жабылды",
        posted: true,
        cashFlowTag: "none",
      });
    }

    if (closingEntries.length === 0) {
      onTipChange?.("6010, 7010, 7210 транзиттік шоттары әлдеқашан жабылған (қалдық 0 ₸)!");
      return;
    }

    setJournal((prev) => [...closingEntries, ...prev]);
    playSfx("harvest", sfxMuted);
    onTipChange?.(
      "«Айды жабу» орындалды! 6010, 7010, 7210 шоттары 5610 Қорытынды пайда шотына жабылды."
    );
  };

  const handleCheckDrill = () => {
    if (!pickedDebit || !pickedCredit) return;
    setDrillChecked(true);
    const right = pickedDebit === drill.correctDebit && pickedCredit === drill.correctCredit;
    if (right) {
      setSolvedDrillIds((prev) => (prev.includes(drill.id) ? prev : [...prev, drill.id]));
      playSfx("harvest", sfxMuted);
      onTipChange?.(`Дәл таптыңыз! Дт ${drill.correctDebit} — Кт ${drill.correctCredit}.`);
    } else {
      playSfx("worm_shield", sfxMuted);
      onTipChange?.(
        `Қате: Дұрыс проводка — Дт ${drill.correctDebit} (${getAccountByCode(drill.correctDebit).name}) — Кт ${drill.correctCredit}.`
      );
    }
  };

  const handlePostDrillTo1C = () => {
    const entry: OneCJournalItem = {
      id: `drill-op-${Date.now()}`,
      date: "25.11",
      docKind: "bank",
      docName: `${drill.docName} (Жаттығудан)`,
      debit: drill.correctDebit,
      credit: drill.correctCredit,
      amount: drill.amount,
      subconto: drill.subcontoExample,
      comment: drill.operationText,
      posted: true,
      cashFlowTag:
        drill.correctDebit === "1010" || drill.correctDebit === "1030"
          ? "operating_in"
          : drill.correctCredit === "1010" || drill.correctCredit === "1030"
            ? "operating_out"
            : "none",
    };
    setJournal((prev) => [entry, ...prev]);
    playSfx("coin", sfxMuted);
    onTipChange?.("Жаттығу проводкасы 1С Журналға өткізілді және есептер қайта есептелді!");
  };

  const handleTabSwitch = (id: AccountingTabId) => {
    onChangeSubTab(id);
    playSfx("coin", sfxMuted);
    const tipMap: Record<AccountingTabId, string> = {
      trainer: "Қарапайым операция үшін Дт және Кт шоттарын таңдап, проводка логикасын жаттықтырыңыз.",
      oneC: "Шексіз жаңа 1С құжаттарын қосып өткізіңіз — АСВ, Баланс, ОПиУ және ДДС лезде жаңарады.",
      osv: "АСВ (ОСВ): Барлық өткізілген 1С құжаттары бойынша Дт/Кт айналымдар мен соңғы сальдо теңдігі.",
      balance: "Баланс (Ф.1): Активтер әрқашан Міндеттемелер мен Меншікті капитал қосындысына тең.",
      opiu: "ОПиУ (Ф.2): 6010 Түсім − 7010 Өзіндік құн − 7210 Шығындар = Таза пайда.",
      dds: "ДДС (Ф.3): 1010 Касса мен 1030 Банк шоттарындағы нақты ақша кірісі мен шығысы.",
    };
    onTipChange?.(tipMap[id]);
  };

  // Filtered Journal & OSV
  const filteredJournal = journal.filter((item) => {
    const matchKind = docKindFilter === "all" || item.docKind === docKindFilter;
    const q = journalSearch.trim().toLowerCase();
    const matchText =
      !q ||
      item.docName.toLowerCase().includes(q) ||
      item.debit.includes(q) ||
      item.credit.includes(q) ||
      item.subconto.toLowerCase().includes(q) ||
      item.comment.toLowerCase().includes(q);
    return matchKind && matchText;
  });

  const filteredOsvRows = liveOsv.rows.filter((row) => {
    const def = getAccountByCode(row.code);
    const matchGroup = osvGroupFilter === "Барлығы" || def.group === osvGroupFilter;
    const q = osvSearch.trim().toLowerCase();
    const matchText = !q || row.code.includes(q) || row.name.toLowerCase().includes(q);
    return matchGroup && matchText;
  });

  // Visual Summary Card Data for Balance / OPIU / DDS tabs
  let reportCardData: CompassStructuredResponse | null = null;
  let stageProgress = 0.82;
  let stageSecondary = 0.35;
  let stageMetrics: Array<{ label: string; value: number; color: string }> | undefined;

  if (activeSubTab === "balance") {
    stageSecondary = balance.debtSharePct / 100;
    stageProgress = Math.min(1, Math.max(0.2, balance.totalAssets / 20_000_000));
    reportCardData = {
      explanation: `Кәсіпорынның жиынтық активтері ${formatTenge(balance.totalAssets)} құрайды. Оның ішінде міндеттемелер — ${formatTenge(balance.totalLiabilities)} (${formatPercent(balance.debtSharePct)}), ал меншікті капитал — ${formatTenge(balance.equity)} (${formatPercent(balance.equitySharePct)}).`,
      sceneDescription: `Өтімділік коэффициенті ${balance.currentRatio.toFixed(2)}× · Айналым капиталы: ${formatTenge(balance.workingCapital)}.`,
      sfxType: "bricks",
      expertSummary:
        balance.currentRatio >= 1.5
          ? "Қысқа мерзімді өтімділік тұрақты (>1.5×): ағымдағы қарыздарды өтеуге айналым қаражаты жеткілікті."
          : "Өтімділік коэффициенті төмен (<1.5×): 1210 дебиторлық берешекті жинауды жеделдетіңіз.",
      visualType: "balance",
      journalEntry: "Активтер (1010–2410) = Міндеттеме (3010–3510) + Капитал (5030–5610)",
      doc1C: "Регламенттелген есептер → Бухгалтерлік баланс (Ф.1)",
      formulaLabel: "Айналым капиталы = Ағымдағы актив − Қысқа мерзімді қарыз",
      exampleCalculation: `${formatTenge(balance.totalAssets)} = ${formatTenge(balance.totalLiabilities)} + ${formatTenge(balance.equity)}`,
      keyMetricLabel: useLive1CData ? "1С Нақты Баланс (Актив)" : "Симулятор Баланс",
      keyMetricValue: formatTenge(balance.totalAssets),
    };
  } else if (activeSubTab === "opiu") {
    stageProgress = Math.max(0.15, Math.min(1, opiu.netMarginPct / 40));
    stageSecondary = opiu.revenue > 0 ? opiu.cogs / opiu.revenue : 0.5;
    stageMetrics = [
      { label: "Түсім (6010)", value: opiu.revenue, color: "#065F46" },
      { label: "Өзіндік құн (7010)", value: opiu.cogs, color: "#D97706" },
      { label: "Опер. шығын (7210)", value: opiu.opex, color: "#64748B" },
      { label: "Таза пайда", value: opiu.netProfit, color: opiu.netProfit >= 0 ? "#10B981" : "#DC2626" },
    ];
    reportCardData = {
      explanation: `${formatTenge(opiu.revenue)} түсімнен өзіндік құн (${formatTenge(opiu.cogs)}) және операциялық шығыстар (${formatTenge(opiu.opex)}) шегерілгенде операциялық пайда ${formatTenge(opiu.ebit)}, ал таза пайда ${formatTenge(opiu.netProfit)} болады.`,
      sceneDescription: `Жалпы маржа: ${formatPercent(opiu.grossMarginPct)} · Таза маржа: ${formatPercent(opiu.netMarginPct)}.`,
      sfxType: "harvest",
      expertSummary:
        "1С-те ОПиУ (Ф.2) есебі «Айды жабу» операциясы арқылы 6010, 7010 және 7210 шоттарын 5610-ға жапқаннан кейін балансқа толық түседі.",
      visualType: "opiu",
      journalEntry: "Айды жабу: Кт 6010 / Дт 7010, 7210 → 5610",
      doc1C: "Пайда мен залал туралы есеп (ОПиУ · Ф.2)",
      formulaLabel: "Таза маржа = (Таза пайда / Түсім) × 100%",
      exampleCalculation: `Таза пайда: ${formatTenge(opiu.netProfit)}`,
      keyMetricLabel: useLive1CData ? "1С Нақты Таза пайда" : "Таза пайда (ОПиУ)",
      keyMetricValue: formatTenge(opiu.netProfit),
    };
  } else if (activeSubTab === "dds") {
    stageMetrics = [
      { label: "Операциялық ағын", value: dds.operatingCf, color: "#059669" },
      { label: "Инвестициялық", value: dds.investingCf, color: "#D97706" },
      { label: "Қаржылық ағын", value: dds.financingCf, color: "#0284C7" },
    ];
    reportCardData = {
      explanation: `Операциялық ақша ағымы ${formatTenge(dds.operatingCf)} (түсім ${formatTenge(dds.operatingCf >= 0 ? dds.operatingCf : 0)}), қаржылық ағын ${formatTenge(dds.financingCf)} болып, соңғы ақша қалдығы ${formatTenge(dds.endingCash)} құрады.`,
      sceneDescription: "1010 Касса мен 1030 Есеп айырысу шотындағы нақты ақша қозғалысы.",
      sfxType: "water",
      expertSummary:
        dds.endingCash >= 0
          ? "Ақша қалдығы оң: касса алшақтығы жоқ. 1С-те ПКО, РКО және банк көшірмесінде ДДС бабын толтыру міндетті."
          : "Теріс ақша қалдығы: жедел түрде 1210 дебиторлардан төлем жинаңыз немесе овердрафт қосыңыз.",
      visualType: "dds",
      journalEntry: "Дт 1030 / 1010 (Түсім) · Кт 1030 / 1010 (Төлем)",
      doc1C: "Ақша қозғалысы туралы есеп (ДДС · Ф.3)",
      formulaLabel: "Соңғы қалдық = Бастапқы + Операция + Инвестиция + Қаржы",
      exampleCalculation: `Нақты ақша қалдығы: ${formatTenge(dds.endingCash)}`,
      keyMetricLabel: useLive1CData ? "1С Нақты Ақша (1010+1030)" : "Соңғы ақша қалдығы",
      keyMetricValue: formatTenge(dds.endingCash),
    };
  }

  return (
    <div className="space-y-4">
      {/* Sub-navigation tabs */}
      <div
        role="tablist"
        aria-label="Бухгалтерлік есеп және 1С бөлімдері"
        className="inline-flex flex-wrap items-center gap-1 p-1.5 bg-white border border-emerald-900/10 rounded-2xl shadow-[0_2px_10px_rgba(6,78,59,0.04)]"
      >
        {ACCOUNTING_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              type="button"
              onClick={() => handleTabSwitch(tab.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 min-h-[40px] text-xs font-bold rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isActive
                  ? "bg-emerald-800 text-white"
                  : "text-slate-600 hover:text-emerald-950 hover:bg-emerald-50/80"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? "text-amber-300" : "text-emerald-700"}`} />
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                  isActive ? "bg-white/15 text-amber-200" : "bg-slate-100 text-slate-500"
                }`}
              >
                {tab.code}
              </span>
            </button>
          );
        })}
      </div>

      {/* 1. INTERACTIVE Дт/Кт TRAINER */}
      {activeSubTab === "trainer" && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
          <div className="xl:col-span-7 bg-white border border-emerald-900/10 rounded-2xl shadow-[0_4px_20px_rgba(6,78,59,0.05)] p-4 sm:p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-900/10 pb-3">
              <div>
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-2 py-0.5">
                  {drill.title}
                </span>
                <h3 className="text-sm sm:text-base font-extrabold text-emerald-950 mt-1.5">
                  Операцияға дұрыс Дебет (Дт) және Кредит (Кт) шоттарын таңдаңыз
                </h3>
              </div>
              <div className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5 tabular-nums">
                Шешілгені: {solvedDrillIds.length}/{DK_DRILL_CASES.length}
              </div>
            </div>

            <div className="rounded-xl bg-[#F6F8F7] border border-emerald-900/10 p-3.5 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-bold text-emerald-900">{drill.docName}</span>
                <span className="tabular-nums font-extrabold text-emerald-950 bg-white border border-emerald-200 rounded-lg px-2.5 py-0.5">
                  Сомасы: {formatTenge(drill.amount)}
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-900 leading-relaxed">
                {drill.operationText}
              </p>
              <div className="text-[11px] text-slate-500">Аналитика (Субконто): {drill.subcontoExample}</div>
            </div>

            {/* Dual Selector: Debit vs Credit */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3 space-y-2">
                <div className="text-xs font-extrabold text-emerald-950">
                  1. ДЕБЕТ (Дт) шотын таңдаңыз
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {drill.candidateAccounts.map((code) => {
                    const acc = getAccountByCode(code);
                    const selected = pickedDebit === code;
                    const showRight = drillChecked && code === drill.correctDebit;
                    const showWrong = drillChecked && selected && code !== drill.correctDebit;
                    return (
                      <button
                        key={`dt-${code}`}
                        type="button"
                        onClick={() => {
                          if (!drillChecked) setPickedDebit(code);
                        }}
                        className={`p-2 rounded-xl border text-left transition-colors cursor-pointer ${
                          showRight
                            ? "bg-emerald-700 text-white border-emerald-800"
                            : showWrong
                              ? "bg-red-100 text-red-900 border-red-400"
                              : selected
                                ? "bg-emerald-800 text-white border-emerald-800"
                                : "bg-white text-slate-800 border-emerald-900/10 hover:bg-emerald-50"
                        }`}
                      >
                        <div className="text-xs font-extrabold tabular-nums">Дт {code}</div>
                        <div
                          className={`text-[10px] truncate ${
                            selected || showRight ? "text-emerald-100" : "text-slate-500"
                          }`}
                        >
                          {acc.name}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-3 space-y-2">
                <div className="text-xs font-extrabold text-amber-950">
                  2. КРЕДИТ (Кт) шотын таңдаңыз
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {drill.candidateAccounts.map((code) => {
                    const acc = getAccountByCode(code);
                    const selected = pickedCredit === code;
                    const showRight = drillChecked && code === drill.correctCredit;
                    const showWrong = drillChecked && selected && code !== drill.correctCredit;
                    return (
                      <button
                        key={`ct-${code}`}
                        type="button"
                        onClick={() => {
                          if (!drillChecked) setPickedCredit(code);
                        }}
                        className={`p-2 rounded-xl border text-left transition-colors cursor-pointer ${
                          showRight
                            ? "bg-emerald-700 text-white border-emerald-800"
                            : showWrong
                              ? "bg-red-100 text-red-900 border-red-400"
                              : selected
                                ? "bg-amber-600 text-white border-amber-600"
                                : "bg-white text-slate-800 border-emerald-900/10 hover:bg-amber-50"
                        }`}
                      >
                        <div className="text-xs font-extrabold tabular-nums">Кт {code}</div>
                        <div
                          className={`text-[10px] truncate ${
                            selected || showRight ? "text-amber-50" : "text-slate-500"
                          }`}
                        >
                          {acc.name}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Selected Preview & Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-emerald-900/10">
              <div className="space-y-1">
                <div className="text-xs font-bold text-slate-700 tabular-nums">
                  Таңдалған жазба:{" "}
                  <span className="text-emerald-900 bg-emerald-50 border border-emerald-200 rounded-lg px-2 py-1">
                    Дт {pickedDebit || "____"} — Кт {pickedCredit || "____"}
                  </span>
                </div>
                {pickedDebit && pickedCredit && pickedDebit === pickedCredit && (
                  <div className="text-[11px] font-semibold text-red-700">
                    Дебет пен Кредит бір шот бола алмайды — әртүрлі шот таңдаңыз.
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {!drillChecked ? (
                  <button
                    type="button"
                    disabled={!pickedDebit || !pickedCredit || pickedDebit === pickedCredit}
                    onClick={handleCheckDrill}
                    className="px-4 py-2 min-h-[40px] text-xs font-bold rounded-xl bg-emerald-800 text-white hover:bg-emerald-900 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    Проводканы тексеру
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handlePostDrillTo1C}
                      className="px-3.5 py-2 min-h-[40px] text-xs font-bold rounded-xl bg-emerald-100 text-emerald-950 border border-emerald-300 hover:bg-emerald-200 transition-colors cursor-pointer"
                    >
                      1С Журналға өткізу
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDrillIdx((i) => (i + 1) % DK_DRILL_CASES.length);
                        setPickedDebit(null);
                        setPickedCredit(null);
                        setDrillChecked(false);
                      }}
                      className="px-4 py-2 min-h-[40px] text-xs font-bold rounded-xl bg-amber-500 text-white hover:bg-amber-600 transition-colors cursor-pointer"
                    >
                      Келесі операция →
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Quick exercise number navigation */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex flex-wrap gap-1.5">
                {DK_DRILL_CASES.map((c, idx) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setDrillIdx(idx);
                      setPickedDebit(null);
                      setPickedCredit(null);
                      setDrillChecked(false);
                    }}
                    className={`w-8 h-8 rounded-xl text-xs font-bold tabular-nums cursor-pointer transition-colors ${
                      idx === drillIdx
                        ? "bg-emerald-800 text-white"
                        : solvedDrillIds.includes(c.id)
                          ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
              {solvedDrillIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setSolvedDrillIds([]);
                    setDrillIdx(0);
                    setPickedDebit(null);
                    setPickedCredit(null);
                    setDrillChecked(false);
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-emerald-900 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Қайта бастау</span>
                </button>
              )}
            </div>
          </div>

          {/* Right Panel: Feedback & Account Rule Reference */}
          <div className="xl:col-span-5 space-y-4">
            {drillChecked ? (
              <div
                className={`rounded-2xl border p-4 sm:p-5 space-y-3 anim-panel-enter ${
                  isDrillCorrect
                    ? "bg-emerald-50/90 border-emerald-300"
                    : "bg-amber-50/90 border-amber-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  {isDrillCorrect ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600 shrink-0" />
                  )}
                  <h4 className="text-sm font-extrabold text-slate-900">
                    {isDrillCorrect
                      ? "Өте дұрыс! Проводка 100% сәйкес."
                      : "Назар аударыңыз — дұрыс проводканы қараңыз:"}
                  </h4>
                </div>
                <div className="rounded-xl bg-white border border-emerald-900/10 p-3 text-xs font-extrabold text-emerald-950 tabular-nums">
                  Дт {drill.correctDebit} ({getAccountByCode(drill.correctDebit).name}) — Кт{" "}
                  {drill.correctCredit} ({getAccountByCode(drill.correctCredit).name}) ·{" "}
                  {formatTenge(drill.amount)}
                </div>
                <p className="text-xs sm:text-[13px] text-slate-800 leading-relaxed">
                  {drill.explanation}
                </p>
              </div>
            ) : (
              <div className="rounded-2xl bg-gradient-to-br from-emerald-900 to-emerald-800 text-white p-5 space-y-3 shadow-[0_4px_20px_rgba(6,78,59,0.12)]">
                <div className="text-xs font-bold text-amber-300">Дт / Кт Еске салғыш ережесі</div>
                <h4 className="text-base font-extrabold">
                  Активті, Пассивті және Кіріс/Шығыс шоттары қалай жұмыс істейді?
                </h4>
                <ul className="space-y-2 text-xs text-emerald-100 leading-relaxed">
                  <li>
                    <strong className="text-white">Активті (1010, 1030, 1210, 1330):</strong>{" "}
                    Өссе — <span className="text-amber-300 font-bold">Дебет (Дт)</span>, азайса — Кредит (Кт).
                  </li>
                  <li>
                    <strong className="text-white">Пассивті (3310, 3350, 3120, 5030):</strong>{" "}
                    Өссе — <span className="text-amber-300 font-bold">Кредит (Кт)</span>, өтелсе — Дебет (Дт).
                  </li>
                  <li>
                    <strong className="text-white">Кіріс (6010) / Шығыс (7010, 7210):</strong>{" "}
                    Кіріс Кредитте, ал барлық шығыстар Дебетте жиналады.
                  </li>
                </ul>
              </div>
            )}

            <button
              type="button"
              onClick={() =>
                onAskCompass(
                  `«${drill.operationText}» операциясында неліктен Дт ${drill.correctDebit} — Кт ${drill.correctCredit} проводкасы жазылатынын және 1С-те қандай құжатпен өткізілетінін түсіндіріп беріңіз.`,
                  "Дт/Кт Жаттығуы"
                )
              }
              className="w-full min-h-[42px] py-2 px-4 text-xs sm:text-sm font-bold rounded-xl bg-emerald-800 text-white hover:bg-emerald-900 transition-colors cursor-pointer"
            >
              Бұл проводканы AI Тәлімгерден сұрау
            </button>
          </div>
        </div>
      )}

      {/* 2. UNLIMITED 1C JOURNAL & DOCUMENTS WORKSPACE */}
      {activeSubTab === "oneC" && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
          {/* Left: Add Any 1C Document Unlimited */}
          <form
            onSubmit={handleAddJournalEntry}
            className="xl:col-span-5 bg-white border border-emerald-900/10 rounded-2xl shadow-[0_4px_20px_rgba(6,78,59,0.05)] p-4 sm:p-5 space-y-3"
          >
            <div className="flex items-center justify-between border-b border-emerald-900/10 pb-2.5">
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-emerald-950">
                  1С Құжат енгізу және өткізу
                </h3>
                <p className="text-[11px] text-slate-500">
                  Шексіз операция қосыңыз — АСВ, Баланс, ОПиУ лезде есептеледі
                </p>
              </div>
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-2 py-0.5">
                {journal.filter((j) => j.posted).length} өткізілген
              </span>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">1С Құжат түрі</label>
              <select
                value={newKind}
                onChange={(e) => handleSelectTemplateKind(e.target.value as OneCDocKind)}
                className="w-full min-h-[40px] rounded-xl border border-emerald-900/15 bg-[#F6F8F7] px-3 py-1.5 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700/25"
              >
                {ONEC_DOC_TEMPLATES.map((t) => (
                  <option key={t.kind} value={t.kind}>
                    {t.title} ({t.doc1C})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-emerald-900 block">Дебет (Дт)</label>
                <select
                  value={newDebit}
                  onChange={(e) => setNewDebit(e.target.value)}
                  className="w-full min-h-[38px] rounded-xl border border-emerald-900/15 bg-[#F6F8F7] px-2.5 py-1.5 text-xs font-bold text-slate-900 tabular-nums"
                >
                  {KZ_ACCOUNTS.map((a) => (
                    <option key={`d-${a.code}`} value={a.code}>
                      {a.code} · {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-amber-900 block">Кредит (Кт)</label>
                <select
                  value={newCredit}
                  onChange={(e) => setNewCredit(e.target.value)}
                  className="w-full min-h-[38px] rounded-xl border border-emerald-900/15 bg-[#F6F8F7] px-2.5 py-1.5 text-xs font-bold text-slate-900 tabular-nums"
                >
                  {KZ_ACCOUNTS.map((a) => (
                    <option key={`c-${a.code}`} value={a.code}>
                      {a.code} · {a.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Құжат атауы</label>
                <input
                  type="text"
                  value={newDocName}
                  onChange={(e) => setNewDocName(e.target.value)}
                  className="w-full min-h-[38px] rounded-xl border border-emerald-900/15 bg-[#F6F8F7] px-3 py-1.5 text-xs text-slate-900"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Сома (₸)</label>
                <input
                  type="number"
                  min={1}
                  step={1000}
                  value={newAmount}
                  onChange={(e) => setNewAmount(Number(e.target.value))}
                  className="w-full min-h-[38px] rounded-xl border border-emerald-900/15 bg-[#F6F8F7] px-3 py-1.5 text-xs font-bold tabular-nums text-slate-900"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                Субконто / Аналитика (Контрагент, Қойма, Қызметкер)
              </label>
              <input
                type="text"
                value={newSubconto}
                onChange={(e) => setNewSubconto(e.target.value)}
                className="w-full min-h-[38px] rounded-xl border border-emerald-900/15 bg-[#F6F8F7] px-3 py-1.5 text-xs text-slate-900"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">Түсініктеме (Комментарий)</label>
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="w-full min-h-[38px] rounded-xl border border-emerald-900/15 bg-[#F6F8F7] px-3 py-1.5 text-xs text-slate-900"
              />
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="submit"
                disabled={newAmount <= 0 || newDebit === newCredit}
                className="flex-1 min-h-[42px] inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-emerald-800 text-white hover:bg-emerald-900 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>Құжатты өткізу (Провести)</span>
              </button>
              <button
                type="button"
                onClick={handleCloseMonthIn1C}
                className="min-h-[42px] inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-amber-500 text-white hover:bg-amber-600 transition-colors cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Айды жабу</span>
              </button>
            </div>
          </form>

          {/* Right: Live Operations Journal + Quick Report KPIs */}
          <div className="xl:col-span-7 bg-white border border-emerald-900/10 rounded-2xl shadow-[0_4px_20px_rgba(6,78,59,0.05)] p-4 sm:p-5 space-y-3.5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <KpiTile label="1С Ақша (1010+1030)" value={live1CReports.cashBalance} formatter={formatTenge} tone="emerald" />
              <KpiTile label="Түсім (6010)" value={live1CReports.revenue} formatter={formatTenge} />
              <KpiTile label="Таза пайда (ОПиУ)" value={live1CReports.netProfit} formatter={formatTenge} tone={live1CReports.netProfit >= 0 ? "amber" : "red"} />
              <KpiTile label="Баланс Активі" value={live1CReports.totalAssets} formatter={formatTenge} />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={journalSearch}
                  onChange={(e) => setJournalSearch(e.target.value)}
                  placeholder="Шот, құжат немесе контрагент іздеу..."
                  className="w-full min-h-[36px] rounded-xl border border-emerald-900/15 bg-[#F6F8F7] pl-8 pr-3 py-1 text-xs"
                />
              </div>

              <select
                value={docKindFilter}
                onChange={(e) => setDocKindFilter(e.target.value as OneCDocKind | "all")}
                className="min-h-[36px] rounded-xl border border-emerald-900/15 bg-[#F6F8F7] px-2.5 py-1 text-xs font-semibold"
              >
                <option value="all">Барлық құжаттар</option>
                {ONEC_DOC_TEMPLATES.map((t) => (
                  <option key={`f-${t.kind}`} value={t.kind}>
                    {t.title}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setJournal(INITIAL_ONEC_JOURNAL)}
                title="Бастапқы журналды қалпына келтіру"
                className="min-h-[36px] inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border border-emerald-900/15 text-xs font-bold text-slate-600 hover:bg-emerald-50 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Қалпына келтіру</span>
              </button>
            </div>

            <div className="overflow-x-auto max-h-[380px] overflow-y-auto border border-emerald-900/10 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-[#F6F8F7] sticky top-0 text-[11px] font-bold text-slate-600 border-b border-emerald-900/10">
                  <tr>
                    <th className="py-2 px-2.5">Күні</th>
                    <th className="py-2 px-2.5">Құжат / Субконто</th>
                    <th className="py-2 px-2.5">Дт</th>
                    <th className="py-2 px-2.5">Кт</th>
                    <th className="py-2 px-2.5 text-right">Сома</th>
                    <th className="py-2 px-2.5 text-center">Күйі</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredJournal.map((row) => (
                    <tr
                      key={row.id}
                      className={`hover:bg-emerald-50/40 ${!row.posted ? "opacity-55 bg-slate-50" : ""}`}
                    >
                      <td className="py-2 px-2.5 tabular-nums font-semibold text-slate-500 whitespace-nowrap">
                        {row.date}
                      </td>
                      <td className="py-2 px-2.5 min-w-[180px]">
                        <div className="font-bold text-slate-900">{row.docName}</div>
                        <div className="text-[10px] text-slate-500 truncate max-w-[230px]">
                          {row.subconto}
                        </div>
                      </td>
                      <td className="py-2 px-2.5 font-extrabold text-emerald-900 tabular-nums">
                        {row.debit}
                      </td>
                      <td className="py-2 px-2.5 font-extrabold text-amber-800 tabular-nums">
                        {row.credit}
                      </td>
                      <td className="py-2 px-2.5 text-right font-extrabold tabular-nums whitespace-nowrap text-slate-900">
                        {formatTenge(row.amount)}
                      </td>
                      <td className="py-2 px-2.5">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleTogglePosted(row.id)}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold cursor-pointer ${
                              row.posted
                                ? "bg-emerald-100 text-emerald-900"
                                : "bg-slate-200 text-slate-600"
                            }`}
                          >
                            {row.posted ? "Өткізілді" : "Жоба"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteEntry(row.id)}
                            aria-label="Жою"
                            className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              type="button"
              onClick={() =>
                onAskCompass(
                  `Мен 1С Журналымда ${journal.filter((j) => j.posted).length} құжат өткіздім: түсім ${formatTenge(live1CReports.revenue)}, ақша қалдығы ${formatTenge(live1CReports.cashBalance)}, таза пайда ${formatTenge(live1CReports.netProfit)}. 1С-те «Айды жабу», салық регистрлері және АСВ тексерісі бойынша кәсіби талдау беріңіз.`,
                  "1С: Бухгалтерия журналы"
                )
              }
              className="w-full min-h-[40px] py-2 px-4 text-xs font-bold rounded-xl bg-emerald-800 text-white hover:bg-emerald-900 transition-colors cursor-pointer"
            >
              1С Журнал мен проводкаларды AI Тәлімгермен талдау
            </button>
          </div>
        </div>
      )}

      {/* 3. LIVE АСВ (ОСВ) FROM 1C JOURNAL */}
      {activeSubTab === "osv" && (
        <div className="bg-white border border-emerald-900/10 rounded-2xl shadow-[0_4px_20px_rgba(6,78,59,0.05)] p-4 sm:p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-900/10 pb-3">
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-emerald-950">
                Айналым-сальдо ведомосі (АСВ / ОСВ) — 1С Журнал бойынша нақты есеп
              </h3>
              <p className="text-[11px] text-slate-500">
                Журналда өткізілген әрбір құжат осы кестедегі Дебет/Кредит айналымдарын автоматты жаңартады
              </p>
            </div>
            <span
              className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-xl border ${
                liveOsv.isBalanced
                  ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                  : "bg-red-50 text-red-900 border-red-200"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{liveOsv.isBalanced ? "Дт == Кт теңдігі сақталды" : "Теңдік бұзылды"}</span>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[190px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={osvSearch}
                onChange={(e) => setOsvSearch(e.target.value)}
                placeholder="Шот коды (1030, 6010...) немесе атауы бойынша сүзгі"
                className="w-full min-h-[38px] rounded-xl border border-emerald-900/15 bg-[#F6F8F7] pl-8 pr-3 py-1 text-xs"
              />
            </div>

            {(
              ["Барлығы", "Ақша", "Есеп айырысу", "Тауар/Мүлік", "Салық/Жалақы", "Капитал", "Кіріс/Шығыс"] as const
            ).map((grp) => (
              <button
                key={grp}
                type="button"
                onClick={() => setOsvGroupFilter(grp)}
                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-colors cursor-pointer ${
                  osvGroupFilter === grp
                    ? "bg-emerald-800 text-white"
                    : "bg-[#F6F8F7] text-slate-600 border border-emerald-900/10 hover:bg-emerald-50"
                }`}
              >
                {grp}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto border border-emerald-900/10 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-[#F6F8F7] text-[11px] font-bold text-slate-600 border-b border-emerald-900/10">
                <tr>
                  <th className="py-2.5 px-3">Шот</th>
                  <th className="py-2.5 px-3">Шот атауы / Түрі</th>
                  <th className="py-2.5 px-3 text-right">Дт айналым</th>
                  <th className="py-2.5 px-3 text-right">Кт айналым</th>
                  <th className="py-2.5 px-3 text-right">Соңғы Дт</th>
                  <th className="py-2.5 px-3 text-right">Соңғы Кт</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOsvRows.map((r) => (
                  <tr key={r.code} className="hover:bg-emerald-50/40">
                    <td className="py-2 px-3 font-extrabold text-emerald-950 tabular-nums">
                      {r.code}
                    </td>
                    <td className="py-2 px-3">
                      <div className="font-semibold text-slate-900">{r.name}</div>
                      <div className="text-[10px] text-slate-500">{r.natureLabel}</div>
                    </td>
                    <td className="py-2 px-3 text-right tabular-nums font-semibold text-slate-800">
                      {formatTenge(r.dtTurnover)}
                    </td>
                    <td className="py-2 px-3 text-right tabular-nums font-semibold text-slate-800">
                      {formatTenge(r.ctTurnover)}
                    </td>
                    <td className="py-2 px-3 text-right tabular-nums font-extrabold text-emerald-900">
                      {r.closingDt > 0 ? formatTenge(r.closingDt) : "—"}
                    </td>
                    <td className="py-2 px-3 text-right tabular-nums font-extrabold text-amber-800">
                      {r.closingCt > 0 ? formatTenge(r.closingCt) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-emerald-900 text-white font-extrabold text-xs">
                <tr>
                  <td className="py-2.5 px-3" colSpan={2}>
                    ЖИЫНЫ (БАРЛЫҚ ШОТТАР БОЙЫНША)
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums">
                    {formatTenge(liveOsv.totalDtTurnover)}
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums">
                    {formatTenge(liveOsv.totalCtTurnover)}
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-amber-300">
                    {formatTenge(liveOsv.totalClosingDt)}
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-amber-300">
                    {formatTenge(liveOsv.totalClosingCt)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs text-slate-600">
              Егер 6010, 7010, 7210 шоттарында қалдық тұрса — «1С: Журнал» бөлімінде{" "}
              <strong>«Айды жабу»</strong> батырмасын басып көріңіз.
            </div>
            <button
              type="button"
              onClick={() =>
                onAskCompass(
                  `Менің 1С АСВ (ОСВ) жиынтық айналымым ${formatTenge(liveOsv.totalDtTurnover)}, ал соңғы қалдық теңдігі ${formatTenge(liveOsv.totalClosingDt)}. 1С-те АСВ-дағы қателерді (қызыл қалдық, жабылмаған 6010/7210) қалай тексереді?`,
                  "АСВ (ОСВ)"
                )
              }
              className="px-4 py-2 min-h-[38px] text-xs font-bold rounded-xl bg-emerald-800 text-white hover:bg-emerald-900 transition-colors cursor-pointer"
            >
              АСВ есебін AI Тәлімгерде талдау
            </button>
          </div>
        </div>
      )}

      {/* 4. BALANCE (Ф.1), OPIU (Ф.2), DDS (Ф.3) WITH LIVE 1C vs SIMULATOR SWITCH */}
      {(activeSubTab === "balance" || activeSubTab === "opiu" || activeSubTab === "dds") &&
        reportCardData && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
            <div className="xl:col-span-7">
              <CompassFormatCard
                data={reportCardData}
                sfxMuted={sfxMuted}
                showVisualStage={true}
                stageProgress={stageProgress}
                stageSecondaryRatio={stageSecondary}
                stageMetrics={stageMetrics}
                onSpeakingChange={onSpeakingChange}
                compactStage={true}
              />
            </div>

            <div className="xl:col-span-5 bg-white border border-emerald-900/10 rounded-2xl shadow-[0_4px_20px_rgba(6,78,59,0.05)] p-4 sm:p-5 space-y-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-900/10 pb-2.5">
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-emerald-950">
                    {ACCOUNTING_TABS.find((t) => t.id === activeSubTab)?.label}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    1С журналынан автоматты алу немесе қолмен модельдеу
                  </p>
                </div>

                <div className="inline-flex rounded-xl bg-[#F6F8F7] border border-emerald-900/10 p-0.5 text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setUseLive1CData(true)}
                    className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                      useLive1CData ? "bg-emerald-800 text-white" : "text-slate-600"
                    }`}
                  >
                    1С Дерегі
                  </button>
                  <button
                    type="button"
                    onClick={() => setUseLive1CData(false)}
                    className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                      !useLive1CData ? "bg-amber-500 text-white" : "text-slate-600"
                    }`}
                  >
                    Симулятор
                  </button>
                </div>
              </div>

              {useLive1CData ? (
                <div className="space-y-3">
                  <div className="rounded-xl bg-emerald-50/70 border border-emerald-200 p-3 text-xs text-emerald-950 flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <span>
                      Бұл көрсеткіштер <strong>«1С: Журнал»</strong> қойындысындағы{" "}
                      {journal.filter((j) => j.posted).length} өткізілген құжаттан тікелей есептелді.
                    </span>
                  </div>

                  {activeSubTab === "balance" && (
                    <div className="grid grid-cols-2 gap-2">
                      <KpiTile label="Ақша (1010+1030)" value={live1CReports.cashBalance} formatter={formatTenge} tone="emerald" />
                      <KpiTile label="Дебитор + ТМҚ" value={live1CReports.receivablesAndInventory} formatter={formatTenge} />
                      <KpiTile label="Міндеттемелер" value={balance.totalLiabilities} formatter={formatTenge} tone="amber" />
                      <KpiTile label="Меншікті капитал" value={balance.equity} formatter={formatTenge} tone="emerald" />
                    </div>
                  )}

                  {activeSubTab === "opiu" && (
                    <div className="grid grid-cols-2 gap-2">
                      <KpiTile label="Түсім (6010)" value={opiu.revenue} formatter={formatTenge} tone="emerald" />
                      <KpiTile label="Өзіндік құн (7010)" value={opiu.cogs} formatter={formatTenge} />
                      <KpiTile label="Шығыстар (7210)" value={opiu.opex} formatter={formatTenge} tone="amber" />
                      <KpiTile label="Таза пайда" value={opiu.netProfit} formatter={formatTenge} tone={opiu.netProfit >= 0 ? "emerald" : "red"} />
                    </div>
                  )}

                  {activeSubTab === "dds" && (
                    <div className="grid grid-cols-2 gap-2">
                      <KpiTile label="Операциялық түсім" value={live1CReports.operatingInflow} formatter={formatTenge} tone="emerald" />
                      <KpiTile label="Операциялық төлем" value={live1CReports.operatingOutflow} formatter={formatTenge} tone="amber" />
                      <KpiTile label="Қаржылық ағын" value={live1CReports.financingNet} formatter={formatTenge} />
                      <KpiTile label="Соңғы ақша қалдығы" value={dds.endingCash} formatter={formatTenge} tone="emerald" />
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {activeSubTab === "balance" && (
                    <div className="space-y-3">
                      <SliderControl label="Ақша қаражаты (1010, 1030)" valueLabel={formatTenge(cashBank)} min={500_000} max={15_000_000} step={250_000} value={cashBank} onChange={setCashBank} />
                      <SliderControl label="Дебиторлар және ТМҚ (1210, 1330)" valueLabel={formatTenge(recvInventory)} min={500_000} max={20_000_000} step={250_000} value={recvInventory} onChange={setRecvInventory} />
                      <SliderControl label="Негізгі құралдар (2410)" valueLabel={formatTenge(fixedAssets)} min={1_000_000} max={40_000_000} step={500_000} value={fixedAssets} onChange={setFixedAssets} />
                      <SliderControl label="Қысқа мерзімді қарыз (3310, 3350)" valueLabel={formatTenge(shortDebt)} min={200_000} max={15_000_000} step={200_000} value={shortDebt} onChange={setShortDebt} />
                      <SliderControl label="Ұзақ мерзімді қарыздар (4010)" valueLabel={formatTenge(longDebt)} min={0} max={20_000_000} step={250_000} value={longDebt} onChange={setLongDebt} />
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-emerald-900/10">
                        <KpiTile label="Жиынтық актив" value={balance.totalAssets} formatter={formatTenge} tone="emerald" />
                        <KpiTile label="Меншікті капитал" value={balance.equity} formatter={formatTenge} tone={balance.equity >= 0 ? "amber" : "red"} />
                      </div>
                    </div>
                  )}

                  {activeSubTab === "opiu" && (
                    <div className="space-y-3">
                      <SliderControl label="Сатудан түскен түсім (6010)" valueLabel={formatTenge(revenue)} min={1_000_000} max={30_000_000} step={250_000} value={revenue} onChange={setRevenue} />
                      <SliderControl label="Өзіндік құн (7010)" valueLabel={formatTenge(cogs)} min={500_000} max={22_000_000} step={200_000} value={cogs} onChange={setCogs} />
                      <SliderControl label="Әкімшілік шығындар (7210)" valueLabel={formatTenge(opex)} min={200_000} max={10_000_000} step={150_000} value={opex} onChange={setOpex} />
                      <SliderControl label="Табыс салығы (КТС)" valueLabel={`${taxRate}%`} min={0} max={25} step={1} value={taxRate} onChange={setTaxRate} />
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-emerald-900/10">
                        <KpiTile label="Жалпы пайда" value={opiu.grossProfit} formatter={formatTenge} />
                        <KpiTile label="Таза пайда" value={opiu.netProfit} formatter={formatTenge} tone={opiu.netProfit >= 0 ? "emerald" : "red"} />
                      </div>
                    </div>
                  )}

                  {activeSubTab === "dds" && (
                    <div className="space-y-3">
                      <SliderControl label="Бастапқы ақша қалдығы" valueLabel={formatTenge(openCash)} min={0} max={10_000_000} step={100_000} value={openCash} onChange={setOpenCash} />
                      <SliderControl label="Операциялық түсім" valueLabel={formatTenge(opInflow)} min={500_000} max={25_000_000} step={250_000} value={opInflow} onChange={setOpInflow} />
                      <SliderControl label="Операциялық төлемдер" valueLabel={formatTenge(opOutflow)} min={300_000} max={20_000_000} step={200_000} value={opOutflow} onChange={setOpOutflow} />
                      <SliderControl label="Инвестициялық таза ағын" valueLabel={formatTenge(investNet)} min={-5_000_000} max={3_000_000} step={150_000} value={investNet} onChange={setInvestNet} />
                      <SliderControl label="Қаржылық таза ағын" valueLabel={formatTenge(financeNet)} min={-4_000_000} max={5_000_000} step={150_000} value={financeNet} onChange={setFinanceNet} />
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-emerald-900/10">
                        <KpiTile label="Операциялық ағын" value={dds.operatingCf} formatter={formatTenge} tone={dds.operatingCf >= 0 ? "emerald" : "red"} />
                        <KpiTile label="Соңғы ақша қалдығы" value={dds.endingCash} formatter={formatTenge} tone={dds.endingCash >= 0 ? "amber" : "red"} />
                      </div>
                    </div>
                  )}
                </>
              )}

              <button
                type="button"
                onClick={() =>
                  onAskCompass(
                    activeSubTab === "balance"
                      ? `Активтер ${formatTenge(balance.totalAssets)}, міндеттемелер ${formatTenge(balance.totalLiabilities)}, меншікті капитал ${formatTenge(balance.equity)} болғанда Баланс (Ф.1) мен 1С АСВ арасындағы байланысты талдап беріңіз.`
                      : activeSubTab === "opiu"
                        ? `Түсім ${formatTenge(opiu.revenue)}, өзіндік құн ${formatTenge(opiu.cogs)}, таза пайда ${formatTenge(opiu.netProfit)} болғанда ОПиУ (Ф.2) мен 1С «Айды жабу» қалай орындалады?`
                        : `Операциялық ағын ${formatTenge(dds.operatingCf)} және соңғы қалдық ${formatTenge(dds.endingCash)} болғанда ДДС (Ф.3) касса алшақтығын қалай тексереміз?`,
                    ACCOUNTING_TABS.find((t) => t.id === activeSubTab)?.label || "Есеп және 1С"
                  )
                }
                className="w-full min-h-[42px] py-2 px-4 text-xs sm:text-sm font-bold rounded-xl bg-emerald-800 text-white hover:bg-emerald-900 transition-colors cursor-pointer"
              >
                Осы есепті AI Тәлімгерде талдау
              </button>
            </div>
          </div>
        )}
    </div>
  );
}

function SliderControl({
  label,
  valueLabel,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string;
  valueLabel: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (val: number) => void;
}) {
  return (
    <label className="block space-y-1">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="font-semibold text-slate-700">{label}</span>
        <span className="tabular-nums font-bold text-emerald-950">{valueLabel}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full compass-slider"
      />
    </label>
  );
}

function KpiTile({
  label,
  value,
  formatter,
  tone = "neutral",
}: {
  label: string;
  value: number;
  formatter: (val: number) => string;
  tone?: "neutral" | "emerald" | "amber" | "red";
}) {
  const toneClass =
    tone === "emerald"
      ? "text-emerald-950 bg-emerald-50/90 border-emerald-200"
      : tone === "amber"
        ? "text-amber-950 bg-amber-50/85 border-amber-200"
        : tone === "red"
          ? "text-red-950 bg-red-50/85 border-red-200"
          : "text-slate-900 bg-[#F6F8F7] border-emerald-900/10";

  return (
    <div className={`rounded-xl border px-3 py-2 space-y-0.5 ${toneClass}`}>
      <div className="text-[11px] font-medium text-slate-600 leading-tight">{label}</div>
      <div className="text-sm tabular-nums font-extrabold">
        <AnimatedCounter value={value} formatter={formatter} />
      </div>
    </div>
  );
}
