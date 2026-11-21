import { ArrowUpRight } from "lucide-react";
import type { AccountingTabId, LiteracyTabId } from "../types/finance";

interface FormulaVaultSectionProps {
  onOpenLiteracyTab: (tab: LiteracyTabId) => void;
  onOpenAccountingTab: (tab: AccountingTabId) => void;
  onOpenBankingTab: () => void;
}

const FORMULAS: Array<{
  title: string;
  formula: string;
  category: string;
  meaning: string;
  section: "literacy" | "accounting" | "banking";
  subId?: LiteracyTabId | AccountingTabId;
}> = [
  {
    title: "Күрделі пайыз және 72 ережесі",
    formula: "FV = P · (1 + r)^n · T_2x ≈ 72 / r",
    category: "Қаржылық сауаттылық",
    meaning:
      "Табысқа қайта табыс қосылып, капиталды еселейді. 72 санын жылдық пайызға бөлсеңіз, ақшаның 2 еселену уақыты шығады.",
    section: "literacy",
    subId: "compound",
  },
  {
    title: "Фишер нақты табыстылық теңдеуі",
    formula: "r_real = (1 + r) / (1 + i) − 1",
    category: "Инфляциядан қорғау",
    meaning:
      "Депозит немесе инвестиция табыстылығы инфляциядан (i) жоғары болғанда ғана сатып алу қабілетіңіз нақты өседі.",
    section: "literacy",
    subId: "inflation",
  },
  {
    title: "Аннуитеттік ипотека / Несие төлемі",
    formula: "A = P · [r(1+r)^n] / [(1+r)^n − 1]",
    category: "Несие және Ипотека",
    meaning:
      "Алғашқы жылдардағы мерзімінен бұрын төлем негізгі қарызды азайтып, болашақ банктік сыйақыны еселеп қысқартады.",
    section: "literacy",
    subId: "mortgage",
  },
  {
    title: "Негізгі бухгалтерлік теңдік (Баланс Ф.1)",
    formula: "Активтер = Міндеттемелер + Меншікті капитал",
    category: "Бухгалтерлік есеп (1010–5610)",
    meaning:
      "Кәсіпорынның барлық мүлкі мен ақшасы (Актив) оның қаржыландыру көздеріне (Міндеттеме + Капитал) тең.",
    section: "accounting",
    subId: "balance",
  },
  {
    title: "ОПиУ (Ф.2) және ДДС (Ф.3) формулалары",
    formula: "Таза пайда = 6010 − 7010 − 7210 − КТС · Соңғы ақша = Баст + Ағындар",
    category: "Есептілік және 1С",
    meaning:
      "ОПиУ сату сәтін (метод начисления) көрсетсе, ДДС 1010 касса мен 1030 банктегі нақты ақша қозғалысын бақылайды.",
    section: "accounting",
    subId: "opiu",
  },
  {
    title: "Эквайринг және Овердрафт есебі",
    formula: "Овердрафт % = Сома × (Мөлшерлеме / 365) × Күн",
    category: "Банктік қызметтер",
    meaning:
      "Эквайринг комиссиясы сату түсімін (6010) азайтпай, Дт 7210-ға бөлек жазылады. Овердрафт тек қолданған күндерге есептеледі.",
    section: "banking",
  },
];

export function FormulaVaultSection({
  onOpenLiteracyTab,
  onOpenAccountingTab,
  onOpenBankingTab,
}: FormulaVaultSectionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {FORMULAS.map((item) => (
        <div
          key={item.title}
          className="rounded-2xl border border-emerald-900/10 bg-white shadow-[0_4px_20px_rgba(6,78,59,0.05)] p-5 flex flex-col justify-between gap-4"
        >
          <div className="space-y-2.5">
            <div className="text-xs font-bold text-emerald-800">{item.category}</div>
            <h3 className="text-base font-extrabold text-slate-900">{item.title}</h3>
            <div className="text-xs sm:text-sm font-bold bg-[#F6F8F7] border border-emerald-900/10 rounded-xl px-3.5 py-2.5 text-emerald-950 tabular-nums">
              {item.formula}
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{item.meaning}</p>
          </div>

          <div className="pt-1">
            <button
              type="button"
              onClick={() => {
                if (item.section === "literacy" && item.subId) {
                  onOpenLiteracyTab(item.subId as LiteracyTabId);
                } else if (item.section === "accounting" && item.subId) {
                  onOpenAccountingTab(item.subId as AccountingTabId);
                } else {
                  onOpenBankingTab();
                }
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[38px] rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-900 hover:bg-emerald-100 transition-colors cursor-pointer"
            >
              <span>Калькуляторда ашу</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
