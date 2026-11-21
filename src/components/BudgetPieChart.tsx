import { useState } from "react";
import { PieChart, ShieldCheck, AlertTriangle } from "lucide-react";
import { formatTenge, formatPercent } from "../utils/financeMath";

export interface BudgetPieSegment {
  id: string;
  label: string;
  amount: number;
  color: string;
  hint: string;
}

interface BudgetPieChartProps {
  income: number;
  debtPayment: number;
  mandatoryLiving: number;
  wants: number;
  cushionMonthly: number;
  cushionTarget6M: number;
  monthsToCushion: number;
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function describePieSlice(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
): string {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${cx} ${cy} L ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${r} ${r} 0 ${largeArc} 0 ${end.x.toFixed(2)} ${end.y.toFixed(2)} Z`;
}

export function BudgetPieChart({
  income,
  debtPayment,
  mandatoryLiving,
  wants,
  cushionMonthly,
  cushionTarget6M,
  monthsToCushion,
}: BudgetPieChartProps) {
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);

  const totalExpenses = debtPayment + mandatoryLiving + wants;
  const deficit = Math.max(0, totalExpenses - income);
  const effectiveCushion = Math.max(0, cushionMonthly);
  const chartBaseTotal = Math.max(1, debtPayment + mandatoryLiving + wants + effectiveCushion);

  const debtRatioPct = income > 0 ? (debtPayment / income) * 100 : 0;
  const cushionRatioPct = income > 0 ? (effectiveCushion / income) * 100 : 0;
  const recommendedCushion20 = Math.round(income * 0.2);

  const segments: BudgetPieSegment[] = [
    {
      id: "debt",
      label: "Қажетті төлемдер (Ипотека / Несие)",
      amount: debtPayment,
      color: "#D97706",
      hint:
        debtRatioPct > 35
          ? "Қарыз жүктемесі 35%-дан асты — қайта қаржыландыруды қарастырыңыз."
          : "Қауіпсіз шек: табыстың 30–35%-ынан аспауы тиіс.",
    },
    {
      id: "living",
      label: "Міндетті тұрмыстық шығындар",
      amount: mandatoryLiving,
      color: "#065F46",
      hint: "Азық-түлік, коммуналдық төлем, жол және негізгі қажеттіліктер.",
    },
    {
      id: "wants",
      label: "Қосымша қалау мен демалыс",
      amount: wants,
      color: "#0284C7",
      hint: "Киім, кафе, демалыс — қорды тездету үшін 10% қысқартуға болады.",
    },
    {
      id: "cushion",
      label: "Қаржылық жастыққа бөлінетін сома",
      amount: effectiveCushion,
      color: "#10B981",
      hint: `Ай сайын автоматты түрде қорға аударылады (${formatPercent(cushionRatioPct)}).`,
    },
  ];

  // Build SVG slice angles
  let currentAngle = 0;
  const computedSlices = segments
    .filter((seg) => seg.amount > 0)
    .map((seg) => {
      const share = seg.amount / chartBaseTotal;
      const sweep = share * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + sweep;
      const midAngle = startAngle + sweep / 2;
      currentAngle = endAngle;
      return {
        ...seg,
        pctOfIncome: income > 0 ? (seg.amount / income) * 100 : 0,
        pctOfChart: share * 100,
        startAngle,
        endAngle,
        midAngle,
      };
    });

  const activeSegment =
    segments.find((s) => s.id === activeSegmentId) ??
    segments.find((s) => s.id === "cushion")!;

  return (
    <div className="bg-white border border-emerald-900/10 rounded-2xl shadow-[0_4px_20px_rgba(6,78,59,0.05)] p-4 sm:p-5 space-y-3.5 anim-panel-enter">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-900/10 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-emerald-800 text-amber-300 flex items-center justify-center shrink-0">
            <PieChart className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-emerald-950">
              Айлық бюджеттің дөңгелек диаграммасы
            </h3>
            <p className="text-[11px] text-slate-500">
              Табыс, ипотека/несие төлемдері және қаржылық жастық автоматты түрде есептеледі
            </p>
          </div>
        </div>
        <span className="tabular-nums text-xs font-extrabold text-emerald-950 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-1">
          Табыс: {formatTenge(income)}
        </span>
      </div>

      {/* Deficit Warning if expenses > income */}
      {deficit > 0 && (
        <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-3.5 py-2.5 text-xs font-semibold text-red-900">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>
            Шығындар табыстан <strong>{formatTenge(deficit)}</strong> асып кетті — қаржылық
            жастыққа бос сома қалмады. Қосымша шығындарды азайтыңыз.
          </span>
        </div>
      )}

      {/* Main Chart + Auto-Calculated Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Interactive SVG Pie Chart */}
        <div className="md:col-span-5 flex flex-col items-center justify-center">
          <div className="relative w-52 h-52 sm:w-56 sm:h-56">
            <svg
              viewBox="0 0 220 220"
              className="w-full h-full overflow-visible"
              role="img"
              aria-label="Айлық бюджеттің дөңгелек диаграммасы"
            >
              {computedSlices.length === 1 ? (
                <circle
                  cx={110}
                  cy={110}
                  r={92}
                  fill={computedSlices[0].color}
                  stroke="#ffffff"
                  strokeWidth={2}
                />
              ) : (
                computedSlices.map((slice) => {
                  const isActive = activeSegmentId === slice.id;
                  const radius = isActive ? 97 : 92;
                  const pathD = describePieSlice(
                    110,
                    110,
                    radius,
                    slice.startAngle,
                    Math.min(slice.endAngle, slice.startAngle + 359.99)
                  );
                  const labelPos = polarToCartesian(110, 110, 62, slice.midAngle);

                  return (
                    <g
                      key={slice.id}
                      onMouseEnter={() => setActiveSegmentId(slice.id)}
                      onMouseLeave={() => setActiveSegmentId(null)}
                      onClick={() =>
                        setActiveSegmentId((prev) => (prev === slice.id ? null : slice.id))
                      }
                      className="cursor-pointer"
                    >
                      <path
                        d={pathD}
                        fill={slice.color}
                        stroke="#ffffff"
                        strokeWidth={2.5}
                        opacity={activeSegmentId && !isActive ? 0.72 : 1}
                        style={{
                          transition: "opacity 200ms ease, transform 250ms cubic-bezier(0.22, 1, 0.36, 1)",
                        }}
                      />
                      {slice.pctOfChart >= 9 && (
                        <text
                          x={labelPos.x}
                          y={labelPos.y}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill="#ffffff"
                          fontSize="11"
                          fontWeight="800"
                          className="pointer-events-none tabular-nums"
                        >
                          {Math.round(slice.pctOfChart)}%
                        </text>
                      )}
                    </g>
                  );
                })
              )}
            </svg>
          </div>

          <div className="mt-1 text-center text-[11px] font-semibold text-slate-600 px-2">
            Секторды басып немесе үстіне апарып тексеріңіз
          </div>
        </div>

        {/* Auto-calculated Breakdown Rows */}
        <div className="md:col-span-7 space-y-2">
          {segments.map((seg) => {
            const pct = income > 0 ? (seg.amount / income) * 100 : 0;
            const isHighlighted = activeSegment.id === seg.id;
            return (
              <button
                key={seg.id}
                type="button"
                onMouseEnter={() => setActiveSegmentId(seg.id)}
                onMouseLeave={() => setActiveSegmentId(null)}
                onClick={() =>
                  setActiveSegmentId((prev) => (prev === seg.id ? null : seg.id))
                }
                className={`w-full text-left rounded-xl border px-3 py-2 transition-colors cursor-pointer ${
                  isHighlighted
                    ? "bg-emerald-50/75 border-emerald-500 shadow-[0_2px_10px_rgba(6,95,70,0.08)]"
                    : "bg-[#F6F8F7] border-emerald-900/10 hover:bg-emerald-50/40"
                }`}
              >
                <div className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-3 h-3 rounded-sm shrink-0"
                      style={{ backgroundColor: seg.color }}
                    />
                    <span className="font-bold text-slate-900 truncate">{seg.label}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 tabular-nums">
                    <span className="font-extrabold text-emerald-950">
                      {formatTenge(seg.amount)}
                    </span>
                    <span className="text-[11px] font-bold text-slate-600 bg-white border border-emerald-900/10 rounded-md px-1.5 py-0.5 min-w-[46px] text-center">
                      {formatPercent(pct)}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}

          {/* Focused Hint & Cushion Summary Strip */}
          <div className="rounded-xl bg-emerald-900 text-white px-3.5 py-2.5 text-xs space-y-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-bold text-amber-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>
                  Жастық қоры (6 ай): {formatTenge(cushionTarget6M)}
                </span>
              </span>
              <span className="tabular-nums font-extrabold">
                {effectiveCushion > 0 && Number.isFinite(monthsToCushion)
                  ? `Жету уақыты: ${monthsToCushion} ай`
                  : "Қорға сома жеткіліксіз"}
              </span>
            </div>
            <div className="text-[11px] text-emerald-100 leading-snug">
              {activeSegment.hint} (20% ұсынылған қор: {formatTenge(recommendedCushion20)}/ай)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
