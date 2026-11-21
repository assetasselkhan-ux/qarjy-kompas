export type AccountNature = "active" | "passive" | "income" | "expense";

export interface KzAccountDef {
  code: string;
  name: string;
  nature: AccountNature;
  natureLabel: string;
  group: "Ақша" | "Есеп айырысу" | "Тауар/Мүлік" | "Салық/Жалақы" | "Капитал" | "Кіріс/Шығыс";
  subcontoType: string;
}

export const KZ_ACCOUNTS: KzAccountDef[] = [
  { code: "1010", name: "Кассадағы қолма-қол ақша", nature: "active", natureLabel: "Активті", group: "Ақша", subcontoType: "Касса / АҚЕ бабы" },
  { code: "1022", name: "Жолдағы ақша (Эквайринг)", nature: "active", natureLabel: "Активті", group: "Ақша", subcontoType: "POS-терминал / Банк" },
  { code: "1030", name: "Есеп айырысу шотындағы ақша", nature: "active", natureLabel: "Активті", group: "Ақша", subcontoType: "Банктік шот (ИИК) / АҚЕ бабы" },
  { code: "1210", name: "Сатып алушылардың берешегі", nature: "active", natureLabel: "Активті", group: "Есеп айырысу", subcontoType: "Контрагент / Шарт" },
  { code: "1251", name: "Қызметкерлердің есеп беретін сомасы", nature: "active", natureLabel: "Активті", group: "Есеп айырысу", subcontoType: "Қызметкер" },
  { code: "1330", name: "Тауарлар (ТМҚ)", nature: "active", natureLabel: "Активті", group: "Тауар/Мүлік", subcontoType: "Номенклатура / Қойма" },
  { code: "1420", name: "Есепке жатқызылатын ҚҚС", nature: "active", natureLabel: "Активті", group: "Салық/Жалақы", subcontoType: "ҚҚС түрі / ЭШФ" },
  { code: "2410", name: "Негізгі құралдар", nature: "active", natureLabel: "Активті", group: "Тауар/Мүлік", subcontoType: "Негізгі құрал объектісі" },
  { code: "3010", name: "Қысқа мерзімді банк несиелері", nature: "passive", natureLabel: "Пассивті", group: "Есеп айырысу", subcontoType: "Банк / Несие шарты" },
  { code: "3120", name: "Жеке табыс салығы (ЖТС / ИПН)", nature: "passive", natureLabel: "Пассивті", group: "Салық/Жалақы", subcontoType: "Салық төлеуші / Кезең" },
  { code: "3130", name: "Есептелген ҚҚС (НДС)", nature: "passive", natureLabel: "Пассивті", group: "Салық/Жалақы", subcontoType: "Сату ЭШФ / Ставка 12%" },
  { code: "3220", name: "Міндетті зейнетақы жарналары (МЗЖ / ОПВ)", nature: "passive", natureLabel: "Пассивті", group: "Салық/Жалақы", subcontoType: "Қызметкер / БЖЗҚ" },
  { code: "3310", name: "Жабдықтаушылар алдындағы берешек", nature: "passive", natureLabel: "Пассивті", group: "Есеп айырысу", subcontoType: "Жабдықтаушы / Шарт" },
  { code: "3350", name: "Еңбекақы төлеу бойынша берешек", nature: "passive", natureLabel: "Пассивті", group: "Салық/Жалақы", subcontoType: "Қызметкер / Есеп айы" },
  { code: "3510", name: "Алынған қысқа мерзімді аванстар", nature: "passive", natureLabel: "Пассивті", group: "Есеп айырысу", subcontoType: "Сатып алушы / Шарт" },
  { code: "5030", name: "Жарғылық капитал", nature: "passive", natureLabel: "Пассивті", group: "Капитал", subcontoType: "Құрылтайшы" },
  { code: "5610", name: "Қорытынды пайда (залал)", nature: "passive", natureLabel: "Пассивті", group: "Капитал", subcontoType: "Есепті кезең" },
  { code: "6010", name: "Өнімді өткізуден түскен кіріс", nature: "income", natureLabel: "Кіріс (Кт)", group: "Кіріс/Шығыс", subcontoType: "Номенклатура тобы" },
  { code: "7010", name: "Өткізілген тауар өзіндік құны", nature: "expense", natureLabel: "Шығыс (Дт)", group: "Кіріс/Шығыс", subcontoType: "Номенклатура тобы" },
  { code: "7210", name: "Әкімшілік шығыстар", nature: "expense", natureLabel: "Шығыс (Дт)", group: "Кіріс/Шығыс", subcontoType: "Шығын бабы" },
  { code: "7310", name: "Сыйақы (несие пайызы) шығыстары", nature: "expense", natureLabel: "Шығыс (Дт)", group: "Кіріс/Шығыс", subcontoType: "Несие шарты" },
];

