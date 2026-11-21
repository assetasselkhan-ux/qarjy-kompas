import { useState } from "react";
import {
  Landmark,
  CreditCard,
  Percent,
  ShieldCheck,
  FileUp,
  CheckCircle2,
  Scale,
  Award,
} from "lucide-react";
import type { BankingServiceId, CompassStructuredResponse } from "../types/finance";
import {
  buildGraceVsLoanMatrix,
  calculateAcquiring,
  calculateBusinessCredit,
  calculateGuaranteeAndDeposit,
  compareKzAndGlobalBanks,
  comparePaymentMethods,
  formatTenge,
  formatPercent,
} from "../utils/financeMath";
import { playSfx } from "../utils/sfx";
import { CompassFormatCard } from "./CompassFormatCard";
import { AnimatedCounter } from "./AnimatedCounter";

interface BankingServicesSectionProps {
  sfxMuted: boolean;
  onAskCompass: (prompt: string, topic: string) => void;
  onTipChange?: (tip: string) => void;
  onSpeakingChange?: (speaking: boolean) => void;
}

const BANKING_TABS: Array<{
  id: BankingServiceId;
  label: string;
  badge: string;
  icon: typeof Landmark;
}> = [
  { id: "compare", label: "Салыстыру: Карта vs Несие & Банктер", badge: "Тиімділік", icon: Scale },
  { id: "accounts", label: "Шот және Аударым", badge: "РКО", icon: Landmark },
  { id: "acquiring", label: "Эквайринг", badge: "POS / QR", icon: CreditCard },
  { id: "credit", label: "Депозит, Несие, Овердрафт", badge: "Қаржы", icon: Percent },
  { id: "guarantee", label: "Кепілдік және Аккредитив", badge: "Сауда", icon: ShieldCheck },
  { id: "sync1c", label: "Көшірме → 1С", badge: "Выписка", icon: FileUp },
];

const SYNC_STEPS = [
  {
    step: "1. Банктен көшірмені экспорттау",
    detail:
      "Интернет-банкингтен кезеңді таңдап, «1С-ке арналған көшірме» (.txt немесе .xml) файлын жүктеп алыңыз.",
  },
  {
    step: "2. 1С:Бухгалтерияға жүктеу",
    detail:
      "«Банк және касса → Банктік көшірмелер → Жүктеу (Загрузить)» арқылы файлды импорттаңыз.",
  },
  {
    step: "3. Контрагент және КНП тексеру",
    detail:
      "БСН/ЖСН (БИН/ИИН) бойынша контрагент пен шарт автоматты байланады; КНП мен ДДС бабын тексеріңіз.",
  },
  {
    step: "4. Комиссия мен эквайрингті бөлу",
    detail:
      "Банк комиссиясы Дт 7210 — Кт 1030, ал эквайринг түсімі Дт 1030 — Кт 1022 болып өткізіледі.",
  },
  {
    step: "5. 1030 шот қалдығын салыстыру",
    detail:
      "Күн соңында 1С-тегі АСВ (ОСВ) 1030 шотының соңғы сальдосы банк үзіндісімен тиынға дейін тең болуы тиіс.",
  },
];

