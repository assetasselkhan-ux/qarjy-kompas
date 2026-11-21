import { useState } from "react";
import { Wallet, TrendingUp, ShieldAlert, Home, Scale } from "lucide-react";
import type { CompassStructuredResponse, LiteracyTabId } from "../types/finance";
import {
  calculateBudgetAndCushion,
  calculateCompoundAndInflation,
  calculateDebtAndTrap,
  calculateLoanMortgage,
  formatTenge,
  formatPercent,
} from "../utils/financeMath";
import { playSfx } from "../utils/sfx";
import { CompassFormatCard } from "./CompassFormatCard";
import { AnimatedCounter } from "./AnimatedCounter";
import { BudgetPieChart } from "./BudgetPieChart";

interface FinancialLiteracySectionProps {
  activeSubTab: LiteracyTabId;
  onChangeSubTab: (tab: LiteracyTabId) => void;
  sfxMuted: boolean;
  onAskMentor: (prompt: string, topic: string) => void;
  onTipChange?: (tip: string) => void;
  onSpeakingChange?: (speaking: boolean) => void;
}

const LITERACY_TABS: Array<{
  id: LiteracyTabId;
  label: string;
  badge: string;
  icon: typeof Wallet;
}> = [
  { id: "budget", label: "Бюджет және Жастық", badge: "50/30/20", icon: Wallet },
  { id: "debts", label: "Қарыз & Тұзақтар", badge: "Анти-қарыз", icon: Scale },
  { id: "compound", label: "Күрделі пайыз", badge: "Инвестиция", icon: TrendingUp },
  { id: "inflation", label: "Инфляция", badge: "Нақты құн", icon: ShieldAlert },
  { id: "mortgage", label: "Несие және Ипотека", badge: "Аннуитет", icon: Home },
];

