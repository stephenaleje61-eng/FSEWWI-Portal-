import React, { useRef, useState, useEffect } from 'react';
import { Eraser, Check, Fingerprint, Calendar } from 'lucide-react';

interface SignaturePadProps {
  signatureData: string;
  onSignatureChange: (dataUrl: string) => void;
  dateString: string;
  onDateChange: (date: string) => void;
  disabled?: boolean;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
  signatureData,
  onSignatureChange,
  dateString,
  onDateChange,
  disabled = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#1e1b4b'; // Deep indigo/black
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (signatureData) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        setHasDrawn(true);
      };
      img.src = signatureData;
    }
  }, [signatureData]);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    } else {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || disabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    onSignatureChange(dataUrl);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    onSignatureChange('');
  };

  return (
    <div className="border border-slate-300 rounded-xl p-4 bg-slate-50/70">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
        
        {/* 1. Digital Signature */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Digital Signature <span className="text-rose-500">*</span>
            </label>
            {!disabled && hasDrawn && (
              <button
                type="button"
                onClick={clearSignature}
                className="text-[11px] text-rose-600 hover:text-rose-800 font-medium flex items-center gap-1 transition"
              >
                <Eraser className="w-3 h-3" />
                Clear
              </button>
            )}
          </div>

          <div className="relative border-2 border-slate-300 bg-white rounded-lg shadow-inner overflow-hidden h-28 flex items-center justify-center">
            <canvas
              ref={canvasRef}
              width={320}
              height={112}
              className={`w-full h-full ${disabled ? 'cursor-not-allowed opacity-90' : 'cursor-crosshair'}`}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
            {!hasDrawn && !signatureData && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-slate-400">
                <span className="text-xs italic font-serif">Sign here with finger or mouse</span>
                <div className="w-4/5 border-b border-dotted border-slate-300 mt-3"></div>
              </div>
            )}
          </div>
          <span className="text-[10px] text-slate-500 mt-1">Applicant Signature (Required)</span>
        </div>

        {/* 2. Thumbprint Box (Physical / Digital Form Indicator) */}
        <div className="flex flex-col items-center justify-center">
          <label className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-1.5 text-center">
            Thumb Print
          </label>
          <div className="w-24 h-28 border-2 border-dashed border-slate-300 bg-white rounded-lg flex flex-col items-center justify-center text-center p-2 text-slate-400 shadow-inner">
            <Fingerprint className="w-10 h-10 text-slate-300 stroke-[1.5]" />
            <span className="text-[9px] uppercase font-semibold text-slate-500 mt-1">Right Thumb</span>
            <span className="text-[8px] text-slate-400 leading-tight">(Affix on physical copy / verification desk)</span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1">Biometrics Reserved</span>
        </div>

        {/* 3. Date Field */}
        <div className="flex flex-col">
          <label className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-1.5 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-purple-700" />
            Date of Application <span className="text-rose-500">*</span>
          </label>
          <input
            type="date"
            value={dateString}
            onChange={(e) => onDateChange(e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
          />
          <span className="text-[10px] text-slate-500 mt-1">Auto-set to current date</span>
        </div>

      </div>
    </div>
  );
};
