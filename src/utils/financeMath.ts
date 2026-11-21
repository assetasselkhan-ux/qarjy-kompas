export function formatTenge(value: number): string {
  if (!Number.isFinite(value)) return "0 ₸";
  const rounded = Math.round(value);
  return `${rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")} ₸`;
}

export function formatPercent(value: number, digits = 1): string {
  if (!Number.isFinite(value)) return "0%";
  return `${value.toFixed(digits)}%`;
}

// --- ҚАРЖЫЛЫҚ САУАТТЫЛЫҚ (Бюджет, Жастық, Күрделі пайыз, Инфляция, Ипотека) ---

export interface BudgetCushionResult {
  needsTarget: number;
  wantsTarget: number;
  savingsTarget: number;
  actualSurplus: number;
  cushionTarget6M: number;
  monthsToCushion: number;
  savingsRatePct: number;
}

export function calculateBudgetAndCushion(
  monthlyIncome: number,
  mandatoryExpenses: number,
  wantsExpenses: number,
  currentCushion: number,
  cushionMonths = 6
): BudgetCushionResult {
  const needsTarget = monthlyIncome * 0.5;
  const wantsTarget = monthlyIncome * 0.3;
  const savingsTarget = monthlyIncome * 0.2;
  const actualSurplus = monthlyIncome - mandatoryExpenses - wantsExpenses;
  const cushionTarget6M = mandatoryExpenses * cushionMonths;
  const remaining = Math.max(0, cushionTarget6M - currentCushion);
  const monthsToCushion = actualSurplus > 0 ? Math.ceil(remaining / actualSurplus) : Infinity;
  const savingsRatePct = monthlyIncome > 0 ? (actualSurplus / monthlyIncome) * 100 : 0;

  return {
    needsTarget,
    wantsTarget,
    savingsTarget,
    actualSurplus,
    cushionTarget6M,
    monthsToCushion,
    savingsRatePct,
  };
}

export interface CompoundInflationResult {
  finalNominal: number;
  finalReal: number;
  totalContributed: number;
  compoundProfit: number;
  purchasingPowerLost: number;
  ruleOf72Years: number;
  realRateFisherPct: number;
}

export function calculateCompoundAndInflation(
  initialAmount: number,
  monthlyContribution: number,
  annualReturnPct: number,
  years: number,
  annualInflationPct: number
): CompoundInflationResult {
  const monthlyRate = annualReturnPct / 100 / 12;
  const infRate = annualInflationPct / 100;
  let nominal = initialAmount;
  let contributed = initialAmount;

  for (let m = 0; m < years * 12; m++) {
    nominal = nominal * (1 + monthlyRate) + monthlyContribution;
    contributed += monthlyContribution;
  }

  const finalReal = nominal / Math.pow(1 + infRate, years);
  const compoundProfit = Math.max(0, nominal - contributed);
  const purchasingPowerLost = Math.max(0, nominal - finalReal);
  const ruleOf72Years = annualReturnPct > 0 ? 72 / annualReturnPct : Infinity;
  const realRateFisherPct = ((1 + annualReturnPct / 100) / (1 + infRate) - 1) * 100;

  return {
    finalNominal: nominal,
    finalReal,
    totalContributed: contributed,
    compoundProfit,
    purchasingPowerLost,
    ruleOf72Years,
    realRateFisherPct,
  };
}

export interface MortgageLoanResult {
  loanAmount: number;
  monthlyPayment: number;
  totalInterestBase: number;
  totalInterestWithExtra: number;
  savedInterest: number;
  savedMonths: number;
  interestSharePct: number;
}