export function getAccountByCode(code: string): KzAccountDef {
  return (
    KZ_ACCOUNTS.find((a) => a.code === code) || {
      code,
      name: `${code} шоты`,
      nature: "active",
      natureLabel: "Активті",
      group: "Есеп айырысу",
      subcontoType: "Аналитика",
    }
  );
}

export type OneCDocKind =
  | "receipt"
  | "sales"
  | "cash"
  | "bank"
  | "advance"
  | "payroll"
  | "closing";

export interface OneCDocTemplate {
  kind: OneCDocKind;
  title: string;
  doc1C: string;
  menuPath: string;
  defaultDebit: string;
  defaultCredit: string;
  defaultAmount: number;
  defaultSubconto: string;
  defaultComment: string;
  cashFlowTag?: "operating_in" | "operating_out" | "financing" | "none";
}

export const ONEC_DOC_TEMPLATES: OneCDocTemplate[] = [
  {
    kind: "receipt",
    title: "Тауар мен қызметтердің түсуі",
    doc1C: "Поступление ТМЗ и услуг",
    menuPath: "Сатып алу → ТМҚ және қызметтер түсуі",
    defaultDebit: "1330",
    defaultCredit: "3310",
    defaultAmount: 1_200_000,
    defaultSubconto: "«Алатау Жеткізу» ЖШС · Негізгі қойма",
    defaultComment: "Жабдықтаушыдан тауар партиясы кіріске алынды",
    cashFlowTag: "none",
  },
  {
    kind: "sales",
    title: "Тауар мен қызметтерді өткізу",
    doc1C: "Реализация ТМЗ и услуг + ЭШФ",
    menuPath: "Сату → ТМҚ және қызметтерді өткізу",
    defaultDebit: "1210",
    defaultCredit: "6010",
    defaultAmount: 2_100_000,
    defaultSubconto: "«Орталық Сауда» ЖШС · №45 шот-фактура",
    defaultComment: "Сатып алушыға тауар өткізіліп, кіріс танылды",
    cashFlowTag: "none",
  },
  {
    kind: "cash",
    title: "Касса ордерлері (ПКО / РКО)",
    doc1C: "ПКО / РКО (Касса операциясы)",
    menuPath: "Банк және касса → Касса ордерлері",
    defaultDebit: "1010",
    defaultCredit: "1210",
    defaultAmount: 350_000,
    defaultSubconto: "Негізгі касса · Клиенттен қолма-қол түсім",
    defaultComment: "ПКО №12: сатып алушыдан кассаға төлем қабылданды",
    cashFlowTag: "operating_in",
  },
  {
    kind: "bank",
    title: "Банктік көшірме (Түсім / Төлем)",
    doc1C: "Банковская выписка (Платежное поручение)",
    menuPath: "Банк және касса → Банктік көшірмелер",
    defaultDebit: "1030",
    defaultCredit: "1210",
    defaultAmount: 1_850_000,
    defaultSubconto: "ИИК KZ82... · Түсім / КНП 710",
    defaultComment: "Банк көшірмесі бойынша клиенттен төлем түсті",
    cashFlowTag: "operating_in",
  },
  {
    kind: "advance",
    title: "Аванстық есеп (Іссапар / Шаруашылық)",
    doc1C: "Авансовый отчет",
    menuPath: "Банк және касса → Аванстық есептер",
    defaultDebit: "7210",
    defaultCredit: "1251",
    defaultAmount: 145_000,
    defaultSubconto: "Менеджер С. Ермеков · Кеңсе тауарлары мен жол",
    defaultComment: "Есеп беретін сома бойынша әкімшілік шығыс бекітілді",
    cashFlowTag: "none",
  },
  {
    kind: "payroll",
    title: "Жалақы және салық есептеу",
    doc1C: "Начисление зарплаты и налогов (ФНО 200.00)",
    menuPath: "Жалақы → Қызметкерлерге жалақы есептеу",
    defaultDebit: "7210",
    defaultCredit: "3350",
    defaultAmount: 950_000,
    defaultSubconto: "Әкімшілік бөлім · Ағымдағы ай",
    defaultComment: "Қызметкерлерге еңбекақы есептелді (одан бөлек 10% ЖТС, 10% МЗЖ)",
    cashFlowTag: "none",
  },
  {
    kind: "closing",
    title: "Айды жабу және реформация",
    doc1C: "Закрытие месяца (Реформация баланса)",
    menuPath: "Операциялар → Айды жабу",
    defaultDebit: "6010",
    defaultCredit: "5610",
    defaultAmount: 0,
    defaultSubconto: "Есепті ай қорытындысы · 6010/7010/7210 → 5610",
    defaultComment: "Ай соңында кірістер мен шығыстар 5610 қорытынды пайдаға жабылды",
    cashFlowTag: "none",
  },
];

