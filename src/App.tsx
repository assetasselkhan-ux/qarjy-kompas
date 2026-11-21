import { useState, useCallback } from "react";
import {
  Volume2,
  VolumeX,
  Wallet,
  FileSpreadsheet,
  Landmark,
  MessageSquareText,
  GraduationCap,
  Compass,
} from "lucide-react";
import type { AccountingTabId, LiteracyTabId, MainTab, MentorMood } from "./types/finance";
import { FinancialLiteracySection } from "./components/FinancialLiteracySection";
import { AccountingAnd1CSection } from "./components/AccountingAnd1CSection";
import { BankingServicesSection } from "./components/BankingServicesSection";
import { CompassAssistantSection } from "./components/CompassAssistantSection";
import { PracticeQuizSection } from "./components/PracticeQuizSection";
import { MentorSidebarWidget } from "./components/MentorSidebarWidget";
import { PWAInstallButton } from "./components/PWAInstallButton";
import { OfflineIndicator } from "./components/OfflineIndicator";
import { playSfx } from "./utils/sfx";

const MENTOR_TIPS = [
  "50/30/20 бюджет ережесін қолданып, табыстың кемінде 20%-ын қаржылық жастық пен инвестицияға бөліңіз.",
  "1С:Бухгалтерияда әр операция алдымен алғашқы құжатпен рәсімделіп, сосын Дт/Кт проводкасы тексеріледі.",
  "Эквайринг комиссиясы сату түсімін (6010) азайтпайды — ол Дт 7210 шығысына бөлек жазылады.",
  "АСВ (ОСВ) тексеруінде Баланс, ОПиУ және ДДС есептері бір-бірін толықтырып отыруы тиіс.",
];