export function calculateLoanMortgage(
  propertyPrice: number,
  downPct: number,
  annualRatePct: number,
  years: number,
  extraMonthly = 0
): MortgageLoanResult {
  const loanAmount = Math.max(0, propertyPrice * (1 - downPct / 100));
  const months = Math.max(1, Math.round(years * 12));
  const r = annualRatePct / 100 / 12;

  let monthlyPayment = 0;
  if (r === 0) {
    monthlyPayment = loanAmount / months;
  } else {
    const f = Math.pow(1 + r, months);
    monthlyPayment = loanAmount * ((r * f) / (f - 1));
  }

  const totalInterestBase = Math.max(0, monthlyPayment * months - loanAmount);

  let balance = loanAmount;
  let totalInterestWithExtra = 0;
  let count = 0;
  while (balance > 0.5 && count < months) {
    count++;
    const interest = balance * r;
    const pay = Math.min(balance + interest, monthlyPayment + extraMonthly);
    const principal = Math.max(0, pay - interest);
    balance = Math.max(0, balance - principal);
    totalInterestWithExtra += interest;
  }

  const totalPay = loanAmount + totalInterestWithExtra;
  return {
    loanAmount,
    monthlyPayment,
    totalInterestBase,
    totalInterestWithExtra,
    savedInterest: Math.max(0, totalInterestBase - totalInterestWithExtra),
    savedMonths: Math.max(0, months - count),
    interestSharePct: totalPay > 0 ? (totalInterestWithExtra / totalPay) * 100 : 0,
  };
}

// --- БУХГАЛТЕРЛІК ЕСЕП (Баланс, ОПиУ, ДДС) ---

export interface BalanceSheetResult {
  totalAssets: number;
  totalLiabilities: number;
  equity: number;
  workingCapital: number;
  currentRatio: number;
  debtSharePct: number;
  equitySharePct: number;
}

export function calculateBalanceSheet(
  cashAndBank: number,
  receivablesAndInventory: number,
  fixedAssets: number,
  shortTermLiabilities: number,
  longTermLiabilities: number
): BalanceSheetResult {
  const currentAssets = Math.max(0, cashAndBank + receivablesAndInventory);
  const totalAssets = currentAssets + Math.max(0, fixedAssets);
  const totalLiabilities = Math.max(0, shortTermLiabilities + longTermLiabilities);
  const equity = totalAssets - totalLiabilities;
  const workingCapital = currentAssets - shortTermLiabilities;
  const currentRatio = shortTermLiabilities > 0 ? currentAssets / shortTermLiabilities : 2.5;
  const debtSharePct = totalAssets > 0 ? Math.min(100, (totalLiabilities / totalAssets) * 100) : 0;
  const equitySharePct = totalAssets > 0 ? Math.max(0, 100 - debtSharePct) : 100;

  return {
    totalAssets,
    totalLiabilities,
    equity,
    workingCapital,
    currentRatio,
    debtSharePct,
    equitySharePct,
  };
}

export interface OpiuResult {
  revenue: number;
  cogs: number;
  grossProfit: number;
  grossMarginPct: number;
  opex: number;
  ebit: number;
  taxAmount: number;
  netProfit: number;
  netMarginPct: number;
}

export function calculateOpiu(
  revenue: number,
  cogs: number,
  opex: number,
  taxRatePct = 20
): OpiuResult {
  const grossProfit = revenue - cogs;
  const grossMarginPct = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
  const ebit = grossProfit - opex;
  const taxAmount = ebit > 0 ? ebit * (taxRatePct / 100) : 0;
  const netProfit = ebit - taxAmount;
  const netMarginPct = revenue > 0 ? (netProfit / revenue) * 100 : 0;

  return {
    revenue,
    cogs,
    grossProfit,
    grossMarginPct,
    opex,
    ebit,
    taxAmount,
    netProfit,
    netMarginPct,
  };
}

export interface DdsResult {
  openingCash: number;
  operatingCf: number;
  investingCf: number;
  financingCf: number;
  netCashFlow: number;
  endingCash: number;
}

export function calculateDds(
  openingCash: number,
  operatingInflow: number,
  operatingOutflow: number,
  investingNet: number,
  financingNet: number
): DdsResult {
  const operatingCf = operatingInflow - operatingOutflow;
  const netCashFlow = operatingCf + investingNet + financingNet;
  const endingCash = openingCash + netCashFlow;

  return {
    openingCash,
    operatingCf,
    investingCf: investingNet,
    financingCf: financingNet,
    netCashFlow,
    endingCash,
  };
}