export interface OneCJournalItem {
  id: string;
  date: string;
  docKind: OneCDocKind;
  docName: string;
  debit: string;
  credit: string;
  amount: number;
  subconto: string;
  comment: string;
  posted: boolean;
  cashFlowTag?: "operating_in" | "operating_out" | "financing" | "none";
}

export const INITIAL_ONEC_JOURNAL: OneCJournalItem[] = [
  {
    id: "op-1",
    date: "01.11",
    docKind: "bank",
    docName: "Бастапқы жарғылық салым (Выписка)",
    debit: "1030",
    credit: "5030",
    amount: 5_000_000,
    subconto: "Құрылтайшы · ИИК KZ82...",
    comment: "Жарғылық капитал есеп айырысу шотына салынды",
    posted: true,
    cashFlowTag: "financing",
  },
  {
    id: "op-2",
    date: "03.11",
    docKind: "receipt",
    docName: "Поступление ТМЗ №001",
    debit: "1330",
    credit: "3310",
    amount: 3_200_000,
    subconto: "«ТехноИмпорт» ЖШС · Негізгі қойма",
    comment: "Қоймаға тауар партиясы қабылданды",
    posted: true,
    cashFlowTag: "none",
  },
  {
    id: "op-3",
    date: "05.11",
    docKind: "bank",
    docName: "Платежное поручение №014",
    debit: "3310",
    credit: "1030",
    amount: 2_200_000,
    subconto: "«ТехноИмпорт» ЖШС · КНП 710",
    comment: "Жабдықтаушыға тауар ақысы аударылды",
    posted: true,
    cashFlowTag: "operating_out",
  },
  {
    id: "op-4",
    date: "10.11",
    docKind: "sales",
    docName: "Реализация ТМЗ №008 (Түсім)",
    debit: "1210",
    credit: "6010",
    amount: 4_800_000,
    subconto: "«Сауда Арена» ЖШС · ЭШФ №08",
    comment: "Тауар сатудан түсім танылды",
    posted: true,
    cashFlowTag: "none",
  },
  {
    id: "op-5",
    date: "10.11",
    docKind: "sales",
    docName: "Реализация ТМЗ №008 (Өзіндік құн)",
    debit: "7010",
    credit: "1330",
    amount: 2_600_000,
    subconto: "Негізгі қойма · Өзіндік құн есептен шығару",
    comment: "Сатылған тауардың өзіндік құны есептен шығарылды",
    posted: true,
    cashFlowTag: "none",
  },
  {
    id: "op-6",
    date: "14.11",
    docKind: "bank",
    docName: "Банковская выписка №022",
    debit: "1030",
    credit: "1210",
    amount: 3_600_000,
    subconto: "«Сауда Арена» ЖШС · Төлем түсімі",
    comment: "Сатып алушыдан шотқа төлем түсті",
    posted: true,
    cashFlowTag: "operating_in",
  },
  {
    id: "op-7",
    date: "16.11",
    docKind: "cash",
    docName: "РКО №003 (Есеп беруге)",
    debit: "1251",
    credit: "1030",
    amount: 200_000,
    subconto: "А. Болат · Іссапар шығыстарына",
    comment: "Қызметкерге есеп беретін сома берілді",
    posted: true,
    cashFlowTag: "operating_out",
  },
  {
    id: "op-8",
    date: "18.11",
    docKind: "advance",
    docName: "Авансовый отчет №002",
    debit: "7210",
    credit: "1251",
    amount: 160_000,
    subconto: "А. Болат · Байланыс және кеңсе шығыны",
    comment: "Түбіртектер бойынша әкімшілік шығыс жабылды",
    posted: true,
    cashFlowTag: "none",
  },
  {
    id: "op-9",
    date: "20.11",
    docKind: "payroll",
    docName: "Начисление зарплаты (Қараша)",
    debit: "7210",
    credit: "3350",
    amount: 900_000,
    subconto: "Штаттық қызметкерлер · Жалақы",
    comment: "Айлық жалақы есептелді",
    posted: true,
    cashFlowTag: "none",
  },
  {
    id: "op-10",
    date: "20.11",
    docKind: "payroll",
    docName: "Салық/Жарна ұстау (ЖТС + МЗЖ)",
    debit: "3350",
    credit: "3120",
    amount: 90_000,
    subconto: "10% ЖТС (ИПН) бюджетке",
    comment: "Жалақыдан жеке табыс салығы ұсталды",
    posted: true,
    cashFlowTag: "none",
  },
];