export default function App() {
  const [activeTab, setActiveTab] = useState<MainTab>("literacy");
  const [literacySubTab, setLiteracySubTab] = useState<LiteracyTabId>("budget");
  const [accountingSubTab, setAccountingSubTab] = useState<AccountingTabId>("trainer");
  const [sfxMuted, setSfxMuted] = useState(false);
  const [isMentorSpeaking, setIsMentorSpeaking] = useState(false);
  const [mentorMood, setMentorMood] = useState<MentorMood>("idle");
  const [levelLabel, setLevelLabel] = useState("1-деңгей");
  const [tipIdx, setTipIdx] = useState(0);
  const [mentorTip, setMentorTip] = useState(MENTOR_TIPS[0]);
  const [externalPrompt, setExternalPrompt] = useState<{
    text: string;
    topic: string;
    nonce: number;
  } | null>(null);

  const handleTipChange = useCallback((tip: string) => {
    setMentorMood("explaining");
    setMentorTip(tip);
  }, []);

  const handleTabChange = (tab: MainTab) => {
    setActiveTab(tab);
    setMentorMood("idle");
    playSfx("coin", sfxMuted);
    if (tab === "literacy") {
      setMentorTip(
        "Сырғытпаларды жылжытып, бюджет, 6 айлық жастық, күрделі пайыз, инфляция және ипотека есебін тексеріңіз."
      );
    } else if (tab === "accounting") {
      setMentorTip(
        "Қарапайым операцияларға Дт/Кт проводкасын таңдап жаттығыңыз, 1С Журналға шексіз құжат енгізіңіз және АСВ/Балансты бақылаңыз."
      );
    } else if (tab === "banking") {
      setMentorTip(
        "Несие картасы (грейс-кезең), несие және ҚР/әлем банктерінің шарттарын нақты цифрмен салыстырыңыз."
      );
    } else if (tab === "assistant") {
      setMentorTip(
        "AI Тәлімгер сізге кез келген тақырыпты қадамдап түсіндіріп, соңында түсінуді тексеру сұрағын қояды."
      );
    } else {
      setMentorTip(
        "Білім тесті мен есептегі қателерді шешіп, қаржы және 1С бойынша деңгейіңізді арттырыңыз."
      );
    }
  };

  const handleNextMentorTip = () => {
    const next = (tipIdx + 1) % MENTOR_TIPS.length;
    setTipIdx(next);
    setMentorMood("guiding");
    setMentorTip(MENTOR_TIPS[next]);
    playSfx("harvest", sfxMuted);
  };

  const handleAskMentor = (text: string, topic: string) => {
    setExternalPrompt({ text, topic, nonce: Date.now() });
    setMentorMood("explaining");
    setActiveTab("assistant");
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F8F7] text-slate-900 pb-20 lg:pb-6">
      {/* Top Navigation Header */}
      <header className="sticky top-0 z-30 pt-safe bg-white/95 backdrop-blur-md border-b border-emerald-900/10 shadow-[0_1px_8px_rgba(6,78,59,0.04)]">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 flex items-center justify-between gap-2 sm:gap-4">
          <button
            type="button"
            onClick={() => handleTabChange("literacy")}
            className="inline-flex items-center gap-2 text-sm sm:text-base font-extrabold tracking-tight text-emerald-950 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span className="w-7 h-7 rounded-lg bg-emerald-800 text-amber-300 flex items-center justify-center shrink-0">
              <Compass className="w-4 h-4" />
            </span>
            <span>Қаржы Компас</span>
          </button>

          <nav
            aria-label="Негізгі бөлімдер"
            className="hidden lg:flex items-center gap-4 xl:gap-5 text-xs xl:text-sm font-bold"
          >
            {(
              [
                { id: "literacy", label: "Қаржы сауаты" },
                { id: "accounting", label: "Есептілік және 1С" },
                { id: "banking", label: "Банктік қызметтер" },
                { id: "assistant", label: "AI Тәлімгер" },
                { id: "practice", label: "Тәжірибе / Тест" },
              ] as const
            ).map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleTabChange(item.id)}
                  className={`py-1.5 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    isActive
                      ? "border-emerald-700 text-emerald-950"
                      : "border-transparent text-slate-600 hover:text-emerald-900"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <PWAInstallButton />
            <button
              type="button"
              onClick={() => setSfxMuted((m) => !m)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] text-xs font-bold rounded-xl border border-emerald-900/15 bg-emerald-50 text-emerald-950 hover:bg-emerald-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {sfxMuted ? (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden sm:inline">Дыбыс өшірулі</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-emerald-700" />
                  <span className="hidden sm:inline">Дыбыс қосулы</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Dense Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-4 space-y-4">
        {/* Compact Brand Hero Banner */}
        <div className="rounded-2xl bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-900 text-white px-5 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 shadow-[0_4px_16px_rgba(6,78,59,0.12)]">
          <div className="space-y-0.5 min-w-0">
            <h1 className="text-base sm:text-xl font-extrabold tracking-tight">
              Қаржы Компас: Банк, Есеп және 1С
            </h1>
            <p className="text-xs text-emerald-100 truncate">
              Қаржылық сауаттылық, банктік қызметтер, бухгалтерлік есеп (Баланс, ОПиУ, ДДС) және 1С оқу жүйесі
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-300 shrink-0 tabular-nums">
            <span>{levelLabel}</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-100">
              {activeTab === "literacy"
                ? "Қаржы сауаты"
                : activeTab === "accounting"
                  ? "Есептілік және 1С"
                  : activeTab === "banking"
                    ? "Банктік қызметтер"
                    : activeTab === "assistant"
                      ? "AI Тәлімгер"
                      : "Тәжірибе / Тест"}
            </span>
          </div>
        </div>

        {/* Mobile Compact AI Mentor Strip */}
        <div className="lg:hidden">
          <MentorSidebarWidget
            compact={true}
            activeTab={activeTab}
            mood={mentorMood}
            isSpeaking={isMentorSpeaking}
            levelLabel={levelLabel}
            tipText={mentorTip}
            onNextTip={handleNextMentorTip}
            onOpenAi={activeTab !== "assistant" ? () => handleTabChange("assistant") : undefined}
          />
        </div>

        {/* Main Content + Side AI Mentor Column */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          <div className="lg:col-span-9 min-w-0 anim-panel-enter">
            {activeTab === "literacy" && (
              <FinancialLiteracySection
                activeSubTab={literacySubTab}
                onChangeSubTab={setLiteracySubTab}
                sfxMuted={sfxMuted}
                onAskMentor={handleAskMentor}
                onTipChange={handleTipChange}
                onSpeakingChange={setIsMentorSpeaking}
              />
            )}

            {activeTab === "accounting" && (
              <AccountingAnd1CSection
                activeSubTab={accountingSubTab}
                onChangeSubTab={setAccountingSubTab}
                sfxMuted={sfxMuted}
                onAskCompass={handleAskMentor}
                onTipChange={handleTipChange}
                onSpeakingChange={setIsMentorSpeaking}
              />
            )}

            {activeTab === "banking" && (
              <BankingServicesSection
                sfxMuted={sfxMuted}
                onAskCompass={handleAskMentor}
                onTipChange={handleTipChange}
                onSpeakingChange={setIsMentorSpeaking}
              />
            )}

            {activeTab === "assistant" && (
              <CompassAssistantSection
                sfxMuted={sfxMuted}
                externalPrompt={externalPrompt}
                onStatusTipChange={handleTipChange}
                onSpeakingChange={setIsMentorSpeaking}
              />
            )}

            {activeTab === "practice" && (
              <PracticeQuizSection
                sfxMuted={sfxMuted}
                onOpenLiteracyTab={(tab) => {
                  setLiteracySubTab(tab);
                  setActiveTab("literacy");
                }}
                onOpenAccountingTab={(tab) => {
                  setAccountingSubTab(tab);
                  setActiveTab("accounting");
                }}
                onOpenBankingTab={() => setActiveTab("banking")}
                onTipChange={handleTipChange}
                onSpeakingChange={setIsMentorSpeaking}
                onLevelChange={setLevelLabel}
              />
            )}
          </div>

          <aside className="hidden lg:block lg:col-span-3 lg:sticky lg:top-18">
            <MentorSidebarWidget
              compact={false}
              activeTab={activeTab}
              mood={mentorMood}
              isSpeaking={isMentorSpeaking}
              levelLabel={levelLabel}
              tipText={mentorTip}
              onNextTip={handleNextMentorTip}
              onOpenAi={activeTab !== "assistant" ? () => handleTabChange("assistant") : undefined}
            />
          </aside>
        </div>
      </main>

      {/* Mobile & Tablet Fixed 5-Tab Bottom Bar */}
      <nav
        aria-label="Мобильді мәзір"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-emerald-900/10 pb-safe"
      >
        <div className="grid grid-cols-5 h-14">
          {(
            [
              { id: "literacy", label: "Қаржы", icon: Wallet },
              { id: "accounting", label: "Есеп/1С", icon: FileSpreadsheet },
              { id: "banking", label: "Банк", icon: Landmark },
              { id: "assistant", label: "Тәлімгер", icon: MessageSquareText },
              { id: "practice", label: "Тест", icon: GraduationCap },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold transition-colors cursor-pointer ${
                  isActive ? "text-emerald-800" : "text-slate-500"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-emerald-700" : "text-slate-400"}`} />
                <span className="truncate max-w-[60px]">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <OfflineIndicator />
    </div>
  );
}