// --- БАНКТІК ҚЫЗМЕТТЕР ---

export interface AcquiringResult {
  grossTurnover: number;
  commissionAmount: number;
  netSettledToBank: number;
  effectiveFeePct: number;
  annualCommission: number;
}

export function calculateAcquiring(
  monthlyTurnover: number,
  posSharePct: number,
  posFeePct: number,
  qrFeePct: number
): AcquiringResult {
  const posVolume = monthlyTurnover * (posSharePct / 100);
  const qrVolume = Math.max(0, monthlyTurnover - posVolume);
  const commissionAmount = posVolume * (posFeePct / 100) + qrVolume * (qrFeePct / 100);
  const netSettledToBank = Math.max(0, monthlyTurnover - commissionAmount);
  const effectiveFeePct = monthlyTurnover > 0 ? (commissionAmount / monthlyTurnover) * 100 : 0;

  return {
    grossTurnover: monthlyTurnover,
    commissionAmount,
    netSettledToBank,
    effectiveFeePct,
    annualCommission: commissionAmount * 12,
  };
}

export interface BusinessCreditResult {
  monthlyLoanPayment: number;
  totalLoanInterest: number;
  overdraftInterest: number;
  overdraftTotalRepay: number;
}

export function calculateBusinessCredit(
  loanAmount: number,
  loanRatePct: number,
  loanMonths: number,
  overdraftUsed: number,
  overdraftRatePct: number,
  overdraftDays: number
): BusinessCreditResult {
  const r = loanRatePct / 100 / 12;
  let monthlyLoanPayment = 0;
  if (r === 0) {
    monthlyLoanPayment = loanAmount / Math.max(1, loanMonths);
  } else {
    const f = Math.pow(1 + r, loanMonths);
    monthlyLoanPayment = loanAmount * ((r * f) / (f - 1));
  }
  const totalLoanInterest = Math.max(0, monthlyLoanPayment * loanMonths - loanAmount);
  const overdraftInterest = overdraftUsed * (overdraftRatePct / 100) * (overdraftDays / 365);

  return {
    monthlyLoanPayment,
    totalLoanInterest,
    overdraftInterest,
    overdraftTotalRepay: overdraftUsed + overdraftInterest,
  };
}

export interface GuaranteeResult {
  feeAmount: number;
  freedWorkingCapital: number;
  monthlyDepositIncome: number;
}

export function calculateGuaranteeAndDeposit(
  guaranteeAmount: number,
  feeAnnualPct: number,
  periodMonths: number,
  depositAmount: number,
  depositAnnualPct: number
): GuaranteeResult {
  const feeAmount = guaranteeAmount * (feeAnnualPct / 100) * (periodMonths / 12);
  const freedWorkingCapital = Math.max(0, guaranteeAmount - feeAmount);
  const monthlyDepositIncome = (depositAmount * (depositAnnualPct / 100)) / 12;

  return {
    feeAmount,
    freedWorkingCapital,
    monthlyDepositIncome,
  };
}

// --- БАНКТІК ЖӘНЕ ҚАРЖЫЛЫҚ САЛЫСТЫРУ (Кредит карта, Несие, ҚР & Әлем банктері) ---

export interface CreditCardVsLoanComparison {
  purchaseAmount: number;
  cardCashbackEarned: number;
  depositYieldDuringGrace: number;
  cardNetCost: number;
  cardEffectiveRatePct: number;
  cardLateEffectiveRatePct: number;
  cardLateInterestCost: number;
  loanMonthlyPayment: number;
  loanTotalInterest: number;
  loanFeeAmount: number;
  loanNetCost: number;
  loanEffectiveRatePct: number;
  cashOpportunityLoss: number;
  bestOption: "card_grace" | "cash" | "loan";
  savingsVsLoan: number;
  verdict: string;
}

