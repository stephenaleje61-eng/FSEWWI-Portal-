import React from 'react';

interface FsewwiLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showText?: boolean;
  className?: string;
}

export const FsewwiLogo: React.FC<FsewwiLogoProps> = ({
  size = 'md',
  showText = false,
  className = '',
}) => {
  const sizeMap = {
    xs: 'w-8 h-8',
    sm: 'w-12 h-12',
    md: 'w-16 h-16 sm:w-20 sm:h-20',
    lg: 'w-24 h-24 sm:w-28 sm:h-28',
    xl: 'w-32 h-32 sm:w-36 sm:h-36',
    '2xl': 'w-44 h-44 sm:w-48 sm:h-48',
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className={`relative ${sizeMap[size]} flex-shrink-0 transition-transform duration-300 hover:scale-105 select-none drop-shadow-md`}>
        <img
          src="/logo.svg"
          alt="Foundation for the Support & Empowerment of Widows & Widowers Initiative (FSEWWI)"
          className="w-full h-full object-contain pointer-events-none"
          loading="eager"
        />
      </div>

      {showText && (
        <div className="text-center mt-2">
          <span className="font-serif font-black tracking-widest text-[#0f388a] text-sm uppercase block">
            FSEWWI
          </span>
          <span className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase block">
            Official Organization Seal
          </span>
        </div>
      )}
    </div>
  );
};
