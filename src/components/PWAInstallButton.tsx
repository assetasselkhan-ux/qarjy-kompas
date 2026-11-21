import { useState } from "react";
import { Download, Smartphone, Monitor, Share, X, CheckCircle2 } from "lucide-react";
import { usePWAInstall, type DevicePlatform } from "../hooks/usePWAInstall";

export function PWAInstallButton() {
  const { isInstallable, isInstalled, platform, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);
  const [selectedTab, setSelectedTab] = useState<DevicePlatform>(platform);

  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (accepted) return;
    }
    setSelectedTab(platform);
    setShowGuide(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] text-xs font-bold rounded-xl border border-amber-300 bg-amber-50 text-amber-950 hover:bg-amber-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        title="Қосымшаны телефонға немесе компьютерге орнату"
      >
        <Download className="w-3.5 h-3.5 text-amber-700 shrink-0" />
        <span className="hidden sm:inline">Қосымшаны орнату</span>
        <span className="sm:hidden">Орнату</span>
      </button>

      {showGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-[2px] p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-install-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-white border border-emerald-900/15 shadow-2xl overflow-hidden anim-panel-enter">
            <div className="bg-emerald-900 text-white px-5 py-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-300/40 flex items-center justify-center shrink-0">
                  <Download className="w-4 h-4 text-amber-300" />
                </span>
                <div>
                  <h3 id="pwa-install-title" className="text-sm font-extrabold">
                    Қосымшаны орнату
                  </h3>
                  <p className="text-[11px] text-emerald-100">
                    iPhone, Android және Windows / macOS үшін
                  </p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Жабу"
                onClick={() => setShowGuide(false)}
                className="p-1.5 rounded-lg hover:bg-white/15 text-emerald-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Platform switcher */}
              <div className="grid grid-cols-3 gap-1.5 bg-[#F6F8F7] p-1 rounded-xl border border-emerald-900/10">
                {(
                  [
                    { id: "ios", label: "iPhone / iPad", icon: Smartphone },
                    { id: "android", label: "Android", icon: Smartphone },
                    { id: "desktop", label: "Windows / Mac", icon: Monitor },
                  ] as const
                ).map((item) => {
                  const Icon = item.icon;
                  const active = selectedTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedTab(item.id)}
                      className={`flex items-center justify-center gap-1 py-2 px-2 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                        active
                          ? "bg-emerald-800 text-white shadow-xs"
                          : "text-slate-600 hover:text-emerald-950"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Instructions per platform */}
              {selectedTab === "ios" && (
                <div className="rounded-xl bg-emerald-50/70 border border-emerald-200 p-4 space-y-2.5 text-xs text-slate-800">
                  <div className="font-extrabold text-emerald-950 flex items-center gap-1.5">
                    <Share className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>iPhone / iPad (Safari браузері арқылы)</span>
                  </div>
                  <ol className="space-y-2 text-xs leading-relaxed">
                    <li className="flex items-start gap-2">
                      <span className="font-extrabold text-emerald-800 shrink-0">1.</span>
                      <span>
                        Қосымшаны <strong>Safari</strong> браузерінде ашып, төменгі панельдегі{" "}
                        <strong>«Бөлісу» (Поделиться ↑)</strong> батырмасын басыңыз.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-extrabold text-emerald-800 shrink-0">2.</span>
                      <span>
                        Тізімді төмен түсіріп,{" "}
                        <strong>«Басты экранға қосу» («На экран „Домой“»)</strong> тармағын таңдаңыз.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-extrabold text-emerald-800 shrink-0">3.</span>
                      <span>
                        Жоғарғы оң бұрыштағы <strong>«Қосу» («Добавить»)</strong> батырмасын басыңыз —
                        белгіше телефон экранына шығады.
                      </span>
                    </li>
                  </ol>
                </div>
              )}

              {selectedTab === "android" && (
                <div className="rounded-xl bg-emerald-50/70 border border-emerald-200 p-4 space-y-2.5 text-xs text-slate-800">
                  <div className="font-extrabold text-emerald-950">
                    Android (Google Chrome / Edge)
                  </div>
                  <ol className="space-y-2 text-xs leading-relaxed">
                    <li className="flex items-start gap-2">
                      <span className="font-extrabold text-emerald-800 shrink-0">1.</span>
                      <span>
                        Chrome браузерінің жоғарғы оң бұрышындағы <strong>⋮ мәзір</strong> батырмасын ашыңыз.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-extrabold text-emerald-800 shrink-0">2.</span>
                      <span>
                        <strong>«Қолданбаны орнату» («Установить приложение»)</strong> немесе{" "}
                        <strong>«Басты экранға қосу»</strong> тармағын басыңыз.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-extrabold text-emerald-800 shrink-0">3.</span>
                      <span>
                        Растау терезесінде <strong>«Орнату»</strong> батырмасын басыңыз.
                      </span>
                    </li>
                  </ol>
                </div>
              )}

              {selectedTab === "desktop" && (
                <div className="rounded-xl bg-emerald-50/70 border border-emerald-200 p-4 space-y-2.5 text-xs text-slate-800">
                  <div className="font-extrabold text-emerald-950">
                    Компьютер — Windows / Mac (Chrome, Edge, Safari)
                  </div>
                  <ol className="space-y-2 text-xs leading-relaxed">
                    <li className="flex items-start gap-2">
                      <span className="font-extrabold text-emerald-800 shrink-0">1.</span>
                      <span>
                        <strong>Windows / Mac (Chrome, Edge):</strong> Мекенжай жолының оң жағындағы{" "}
                        <strong>Орнату белгішесін (⊕ / монитор)</strong> басып, «Орнату» түймесін таңдаңыз.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-extrabold text-emerald-800 shrink-0">2.</span>
                      <span>
                        <strong>Mac (Safari браузері):</strong> Жоғарғы мәзірден{" "}
                        <strong>Файл → Dock тақтасына қосу («Добавить в Dock»)</strong> тармағын басыңыз.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-extrabold text-emerald-800 shrink-0">3.</span>
                      <span>
                        Қосымша браузер жолағынсыз жеке бағдарлама ретінде ашылады.
                      </span>
                    </li>
                  </ol>
                </div>
              )}

              <div className="flex items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Тұрақсыз интернетте де жылдам ашылады</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowGuide(false)}
                  className="px-4 py-2 rounded-xl bg-emerald-800 text-white text-xs font-bold hover:bg-emerald-900 transition-colors cursor-pointer shrink-0"
                >
                  Түсінікті
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