export function calculateEffectiveAnnualRatePct(
  netDisbursedAmount: number,
  monthlyPayment: number,
  months: number
): number {
  if (netDisbursedAmount <= 0 || monthlyPayment <= 0 || months <= 0) return 0;
  if (monthlyPayment * months <= netDisbursedAmount) return 0;

  let low = 0;
  let high = 0.5; // up to 50% monthly (~12,874% annual)
  for (let iter = 0; iter < 50; iter++) {
    const mid = (low + high) / 2;
    let pv = 0;
    for (let m = 1; m <= months; m++) {
      pv += monthlyPayment / Math.pow(1 + mid, m);
    }
    if (pv > netDisbursedAmount) {
      low = mid;
    } else {
      high = mid;
    }
  }
  const monthlyIrr = (low + high) / 2;
  return (Math.pow(1 + monthlyIrr, 12) - 1) * 100;
}

export function comparePaymentMethods(
  purchaseAmount: number,
  months: number,
  cardGraceDays: number,
  cardCashbackPct: number,
  loanRatePct: number,
  depositRatePct: number,
  loanFeePct = 0,
  cardPostGraceRatePct = 32
): CreditCardVsLoanComparison {
  // 1. Credit card with full repayment within grace period
  const cardCashbackEarned = purchaseAmount * (cardCashbackPct / 100);
  const depositYieldDuringGrace =
    purchaseAmount * (depositRatePct / 100) * (cardGraceDays / 365);
  const cardNetCost = purchaseAmount - cardCashbackEarned - depositYieldDuringGrace;
  const cardEffectiveRatePct = 0;

  // Card if grace period is violated (post-grace rate compounded monthly)
  const cardLateEffectiveRatePct = (Math.pow(1 + cardPostGraceRatePct / 100 / 12, 12) - 1) * 100;
  const rCard = cardPostGraceRatePct / 100 / 12;
  const fCard = Math.pow(1 + rCard, months);
  const cardLateMonthly =
    rCard === 0 ? purchaseAmount / Math.max(1, months) : purchaseAmount * ((rCard * fCard) / (fCard - 1));
  const cardLateInterestCost = Math.max(0, cardLateMonthly * months - purchaseAmount);

  // 2. Consumer Loan over `months` (with optional origination/insurance fee)
  const r = loanRatePct / 100 / 12;
  let loanMonthlyPayment = 0;
  if (r === 0) {
    loanMonthlyPayment = purchaseAmount / Math.max(1, months);
  } else {
    const f = Math.pow(1 + r, months);
    loanMonthlyPayment = purchaseAmount * ((r * f) / (f - 1));
  }
  const loanFeeAmount = purchaseAmount * (loanFeePct / 100);
  const loanTotalInterest = Math.max(0, loanMonthlyPayment * months - purchaseAmount);
  const loanNetCost = purchaseAmount + loanTotalInterest + loanFeeAmount;
  const netReceivedAfterFee = Math.max(1, purchaseAmount - loanFeeAmount);
  const loanEffectiveRatePct = calculateEffectiveAnnualRatePct(
    netReceivedAfterFee,
    loanMonthlyPayment,
    months
  );

  // 3. Paying cash immediately (no interest, no cashback/grace yield)
  const cashOpportunityLoss = depositYieldDuringGrace;

  const bestOption: "card_grace" | "cash" | "loan" =
    cardNetCost <= purchaseAmount ? "card_grace" : "cash";
  const savingsVsLoan = Math.max(0, loanNetCost - cardNetCost);

  const verdict = `Берешекті ${cardGraceDays} күндік грейс-кезеңде 100% жапсаңыз, несие картасының ТПМ = 0.0% болады және ${formatTenge(cardCashbackEarned)} кэшбэк + ${formatTenge(depositYieldDuringGrace)} депозит табысы түседі. Тұтыну несиесінің нақты ТПМ-і ${loanEffectiveRatePct.toFixed(1)}% құрайды — картамен ${formatTenge(savingsVsLoan)} үнемдейсіз (тек кешіктірмеу шарт!).`;

  return {
    purchaseAmount,
    cardCashbackEarned,
    depositYieldDuringGrace,
    cardNetCost,
    cardEffectiveRatePct,
    cardLateEffectiveRatePct,
    cardLateInterestCost,
    loanMonthlyPayment,
    loanTotalInterest,
    loanFeeAmount,
    loanNetCost,
    loanEffectiveRatePct,
    cashOpportunityLoss,
    bestOption,
    savingsVsLoan,
    verdict,
  };
}

