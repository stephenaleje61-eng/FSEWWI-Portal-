import React from 'react';
import { Printer, Download, X, CheckCircle, ShieldCheck } from 'lucide-react';
import { FsewwiLogo } from './FsewwiLogo.tsx';

interface PrintSlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  referenceNumber: string;
  applicantData: any;
  photoUrl: string;
  signatureData?: string;
  signatureDate?: string;
  status: string;
  submittedAt?: string;
}

export const PrintSlipModal: React.FC<PrintSlipModalProps> = ({
  isOpen,
  onClose,
  referenceNumber,
  applicantData,
  photoUrl,
  signatureData,
  signatureDate,
  status,
  submittedAt,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full my-6 overflow-hidden border border-slate-300">
        
        {/* Modal Action Controls (Hidden when printed) */}
        <div className="no-print bg-slate-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-sm">Official Application Slip Generated</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow transition"
            >
              <Printer className="w-4 h-4" />
              <span>Print Slip</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* The Printable Form Page (Replicating the original paper form layout with official styling) */}
        <div className="p-6 sm:p-8 bg-white text-slate-900 border-2 border-slate-800 m-2 sm:m-4 rounded-xl print-page">
          
          {/* Top Form Header with Logo, Organization Name, Contact info, and Affix Passport Box */}
          <div className="flex items-start justify-between gap-4 pb-4 border-b-2 border-slate-900">
            {/* Official Logo */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 flex items-center justify-center">
              <FsewwiLogo size="sm" />
            </div>

            {/* Title & Details */}
            <div className="text-center flex-1 px-2">
              <h2 className="text-sm sm:text-lg font-black tracking-tight text-purple-950 font-serif leading-tight uppercase">
                FOUNDATION FOR THE SUPPORT &amp; EMPOWERMENT<br />
                OF WIDOWS &amp; WIDOWERS INITIATIVE
              </h2>
              <p className="text-[11px] sm:text-xs font-bold italic text-rose-600 mt-0.5">
                Empowering Lives. Restoring Hope. Building Futures
              </p>
              <p className="text-[10px] text-slate-700 mt-1">
                <strong>Email:</strong> fsewi@gmail.com &nbsp;|&nbsp; <strong>Tel:</strong> +234 806 252 5046, +234 806 337 499, +234 708 1470 032
              </p>
              <p className="text-[9px] text-slate-600 mt-0.5">
                <strong>Office Address:</strong> Beside Tetris Filling Station, 2nd Gate Federal Low-Cost Housing Estate North Bank Makurdi, Benue State.
              </p>
            </div>

            {/* Passport Photograph Box */}
            <div className="w-24 h-28 sm:w-28 sm:h-32 border-2 border-slate-900 flex-shrink-0 flex flex-col items-center justify-center overflow-hidden bg-slate-50 relative">
              {photoUrl ? (
                <img src={photoUrl} alt="Applicant Passport" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center p-2 text-slate-400">
                  <span className="text-[10px] font-bold block uppercase">Affix Passport Here</span>
                </div>
              )}
            </div>
          </div>

          {/* Reference & Status Bar */}
          <div className="my-3 py-1.5 px-3 bg-purple-50 border border-purple-200 rounded flex flex-wrap items-center justify-between text-xs font-mono font-bold">
            <span className="text-purple-950">REF: {referenceNumber}</span>
            <span className="text-slate-700">SUBMITTED: {submittedAt ? new Date(submittedAt).toLocaleDateString() : new Date().toLocaleDateString()}</span>
            <span className="uppercase text-purple-900 bg-purple-200 px-2 py-0.5 rounded text-[10px]">STATUS: {status}</span>
          </div>

          {/* Form Fields 1 to 9 */}
          <div className="space-y-2.5 text-xs text-slate-800 font-sans my-4">
            
            <div className="flex items-baseline">
              <span className="font-bold w-44">1. Title:</span>
              <span className="flex-1 border-b border-dotted border-slate-500 font-semibold">{applicantData?.title || 'Mrs.'}</span>
            </div>

            <div className="flex items-baseline">
              <span className="font-bold w-44">2. Name:</span>
              <span className="flex-1 border-b border-dotted border-slate-500 font-semibold">
                {applicantData?.surname} &nbsp;&nbsp;&nbsp;&nbsp; {applicantData?.otherNames}
              </span>
            </div>

            <div className="flex items-baseline">
              <span className="font-bold w-44">3. Phone Number:</span>
              <span className="flex-1 border-b border-dotted border-slate-500 font-semibold">{applicantData?.phoneNumber}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="flex items-baseline">
                <span className="font-bold mr-2">4. Nationality:</span>
                <span className="flex-1 border-b border-dotted border-slate-500 font-semibold">{applicantData?.nationality || 'Nigerian'}</span>
              </div>
              <div className="flex items-baseline">
                <span className="font-bold mr-2">State:</span>
                <span className="flex-1 border-b border-dotted border-slate-500 font-semibold">{applicantData?.state}</span>
              </div>
              <div className="flex items-baseline">
                <span className="font-bold mr-2">LGA:</span>
                <span className="flex-1 border-b border-dotted border-slate-500 font-semibold">{applicantData?.lga}</span>
              </div>
            </div>

            <div className="flex items-baseline">
              <span className="font-bold w-52">5. Highest Educational Qualification:</span>
              <span className="flex-1 border-b border-dotted border-slate-500 font-semibold">{applicantData?.highestQualification}</span>
            </div>

            <div className="flex items-baseline">
              <span className="font-bold w-52">6. Name of Priest/Pastor/Imam:</span>
              <span className="flex-1 border-b border-dotted border-slate-500 font-semibold">{applicantData?.clergyName || 'None'}</span>
            </div>

            <div className="flex items-baseline">
              <span className="font-bold w-64">7. Number of children left behind by late spouse:</span>
              <span className="flex-1 border-b border-dotted border-slate-500 font-semibold">{applicantData?.childrenCount ?? 0}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-baseline">
                <span className="font-bold mr-2">8. (a) Number in school:</span>
                <span className="flex-1 border-b border-dotted border-slate-500 font-semibold">{applicantData?.childrenInSchool ?? 0}</span>
              </div>
              <div className="flex items-baseline">
                <span className="font-bold mr-2">(b) Number out of school:</span>
                <span className="flex-1 border-b border-dotted border-slate-500 font-semibold">{applicantData?.childrenOutOfSchool ?? 0}</span>
              </div>
            </div>

            <div className="flex items-baseline">
              <span className="font-bold w-44">9. (a) Professional skills:</span>
              <span className="flex-1 border-b border-dotted border-slate-500 font-semibold">
                {Array.isArray(applicantData?.professionalSkills) ? applicantData?.professionalSkills.join(', ') : applicantData?.professionalSkills}
              </span>
            </div>

            <div className="flex items-baseline">
              <span className="font-bold w-44">(b) Acquired skills if any:</span>
              <span className="flex-1 border-b border-dotted border-slate-500 font-semibold">{applicantData?.acquiredSkills || 'None'}</span>
            </div>

          </div>

          {/* Signature / Thumb Print / Date */}
          <div className="grid grid-cols-3 gap-4 pt-6 pb-6 border-b-2 border-slate-400 text-center text-xs">
            <div>
              <div className="h-12 border-b border-dotted border-slate-600 flex items-center justify-center">
                {signatureData ? (
                  <img src={signatureData} alt="Applicant Signature" className="max-h-10 object-contain" />
                ) : (
                  <span className="text-slate-400 italic">Signature on file</span>
                )}
              </div>
              <span className="font-bold uppercase tracking-wider block mt-1">Signature</span>
            </div>

            <div>
              <div className="h-12 border-b border-dotted border-slate-600 flex items-center justify-center">
                <span className="text-[10px] text-slate-400 font-mono">[Thumbprint]</span>
              </div>
              <span className="font-bold uppercase tracking-wider block mt-1">Thumb Print</span>
            </div>

            <div>
              <div className="h-12 border-b border-dotted border-slate-600 flex items-center justify-center font-bold">
                {signatureDate || new Date().toISOString().split('T')[0]}
              </div>
              <span className="font-bold uppercase tracking-wider block mt-1">Date</span>
            </div>
          </div>

          {/* OFFICIAL USE ONLY SECTION matching original form */}
          <div className="mt-4 pt-2">
            <h3 className="text-center font-black text-rose-700 tracking-wider text-sm uppercase">
              OFFICIAL USE ONLY
            </h3>
            <div className="mt-2 text-xs space-y-2">
              <div className="flex items-baseline font-bold">
                <span className="mr-3">DECISION:</span>
                <span className={`px-2 py-0.5 rounded text-[11px] uppercase ${
                  status === 'Approved' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                  status === 'Not Approved' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                  'bg-amber-100 text-amber-800 border border-amber-300'
                }`}>
                  {status === 'Approved' ? 'APPROVED' : status === 'Not Approved' ? 'NOT APPROVED' : 'PENDING REVIEW'}
                </span>
              </div>
              <div className="flex items-baseline">
                <span className="w-20 font-bold">Reviewer:</span>
                <span className="flex-1 border-b border-dotted border-slate-500 font-mono">FSEWWI Welfare Screening Committee</span>
              </div>
              <div className="flex items-baseline">
                <span className="w-20 font-bold">Seal/Stamp:</span>
                <span className="flex-1 border-b border-dotted border-slate-500 font-mono">Verified Digital Record — Makurdi HQ</span>
              </div>
            </div>
          </div>

          {/* Footer Enquiries Strip */}
          <div className="mt-6 pt-3 border-t border-slate-300 text-center text-[10px] text-slate-600 font-semibold">
            For Enquiries Please Call: 07081470032, 07033593882, 07030682031, 08069532690 &amp; 07032126924
          </div>

        </div>

      </div>
    </div>
  );
};