export function BankingServicesSection({
  sfxMuted,
  onAskCompass,
  onTipChange,
  onSpeakingChange,
}: BankingServicesSectionProps) {
  const [activeService, setActiveService] = useState<BankingServiceId>("compare");
  const [compareMode, setCompareMode] = useState<"card_vs_loan" | "banks">("card_vs_loan");

  // Compare: Card (Grace + Cashback) vs Loan vs Cash
  const [purchaseAmount, setPurchaseAmount] = useState(600_000);
  const [loanCompareMonths, setLoanCompareMonths] = useState(12);
  const [graceDays, setGraceDays] = useState(55);
  const [cashbackPct, setCashbackPct] = useState(1.5);
  const [consumerLoanRate, setConsumerLoanRate] = useState(22.0);
  const [loanFeePct, setLoanFeePct] = useState(1.0);
  const [cardPostGraceRate, setCardPostGraceRate] = useState(32.0);
  const [compareDepositRate, setCompareDepositRate] = useState(14.0);
  const [matrixFilter, setMatrixFilter] = useState<"all" | "terms" | "rates">("all");

  // Compare: KZ & Global Banks
  const [bankTurnover, setBankTurnover] = useState(5_000_000);
  const [bankTransfers, setBankTransfers] = useState(40);
  const [bankAvgBalance, setBankAvgBalance] = useState(2_500_000);

  // Accounts & Transfers state
  const [monthlyPaymentsCount, setMonthlyPaymentsCount] = useState(45);
  const [avgFeePerTransfer, setAvgFeePerTransfer] = useState(350);
  const [rkoMonthlyPlan, setRkoMonthlyPlan] = useState(5_900);

  // Acquiring state
  const [acqTurnover, setAcqTurnover] = useState(6_000_000);
  const [posSharePct, setPosSharePct] = useState(55);
  const [posFeePct, setPosFeePct] = useState(1.8);
  const [qrFeePct, setQrFeePct] = useState(0.95);

  // Credit, Overdraft, Deposit state
  const [loanAmount, setLoanAmount] = useState(10_000_000);
  const [loanRatePct, setLoanRatePct] = useState(19.5);
  const [loanMonths, setLoanMonths] = useState(24);
  const [overdraftUsed, setOverdraftUsed] = useState(1_500_000);
  const [overdraftDays, setOverdraftDays] = useState(12);
  const [depositAmount, setDepositAmount] = useState(4_000_000);
  const [depositRatePct, setDepositRatePct] = useState(13.5);

  // Guarantee & LC state
  const [guaranteeAmount, setGuaranteeAmount] = useState(15_000_000);
  const [guaranteeFeePct, setGuaranteeFeePct] = useState(3.0);
  const [guaranteeMonths, setGuaranteeMonths] = useState(6);

  // 1C Sync step & interactive info toggles
  const [activeSyncStep, setActiveSyncStep] = useState(0);
  const [selectedKnpCode, setSelectedKnpCode] = useState<"710" | "332" | "911">("710");
  const [guaranteeInfoFocus, setGuaranteeInfoFocus] = useState<"guarantee" | "lc">("guarantee");

  const cardVsLoan = comparePaymentMethods(
    purchaseAmount,
    loanCompareMonths,
    graceDays,
    cashbackPct,
    consumerLoanRate,
    compareDepositRate,
    loanFeePct,
    cardPostGraceRate
  );
  const graceLoanMatrix = buildGraceVsLoanMatrix(
    purchaseAmount,
    graceDays,
    cashbackPct,
    compareDepositRate,
    consumerLoanRate,
    loanCompareMonths,
    loanFeePct,
    cardPostGraceRate
  );
  const bankOffers = compareKzAndGlobalBanks(bankTurnover, bankTransfers, bankAvgBalance);
  const bestBankOffer = [...bankOffers].sort((a, b) => a.monthlyNetCost - b.monthlyNetCost)[0];

  const rkoTotalCost = rkoMonthlyPlan + monthlyPaymentsCount * avgFeePerTransfer;
  const acq = calculateAcquiring(acqTurnover, posSharePct, posFeePct, qrFeePct);
  const creditRes = calculateBusinessCredit(
    loanAmount,
    loanRatePct,
    loanMonths,
    overdraftUsed,
    24.0,
    overdraftDays
  );
  const guar = calculateGuaranteeAndDeposit(
    guaranteeAmount,
    guaranteeFeePct,
    guaranteeMonths,
    depositAmount,
    depositRatePct
  );

  const handleTabChange = (id: BankingServiceId) => {
    setActiveService(id);
    playSfx("coin", sfxMuted);
    const tips: Record<BankingServiceId, string> = {
      compare:
        "Грейс-кезең ішінде несие картасын толық жапсаңыз, пайыз төлемейсіз, керісінше кэшбэк пен депозиттен табыс аласыз.",
      accounts:
        "Есеп айырысу шоты (ИИК) — бизнестің барлық заңды төлемдері мен салық аударымдарының негізі.",
      acquiring:
        "Эквайринг комиссиясы сату түсімін (6010) азайтпайды — ол 7210 шығыс шотына бөлек жазылады.",
      credit:
        "Овердрафт — тек нақты пайдаланылған күндерге ғана пайыз есептелетін қысқа кассалық көмек.",
      guarantee:
        "Банктік кепілдік пен аккредитив айналымдағы қолма-қол ақшаны босатуға мүмкіндік береді.",
      sync1c:
        "Банк көшірмесін Client-Bank арқылы 1С-ке жүктеу қолмен теру қателерін толық жояды.",
    };
    onTipChange?.(tips[id]);
  };

  let cardData: CompassStructuredResponse | null = null;
  let stageProgress = 0.78;
  let stageSecondary = 0.35;

  if (activeService === "accounts") {
    stageProgress = Math.min(1, Math.max(0.2, monthlyPaymentsCount / 120));
    cardData = {
      explanation: `Айына ${monthlyPaymentsCount} төлем тапсырмасын жібергенде, ${formatTenge(rkoMonthlyPlan)} абоненттік төлем және ${formatTenge(avgFeePerTransfer)} комиссиямен жалпы РКО шығыны ${formatTenge(rkoTotalCost)} болады. Төлемдер КНП және КБе кодтарымен ИИК (KZ...) арқылы өтеді.`,
      sceneDescription:
        "Есеп айырысу шоты (1030) арқылы серіктестерге төлем (3310), салық (3110–3150) және жалақы аударымдары жүргізіледі.",
      sfxType: "coin",
      expertSummary:
        "Төлем саны көп болса, пакеттік РКО тарифін таңдау комиссияны 30–45% үнемдейді. 1С-те барлық банк комиссиялары 7210 шотына есептеледі.",
      visualType: "banking",
      journalEntry: "Төлем: Дт 3310 — Кт 1030 · Комиссия: Дт 7210 — Кт 1030",
      doc1C: "Шығыс төлем тапсырмасы (Платежное поручение исходящее)",
      formulaLabel: "РКО шығыны = Тариф + (Төлем саны × Комиссия)",
      exampleCalculation: `${formatTenge(rkoMonthlyPlan)} + ${monthlyPaymentsCount} × ${avgFeePerTransfer} ₸ = ${formatTenge(rkoTotalCost)}`,
      keyMetricLabel: "Айлық РКО шығыны",
      keyMetricValue: formatTenge(rkoTotalCost),
    };
  } else if (activeService === "acquiring") {
    stageProgress = acqTurnover > 0 ? acq.netSettledToBank / acqTurnover : 0.9;
    cardData = {
      explanation: `${formatTenge(acqTurnover)} айналымның ${posSharePct}%-ы POS-терминалмен (${posFeePct}%), қалғаны QR-мен (${qrFeePct}%) төленсе, банкке таза ${formatTenge(acq.netSettledToBank)} түседі, ал комиссия — ${formatTenge(acq.commissionAmount)} (${formatPercent(acq.effectiveFeePct, 2)}).`,
      sceneDescription:
        "Төлем сәтінде сату 6010-ға толық түсім ретінде (1022 арқылы) жазылады, ал комиссия бөлек 7210 шығысына алынады.",
      sfxType: "coin",
      expertSummary:
        "Бухгалтерлердің жиі қатесі — түсімді (6010) банктен түскен таза сомамен жазу. Дұрысы: толық соманы 6010-ға, комиссияны Дт 7210-ға көрсету!",
      visualType: "banking",
      journalEntry: "Дт 1022 — Кт 6010 · Дт 1030 — Кт 1022 · Дт 7210 — Кт 1022",
      doc1C: "Төлем карталарымен төлем (Оплата от покупателя платежной картой)",
      formulaLabel: "Таза түсім = Айналым − (POS × % + QR × %)",
      exampleCalculation: `Жылдық комиссия: ${formatTenge(acq.annualCommission)}`,
      keyMetricLabel: "Шотқа түсетін таза сома",
      keyMetricValue: formatTenge(acq.netSettledToBank),
    };
  } else if (activeService === "credit") {
    stageProgress = Math.min(1, Math.max(0.2, loanAmount / 30_000_000));
    cardData = {
      explanation: `${formatTenge(loanAmount)} бизнес несиені ${loanRatePct}%-бен ${loanMonths} айға алсаңыз, айлық төлем — ${formatTenge(creditRes.monthlyLoanPayment)}. Ал ${formatTenge(overdraftUsed)} овердрафтты ${overdraftDays} күн пайдалансаңыз, пайызы бар болғаны ${formatTenge(creditRes.overdraftInterest)} болады.`,
      sceneDescription: `Депозитте жатқан ${formatTenge(depositAmount)} (${depositRatePct}%) айына ${formatTenge(guar.monthlyDepositIncome)} пассив табыс әкеледі.`,
      sfxType: "bricks",
      expertSummary:
        "Уақытша касса алшақтығын жабу үшін ұзақ несие емес, овердрафт тиімді — себебі пайыз тек нақты қолданған күндерге есептеледі.",
      visualType: "banking",
      journalEntry: "Несие: Дт 1030 — Кт 3010 · Пайыз: Дт 7310 — Кт 3050 · Депозит: Дт 1050",
      doc1C: "Банк көшірмесі (Несие түсімі / Қайтару / Сыйақы есептеу)",
      formulaLabel: "Овердрафт % = Сома × (Мөлшерлеме / 365) × Күн саны",
      exampleCalculation: `${overdraftDays} күндік овердрафт % = ${formatTenge(creditRes.overdraftInterest)}`,
      keyMetricLabel: "Несиенің айлық төлемі",
      keyMetricValue: formatTenge(creditRes.monthlyLoanPayment),
    };
  } else if (activeService === "guarantee") {
    stageProgress = Math.min(1, Math.max(0.25, guaranteeAmount / 40_000_000));
    cardData = {
      explanation: `${formatTenge(guaranteeAmount)} тендерлік немесе шарттық міндеттемеге ${guaranteeMonths} айға ${guaranteeFeePct}% мөлшерлемемен банктік кепілдік ресімдесеңіз, банк комиссиясы ${formatTenge(guar.feeAmount)} құрайды. Нәтижесінде айналымда ${formatTenge(guar.freedWorkingCapital)} қолма-қол ақша бос қалады!`,
      sceneDescription:
        "Аккредитив сатушы мен сатып алушы арасындағы ірі жеткізілім тәуекелін банк арқылы кепілдендіреді.",
      sfxType: "worm_shield",
      expertSummary:
        "Өз ақшаңызды кепілге байлағанша, арзан банктік кепілдік алып, бос қаражатты тауар айналымына немесе депозитке салу әлдеқайда тиімді.",
      visualType: "banking",
      journalEntry: "Комиссия: Дт 7210 — Кт 1030 · Кепілдік міндеттеме: баланстан тыс есеп",
      doc1C: "Алдағы кезең шығыстары (1720) немесе Әкімшілік шығындар (7210)",
      formulaLabel: "Кепілдік комиссиясы = Сома × Жылдық % × (Ай / 12)",
      exampleCalculation: `Босатылған капитал: ${formatTenge(guar.freedWorkingCapital)}`,
      keyMetricLabel: "Кепілдік комиссиясы",
      keyMetricValue: formatTenge(guar.feeAmount),
    };
  } else if (activeService === "sync1c") {
    stageProgress = (activeSyncStep + 1) / SYNC_STEPS.length;
    cardData = {
      explanation: `Банк көшірмесін 1С-ке синхрондау 5 қадамнан тұрады. Қазіргі қадам: «${SYNC_STEPS[activeSyncStep].step}». Автоматты алмасу арқылы 1030 шотындағы барлық түсімдер мен төлемдер бірден АСВ-ға түседі.`,
      sceneDescription: SYNC_STEPS[activeSyncStep].detail,
      sfxType: "water",
      expertSummary:
        "1С-те банк көшірмесін күн сайын немесе апта сайын жүктеп, 1030 шот сальдосын тексеру салық есептілігі мен касса алшақтығын бақылауды жеңілдетеді.",
      visualType: "banking",
      journalEntry: "Дт 1030 — Кт 1210 (Түсім) · Дт 3310 — Кт 1030 (Төлем) · Дт 7210 — Кт 1030",
      doc1C: "Банк және касса → Клиент-Банк алмасуы (XML / TXT)",
      formulaLabel: "Банк қалдығы (Көшірме) == 1С АСВ 1030 Сальдосы",
      exampleCalculation: `Қадам ${activeSyncStep + 1} / ${SYNC_STEPS.length}`,
      keyMetricLabel: "1С Интеграция қадамы",
      keyMetricValue: `${activeSyncStep + 1} / ${SYNC_STEPS.length}`,
    };
  }

  return (
    <div className="space-y-4">
      <div
        role="tablist"
        aria-label="Банктік қызметтер бөлімдері"
        className="inline-flex flex-wrap items-center gap-1 p-1.5 bg-white border border-emerald-900/10 rounded-2xl shadow-[0_2px_10px_rgba(6,78,59,0.04)]"
      >
        {BANKING_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeService === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              type="button"
              onClick={() => handleTabChange(tab.id)}
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

      {/* SIDE-BY-SIDE COMPARISON MODULE (KZ & Global Banks + Credit Card vs Loan vs Cash) */}
      {activeService === "compare" ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 bg-white border border-emerald-900/10 rounded-2xl p-3 shadow-[0_2px_10px_rgba(6,78,59,0.04)]">
            <div className="inline-flex rounded-xl bg-[#F6F8F7] border border-emerald-900/10 p-1 gap-1">
              <button
                type="button"
                onClick={() => setCompareMode("card_vs_loan")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  compareMode === "card_vs_loan"
                    ? "bg-emerald-800 text-white"
                    : "text-slate-600 hover:text-emerald-950"
                }`}
              >
                Несие картасы (Грейс + Кэшбэк) vs Несие
              </button>
              <button
                type="button"
                onClick={() => setCompareMode("banks")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  compareMode === "banks"
                    ? "bg-emerald-800 text-white"
                    : "text-slate-600 hover:text-emerald-950"
                }`}
              >
                ҚР және Әлем банктерін салыстыру
              </button>
            </div>

            <button
              type="button"
              onClick={() =>
                onAskCompass(
                  compareMode === "card_vs_loan"
                    ? `${formatTenge(purchaseAmount)} сатып алуды ${graceDays} күндік грейс-кезеңі және ${cashbackPct}% кэшбэгі бар несие картасымен төлеу, ${consumerLoanRate}% несиеге алу немесе қолма-қол төлеудің қайсысы тиімді? Цифрмен салыстырыңыз.`
                    : `Айлық айналымы ${formatTenge(bankTurnover)}, ${bankTransfers} аударым және шоттағы орташа қалдығы ${formatTenge(bankAvgBalance)} компания үшін Kaspi, Halyk, Forte және Wise/Revolut банктерінің қайсысы тиімдірек?`,
                  "Банк және Өнім Салыстыру"
                )
              }
              className="px-3.5 py-2 text-xs font-bold rounded-xl bg-amber-500 text-white hover:bg-amber-600 transition-colors cursor-pointer"
            >
              AI Тәлімгерден терең салыстыру алу
            </button>
          </div>

          {compareMode === "card_vs_loan" ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
                {/* Left 7 cols: Side-by-side comparison cards + clear winner verdict */}
                <div className="xl:col-span-7 bg-white border border-emerald-900/10 rounded-2xl shadow-[0_4px_20px_rgba(6,78,59,0.05)] p-4 sm:p-5 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-900/10 pb-2.5">
                    <div>
                      <h3 className="text-sm sm:text-base font-extrabold text-emerald-950">
                        Несие картасы (Грейс-кезең) vs Тұтыну несиесі vs Қолма-қол
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Нақты теңге есебі және ТПМ (тиімді пайыздық мөлшерлеме) салыстыруы
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-900 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1">
                      <Award className="w-3.5 h-3.5 text-amber-600" />
                      <span>Үнем: {formatTenge(cardVsLoan.savingsVsLoan)}</span>
                    </span>
                  </div>

                  {/* 3 Side-by-Side Comparison Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Option 1: Credit Card + Grace Period */}
                    <div className="rounded-2xl border-2 border-emerald-600 bg-emerald-50/45 p-3.5 space-y-2 relative">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-extrabold text-emerald-950">
                          1. Несие картасы (Грейс)
                        </span>
                        <span className="text-[10px] font-extrabold bg-emerald-700 text-white rounded-md px-1.5 py-0.5">
                          ТПМ: 0.0%
                        </span>
                      </div>
                      <div className="text-base font-extrabold text-emerald-900 tabular-nums">
                        {formatTenge(cardVsLoan.cardNetCost)}
                      </div>
                      <div className="text-[11px] text-slate-700 space-y-1 tabular-nums">
                        <div>• Сатып алу: {formatTenge(purchaseAmount)}</div>
                        <div className="text-emerald-800 font-semibold">
                          • Кэшбэк ({cashbackPct}%): +{formatTenge(cardVsLoan.cardCashbackEarned)}
                        </div>
                        <div className="text-emerald-800 font-semibold">
                          • Депозит ({graceDays} күн): +{formatTenge(cardVsLoan.depositYieldDuringGrace)}
                        </div>
                      </div>
                      <div className="pt-1.5 border-t border-emerald-200 text-[10px] text-emerald-900 font-medium space-y-0.5">
                        <div>Шарты: {graceDays} күнде 100% жабу.</div>
                        <div className="text-amber-800 font-semibold">
                          Кешіксе ТПМ: {formatPercent(cardVsLoan.cardLateEffectiveRatePct, 1)}!
                        </div>
                      </div>
                    </div>

                    {/* Option 2: Paying Cash Immediately */}
                    <div className="rounded-2xl border border-emerald-900/15 bg-[#F6F8F7] p-3.5 space-y-2">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-extrabold text-slate-900">2. Қолма-қол / Дебет</span>
                        <span className="text-[10px] font-bold bg-slate-200 text-slate-700 rounded-md px-1.5 py-0.5">
                          ТПМ: 0.0%
                        </span>
                      </div>
                      <div className="text-base font-extrabold text-slate-900 tabular-nums">
                        {formatTenge(purchaseAmount)}
                      </div>
                      <div className="text-[11px] text-slate-600 space-y-1 tabular-nums">
                        <div>• Сатып алу: {formatTenge(purchaseAmount)}</div>
                        <div>• Пайыз шығыны: 0 ₸</div>
                        <div className="text-amber-800">
                          • Жоғалтқан депозит: −{formatTenge(cardVsLoan.cashOpportunityLoss)}
                        </div>
                      </div>
                      <div className="pt-1.5 border-t border-slate-200 text-[10px] text-slate-600">
                        Қарыз жоқ, бірақ бос қаражат ертерек кетеді.
                      </div>
                    </div>

                    {/* Option 3: Consumer Loan */}
                    <div className="rounded-2xl border border-red-200 bg-red-50/40 p-3.5 space-y-2">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-extrabold text-red-950">3. Тұтыну несиесі</span>
                        <span className="text-[10px] font-bold bg-red-100 text-red-800 rounded-md px-1.5 py-0.5 tabular-nums">
                          ТПМ: {formatPercent(cardVsLoan.loanEffectiveRatePct, 1)}
                        </span>
                      </div>
                      <div className="text-base font-extrabold text-red-900 tabular-nums">
                        {formatTenge(cardVsLoan.loanNetCost)}
                      </div>
                      <div className="text-[11px] text-slate-700 space-y-1 tabular-nums">
                        <div>• Айлық төлем: {formatTenge(cardVsLoan.loanMonthlyPayment)}</div>
                        <div className="text-red-700 font-semibold">
                          • Пайыз ({consumerLoanRate}%): +{formatTenge(cardVsLoan.loanTotalInterest)}
                        </div>
                        {loanFeePct > 0 && (
                          <div className="text-red-700 font-semibold">
                            • Комиссия ({loanFeePct}%): +{formatTenge(cardVsLoan.loanFeeAmount)}
                          </div>
                        )}
                        <div>• Мерзімі: {loanCompareMonths} ай</div>
                      </div>
                      <div className="pt-1.5 border-t border-red-200 text-[10px] text-red-800">
                        Номинал {consumerLoanRate}% → нақты ТПМ{" "}
                        {formatPercent(cardVsLoan.loanEffectiveRatePct, 1)}.
                      </div>
                    </div>
                  </div>

                  {/* Clear Verdict Banner */}
                  <div className="rounded-xl bg-emerald-800 text-white p-3.5 text-xs leading-relaxed">
                    <strong>Нақты қорытынды:</strong> {cardVsLoan.verdict}
                  </div>
                </div>

                {/* Right 5 cols: Presets & Sliders */}
                <div className="xl:col-span-5 bg-white border border-emerald-900/10 rounded-2xl shadow-[0_4px_20px_rgba(6,78,59,0.05)] p-4 sm:p-5 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-900/10 pb-2">
                    <h4 className="text-sm font-extrabold text-emerald-950">
                      Салыстыру параметрлері
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {[
                        { label: "500 мың ₸", amt: 500_000, m: 12, rate: 22 },
                        { label: "1.5 млн ₸", amt: 1_500_000, m: 24, rate: 20 },
                        { label: "3 млн ₸", amt: 3_000_000, m: 36, rate: 18 },
                      ].map((p) => (
                        <button
                          key={p.label}
                          type="button"
                          onClick={() => {
                            setPurchaseAmount(p.amt);
                            setLoanCompareMonths(p.m);
                            setConsumerLoanRate(p.rate);
                            playSfx("coin", sfxMuted);
                          }}
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-md border transition-colors cursor-pointer ${
                            purchaseAmount === p.amt && loanCompareMonths === p.m
                              ? "bg-emerald-800 text-white border-emerald-800"
                              : "bg-[#F6F8F7] text-slate-600 border-emerald-900/15 hover:bg-emerald-50"
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <BankSlider
                    label="Сатып алу / Несие сомасы"
                    valueLabel={formatTenge(purchaseAmount)}
                    min={100_000}
                    max={5_000_000}
                    step={50_000}
                    value={purchaseAmount}
                    onChange={setPurchaseAmount}
                  />
                  <BankSlider
                    label="Карта грейс-кезеңі"
                    valueLabel={`${graceDays} күн`}
                    min={30}
                    max={100}
                    step={5}
                    value={graceDays}
                    onChange={setGraceDays}
                  />
                  <BankSlider
                    label="Карта кэшбэгі"
                    valueLabel={formatPercent(cashbackPct, 1)}
                    min={0}
                    max={5}
                    step={0.5}
                    value={cashbackPct}
                    onChange={setCashbackPct}
                  />
                  <BankSlider
                    label="Несие номинал мөлшерлемесі"
                    valueLabel={formatPercent(consumerLoanRate, 1)}
                    min={8}
                    max={36}
                    step={0.5}
                    value={consumerLoanRate}
                    onChange={setConsumerLoanRate}
                  />
                  <BankSlider
                    label="Несие төлем мерзімі"
                    valueLabel={`${loanCompareMonths} ай`}
                    min={3}
                    max={36}
                    step={3}
                    value={loanCompareMonths}
                    onChange={setLoanCompareMonths}
                  />
                  <BankSlider
                    label="Несие комиссиясы / сақтандыру"
                    valueLabel={formatPercent(loanFeePct, 1)}
                    min={0}
                    max={5}
                    step={0.5}
                    value={loanFeePct}
                    onChange={setLoanFeePct}
                  />
                  <BankSlider
                    label="Грейс бұзылса карта мөлшерлемесі"
                    valueLabel={formatPercent(cardPostGraceRate, 0)}
                    min={20}
                    max={45}
                    step={1}
                    value={cardPostGraceRate}
                    onChange={setCardPostGraceRate}
                  />
                  <BankSlider
                    label="Депозит табыстылығы (өз ақшаңызға)"
                    valueLabel={formatPercent(compareDepositRate, 1)}
                    min={0}
                    max={18}
                    step={0.5}
                    value={compareDepositRate}
                    onChange={setCompareDepositRate}
                  />
                </div>
              </div>

              {/* FULL-WIDTH ТПМ (EFFECTIVE INTEREST RATE) COMPARATIVE TABLE ACROSS RATES & TERMS */}
              <div className="bg-white border border-emerald-900/10 rounded-2xl shadow-[0_4px_20px_rgba(6,78,59,0.05)] p-4 sm:p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-900/10 pb-2.5">
                  <div>
                    <h4 className="text-sm sm:text-base font-extrabold text-emerald-950">
                      Пайыздық мөлшерлемелер мен төлем мерзімдері бойынша ТПМ салыстырмалы кестесі
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      ТПМ (Тиімді пайыздық мөлшерлеме / ГЭСВ) — ай сайынғы капиталдану мен банктік комиссияны қосқандағы нақты жылдық баға. Кез келген жолды басып таңдаңыз.
                    </p>
                  </div>
                  <div className="inline-flex rounded-xl bg-[#F6F8F7] border border-emerald-900/10 p-1 gap-1">
                    {(
                      [
                        { id: "all", label: "Барлығы" },
                        { id: "terms", label: "Мерзімдер (6–36 ай)" },
                        { id: "rates", label: "Мөлшерлемелер" },
                      ] as const
                    ).map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setMatrixFilter(f.id)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                          matrixFilter === f.id
                            ? "bg-emerald-800 text-white"
                            : "text-slate-600 hover:text-emerald-950"
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto border border-emerald-900/10 rounded-xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-[#F6F8F7] text-[11px] font-bold text-slate-600 border-b border-emerald-900/10">
                      <tr>
                        <th className="py-2.5 px-3">Құрал / Шарт</th>
                        <th className="py-2.5 px-3 text-right">Мерзім</th>
                        <th className="py-2.5 px-3 text-right">Номинал %</th>
                        <th className="py-2.5 px-3 text-right">Нақты ТПМ (%)</th>
                        <th className="py-2.5 px-3 text-right">Айлық төлем</th>
                        <th className="py-2.5 px-3 text-right">Артық төлем / Табыс</th>
                        <th className="py-2.5 px-3 text-right">Грейс-картамен айырма</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {graceLoanMatrix
                        .filter((row) => {
                          if (matrixFilter === "terms") {
                            return row.id.startsWith("grace-") || row.id.startsWith("loan-base-");
                          }
                          if (matrixFilter === "rates") {
                            return (
                              row.id.startsWith("grace-") ||
                              row.id.startsWith("loan-rate-") ||
                              row.isHighlighted
                            );
                          }
                          return true;
                        })
                        .map((row) => {
                          const handleRowClick = () => {
                            if (row.id.startsWith("loan-base-")) {
                              const m = Number(row.id.replace("loan-base-", ""));
                              if (m) setLoanCompareMonths(m);
                              playSfx("coin", sfxMuted);
                            } else if (row.id.startsWith("loan-rate-")) {
                              const r = Number(row.id.replace("loan-rate-", ""));
                              if (r) setConsumerLoanRate(r);
                              playSfx("coin", sfxMuted);
                            }
                          };
                          return (
                            <tr
                              key={row.id}
                              onClick={handleRowClick}
                              className={`transition-colors ${
                                row.id.startsWith("loan-") ? "cursor-pointer" : ""
                              } ${
                                row.isGraceWinner
                                  ? "bg-emerald-50/85 font-semibold"
                                  : row.isWarning
                                    ? "bg-red-50/55"
                                    : row.isHighlighted
                                      ? "bg-amber-50/80 font-semibold"
                                      : "hover:bg-slate-50/80"
                              }`}
                            >
                              <td className="py-2.5 px-3">
                                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                                  <span>{row.instrument}</span>
                                  {row.isGraceWinner && (
                                    <span className="text-[10px] font-extrabold bg-emerald-700 text-white rounded-md px-1.5 py-0.5 shrink-0">
                                      Ең тиімді
                                    </span>
                                  )}
                                  {row.isHighlighted && (
                                    <span className="text-[10px] font-extrabold bg-amber-500 text-white rounded-md px-1.5 py-0.5 shrink-0">
                                      Таңдалған
                                    </span>
                                  )}
                                  {row.isWarning && (
                                    <span className="text-[10px] font-bold bg-red-100 text-red-800 rounded-md px-1.5 py-0.5 shrink-0">
                                      Қауіп
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-right tabular-nums text-slate-700 font-semibold">
                                {row.termLabel}
                              </td>
                              <td className="py-2.5 px-3 text-right tabular-nums text-slate-700">
                                {formatPercent(row.nominalRatePct, 1)}
                              </td>
                              <td className="py-2.5 px-3 text-right tabular-nums font-extrabold">
                                <span
                                  className={
                                    row.effectiveRatePct === 0
                                      ? "text-emerald-800"
                                      : row.effectiveRatePct >= 30
                                        ? "text-red-700"
                                        : "text-amber-800"
                                  }
                                >
                                  {formatPercent(row.effectiveRatePct, 1)}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-right tabular-nums font-semibold text-slate-800">
                                {row.isGraceWinner
                                  ? `${formatTenge(row.monthlyPayment)} (1 рет)`
                                  : formatTenge(row.monthlyPayment)}
                              </td>
                              <td className="py-2.5 px-3 text-right tabular-nums font-bold">
                                {row.totalOverpayOrGain < 0 ? (
                                  <span className="text-emerald-800">
                                    +{formatTenge(Math.abs(row.totalOverpayOrGain))} табыс
                                  </span>
                                ) : (
                                  <span className="text-red-700">
                                    −{formatTenge(row.totalOverpayOrGain)} шығын
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-right tabular-nums font-bold text-slate-700">
                                {row.diffVsGraceCard === 0
                                  ? "Базалық (0 ₸)"
                                  : `+${formatTenge(row.diffVsGraceCard)} қымбат`}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>

                <div className="rounded-xl bg-[#F6F8F7] border border-emerald-900/10 px-3.5 py-2.5 text-xs text-slate-700 leading-relaxed">
                  <strong className="text-emerald-950">Қарапайым түсіндірме (ТПМ):</strong> Жарнамадағы «{consumerLoanRate.toFixed(1)}%» — бұл номиналды пайыз ғана. Ай сайынғы пайыз қосылуы мен {loanFeePct > 0 ? `${loanFeePct}% комиссияны ` : "есептеу тәртібін "}қосқанда нақты ТПМ <strong>{formatPercent(cardVsLoan.loanEffectiveRatePct, 1)}</strong> болады. Сондықтан несие картасын {graceDays} күндік грейс-кезеңде уақытылы жабу ең арзан, ал грейс-кезеңнен кешігу ({formatPercent(cardVsLoan.cardLateEffectiveRatePct, 1)} ТПМ) ең қымбат!
                </div>
              </div>
            </div>
          ) : (
            /* Mode B: KZ & International Banks Comparison Table & Cards */
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
              <div className="xl:col-span-8 bg-white border border-emerald-900/10 rounded-2xl shadow-[0_4px_20px_rgba(6,78,59,0.05)] p-4 sm:p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-900/10 pb-2.5">
                  <div>
                    <h3 className="text-sm sm:text-base font-extrabold text-emerald-950">
                      Қазақстан және Халықаралық банктерді салыстыру (Айлық таза шығын/табыс)
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Шот ашу, РКО, аударым, POS/QR эквайринг және шот қалдығына сыйақы ескерілген
                    </p>
                  </div>
                  <span className="text-xs font-extrabold text-emerald-900 bg-emerald-50 border border-emerald-200 rounded-xl px-2.5 py-1">
                    Ең тиімдісі: {bestBankOffer.bankName}
                  </span>
                </div>

                <div className="overflow-x-auto border border-emerald-900/10 rounded-xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-[#F6F8F7] text-[11px] font-bold text-slate-600 border-b border-emerald-900/10">
                      <tr>
                        <th className="py-2.5 px-3">Банк / Аймақ</th>
                        <th className="py-2.5 px-3 text-right">Айлық РКО</th>
                        <th className="py-2.5 px-3 text-right">1 аударым</th>
                        <th className="py-2.5 px-3 text-right">Эквайринг</th>
                        <th className="py-2.5 px-3 text-right">Қалдық %</th>
                        <th className="py-2.5 px-3 text-right">Айлық таза нәтиже</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {bankOffers.map((b) => {
                        const isBest = b.id === bestBankOffer.id;
                        return (
                          <tr
                            key={b.id}
                            className={isBest ? "bg-emerald-50/75" : "hover:bg-slate-50/70"}
                          >
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-1.5 font-extrabold text-slate-900">
                                <span>{b.bankName}</span>
                                {isBest && (
                                  <span className="text-[10px] font-bold bg-emerald-700 text-white rounded-md px-1.5 py-0.5">
                                    Тиімді
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-500">
                                {b.region} · {b.swiftOrFxNote}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-right tabular-nums font-semibold">
                              {formatTenge(b.monthlyRko)}
                            </td>
                            <td className="py-2.5 px-3 text-right tabular-nums font-semibold">
                              {formatTenge(b.transferFee)}
                            </td>
                            <td className="py-2.5 px-3 text-right tabular-nums font-semibold">
                              {formatPercent(b.acquiringRatePct, 2)}
                            </td>
                            <td className="py-2.5 px-3 text-right tabular-nums font-semibold text-emerald-800">
                              {b.cashbackOrYieldPct > 0 ? formatPercent(b.cashbackOrYieldPct, 1) : "0%"}
                            </td>
                            <td className="py-2.5 px-3 text-right tabular-nums font-extrabold">
                              {b.monthlyNetCost <= 0 ? (
                                <span className="text-emerald-800">
                                  +{formatTenge(Math.abs(b.monthlyNetCost))} табыс
                                </span>
                              ) : (
                                <span className="text-slate-900">
                                  −{formatTenge(b.monthlyNetCost)} шығын
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="rounded-xl bg-emerald-800 text-white p-3.5 text-xs leading-relaxed">
                  <strong>Қорытынды:</strong> {formatTenge(bankTurnover)} айналым және{" "}
                  {formatTenge(bankAvgBalance)} орташа шот қалдығы кезінде{" "}
                  <strong>{bestBankOffer.bankName}</strong> ең тиімді (айлық таза нәтиже:{" "}
                  {bestBankOffer.monthlyNetCost <= 0
                    ? `+${formatTenge(Math.abs(bestBankOffer.monthlyNetCost))} табыс`
                    : `${formatTenge(bestBankOffer.monthlyNetCost)} шығын`}
                  ). Халықаралық USD/EUR аударымдары үшін Wise / Revolut мультивалюта шоты SWIFT
                  комиссиясын үнемдейді.
                </div>
              </div>

              <div className="xl:col-span-4 bg-white border border-emerald-900/10 rounded-2xl shadow-[0_4px_20px_rgba(6,78,59,0.05)] p-4 sm:p-5 space-y-3">
                <h4 className="text-sm font-extrabold text-emerald-950 border-b border-emerald-900/10 pb-2">
                  Айналым және қалдық параметрлері
                </h4>
                <BankSlider
                  label="Айлық эквайринг / шот айналымы"
                  valueLabel={formatTenge(bankTurnover)}
                  min={500_000}
                  max={25_000_000}
                  step={500_000}
                  value={bankTurnover}
                  onChange={setBankTurnover}
                />
                <BankSlider
                  label="Ай сайынғы төлем тапсырмасы саны"
                  valueLabel={`${bankTransfers} дана`}
                  min={5}
                  max={150}
                  step={5}
                  value={bankTransfers}
                  onChange={setBankTransfers}
                />
                <BankSlider
                  label="Шоттағы орташа бос қалдық"
                  valueLabel={formatTenge(bankAvgBalance)}
                  min={0}
                  max={20_000_000}
                  step={500_000}
                  value={bankAvgBalance}
                  onChange={setBankAvgBalance}
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        /* EXISTING BANKING CALCULATOR TABS */
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
          <div className="xl:col-span-7">
            {cardData && (
              <CompassFormatCard
                data={cardData}
                sfxMuted={sfxMuted}
                showVisualStage={true}
                stageProgress={stageProgress}
                stageSecondaryRatio={stageSecondary}
                onSpeakingChange={onSpeakingChange}
                compactStage={true}
              />
            )}
          </div>

          <div className="xl:col-span-5 bg-white border border-emerald-900/10 rounded-2xl shadow-[0_4px_20px_rgba(6,78,59,0.05)] p-4 sm:p-5 space-y-3.5">
            <div className="flex items-center justify-between border-b border-emerald-900/10 pb-2.5">
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-emerald-950">
                  {BANKING_TABS.find((t) => t.id === activeService)?.label}
                </h3>
                <p className="text-[11px] text-slate-500">
                  Параметрлерді баптап, комиссия мен төлемді есептеңіз
                </p>
              </div>
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-2 py-0.5">
                {BANKING_TABS.find((t) => t.id === activeService)?.badge}
              </span>
            </div>

            {activeService === "accounts" && (
              <div className="space-y-3">
                <BankSlider
                  label="Ай сайынғы төлем тапсырмасы саны"
                  valueLabel={`${monthlyPaymentsCount} дана`}
                  min={5}
                  max={200}
                  step={5}
                  value={monthlyPaymentsCount}
                  onChange={setMonthlyPaymentsCount}
                />
                <BankSlider
                  label="Бір аударым комиссиясы"
                  valueLabel={formatTenge(avgFeePerTransfer)}
                  min={0}
                  max={1_200}
                  step={50}
                  value={avgFeePerTransfer}
                  onChange={setAvgFeePerTransfer}
                />
                <BankSlider
                  label="Шотқа қызмет көрсету тарифі (РКО)"
                  valueLabel={formatTenge(rkoMonthlyPlan)}
                  min={0}
                  max={25_000}
                  step={500}
                  value={rkoMonthlyPlan}
                  onChange={setRkoMonthlyPlan}
                />

                <div className="rounded-xl bg-[#F6F8F7] border border-emerald-900/10 p-3 text-xs space-y-2">
                  <div className="font-bold text-emerald-950">
                    Есеп айырысу шоты (ИИК) және КНП кодтары (таңдап тексеріңіз):
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(
                      [
                        { code: "710", title: "710 · Тауар/Қызмет" },
                        { code: "332", title: "332 · Жалақы" },
                        { code: "911", title: "911 · Салық" },
                      ] as const
                    ).map((knp) => (
                      <button
                        key={knp.code}
                        type="button"
                        onClick={() => {
                          setSelectedKnpCode(knp.code);
                          playSfx("coin", sfxMuted);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                          selectedKnpCode === knp.code
                            ? "bg-emerald-800 text-white border-emerald-800"
                            : "bg-white text-slate-700 border-emerald-900/15 hover:bg-emerald-50"
                        }`}
                      >
                        {knp.title}
                      </button>
                    ))}
                  </div>
                  <div className="rounded-lg bg-white border border-emerald-200/80 p-2 text-[11px] text-slate-700 leading-relaxed">
                    {selectedKnpCode === "710"
                      ? "КНП 710: Жеткізушіге тауар/қызмет үшін төлем. 1С: Дт 3310 — Кт 1030."
                      : selectedKnpCode === "332"
                        ? "КНП 332: Қызметкерлерге жалақы аудару (ИИК + ЖСН тізімімен). 1С: Дт 3350 — Кт 1030."
                        : "КНП 911: Бюджетке салық (ЖТС, КТС, ҚҚС) төлеу. 1С: Дт 3110/3120 — Кт 1030."}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-emerald-900/10">
                  <BankKpi
                    label="Аударым комиссиясы"
                    value={monthlyPaymentsCount * avgFeePerTransfer}
                    formatter={formatTenge}
                  />
                  <BankKpi
                    label="Жалпы айлық РКО"
                    value={rkoTotalCost}
                    formatter={formatTenge}
                    tone="emerald"
                  />
                </div>
              </div>
            )}

            {activeService === "acquiring" && (
              <div className="space-y-3">
                <BankSlider
                  label="Айлық қолма-қолсыз айналым"
                  valueLabel={formatTenge(acqTurnover)}
                  min={500_000}
                  max={30_000_000}
                  step={250_000}
                  value={acqTurnover}
                  onChange={setAcqTurnover}
                />
                <BankSlider
                  label="POS-терминал үлесі (қалғаны QR)"
                  valueLabel={`${posSharePct}%`}
                  min={0}
                  max={100}
                  step={5}
                  value={posSharePct}
                  onChange={setPosSharePct}
                />
                <BankSlider
                  label="POS комиссиясы"
                  valueLabel={formatPercent(posFeePct, 2)}
                  min={0.5}
                  max={3.5}
                  step={0.1}
                  value={posFeePct}
                  onChange={setPosFeePct}
                />
                <BankSlider
                  label="QR эквайринг комиссиясы"
                  valueLabel={formatPercent(qrFeePct, 2)}
                  min={0.3}
                  max={2.5}
                  step={0.05}
                  value={qrFeePct}
                  onChange={setQrFeePct}
                />

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-emerald-900/10">
                  <BankKpi
                    label="Банк комиссиясы"
                    value={acq.commissionAmount}
                    formatter={formatTenge}
                    tone="amber"
                  />
                  <BankKpi
                    label="Шотқа таза түсім"
                    value={acq.netSettledToBank}
                    formatter={formatTenge}
                    tone="emerald"
                  />
                </div>
              </div>
            )}

            {activeService === "credit" && (
              <div className="space-y-3">
                <BankSlider
                  label="Бизнес несие сомасы"
                  valueLabel={formatTenge(loanAmount)}
                  min={1_000_000}
                  max={50_000_000}
                  step={500_000}
                  value={loanAmount}
                  onChange={setLoanAmount}
                />
                <BankSlider
                  label="Несие мөлшерлемесі"
                  valueLabel={formatPercent(loanRatePct)}
                  min={6}
                  max={28}
                  step={0.5}
                  value={loanRatePct}
                  onChange={setLoanRatePct}
                />
                <BankSlider
                  label="Несие мерзімі"
                  valueLabel={`${loanMonths} ай`}
                  min={6}
                  max={60}
                  step={6}
                  value={loanMonths}
                  onChange={setLoanMonths}
                />
                <BankSlider
                  label="Пайдаланылған овердрафт"
                  valueLabel={formatTenge(overdraftUsed)}
                  min={0}
                  max={10_000_000}
                  step={250_000}
                  value={overdraftUsed}
                  onChange={setOverdraftUsed}
                />
                <BankSlider
                  label="Овердрафт күн саны"
                  valueLabel={`${overdraftDays} күн`}
                  min={1}
                  max={30}
                  step={1}
                  value={overdraftDays}
                  onChange={setOverdraftDays}
                />
                <BankSlider
                  label="Бизнес депозит / Овернайт"
                  valueLabel={`${formatTenge(depositAmount)} (${depositRatePct}%)`}
                  min={0}
                  max={20_000_000}
                  step={500_000}
                  value={depositAmount}
                  onChange={setDepositAmount}
                />

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-emerald-900/10">
                  <BankKpi
                    label="Несие айлық төлемі"
                    value={creditRes.monthlyLoanPayment}
                    formatter={formatTenge}
                  />
                  <BankKpi
                    label="Овердрафт пайызы"
                    value={creditRes.overdraftInterest}
                    formatter={formatTenge}
                    tone="amber"
                  />
                </div>
              </div>
            )}

            {activeService === "guarantee" && (
              <div className="space-y-3">
                <BankSlider
                  label="Кепілдік / Аккредитив сомасы"
                  valueLabel={formatTenge(guaranteeAmount)}
                  min={1_000_000}
                  max={100_000_000}
                  step={1_000_000}
                  value={guaranteeAmount}
                  onChange={setGuaranteeAmount}
                />
                <BankSlider
                  label="Банк комиссиясы (жылдық)"
                  valueLabel={formatPercent(guaranteeFeePct)}
                  min={1.0}
                  max={8.0}
                  step={0.5}
                  value={guaranteeFeePct}
                  onChange={setGuaranteeFeePct}
                />
                <BankSlider
                  label="Кепілдік мерзімі"
                  valueLabel={`${guaranteeMonths} ай`}
                  min={1}
                  max={24}
                  step={1}
                  value={guaranteeMonths}
                  onChange={setGuaranteeMonths}
                />

                <div className="rounded-xl bg-[#F6F8F7] border border-emerald-900/10 p-3 text-xs space-y-2 text-slate-700">
                  <div className="font-bold text-emerald-950">Құралды таңдап салыстырыңыз:</div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setGuaranteeInfoFocus("guarantee");
                        playSfx("coin", sfxMuted);
                      }}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                        guaranteeInfoFocus === "guarantee"
                          ? "bg-emerald-800 text-white border-emerald-800"
                          : "bg-white text-slate-700 border-emerald-900/15 hover:bg-emerald-50"
                      }`}
                    >
                      Банктік кепілдік
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setGuaranteeInfoFocus("lc");
                        playSfx("coin", sfxMuted);
                      }}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                        guaranteeInfoFocus === "lc"
                          ? "bg-emerald-800 text-white border-emerald-800"
                          : "bg-white text-slate-700 border-emerald-900/15 hover:bg-emerald-50"
                      }`}
                    >
                      Аккредитив (LC)
                    </button>
                  </div>
                  <div className="rounded-lg bg-white border border-emerald-200/80 p-2 text-[11px] text-slate-700 leading-relaxed">
                    {guaranteeInfoFocus === "guarantee"
                      ? "Қарапайым мәні: Тендерге қатысқанда өз ақшаңызды кепілге салмайсыз — банк «шартты орындамаса, мен төлеймін» деп кепіл береді. 1С: Дт 7210 — Кт 1030."
                      : "Қарапайым мәні: Шетелден ірі тауар алғанда банк ақшаны сатушы тауарды жөнелткен құжатты (жүкқұжат) көрсеткен соң ғана аударады — алданудан қорғайды."}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-emerald-900/10">
                  <BankKpi
                    label="Банк комиссиясы"
                    value={guar.feeAmount}
                    formatter={formatTenge}
                    tone="amber"
                  />
                  <BankKpi
                    label="Бос қалған капитал"
                    value={guar.freedWorkingCapital}
                    formatter={formatTenge}
                    tone="emerald"
                  />
                </div>
              </div>
            )}

            {activeService === "sync1c" && (
              <div className="space-y-2.5">
                {SYNC_STEPS.map((st, idx) => {
                  const active = idx === activeSyncStep;
                  return (
                    <button
                      key={st.step}
                      type="button"
                      onClick={() => {
                        setActiveSyncStep(idx);
                        playSfx("coin", sfxMuted);
                      }}
                      className={`w-full text-left p-3 rounded-xl border text-xs transition-colors cursor-pointer space-y-1 ${
                        active
                          ? "bg-emerald-800 text-white border-emerald-800"
                          : "bg-[#F6F8F7] text-slate-800 border-emerald-900/10 hover:bg-emerald-50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 font-bold">
                        <span>{st.step}</span>
                        <CheckCircle2
                          className={`w-3.5 h-3.5 shrink-0 ${
                            active ? "text-amber-300" : "text-emerald-700"
                          }`}
                        />
                      </div>
                      <p
                        className={`text-[11px] leading-relaxed ${
                          active ? "text-emerald-100" : "text-slate-600"
                        }`}
                      >
                        {st.detail}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}

            <button
              type="button"
              onClick={() =>
                onAskCompass(
                  activeService === "accounts"
                    ? `Ай сайын ${monthlyPaymentsCount} төлем жасайтын компания үшін ҚР және халықаралық банктерде РКО, ИИК/КНП және 1С-те 1030 шотын жүргізу бойынша практикалық кеңес беріңіз.`
                    : activeService === "acquiring"
                      ? `${formatTenge(acqTurnover)} айналымда POS (${posFeePct}%) және QR (${qrFeePct}%) эквайринг комиссияларын 1С-те Дт 1022 / 1030 / 7210 шоттарымен қалай көрсетемін?`
                      : activeService === "credit"
                        ? `Бизнес несие (${formatTenge(loanAmount)}) мен ${overdraftDays} күндік овердрафтты салыстырып, 1С-тегі 3010 және 7310 проводкаларын түсіндіріп беріңіз.`
                        : activeService === "guarantee"
                          ? `${formatTenge(guaranteeAmount)} банктік кепілдік пен аккредитивтің артықшылықтары мен бухгалтерлік есебін түсіндіріп беріңіз.`
                          : `Client-Bank көшірмесін 1С:Бухгалтерияға импорттағанда қандай қателер кетеді және 1030 шотын қалай дұрыс тексеруге болады?`,
                  BANKING_TABS.find((t) => t.id === activeService)?.label || "Банктік қызметтер"
                )
              }
              className="w-full min-h-[42px] py-2 px-4 text-xs sm:text-sm font-bold rounded-xl bg-emerald-800 text-white hover:bg-emerald-900 transition-colors cursor-pointer"
            >
              Осы қызметті AI Тәлімгерде талдау
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function BankSlider({
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

function BankKpi({
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