export interface GraceVsLoanMatrixRow {
  id: string;
  instrument: string;
  termLabel: string;
  nominalRatePct: number;
  effectiveRatePct: number;
  monthlyPayment: number;
  totalOverpayOrGain: number; // positive = overpay, negative = net gain
  diffVsGraceCard: number;
  isHighlighted?: boolean;
  isGraceWinner?: boolean;
  isWarning?: boolean;
}

export function buildGraceVsLoanMatrix(
  purchaseAmount: number,
  graceDays: number,
  cashbackPct: number,
  depositRatePct: number,
  baseLoanRatePct: number,
  selectedLoanMonths: number,
  loanFeePct: number,
  cardPostGraceRatePct: number
): GraceVsLoanMatrixRow[] {
  const baseComp = comparePaymentMethods(
    purchaseAmount,
    selectedLoanMonths,
    graceDays,
    cashbackPct,
    baseLoanRatePct,
    depositRatePct,
    loanFeePct,
    cardPostGraceRatePct
  );

  const graceGain = baseComp.cardCashbackEarned + baseComp.depositYieldDuringGrace;

  const rows: GraceVsLoanMatrixRow[] = [
    {
      id: "grace-on-time",
      instrument: "Несие картасы (Грейс-кезеңде 100% жабу)",
      termLabel: `${graceDays} күн`,
      nominalRatePct: 0,
      effectiveRatePct: 0,
      monthlyPayment: purchaseAmount,
      totalOverpayOrGain: -graceGain,
      diffVsGraceCard: 0,
      isGraceWinner: true,
    },
    {
      id: "grace-missed",
      instrument: "Несие картасы (Грейс бұзылса / кешіксе)",
      termLabel: `${selectedLoanMonths} ай`,
      nominalRatePct: cardPostGraceRatePct,
      effectiveRatePct: baseComp.cardLateEffectiveRatePct,
      monthlyPayment:
        (purchaseAmount + baseComp.cardLateInterestCost) / Math.max(1, selectedLoanMonths),
      totalOverpayOrGain: baseComp.cardLateInterestCost,
      diffVsGraceCard: baseComp.cardLateInterestCost + graceGain,
      isWarning: true,
    },
  ];

  const terms = Array.from(new Set([6, 12, selectedLoanMonths, 24, 36])).sort((a, b) => a - b);
  const lowRate = Math.max(8, Number((baseLoanRatePct - 6).toFixed(1)));
  const highRate = Math.min(42, Number((baseLoanRatePct + 6).toFixed(1)));

  for (const m of terms) {
    const comp = comparePaymentMethods(
      purchaseAmount,
      m,
      graceDays,
      cashbackPct,
      baseLoanRatePct,
      depositRatePct,
      loanFeePct,
      cardPostGraceRatePct
    );
    const overpay = comp.loanTotalInterest + comp.loanFeeAmount;
    rows.push({
      id: `loan-base-${m}`,
      instrument: `Тұтыну несиесі (${baseLoanRatePct.toFixed(1)}%${loanFeePct > 0 ? ` + ${loanFeePct}% ком.` : ""})`,
      termLabel: `${m} ай`,
      nominalRatePct: baseLoanRatePct,
      effectiveRatePct: comp.loanEffectiveRatePct,
      monthlyPayment: comp.loanMonthlyPayment,
      totalOverpayOrGain: overpay,
      diffVsGraceCard: overpay + graceGain,
      isHighlighted: m === selectedLoanMonths,
    });
  }

  // Add 2 sensitivity rows at selected term for lower & higher rates
  for (const [labelPrefix, rateVal] of [
    ["Жеңілдетілген несие", lowRate],
    ["Жоғары мөлшерлемелі несие", highRate],
  ] as const) {
    if (Math.abs(rateVal - baseLoanRatePct) < 0.5) continue;
    const comp = comparePaymentMethods(
      purchaseAmount,
      selectedLoanMonths,
      graceDays,
      cashbackPct,
      rateVal,
      depositRatePct,
      loanFeePct,
      cardPostGraceRatePct
    );
    const overpay = comp.loanTotalInterest + comp.loanFeeAmount;
    rows.push({
      id: `loan-rate-${rateVal}`,
      instrument: `${labelPrefix} (${rateVal.toFixed(1)}%)`,
      termLabel: `${selectedLoanMonths} ай`,
      nominalRatePct: rateVal,
      effectiveRatePct: comp.loanEffectiveRatePct,
      monthlyPayment: comp.loanMonthlyPayment,
      totalOverpayOrGain: overpay,
      diffVsGraceCard: overpay + graceGain,
    });
  }

  return rows;
}

