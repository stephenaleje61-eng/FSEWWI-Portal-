import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, CheckCircle2, RefreshCw, X, AlertCircle, ShieldCheck } from 'lucide-react';

interface PassportPhotoCaptureProps {
  photoUrl: string;
  isVerified: boolean;
  onPhotoVerified: (photoDataUrl: string) => void;
  disabled?: boolean;
}

export const PassportPhotoCapture: React.FC<PassportPhotoCaptureProps> = ({
  photoUrl,
  isVerified,
  onPhotoVerified,
  disabled = false,
}) => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera stream safely
  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  // Request camera access upon applicant's explicit action
  const handleStartCamera = async () => {
    setCameraError(null);
    setCapturedPreview(null);
    setIsConfirming(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 640 },
        },
        audio: false,
      });

      streamRef.current = stream;
      setIsCameraActive(true);

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch((err) => {
            console.error('Video play error:', err);
          });
        }
      }, 100);
    } catch (err: any) {
      console.error('Camera access denied or unavailable:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera access was denied. Please allow camera permissions in your browser or choose "Upload Photo".');
      } else {
        setCameraError('Unable to open camera on this device. Please use "Upload Photo" instead.');
      }
      setIsCameraActive(false);
    }
  };

  // Capture photo from video stream
  const handleCapturePhoto = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = 480;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // Mirror the horizontal if front facing
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

      setCapturedPreview(dataUrl);
      setIsConfirming(true);
      stopCameraStream();
    }
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (JPEG, PNG).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('Photo size exceeds 10MB limit. Please select a smaller photo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setCapturedPreview(dataUrl);
      setIsConfirming(true);
      stopCameraStream();
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Confirm photo verification
  const handleConfirmPhoto = () => {
    if (capturedPreview) {
      onPhotoVerified(capturedPreview);
      setIsConfirming(false);
      setCapturedPreview(null);
    }
  };

  const handleRetake = () => {
    setCapturedPreview(null);
    setIsConfirming(false);
    handleStartCamera();
  };

  const handleCancel = () => {
    stopCameraStream();
    setCapturedPreview(null);
    setIsConfirming(false);
  };

  return (
    <div className="bg-slate-50 border-2 border-dashed border-indigo-200 rounded-xl p-4 flex flex-col items-center justify-center text-center relative transition-all">
      <div className="text-xs font-bold uppercase tracking-wider text-indigo-900 mb-2 flex items-center gap-1.5">
        <Camera className="w-4 h-4 text-purple-700" />
        <span>PASSPORT PHOTOGRAPH</span>
      </div>

      {/* Camera Live Stream Modal / Overlay */}
      {isCameraActive && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="p-4 bg-indigo-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-amber-300" />
                <h3 className="font-bold text-sm">Passport Photo Capture</h3>
              </div>
              <button
                type="button"
                onClick={handleCancel}
                className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-indigo-900/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4">
              <p className="text-xs text-slate-600 mb-3 text-center">
                Center your face inside the oval frame. Ensure good lighting and a neutral expression.
              </p>

              {/* Video with oval overlay */}
              <div className="relative w-64 h-64 mx-auto rounded-xl overflow-hidden bg-black shadow-inner">
                <video
                  ref={videoRef}
                  playsInline
                  autoPlay
                  muted
                  className="w-full h-full object-cover transform -scale-x-100"
                />
                {/* Passport guide oval */}
                <div className="absolute inset-0 border-2 border-dashed border-amber-300/80 rounded-[45%] pointer-events-none m-4"></div>
              </div>

              <div className="mt-4 flex gap-3 justify-center">
                <button
                  type="button"
                  onClick={handleCapturePhoto}
                  className="bg-purple-700 hover:bg-purple-800 text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg transition"
                >
                  <Camera className="w-4 h-4" />
                  Capture Photo
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-4 py-2.5 rounded-xl font-semibold text-sm transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Step ("Is this photo clear and correct?") */}
      {isConfirming && capturedPreview && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200 p-5 text-center">
            <h3 className="font-bold text-base text-slate-900 mb-1">Passport Photograph Review</h3>
            <p className="text-xs text-slate-600 mb-4 font-medium">
              Is this photo clear, properly lit, and correct?
            </p>

            <div className="w-44 h-44 mx-auto rounded-xl overflow-hidden border-2 border-indigo-500 shadow-md mb-4 bg-slate-100">
              <img
                src={capturedPreview}
                alt="Captured passport preview"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex gap-2 justify-center">
              <button
                type="button"
                onClick={handleConfirmPhoto}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow transition"
              >
                <CheckCircle2 className="w-4 h-4" />
                Confirm &amp; Verify
              </button>
              <button
                type="button"
                onClick={handleRetake}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retake
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Passport photo display frame */}
      <div className="w-32 h-36 sm:w-36 sm:h-44 bg-white border-2 border-indigo-200 rounded-lg overflow-hidden shadow-inner flex flex-col items-center justify-center relative group">
        {photoUrl ? (
          <>
            <img
              src={photoUrl}
              alt="Applicant Passport Photograph"
              className="w-full h-full object-cover"
            />
            {isVerified && (
              <div className="absolute top-1.5 right-1.5 bg-emerald-600/90 text-white p-1 rounded-full shadow" title="Photo Verified">
                <ShieldCheck className="w-4 h-4" />
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center p-3 text-slate-400">
            <Camera className="w-8 h-8 text-slate-300 mb-1" />
            <span className="text-[11px] font-semibold uppercase text-slate-500">Affix Passport Here</span>
            <span className="text-[9px] text-slate-400 mt-0.5">Clear face photo</span>
          </div>
        )}
      </div>

      {/* Verified Status Tag */}
      {photoUrl && isVerified && (
        <div className="mt-2.5 inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-1 rounded-full border border-emerald-300">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>PHOTO VERIFIED</span>
        </div>
      )}

      {/* Camera Error Message */}
      {cameraError && (
        <div className="mt-2 flex items-center gap-1 text-[11px] text-rose-600 max-w-xs text-left bg-rose-50 p-2 rounded border border-rose-200">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{cameraError}</span>
        </div>
      )}

      {/* Action buttons */}
      {!disabled && (
        <div className="mt-3 flex flex-wrap gap-2 justify-center">
          <button
            type="button"
            onClick={handleStartCamera}
            className="bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm transition"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>{photoUrl ? 'Retake Photo' : 'Take Photo'}</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Photo</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>
      )}
    </div>
  );
};
