import React from 'react';

export const HeaderMarquee: React.FC = () => {
  const marqueeText = "★ FOUNDATION FOR THE SUPPORT & EMPOWERMENT OF WIDOWS & WIDOWERS INITIATIVE (FSEWWI) ★ OFFICIAL REGISTRATION & APPLICATION PORTAL ★ EMPOWERING LIVES. RESTORING HOPE. BUILDING FUTURES ★";

  return (
    <div
      className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 text-amber-300 py-2.5 overflow-hidden border-b border-amber-400/30 select-none shadow-sm z-30 relative"
      role="region"
      aria-label="Organization announcement banner"
    >
      <div className="flex w-max animate-continuous-marquee">
        <div className="flex items-center space-x-12 px-6 text-xs sm:text-sm font-semibold tracking-wider uppercase whitespace-nowrap">
          <span>{marqueeText}</span>
          <span>{marqueeText}</span>
        </div>
        <div className="flex items-center space-x-12 px-6 text-xs sm:text-sm font-semibold tracking-wider uppercase whitespace-nowrap">
          <span>{marqueeText}</span>
          <span>{marqueeText}</span>
        </div>
      </div>
    </div>
  );
};