export interface BankOfferRow {
  id: string;
  bankName: string;
  region: "Қазақстан" | "Халықаралық";
  accountOpenFee: number;
  monthlyRko: number;
  transferFee: number;
  acquiringRatePct: number;
  cashbackOrYieldPct: number;
  swiftOrFxNote: string;
  monthlyNetCost: number;
}

export function compareKzAndGlobalBanks(
  monthlyTurnover: number,
  transfersCount: number,
  averageCashBalance: number
): BankOfferRow[] {
  const offers: Array<Omit<BankOfferRow, "monthlyNetCost">> = [
    {
      id: "kaspi",
      bankName: "Kaspi Business",
      region: "Қазақстан",
      accountOpenFee: 0,
      monthlyRko: 0,
      transferFee: 200,
      acquiringRatePct: 0.95,
      cashbackOrYieldPct: 0,
      swiftOrFxNote: "ҚР ішінде лезде аударым · QR 0.95%",
    },
    {
      id: "halyk",
      bankName: "Halyk Onlinebank",
      region: "Қазақстан",
      accountOpenFee: 0,
      monthlyRko: 4_500,
      transferFee: 150,
      acquiringRatePct: 1.2,
      cashbackOrYieldPct: 12.5,
      swiftOrFxNote: "SWIFT / Валюталық бақылау · Овернайт 12.5%",
    },
    {
      id: "forte",
      bankName: "ForteBusiness / Freedom",
      region: "Қазақстан",
      accountOpenFee: 0,
      monthlyRko: 3_900,
      transferFee: 120,
      acquiringRatePct: 1.1,
      cashbackOrYieldPct: 13.5,
      swiftOrFxNote: "Тиімді FX айырбастау · Бизнес кэшбэк 1%+",
    },
    {
      id: "wise-revolut",
      bankName: "Wise / Revolut Business",
      region: "Халықаралық",
      accountOpenFee: 0,
      monthlyRko: 7_500,
      transferFee: 300,
      acquiringRatePct: 1.5,
      cashbackOrYieldPct: 4.5,
      swiftOrFxNote: "USD/EUR/GBP мультивалюта · Нарықтық курс",
    },
  ];

  return offers.map((o) => {
    const rkoAndTransfers = o.monthlyRko + o.transferFee * transfersCount;
    const acquiringCost = monthlyTurnover * (o.acquiringRatePct / 100);
    const depositReturn = (averageCashBalance * (o.cashbackOrYieldPct / 100)) / 12;
    const monthlyNetCost = Math.round(rkoAndTransfers + acquiringCost - depositReturn);
    return {
      ...o,
      monthlyNetCost,
    };
  });
}

// --- ҚАРЫЗДАН ШЫҒУ ЖӘНЕ «0% БӨЛІП ТӨЛЕУ» МАРКЕТИНГ ТҰЗАҒЫ ---