export interface OsvRow {
  code: string;
  name: string;
  nature: AccountNature;
  natureLabel: string;
  dtTurnover: number;
  ctTurnover: number;
  closingDt: number;
  closingCt: number;
}

export interface ComputedOsvSummary {
  rows: OsvRow[];
  totalDtTurnover: number;
  totalCtTurnover: number;
  totalClosingDt: number;
  totalClosingCt: number;
  isBalanced: boolean;
}

export function computeOsvFromEntries(entries: OneCJournalItem[]): ComputedOsvSummary {
  const posted = entries.filter((e) => e.posted && e.amount > 0);
  const map = new Map<string, { dt: number; ct: number }>();

  for (const item of posted) {
    const dtPrev = map.get(item.debit) || { dt: 0, ct: 0 };
    dtPrev.dt += item.amount;
    map.set(item.debit, dtPrev);

    const ctPrev = map.get(item.credit) || { dt: 0, ct: 0 };
    ctPrev.ct += item.amount;
    map.set(item.credit, ctPrev);
  }

  const rows: OsvRow[] = [];
  for (const [code, turn] of Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))) {
    const def = getAccountByCode(code);
    const net = turn.dt - turn.ct;
    const closingDt = net > 0 ? net : 0;
    const closingCt = net < 0 ? Math.abs(net) : 0;
    rows.push({
      code,
      name: def.name,
      nature: def.nature,
      natureLabel: def.natureLabel,
      dtTurnover: turn.dt,
      ctTurnover: turn.ct,
      closingDt,
      closingCt,
    });
  }

  const totalDtTurnover = rows.reduce((s, r) => s + r.dtTurnover, 0);
  const totalCtTurnover = rows.reduce((s, r) => s + r.ctTurnover, 0);
  const totalClosingDt = rows.reduce((s, r) => s + r.closingDt, 0);
  const totalClosingCt = rows.reduce((s, r) => s + r.closingCt, 0);

  return {
    rows,
    totalDtTurnover,
    totalCtTurnover,
    totalClosingDt,
    totalClosingCt,
    isBalanced:
      Math.abs(totalDtTurnover - totalCtTurnover) < 1 &&
      Math.abs(totalClosingDt - totalClosingCt) < 1,
  };
}

