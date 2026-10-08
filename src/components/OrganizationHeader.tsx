import React from 'react';
import { Mail, Phone, MapPin, ShieldCheck } from 'lucide-react';
import { FsewwiLogo } from './FsewwiLogo.tsx';
import { PWAInstallButton } from './PWAInstallButton.tsx';

interface OrganizationHeaderProps {
  onLogout?: () => void;
  userEmail?: string;
  role?: string;
  onOpenAdmin?: () => void;
  onOpenDashboard?: () => void;
}

export const OrganizationHeader: React.FC<OrganizationHeaderProps> = ({
  onLogout,
  userEmail,
  role,
  onOpenAdmin,
  onOpenDashboard,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 shadow-sm relative">
      <div className="max-w-6xl mx-auto px-4 py-3.5 sm:px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Logo & Emblem using Official Uploaded Image */}
          <div className="flex items-center gap-4 text-center sm:text-left">
            <FsewwiLogo size="md" />

            <div>
              <h1 className="text-lg sm:text-2xl md:text-2xl font-black text-[#0f388a] tracking-tight leading-tight uppercase font-serif">
                FOUNDATION FOR THE SUPPORT &amp; EMPOWERMENT <br className="hidden sm:inline" />
                OF WIDOWS &amp; WIDOWERS INITIATIVE
              </h1>
              <p className="text-xs sm:text-sm font-semibold italic text-rose-600 mt-0.5">
                &ldquo;Empowering Lives, Restoring Hope, Building Futures&rdquo;
              </p>
            </div>
          </div>

          {/* Action and User / Session controls */}
          <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-end text-xs">
            {/* Install App Button */}
            <PWAInstallButton variant="header" />

            {userEmail ? (
              <>
                <div className="bg-purple-50 text-purple-900 border border-purple-200 px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  <span className="truncate max-w-[150px] sm:max-w-[200px]">{userEmail}</span>
                  {role && role !== 'applicant' && (
                    <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">
                      {role.replace('_', ' ')}
                    </span>
                  )}
                </div>

                {onOpenDashboard && (
                  <button
                    onClick={onOpenDashboard}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition"
                  >
                    Dashboard
                  </button>
                )}

                {onOpenAdmin && (role !== 'applicant' || userEmail.includes('admin')) && (
                  <button
                    onClick={onOpenAdmin}
                    className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition flex items-center gap-1"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Admin
                  </button>
                )}

                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition"
                  >
                    Sign Out
                  </button>
                )}
              </>
            ) : null}
          </div>
        </div>

        {/* Contact info strip matching paper form */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-[#0f388a] shrink-0" />
            <span><strong className="text-slate-800">Email:</strong> fsewi@gmail.com</span>
          </div>

          <div className="flex items-start gap-2">
            <Phone className="w-4 h-4 text-[#0f388a] shrink-0 mt-0.5" />
            <div className="flex flex-wrap gap-x-2">
              <strong className="text-slate-800">Tel:</strong>
              <span>+234 806 252 5046,</span>
              <span>+234 806 337 499,</span>
              <span>+234 708 1470 032</span>
            </div>
          </div>

          <div className="flex items-start gap-2 md:col-span-1">
            <MapPin className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="leading-snug">
              <strong className="text-slate-800">Office:</strong> Beside Tetris Filling Station, 2nd Gate Federal Low-Cost Housing Estate, North Bank, Makurdi, Benue State.
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