export interface DebtAndTrapResult {
  avalancheMonths: number;
  snowballMonths: number;
  avalancheInterest: number;
  snowballInterest: number;
  savedWithAvalanche: number;
  installmentStickerPrice: number;
  cashDiscountPrice: number;
  hiddenMarkupTenge: number;
  hiddenAnnualRateApproxPct: number;
  verdict: string;
}

export function calculateDebtAndTrap(
  smallDebtAmount: number,
  smallDebtRatePct: number,
  bigDebtAmount: number,
  bigDebtRatePct: number,
  monthlyTotalPayment: number,
  installmentStickerPrice: number,
  cashDiscountPct: number,
  installmentMonths = 12
): DebtAndTrapResult {
  const simulate = (prioritizeBigRate: boolean) => {
    let b1 = smallDebtAmount;
    let b2 = bigDebtAmount;
    const r1 = smallDebtRatePct / 100 / 12;
    const r2 = bigDebtRatePct / 100 / 12;
    let totalInt = 0;
    let months = 0;
    const minPaymentRatio = 0.04;

    while ((b1 > 1 || b2 > 1) && months < 180) {
      months++;
      const int1 = b1 * r1;
      const int2 = b2 * r2;
      totalInt += int1 + int2;
      b1 += int1;
      b2 += int2;

      let budget = Math.max(monthlyTotalPayment, (b1 + b2) * 0.03 + 10_000);
      const min1 = b1 > 0 ? Math.min(b1, Math.max(5_000, b1 * minPaymentRatio)) : 0;
      const min2 = b2 > 0 ? Math.min(b2, Math.max(5_000, b2 * minPaymentRatio)) : 0;

      const payMin1 = Math.min(budget, min1);
      b1 -= payMin1;
      budget -= payMin1;

      const payMin2 = Math.min(budget, min2);
      b2 -= payMin2;
      budget -= payMin2;

      if (budget > 0) {
        const targetFirst = prioritizeBigRate ? (r2 >= r1 ? "b2" : "b1") : b1 <= b2 && b1 > 0 ? "b1" : "b2";
        if (targetFirst === "b2") {
          const extra2 = Math.min(budget, b2);
          b2 -= extra2;
          budget -= extra2;
          if (budget > 0) {
            const extra1 = Math.min(budget, b1);
            b1 -= extra1;
          }
        } else {
          const extra1 = Math.min(budget, b1);
          b1 -= extra1;
          budget -= extra1;
          if (budget > 0) {
            const extra2 = Math.min(budget, b2);
            b2 -= extra2;
          }
        }
      }
    }
    return { months, totalInt };
  };

  const avalanche = simulate(true);
  const snowball = simulate(false);
  const savedWithAvalanche = Math.max(0, snowball.totalInt - avalanche.totalInt);

  const cashDiscountPrice = installmentStickerPrice * (1 - cashDiscountPct / 100);
  const hiddenMarkupTenge = Math.max(0, installmentStickerPrice - cashDiscountPrice);
  const hiddenAnnualRateApproxPct =
    cashDiscountPrice > 0 && installmentMonths > 0
      ? (hiddenMarkupTenge / cashDiscountPrice) * (24 / (installmentMonths + 1)) * 100
      : 0;

  const verdict = `Көшкін әдісі (алдымен жоғары ${Math.max(smallDebtRatePct, bigDebtRatePct)}% несиені жабу) арқылы ${formatTenge(savedWithAvalanche)} пайыз үнемдейсіз. Ал «0% бөліп төлеу» кезінде қолма-қолға ${cashDiscountPct}% жеңілдік берілмесе, тауар бағасында ${formatTenge(hiddenMarkupTenge)} (~жылдық ${hiddenAnnualRateApproxPct.toFixed(1)}%) жасырын үстеме жатыр.`;

  return {
    avalancheMonths: avalanche.months,
    snowballMonths: snowball.months,
    avalancheInterest: avalanche.totalInt,
    snowballInterest: snowball.totalInt,
    savedWithAvalanche,
    installmentStickerPrice,
    cashDiscountPrice,
    hiddenMarkupTenge,
    hiddenAnnualRateApproxPct,
    verdict,
  };
}