export interface Live1CReports {
  cashBalance: number;
  receivablesAndInventory: number;
  fixedAssets: number;
  shortLiabilities: number;
  longLiabilities: number;
  totalAssets: number;
  totalLiabilities: number;
  equity: number;
  revenue: number;
  cogs: number;
  opex: number;
  netProfit: number;
  operatingInflow: number;
  operatingOutflow: number;
  financingNet: number;
  endingCashDds: number;
}

export function computeReportsFromEntries(entries: OneCJournalItem[]): Live1CReports {
  const osv = computeOsvFromEntries(entries);
  const getNetDt = (code: string) => {
    const row = osv.rows.find((r) => r.code === code);
    return row ? row.closingDt - row.closingCt : 0;
  };
  const getNetCt = (code: string) => {
    const row = osv.rows.find((r) => r.code === code);
    return row ? row.closingCt - row.closingDt : 0;
  };

  const cashBalance = Math.max(0, getNetDt("1010") + getNetDt("1022") + getNetDt("1030"));
  const receivablesAndInventory = Math.max(
    0,
    getNetDt("1210") + getNetDt("1251") + getNetDt("1330") + getNetDt("1420")
  );
  const fixedAssets = Math.max(0, getNetDt("2410"));

  const shortLiabilities = Math.max(
    0,
    getNetCt("3010") +
      getNetCt("3120") +
      getNetCt("3130") +
      getNetCt("3220") +
      getNetCt("3310") +
      getNetCt("3350") +
      getNetCt("3510")
  );
  const longLiabilities = 0;

  // OPIU uses turnovers before or after closing: revenue on 6010 Ct, cogs 7010 Dt, opex 7210+7310 Dt
  const posted = entries.filter((e) => e.posted && e.amount > 0);
  const revenue = posted.filter((e) => e.credit === "6010").reduce((s, e) => s + e.amount, 0);
  const cogs = posted.filter((e) => e.debit === "7010").reduce((s, e) => s + e.amount, 0);
  const opex = posted
    .filter((e) => e.debit === "7210" || e.debit === "7310")
    .reduce((s, e) => s + e.amount, 0);
  const netProfit = revenue - cogs - opex;

  const totalAssets = cashBalance + receivablesAndInventory + fixedAssets;
  const totalLiabilities = shortLiabilities + longLiabilities;
  const equity = totalAssets - totalLiabilities;

  // DDS from cash accounts (1010, 1030)
  let operatingInflow = 0;
  let operatingOutflow = 0;
  let financingNet = 0;
  for (const e of posted) {
    const isCashIn = e.debit === "1010" || e.debit === "1030";
    const isCashOut = e.credit === "1010" || e.credit === "1030";
    if (e.cashFlowTag === "financing") {
      if (isCashIn) financingNet += e.amount;
      if (isCashOut) financingNet -= e.amount;
    } else {
      if (isCashIn && !isCashOut) operatingInflow += e.amount;
      if (isCashOut && !isCashIn) operatingOutflow += e.amount;
    }
  }
  const endingCashDds = operatingInflow - operatingOutflow + financingNet;

  return {
    cashBalance,
    receivablesAndInventory,
    fixedAssets,
    shortLiabilities,
    longLiabilities,
    totalAssets,
    totalLiabilities,
    equity,
    revenue,
    cogs,
    opex,
    netProfit,
    operatingInflow,
    operatingOutflow,
    financingNet,
    endingCashDds,
  };
}

export interface DkDrillCase {
  id: string;
  title: string;
  operationText: string;
  docName: string;
  amount: number;
  correctDebit: string;
  correctCredit: string;
  subcontoExample: string;
  explanation: string;
  candidateAccounts: string[];
}