export function FinancialLiteracySection({
  activeSubTab,
  onChangeSubTab,
  sfxMuted,
  onAskMentor,
  onTipChange,
  onSpeakingChange,
}: FinancialLiteracySectionProps) {
  // Budget & Cushion state
  const [income, setIncome] = useState(450_000);
  const [debtPayment, setDebtPayment] = useState(85_000);
  const [mandatory, setMandatory] = useState(145_000);
  const [wants, setWants] = useState(100_000);
  const [cushionNow, setCushionNow] = useState(350_000);

  // Debt Exit & Marketing Trap state
  const [smallDebt, setSmallDebt] = useState(300_000);
  const [smallDebtRate, setSmallDebtRate] = useState(14);
  const [bigDebt, setBigDebt] = useState(1_200_000);
  const [bigDebtRate, setBigDebtRate] = useState(26);
  const [debtBudget, setDebtBudget] = useState(125_000);
  const [installmentPrice, setInstallmentPrice] = useState(400_000);
  const [cashDiscountPct, setCashDiscountPct] = useState(15);

  // Compound & Investment state
  const [invInit, setInvInit] = useState(500_000);
  const [invMonthly, setInvMonthly] = useState(60_000);
  const [invRate, setInvRate] = useState(15.0);
  const [invYears, setInvYears] = useState(10);

  // Inflation state
  const [infAmount, setInfAmount] = useState(2_000_000);
  const [infRate, setInfRate] = useState(9.5);
  const [infYears, setInfYears] = useState(5);
  const [depositYield, setDepositYield] = useState(14.0);

  // Mortgage / Loan state
  const [homePrice, setHomePrice] = useState(24_000_000);
  const [downPct, setDownPct] = useState(20);
  const [loanRate, setLoanRate] = useState(14.5);
  const [loanYears, setLoanYears] = useState(15);
  const [extraPay, setExtraPay] = useState(40_000);

  const totalMandatory = mandatory + debtPayment;
  const budgetRes = calculateBudgetAndCushion(income, totalMandatory, wants, cushionNow, 6);
  const debtRes = calculateDebtAndTrap(
    smallDebt,
    smallDebtRate,
    bigDebt,
    bigDebtRate,
    debtBudget,
    installmentPrice,
    cashDiscountPct,
    12
  );
  const compRes = calculateCompoundAndInflation(invInit, invMonthly, invRate, invYears, infRate);
  const infOnlyRes = calculateCompoundAndInflation(infAmount, 0, 0, infYears, infRate);
  const infProtectedRes = calculateCompoundAndInflation(
    infAmount,
    0,
    depositYield,
    infYears,
    infRate
  );
  const mortgageRes = calculateLoanMortgage(homePrice, downPct, loanRate, loanYears, extraPay);

  const handleTabSwitch = (id: LiteracyTabId) => {
    onChangeSubTab(id);
    playSfx("coin", sfxMuted);
    const tips: Record<LiteracyTabId, string> = {
      budget:
        "Қарапайым ереже: ақша түскен күні алдымен 10–20% қорға бөліңіз — аз табыстан да 1–2 жылда мықты жастық жиналады.",
      debts:
        "Қарыздан құтылу үшін жаңа бөліп төлеу алмаңыз: Көшкін (жоғары % бірінші) ақша үнемдейді, ал 0% бөліп төлеуде қолма-қол жеңілдікті тексеріңіз.",
      compound:
        "Күрделі пайыз — табысқа қайта табыс қосылуы. 72 ережесімен ақшаңыз неше жылда 2 еселенетінін лезде білесіз.",
      inflation:
        "Үйде бос жатқан ақша жыл сайын инфляциядан құнсызданады. Депозит пен облигация сатып алу күшін сақтайды.",
      mortgage:
        "Ипотекада алғашқы жылдардағы шағын артық төлем негізгі қарызды кесіп, миллиондаған пайызды үнемдейді.",
    };
    onTipChange?.(tips[id]);
  };

  let cardData: CompassStructuredResponse;
  let stageMetrics: Array<{ label: string; value: number; color: string }> | undefined;

  if (activeSubTab === "budget") {
    stageMetrics = [
      { label: "Қажетті төлемдер (Ипотека/несие)", value: debtPayment, color: "#D97706" },
      { label: "Міндетті тұрмыстық шығындар", value: mandatory, color: "#065F46" },
      { label: "Қосымша қалау мен демалыс", value: wants, color: "#0284C7" },
      { label: "Қаржылық жастыққа бөлінетін сома", value: Math.max(0, budgetRes.actualSurplus), color: "#10B981" },
    ];
    cardData = {
      shortAnswer: `Айына ${formatTenge(income)} табыстан ипотека/несие (${formatTenge(debtPayment)}) мен шығындарды шегергенде қаржылық жастыққа ${formatTenge(Math.max(0, budgetRes.actualSurplus))} (${formatPercent(budgetRes.savingsRatePct)}) қалады.`,
      explanation: `Қарапайым мысал: айлық түскен күні дүкенге бармай тұрып қорға ақша бөлу — ең тиімді әдет. Қажетті төлемдер (${formatTenge(totalMandatory)}) мен қалау (${formatTenge(wants)}) сомасынан кейін 6 айлық жастыққа (${formatTenge(budgetRes.cushionTarget6M)}) ${Number.isFinite(budgetRes.monthsToCushion) ? `${budgetRes.monthsToCushion} айда` : "шығынды 10% қысқарту арқылы"} жетесіз.`,
      stepByStep: [
        `1-қадам: Табыс түскен күні бірінші кезекте ${formatTenge(Math.max(0, budgetRes.actualSurplus))} соманы бөлек депозитке салыңыз.`,
        `2-қадам: Алғашқы мақсат — 1 айлық міндетті шығын (${formatTenge(totalMandatory)}), сосын 6 айлық қор (${formatTenge(budgetRes.cushionTarget6M)}).`,
        "3-қадам: Ипотека/несие үлесі табыстың 30%-ынан аспауын қадағалаңыз.",
      ],
      guidingQuestion:
        "Егер айлық табыс 250 000 ₸ болса, 10% ережесімен табыс түскен күні қорға кемінде қанша теңге аудару керек?",
      guidingHint: "250 000 × 10% = 25 000 ₸. Бір жылда 14% депозитпен ~322 000 ₸ жиналады!",
      sceneDescription:
        "Жеке бюджеттің табыс, несие/ипотека, шығын және қаржылық жастық бойынша бөлінуі.",
      sfxType: "coin",
      expertSummary:
        "Ай соңында қалғанын жинаймын десеңіз ақша қалмайды. Алдымен өзіңізге 10–20% төлеңіз!",
      visualType: "literacy",
      journalEntry: "Қаржылық жастық = Табыс − (Ипотека/Несие + Міндетті + Қалау)",
      doc1C: "Жеке қаржы жоспары · Дөңгелек бюджет",
      formulaLabel: "6 айлық жастық = (Ипотека/несие + Міндетті шығын) × 6",
      exampleCalculation: `Жастық мақсаты: ${formatTenge(budgetRes.cushionTarget6M)}`,
      keyMetricLabel: "Жастыққа айлық сома",
      keyMetricValue: formatTenge(Math.max(0, budgetRes.actualSurplus)),
    };
  } else if (activeSubTab === "debts") {
    stageMetrics = [
      { label: "Көшкін (пайыз шығыны)", value: debtRes.avalancheInterest, color: "#059669" },
      { label: "Қар кесегі (пайыз шығыны)", value: debtRes.snowballInterest, color: "#D97706" },
      { label: "0% бөліп төлеу үстемесі", value: debtRes.hiddenMarkupTenge, color: "#DC2626" },
    ];
    cardData = {
      shortAnswer: `Қарыздан шығуда «Көшкін» әдісі ${formatTenge(debtRes.savedWithAvalanche)} пайыз үнемдейді, ал «0% бөліп төлеуде» қолма-қол ${cashDiscountPct}% жеңілдік сұрасаңыз ${formatTenge(debtRes.hiddenMarkupTenge)} артық төлемейсіз.`,
      explanation: `Күнделікті мысал: шелекте екі тесік болса, су көп ағатын үлкен тесікті бірінші бітейсіз. Қарызда да солай — ең жоғары ${Math.max(smallDebtRate, bigDebtRate)}% несиені бірінші жабу ақшаңызды сақтайды. Ал дүкендегі «0% бөліп төлеу» жиі бағаға ~${debtRes.hiddenAnnualRateApproxPct.toFixed(0)}% жасырын үстеме қосады.`,
      stepByStep: [
        "1-қадам: Бүгіннен бастап жаңа «0% бөліп төлеу» рәсімдеуге 90 күндік тыйым қойыңыз.",
        `2-қадам: Айына ${formatTenge(debtBudget)} бюджетпен алдымен ${Math.max(smallDebtRate, bigDebtRate)}% несиеге артық төлеңіз (${debtRes.avalancheMonths} айда жабылады).`,
        `3-қадам: Зат сатып аларда «Қолма-қол алсам қанша жеңілдік бар?» деп сұраңыз (${formatTenge(debtRes.cashDiscountPrice)} vs ${formatTenge(installmentPrice)}).`,
      ],
      guidingQuestion:
        `Егер ${formatTenge(installmentPrice)} тұратын затты қолма-қол ${cashDiscountPct}% жеңілдікпен алуға болса, «0% бөліп төлеу» қанша теңге жасырын үстеме болып шығады?`,
      guidingHint: `${formatTenge(installmentPrice)} − ${formatTenge(debtRes.cashDiscountPrice)} = ${formatTenge(debtRes.hiddenMarkupTenge)} (жылдық ~${debtRes.hiddenAnnualRateApproxPct.toFixed(1)}% несиеге тең!).`,
      sceneDescription:
        "Көшкін мен Қар кесегі әдістерін және «0% бөліп төлеу» жасырын бағасын салыстыру.",
      sfxType: "bricks",
      expertSummary:
        "Қарыз төлемі айлық табыстың 30%-ынан аспасын. Бір қарыз жабылғанда, оның төлемін келесі қарызға қосыңыз.",
      visualType: "literacy",
      journalEntry: "Жасырын мөлшерлеме = (Бөліп төлеу − Қолма-қол) / Қолма-қол",
      doc1C: "Қарызсыз жоспар · Анти-тұзақ чегі",
      formulaLabel: "Көшкін = Жоғары % бірінші · Қар кесегі = Кіші сома бірінші",
      exampleCalculation: `Пайыз үнемі: ${formatTenge(debtRes.savedWithAvalanche)} · Тауар үнемі: ${formatTenge(debtRes.hiddenMarkupTenge)}`,
      keyMetricLabel: "Көшкінмен жабу мерзімі",
      keyMetricValue: `${debtRes.avalancheMonths} ай`,
      comparison: {
        title: "Қарыз жабу әдістері мен «0% бөліп төлеу» салыстыруы",
        winnerLabel: `Көшкін ${formatTenge(debtRes.savedWithAvalanche)} үнемдейді`,
        verdict: debtRes.verdict,
        options: [
          {
            name: `1. Көшкін (${Math.max(smallDebtRate, bigDebtRate)}% несие бірінші)`,
            costOrReturn: `Артық пайыз: ${formatTenge(debtRes.avalancheInterest)}`,
            netBenefit: `Мерзім: ${debtRes.avalancheMonths} ай (Ең арзан)`,
            pros: "Банкке төлейтін пайызды барынша азайтады",
            cons: "Үлкен қарыз біткенше алғашқы айларда төзім керек",
            isWinner: true,
          },
          {
            name: `2. Қар кесегі (${formatTenge(smallDebt)} бірінші)`,
            costOrReturn: `Артық пайыз: ${formatTenge(debtRes.snowballInterest)}`,
            netBenefit: `Мерзім: ${debtRes.snowballMonths} ай`,
            pros: "Ұсақ қарыз тез жабылып, психологиялық жеңілдік береді",
            cons: `Көшкінге қарағанда ${formatTenge(debtRes.savedWithAvalanche)} көп пайыз кетеді`,
          },
          {
            name: `3. «0% бөліп төлеу» vs Қолма-қол`,
            costOrReturn: `${formatTenge(installmentPrice)} vs ${formatTenge(debtRes.cashDiscountPrice)}`,
            netBenefit: `Жасырын үстеме: ${formatTenge(debtRes.hiddenMarkupTenge)}`,
            pros: "Бірден толық сома шығармайсыз",
            cons: `Шын мәнінде ~${debtRes.hiddenAnnualRateApproxPct.toFixed(1)}% жылдық үстеме төлейсіз`,
          },
        ],
      },
    };
  } else if (activeSubTab === "compound") {
    stageMetrics = [
      { label: "Өзіңіз салған қаражат", value: compRes.totalContributed, color: "#065F46" },
      { label: "Күрделі пайыз табысы", value: compRes.compoundProfit, color: "#D97706" },
      { label: "Инфляциядан кейінгі нақты құн", value: compRes.finalReal, color: "#10B981" },
    ];
    cardData = {
      shortAnswer: `${invYears} жылда сіз салған ${formatTenge(compRes.totalContributed)} үстіне ${formatTenge(compRes.compoundProfit)} таза пайыз қосылып, капитал ${formatTenge(compRes.finalNominal)} болады (әр ${compRes.ruleOf72Years.toFixed(1)} жылда 2 еселенеді).`,
      explanation: `Қарапайым мысал: күрделі пайыз — тау басынан домалаған қар кесегі сияқты. Алғашқы жылдары баяу өскенімен, өткен жылдың пайызына қайтадан пайыз қосылып, кейінгі жылдары ақшаңыз өздігінен еселеніп өседі.`,
      stepByStep: [
        `1-қадам: Тұрақты айлық салым (${formatTenge(invMonthly)}) капитал базасын өсіреді.`,
        `2-қадам: 72 ережесі бойынша қаражатыңыз әр ${compRes.ruleOf72Years.toFixed(1)} жылда екі еселенеді.`,
        "3-қадам: Қаражатты депозит, облигация және акция себеттеріне бөліп сақтаңыз.",
      ],
      guidingQuestion:
        `Жылдық табыстылық ${invRate}% болғанда, «72 ережесі» бойынша салынған ақша шамамен неше жылда 2 еселенеді?`,
      guidingHint: `72 ÷ ${invRate} ≈ ${compRes.ruleOf72Years.toFixed(1)} жыл.`,
      sceneDescription: "Пайызға пайыз қосылуының экспоненциалды өсу графигі.",
      sfxType: "harvest",
      expertSummary:
        "Инвестицияда ең қуатты фактор — уақыт пен тұрақтылық. Ерте басталған шағын салымдар үлкен нәтиже береді.",
      visualType: "literacy",
      journalEntry: "FV = P(1+r)^n + PMT·[(1+r)^n − 1]/r",
      doc1C: "Инвестициялық портфель есебі",
      formulaLabel: "T_2x ≈ 72 / Жылдық %",
      exampleCalculation: `Таза пайыз табысы: ${formatTenge(compRes.compoundProfit)}`,
      keyMetricLabel: `${invYears} жылдық капитал`,
      keyMetricValue: formatTenge(compRes.finalNominal),
    };
  } else if (activeSubTab === "inflation") {
    stageMetrics = [
      { label: "Бастапқы сома", value: infAmount, color: "#64748B" },
      { label: "Бос жатқандағы нақты құны", value: infOnlyRes.finalReal, color: "#DC2626" },
      { label: `${depositYield}% депозиттегі нақты құны`, value: infProtectedRes.finalReal, color: "#059669" },
    ];
    cardData = {
      shortAnswer: `${formatTenge(infAmount)} үйде бос жатса ${infYears} жылда ${formatTenge(infOnlyRes.purchasingPowerLost)} құнын жоғалтады, ал ${depositYield}% депозитте оны сақтап қана қоймай +${formatPercent(infProtectedRes.realRateFisherPct, 2)} нақты өсім береді.`,
      explanation: `Қарапайым мысал: 5 жыл бұрын 10 000 ₸-ге толған азық-түлік себеті бүгін 16 000 ₸ тұрады. Сондықтан жастық астындағы ақшаның саны өзгермесе де, сатып алатын тауары азаяды — оны тек инфляциядан жоғары депозит қорғайды.`,
      stepByStep: [
        `1-қадам: Бос жатқан ақша ${infYears} жылда ${formatTenge(infOnlyRes.purchasingPowerLost)} сатып алу күшін жоғалтады.`,
        `2-қадам: Фишер формуласы бойынша ${depositYield}% депозиттің нақты табыстылығы — ${formatPercent(infProtectedRes.realRateFisherPct, 2)}.`,
        "3-қадам: Қаражатты инфляциядан жоғары табыс әкелетін құралда ұстаңыз.",
      ],
      guidingQuestion:
        "Егер депозит мөлшерлемесі 14%, ал жылдық инфляция 9.5% болса, салымшы нақты байып жатыр ма әлде ұтылып жатыр ма?",
      guidingHint: "Нақты табыс оң (~+4.1%): депозит инфляцияны жеңіп, сатып алу қабілетін арттырады.",
      sceneDescription: "Инфляция әсері мен қорғалған депозит құнының салыстырмасы.",
      sfxType: "worm_shield",
      expertSummary:
        "Номиналды сома өзгермесе де, инфляция бағаларды өсіреді. Әрдайым нақты табыстылыққа (Табыс − Инфляция) қараңыз.",
      visualType: "literacy",
      journalEntry: "PV_real = Сома / (1 + i)^t",
      doc1C: "Сатып алу қабілеті және Фишер талдауы",
      formulaLabel: "r_real = (1 + r) / (1 + i) − 1",
      exampleCalculation: `Құн жоғалтудан үнем: ${formatTenge(infProtectedRes.finalReal - infOnlyRes.finalReal)}`,
      keyMetricLabel: "Нақты Фишер табысы",
      keyMetricValue: formatPercent(infProtectedRes.realRateFisherPct, 2),
    };
  } else {
    stageMetrics = [
      { label: "Несие сомасы", value: mortgageRes.loanAmount, color: "#065F46" },
      { label: "Базалық банк пайызы", value: mortgageRes.totalInterestBase, color: "#D97706" },
      { label: "Ерте өтеумен үнемделген %", value: mortgageRes.savedInterest, color: "#10B981" },
    ];
    cardData = {
      shortAnswer: `Айлық ипотека төлемі ${formatTenge(mortgageRes.monthlyPayment)} болғанда, үстінен ай сайын ${formatTenge(extraPay)} артық төлеу ${formatTenge(mortgageRes.savedInterest)} пайызды үнемдеп, мерзімді ${mortgageRes.savedMonths} айға қысқартады.`,
      explanation: `Қарапайым мысал: ипотеканың алғашқы жылдарында төлеген ақшаңыздың 80%-ы банктің пайызына кетеді. Сондықтан несие басталған алғашқы 2–3 жылда сәл артық төлеген әр теңгеңіз тікелей негізгі қарызды кесіп, миллиондаған теңге үнемдейді.`,
      stepByStep: [
        "1-қадам: Бастапқы жарна неғұрлым көп болса, банктің негізгі қарызы соғұрлым аз болады.",
        "2-қадам: Аннуитеттік несиенің алғашқы жылдарында төлемнің көп бөлігі пайызға кетеді.",
        `3-қадам: Ай сайын ${formatTenge(extraPay)} артық төлеу негізгі қарызды азайтып, мерзімді ${mortgageRes.savedMonths} айға қысқартады.`,
      ],
      guidingQuestion:
        "Ипотека бойынша мерзімінен бұрын артық төлемді несиенің алғашқы жылдарында жасаған неліктен тиімдірек?",
      guidingHint: "Алғашқы жылдары қалған негізгі қарыз ең үлкен болады, сондықтан пайыз азаюы еселеп әсер етеді.",
      sceneDescription: "Аннуитеттік төлем құрылымы және мерзімінен бұрын өтеу үнемі.",
      sfxType: "bricks",
      expertSummary:
        "Несие аларда айлық төлемге ғана емес, жалпы артық төлем (сыйақы) сомасына және мерзімінен бұрын өтеу шартына қараңыз.",
      visualType: "literacy",
      journalEntry: "A = P · [r(1+r)^n] / [(1+r)^n − 1]",
      doc1C: "Өтеу кестесі · Аннуитет vs Сараланған төлем",
      formulaLabel: "Үнемделген % = Базалық сыйақы − Нақты сыйақы",
      exampleCalculation: `Үнем: ${formatTenge(mortgageRes.savedInterest)} (${mortgageRes.savedMonths} ай ерте)`,
      keyMetricLabel: "Айлық аннуитет төлемі",
      keyMetricValue: formatTenge(mortgageRes.monthlyPayment),
    };
  }

  return (
    <div className="space-y-4">
      <div
        role="tablist"
        aria-label="Қаржылық сауаттылық бөлімдері"
        className="inline-flex flex-wrap items-center gap-1 p-1.5 bg-white border border-emerald-900/10 rounded-2xl shadow-[0_2px_10px_rgba(6,78,59,0.04)]"
      >
        {LITERACY_TABS.map((tab) => {
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
                {tab.badge}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
        <div className="xl:col-span-7 space-y-4">
          {activeSubTab === "budget" && (
            <BudgetPieChart
              income={income}
              debtPayment={debtPayment}
              mandatoryLiving={mandatory}
              wants={wants}
              cushionMonthly={budgetRes.actualSurplus}
              cushionTarget6M={budgetRes.cushionTarget6M}
              monthsToCushion={budgetRes.monthsToCushion}
            />
          )}
          <CompassFormatCard
            data={cardData}
            sfxMuted={sfxMuted}
            showVisualStage={true}
            stageProgress={0.85}
            stageMetrics={stageMetrics}
            onSpeakingChange={onSpeakingChange}
            compactStage={true}
          />
        </div>

        <div className="xl:col-span-5 bg-white border border-emerald-900/10 rounded-2xl shadow-[0_4px_20px_rgba(6,78,59,0.05)] p-4 sm:p-5 space-y-3.5">
          <div className="flex items-center justify-between border-b border-emerald-900/10 pb-2.5">
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-emerald-950">
                {LITERACY_TABS.find((t) => t.id === activeSubTab)?.label}
              </h3>
              <p className="text-[11px] text-slate-500">
                Сандарды жылжытып, нақты есебін көріңіз
              </p>
            </div>
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-2 py-0.5">
              {LITERACY_TABS.find((t) => t.id === activeSubTab)?.badge}
            </span>
          </div>

          {activeSubTab === "budget" && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {[
                  {
                    label: "250 мың ₸ (Бастау)",
                    inc: 250_000,
                    debt: 35_000,
                    man: 120_000,
                    wan: 55_000,
                    cush: 40_000,
                  },
                  {
                    label: "450 мың ₸ (Орташа)",
                    inc: 450_000,
                    debt: 85_000,
                    man: 145_000,
                    wan: 100_000,
                    cush: 350_000,
                  },
                  {
                    label: "750 мың ₸ (Отбасы)",
                    inc: 750_000,
                    debt: 160_000,
                    man: 220_000,
                    wan: 160_000,
                    cush: 900_000,
                  },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setIncome(preset.inc);
                      setDebtPayment(preset.debt);
                      setMandatory(preset.man);
                      setWants(preset.wan);
                      setCushionNow(preset.cush);
                      playSfx("coin", sfxMuted);
                    }}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-colors cursor-pointer ${
                      income === preset.inc && debtPayment === preset.debt && mandatory === preset.man
                        ? "bg-emerald-800 text-white border-emerald-800"
                        : "bg-[#F6F8F7] text-slate-700 border-emerald-900/10 hover:bg-emerald-50"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <LitSlider
                label="Айлық таза табыс"
                valueLabel={formatTenge(income)}
                min={150_000}
                max={2_000_000}
                step={25_000}
                value={income}
                onChange={setIncome}
              />
              <LitSlider
                label="Қажетті төлемдер (ипотека / несие)"
                valueLabel={formatTenge(debtPayment)}
                min={0}
                max={1_000_000}
                step={10_000}
                value={debtPayment}
                onChange={setDebtPayment}
              />
              <LitSlider
                label="Міндетті тұрмыстық шығындар (азық, коммунал)"
                valueLabel={formatTenge(mandatory)}
                min={50_000}
                max={1_200_000}
                step={15_000}
                value={mandatory}
                onChange={setMandatory}
              />
              <LitSlider
                label="Қосымша қалау мен демалыс"
                valueLabel={formatTenge(wants)}
                min={0}
                max={800_000}
                step={10_000}
                value={wants}
                onChange={setWants}
              />
              <LitSlider
                label="Қазіргі жиналған жастық қоры"
                valueLabel={formatTenge(cushionNow)}
                min={0}
                max={3_000_000}
                step={50_000}
                value={cushionNow}
                onChange={setCushionNow}
              />
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-emerald-900/10">
                <LitKpi
                  label="Жастыққа бөлінетін сома"
                  value={budgetRes.actualSurplus}
                  formatter={formatTenge}
                  tone={budgetRes.actualSurplus > 0 ? "emerald" : "red"}
                />
                <LitKpi
                  label="6 айлық жастық мақсаты"
                  value={budgetRes.cushionTarget6M}
                  formatter={formatTenge}
                  tone="amber"
                />
              </div>
            </div>
          )}

          {activeSubTab === "debts" && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setSmallDebt(300_000);
                    setSmallDebtRate(14);
                    setBigDebt(1_200_000);
                    setBigDebtRate(28);
                    setDebtBudget(125_000);
                    playSfx("coin", sfxMuted);
                  }}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg border bg-[#F6F8F7] text-slate-700 border-emerald-900/10 hover:bg-emerald-50 cursor-pointer"
                >
                  Үлгі: 2 несиеден шығу
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setInstallmentPrice(500_000);
                    setCashDiscountPct(18);
                    playSfx("coin", sfxMuted);
                  }}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg border bg-[#F6F8F7] text-slate-700 border-emerald-900/10 hover:bg-emerald-50 cursor-pointer"
                >
                  Үлгі: «0-0-12» тұзағын тексеру
                </button>
              </div>
              <LitSlider
                label="Ұсақ қарыз / бөліп төлеу сомасы"
                valueLabel={`${formatTenge(smallDebt)} (${smallDebtRate}%)`}
                min={50_000}
                max={1_000_000}
                step={50_000}
                value={smallDebt}
                onChange={setSmallDebt}
              />
              <LitSlider
                label="Ірі несие сомасы"
                valueLabel={`${formatTenge(bigDebt)} (${bigDebtRate}%)`}
                min={200_000}
                max={5_000_000}
                step={100_000}
                value={bigDebt}
                onChange={setBigDebt}
              />
              <LitSlider
                label="Ірі несие мөлшерлемесі"
                valueLabel={formatPercent(bigDebtRate, 0)}
                min={10}
                max={45}
                step={1}
                value={bigDebtRate}
                onChange={setBigDebtRate}
              />
              <LitSlider
                label="Ай сайын қарыз жабуға бөлетін сома"
                valueLabel={formatTenge(debtBudget)}
                min={40_000}
                max={500_000}
                step={10_000}
                value={debtBudget}
                onChange={setDebtBudget}
              />
              <LitSlider
                label="«0% бөліп төлеу» тауар бағасы"
                valueLabel={formatTenge(installmentPrice)}
                min={100_000}
                max={1_500_000}
                step={50_000}
                value={installmentPrice}
                onChange={setInstallmentPrice}
              />
              <LitSlider
                label="Қолма-қол алғандағы дүкен жеңілдігі"
                valueLabel={`${cashDiscountPct}%`}
                min={0}
                max={25}
                step={1}
                value={cashDiscountPct}
                onChange={setCashDiscountPct}
              />
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-emerald-900/10">
                <LitKpi
                  label="Көшкінмен үнемделген %"
                  value={debtRes.savedWithAvalanche}
                  formatter={formatTenge}
                  tone="emerald"
                />
                <LitKpi
                  label="Бөліп төлеу жасырын үстемесі"
                  value={debtRes.hiddenMarkupTenge}
                  formatter={formatTenge}
                  tone="red"
                />
              </div>
            </div>
          )}

          {activeSubTab === "compound" && (
            <div className="space-y-3">
              <LitSlider
                label="Бастапқы капитал"
                valueLabel={formatTenge(invInit)}
                min={0}
                max={10_000_000}
                step={100_000}
                value={invInit}
                onChange={setInvInit}
              />
              <LitSlider
                label="Ай сайынғы салым"
                valueLabel={formatTenge(invMonthly)}
                min={10_000}
                max={500_000}
                step={10_000}
                value={invMonthly}
                onChange={setInvMonthly}
              />
              <LitSlider
                label="Жылдық табыстылық"
                valueLabel={formatPercent(invRate)}
                min={4}
                max={28}
                step={0.5}
                value={invRate}
                onChange={setInvRate}
              />
              <LitSlider
                label="Мерзім"
                valueLabel={`${invYears} жыл`}
                min={2}
                max={30}
                step={1}
                value={invYears}
                onChange={setInvYears}
              />
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-emerald-900/10">
                <LitKpi
                  label="Қорытынды сома"
                  value={compRes.finalNominal}
                  formatter={formatTenge}
                  tone="emerald"
                />
                <LitKpi
                  label="Күрделі пайыз табысы"
                  value={compRes.compoundProfit}
                  formatter={formatTenge}
                  tone="amber"
                />
              </div>
            </div>
          )}

          {activeSubTab === "inflation" && (
            <div className="space-y-3">
              <LitSlider
                label="Сақталған сома"
                valueLabel={formatTenge(infAmount)}
                min={200_000}
                max={20_000_000}
                step={200_000}
                value={infAmount}
                onChange={setInfAmount}
              />
              <LitSlider
                label="Жылдық инфляция"
                valueLabel={formatPercent(infRate)}
                min={2}
                max={20}
                step={0.5}
                value={infRate}
                onChange={setInfRate}
              />
              <LitSlider
                label="Уақыт"
                valueLabel={`${infYears} жыл`}
                min={1}
                max={15}
                step={1}
                value={infYears}
                onChange={setInfYears}
              />
              <LitSlider
                label="Депозит / Құрал табыстылығы"
                valueLabel={formatPercent(depositYield)}
                min={0}
                max={22}
                step={0.5}
                value={depositYield}
                onChange={setDepositYield}
              />
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-emerald-900/10">
                <LitKpi
                  label="Бос жатқандағы құн"
                  value={infOnlyRes.finalReal}
                  formatter={formatTenge}
                  tone="red"
                />
                <LitKpi
                  label="Депозитпен нақты құн"
                  value={infProtectedRes.finalReal}
                  formatter={formatTenge}
                  tone="emerald"
                />
              </div>
            </div>
          )}

          {activeSubTab === "mortgage" && (
            <div className="space-y-3">
              <LitSlider
                label="Баспана / Мүлік бағасы"
                valueLabel={formatTenge(homePrice)}
                min={5_000_000}
                max={75_000_000}
                step={1_000_000}
                value={homePrice}
                onChange={setHomePrice}
              />
              <LitSlider
                label="Бастапқы жарна"
                valueLabel={`${downPct}%`}
                min={10}
                max={60}
                step={5}
                value={downPct}
                onChange={setDownPct}
              />
              <LitSlider
                label="Жылдық мөлшерлеме"
                valueLabel={formatPercent(loanRate)}
                min={5}
                max={25}
                step={0.5}
                value={loanRate}
                onChange={setLoanRate}
              />
              <LitSlider
                label="Несие мерзімі"
                valueLabel={`${loanYears} жыл`}
                min={2}
                max={25}
                step={1}
                value={loanYears}
                onChange={setLoanYears}
              />
              <LitSlider
                label="Ай сайынғы артық төлем"
                valueLabel={formatTenge(extraPay)}
                min={0}
                max={300_000}
                step={10_000}
                value={extraPay}
                onChange={setExtraPay}
              />
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-emerald-900/10">
                <LitKpi label="Айлық төлем" value={mortgageRes.monthlyPayment} formatter={formatTenge} />
                <LitKpi
                  label="Үнемделген пайыз"
                  value={mortgageRes.savedInterest}
                  formatter={formatTenge}
                  tone="emerald"
                />
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() =>
              onAskMentor(
                activeSubTab === "budget"
                  ? `Айлық табысым ${formatTenge(income)}, ипотека/несие төлемім ${formatTenge(debtPayment)}, міндетті шығыным ${formatTenge(mandatory)} болса, қаржылық жастықты қарапайым жолмен қалай тез жинаймын?`
                  : activeSubTab === "debts"
                    ? `Менде ${formatTenge(smallDebt)} (${smallDebtRate}%) және ${formatTenge(bigDebt)} (${bigDebtRate}%) қарыз бар, ал дүкендегі ${formatTenge(installmentPrice)} «0% бөліп төлеу» қолма-қол ${cashDiscountPct}% жеңілдіктен қаншалықты қымбат?`
                    : activeSubTab === "compound"
                      ? `Айына ${formatTenge(invMonthly)} салып ${invYears} жылда ${invRate}% табыспен жинасам, күрделі пайыз қалай жұмыс істейді?`
                      : activeSubTab === "inflation"
                        ? `${infRate}% инфляция кезінде ${formatTenge(infAmount)} жинағымды қалай қорғаймын?`
                        : `${formatTenge(homePrice)} ипотеканы ${loanRate}%-бен ${loanYears} жылға алғанда артық төлемді қалай азайтуға болады?`,
                LITERACY_TABS.find((t) => t.id === activeSubTab)?.label || "Қаржы сауаты"
              )
            }
            className="w-full min-h-[42px] py-2 px-4 text-xs sm:text-sm font-bold rounded-xl bg-emerald-800 text-white hover:bg-emerald-900 transition-colors cursor-pointer"
          >
            AI Тәлімгермен талдау
          </button>
        </div>
      </div>
    </div>
  );
}

function LitSlider({
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

function LitKpi({
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
