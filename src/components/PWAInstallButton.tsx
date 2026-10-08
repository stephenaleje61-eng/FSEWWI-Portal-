import React, { useState } from 'react';
import { Download, Smartphone, X, CheckCircle2, Share2, HelpCircle, ExternalLink } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall.ts';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'header' | 'banner' | 'card';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'header',
}) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [showAndroidGuide, setShowAndroidGuide] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  let isInIframe = false;
  try {
    if (typeof window !== 'undefined') {
      isInIframe = window.self !== window.top;
    }
  } catch {
    isInIframe = true;
  }

  // If already installed and running standalone, don't show prompt
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const outcome = await install();
      if (!outcome && isAndroid) {
        setShowAndroidGuide(true);
      }
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else {
      setShowAndroidGuide(true);
    }
  };

  return (
    <>
      {variant === 'header' && (
        <button
          type="button"
          onClick={handleInstallClick}
          className={`bg-amber-400 hover:bg-amber-300 text-purple-950 font-black text-xs px-3.5 py-1.5 rounded-lg shadow-sm transition flex items-center gap-1.5 shrink-0 border border-amber-300 ${className}`}
          title="Install FSEWWI App on your device"
        >
          <Download className="w-3.5 h-3.5 text-purple-950 stroke-[2.5]" />
          <span>Install App</span>
        </button>
      )}

      {variant === 'banner' && (
        <div className={`bg-gradient-to-r from-purple-950 via-indigo-900 to-purple-900 text-white p-3.5 rounded-2xl border border-amber-400/40 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${className}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-purple-950 flex items-center justify-center shrink-0 shadow">
              <Smartphone className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h4 className="text-xs font-black uppercase text-amber-300 tracking-wide">
                Install Official FSEWWI Android App
              </h4>
              <p className="text-[11px] text-purple-200">
                Install directly on your phone or tablet for offline access, instant notifications, and faster registrations.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleInstallClick}
            className="bg-amber-400 hover:bg-amber-300 text-purple-950 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow transition shrink-0"
          >
            <Download className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Install App</span>
          </button>
        </div>
      )}

      {/* Android & Desktop Installation Helper Modal */}
      {showAndroidGuide && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center border border-slate-200 text-slate-900">
            <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto mb-3">
              <Smartphone className="w-6 h-6" />
            </div>

            <h3 className="font-bold text-base mb-1 text-slate-900 font-serif">Install FSEWWI App</h3>
            <p className="text-xs text-slate-600 mb-4">
              Get the official Foundation app directly on your Android phone or computer:
            </p>

            {isInIframe && (
              <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-left text-xs text-amber-900">
                <p className="font-semibold mb-1.5 flex items-center gap-1">
                  <span>📱 Direct Installation:</span>
                </p>
                <p className="text-[11px] text-amber-800 mb-2">
                  To trigger the Android 1-tap install prompt directly, open this app in a dedicated Chrome tab:
                </p>
                <a
                  href={typeof window !== 'undefined' ? window.location.href : '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 px-3 bg-amber-400 hover:bg-amber-300 text-purple-950 rounded-lg text-xs font-black uppercase flex items-center justify-center gap-1.5 shadow-sm transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open in Chrome Tab</span>
                </a>
              </div>
            )}

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-left text-xs space-y-2 mb-4 text-slate-700">
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-[#0f388a] text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</span>
                <span>In Google Chrome on your Android phone or desktop.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-[#0f388a] text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</span>
                <span>Tap the menu icon (<strong>&vellip;</strong>) or the browser address bar.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-[#0f388a] text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">3</span>
                <span>Select <strong>&ldquo;Install app&rdquo;</strong> or <strong>&ldquo;Add to Home screen&rdquo;</strong>.</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAndroidGuide(false)}
              className="w-full py-2.5 bg-[#0f388a] text-white rounded-xl text-xs font-bold uppercase transition hover:bg-[#0b2d72]"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* iOS Safari Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center border border-slate-200 text-slate-900">
            <div className="w-12 h-12 bg-blue-100 text-[#0f388a] rounded-full flex items-center justify-center mx-auto mb-3">
              <Share2 className="w-6 h-6" />
            </div>

            <h3 className="font-bold text-base mb-1 font-serif">Install on iPhone / iPad</h3>
            <p className="text-xs text-slate-600 mb-4">
              Apple Safari supports home screen installation in two quick steps:
            </p>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-left text-xs space-y-2 mb-4 text-slate-700">
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-[#0f388a] text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</span>
                <span>Tap the <strong>Share</strong> button (square with up arrow) in Safari.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-[#0f388a] text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</span>
                <span>Scroll down and tap <strong>&ldquo;Add to Home Screen&rdquo;</strong>.</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2.5 bg-[#0f388a] text-white rounded-xl text-xs font-bold uppercase transition hover:bg-[#0b2d72]"
            >
              Understood
            </button>
          </div>
        </div>
      )}
    </>
  );
};