export const DK_DRILL_CASES: DkDrillCase[] = [
  {
    id: "drill-1",
    title: "1-операция · Сатып алушыдан банкке төлем",
    operationText:
      "Сатып алушы «Алатау Сауда» ЖШС бұрын алған тауары үшін біздің есеп айырысу шотымызға 850 000 ₸ аударды.",
    docName: "Банк көшірмесі (Платежное поручение входящее)",
    amount: 850_000,
    correctDebit: "1030",
    correctCredit: "1210",
    subcontoExample: "«Алатау Сауда» ЖШС · Негізгі шарт",
    explanation:
      "Есеп айырысу шоты (1030) — активті шот, ақша түскенде Дебетте өседі (Дт 1030). Ал сатып алушының берешегі (1210) өтелгендіктен Кредитте азаяды (Кт 1210).",
    candidateAccounts: ["1010", "1030", "1210", "3310", "6010", "7210"],
  },
  {
    id: "drill-2",
    title: "2-операция · Қоймаға тауар түсуі",
    operationText:
      "Жабдықтаушыдан қоймаға 1 400 000 ₸ сомасына тауар партиясы (кейін төлеу шартымен) келіп түсті.",
    docName: "Поступление ТМЗ и услуг",
    amount: 1_400_000,
    correctDebit: "1330",
    correctCredit: "3310",
    subcontoExample: "Жабдықтаушы · Негізгі қойма",
    explanation:
      "Қоймадағы тауар (1330) актив ретінде Дебет бойынша өседі (Дт 1330), ал жабдықтаушы алдындағы қарызымыз (3310) пассив ретінде Кредитте пайда болады (Кт 3310).",
    candidateAccounts: ["1030", "1210", "1330", "3310", "6010", "7010"],
  },
  {
    id: "drill-3",
    title: "3-операция · Тауар сатудан кіріс тану",
    operationText:
      "Клиентке 2 200 000 ₸ сомасына тауар сатылып, Электронды шот-фактура (ЭШФ) берілді (кіріс тану проводкасы).",
    docName: "Реализация ТМЗ и услуг",
    amount: 2_200_000,
    correctDebit: "1210",
    correctCredit: "6010",
    subcontoExample: "Клиент · №12 ЭШФ",
    explanation:
      "Сатып алушының бізге берешегі (1210) Дебетте көбейеді (Дт 1210), ал сатудан түскен кіріс (6010) Кредит бойынша танылады (Кт 6010).",
    candidateAccounts: ["1010", "1210", "1330", "3310", "6010", "7010"],
  },
  {
    id: "drill-4",
    title: "4-операция · Сатылған тауар өзіндік құнын шығару",
    operationText:
      "Алдыңғы сатылған тауардың қоймадағы сатып алу бағасы (өзіндік құны) 1 350 000 ₸. Оны қоймадан есептен шығарыңыз.",
    docName: "Реализация ТМЗ (Өзіндік құн жолы)",
    amount: 1_350_000,
    correctDebit: "7010",
    correctCredit: "1330",
    subcontoExample: "Негізгі қойма · Номенклатура тобы",
    explanation:
      "Өзіндік құн шығысы (7010) Дебетте жиналады (Дт 7010), ал қоймадағы тауар қалдығы (1330) Кредит арқылы азаяды (Кт 1330).",
    candidateAccounts: ["1210", "1330", "6010", "7010", "7210", "3310"],
  },
  {
    id: "drill-5",
    title: "5-операция · Жабдықтаушыға банктен төлем",
    operationText:
      "Есеп айырысу шотынан жабдықтаушыға бұрын алынған тауар берешегі үшін 950 000 ₸ аударылды.",
    docName: "Платежное поручение исходящее",
    amount: 950_000,
    correctDebit: "3310",
    correctCredit: "1030",
    subcontoExample: "Жабдықтаушы · КНП 710",
    explanation:
      "Жабдықтаушы алдындағы қарызымыз (3310 пассив) азайғандықтан Дебетке жазылады (Дт 3310), ал банк шотындағы ақша (1030) шығыс болғандықтан Кредитке жазылады (Кт 1030).",
    candidateAccounts: ["1010", "1030", "1210", "3310", "7210", "6010"],
  },
  {
    id: "drill-6",
    title: "6-операция · Кассаға қолма-қол түсім (ПКО)",
    operationText:
      "Сатып алушы кеңсе кассасына тауар ақысы ретінде 280 000 ₸ қолма-қол ақша өткізді.",
    docName: "Приходный кассовый ордер (ПКО)",
    amount: 280_000,
    correctDebit: "1010",
    correctCredit: "1210",
    subcontoExample: "Негізгі касса · Клиент төлемі",
    explanation:
      "Кассадағы қолма-қол ақша (1010) Дебет бойынша өседі (Дт 1010), ал клиенттің берешегі (1210) Кредит бойынша жабылады (Кт 1210).",
    candidateAccounts: ["1010", "1030", "1210", "1251", "3310", "6010"],
  },
  {
    id: "drill-7",
    title: "7-операция · Жалақы есептеу",
    operationText:
      "Әкімшілік бөлім қызметкерлеріне ай соңында 750 000 ₸ еңбекақы есептелді (төлеу алдындағы есептеу).",
    docName: "Начисление зарплаты сотрудникам",
    amount: 750_000,
    correctDebit: "7210",
    correctCredit: "3350",
    subcontoExample: "Әкімшілік бөлім · Еңбекақы",
    explanation:
      "Жалақы — компанияның әкімшілік шығыны (Дт 7210), сонымен бірге қызметкерлер алдындағы берешек (Кт 3350) пайда болады.",
    candidateAccounts: ["1030", "3120", "3350", "7010", "7210", "1251"],
  },
  {
    id: "drill-8",
    title: "8-операция · Банк комиссиясын есептен шығару",
    operationText:
      "Ай сайынғы РКО және төлем аударымдары үшін банк есеп айырысу шотымыздан 12 500 ₸ комиссия ұстады.",
    docName: "Банковская выписка (Банк қызметі)",
    amount: 12_500,
    correctDebit: "7210",
    correctCredit: "1030",
    subcontoExample: "Банк комиссиясы · Әкімшілік шығын",
    explanation:
      "Банк қызметінің комиссиясы әкімшілік шығысқа жатады (Дт 7210), ал есеп айырысу шотындағы қаражат азаяды (Кт 1030).",
    candidateAccounts: ["1010", "1030", "1022", "3310", "6010", "7210"],
  },
  {
    id: "drill-9",
    title: "9-операция · Аванстық есеп (Кеңсе шығыны)",
    operationText:
      "Қызметкер бұрын алған есеп беретін сомадан (1251) кеңсе қағазы мен пошта қызметіне 45 000 ₸ жұмсап, түбіртек тапсырды.",
    docName: "Авансовый отчет",
    amount: 45_000,
    correctDebit: "7210",
    correctCredit: "1251",
    subcontoExample: "Қызметкер · Кеңсе шығындары",
    explanation:
      "Түбіртек негізінде сома әкімшілік шығынға алынады (Дт 7210), ал қызметкердің есеп беретін қарызы (1251) Кредит бойынша жабылады (Кт 1251).",
    candidateAccounts: ["1010", "1251", "1330", "3350", "7210", "3310"],
  },
  {
    id: "drill-10",
    title: "10-операция · Эквайринг (Банктен түсім)",
    operationText:
      "POS-терминал арқылы өткен клиент төлемі транзиттік 1022 шотынан 500 000 ₸ болып есеп айырысу шотына (1030) түсті.",
    docName: "Банковская выписка (Эквайринг түсімі)",
    amount: 500_000,
    correctDebit: "1030",
    correctCredit: "1022",
    subcontoExample: "POS-терминал · Эквайринг банкі",
    explanation:
      "Қаражат транзиттік 1022 шотынан (Кт 1022) нақты банктік есеп шотқа (Дт 1030) аударылады.",
    candidateAccounts: ["1010", "1022", "1030", "1210", "6010", "7210"],
  },
];
