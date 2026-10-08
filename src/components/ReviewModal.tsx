import React from 'react';
import { ApplicationFormData } from '../types.ts';
import { CheckCircle2, Edit3, Send, ShieldCheck, X } from 'lucide-react';

interface ReviewModalProps {
  formData: ApplicationFormData;
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  formData,
  isOpen,
  onClose,
  onEdit,
  onSubmit,
  isSubmitting,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full my-8 overflow-hidden border border-slate-200">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-purple-900 to-indigo-950 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-amber-300" />
            <div>
              <h3 className="font-black text-base uppercase font-serif tracking-tight">Review Application Details</h3>
              <p className="text-xs text-purple-200">Please verify all information before final submission to the database.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1.5 rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* Header & Photo preview */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 pb-6 border-b border-slate-200">
            <div className="space-y-1 text-center sm:text-left">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-800 bg-purple-100 px-2 py-0.5 rounded-full">
                FSEWWI Applicant Record
              </span>
              <h4 className="text-xl font-black text-slate-900 uppercase">
                {formData.title} {formData.surname} {formData.otherNames}
              </h4>
              <p className="text-xs text-slate-600 font-medium">
                Phone: <strong className="text-slate-900">{formData.phoneNumber}</strong>
              </p>
              <p className="text-xs text-slate-600 font-medium">
                Origin / Residence: <strong className="text-slate-900">{formData.lga} LGA, {formData.state} State ({formData.nationality})</strong>
              </p>
            </div>

            {/* Passport Photograph */}
            <div className="flex-shrink-0 flex flex-col items-center">
              <div className="w-28 h-32 rounded-lg border-2 border-indigo-400 overflow-hidden shadow bg-slate-100">
                {formData.photoUrl ? (
                  <img src={formData.photoUrl} alt="Applicant Passport" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">No Photo</div>
                )}
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full mt-1 border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Verified
              </span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">5. Highest Qualification</span>
              <p className="text-sm font-semibold text-slate-900">{formData.highestQualification}</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">6. Clergy / Religious Reference</span>
              <p className="text-sm font-semibold text-slate-900">{formData.clergyName || 'Not specified'}</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">7. Children Left Behind</span>
              <p className="text-sm font-bold text-slate-900">{formData.childrenCount} Children</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">8. Schooling Status</span>
              <p className="text-sm font-semibold text-slate-900">
                In School: <strong>{formData.childrenInSchool}</strong> | Out of School: <strong>{formData.childrenOutOfSchool}</strong>
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 sm:col-span-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">9. Professional &amp; Acquired Skills</span>
              <div className="flex flex-wrap gap-1.5 mb-1.5">
                {(Array.isArray(formData.professionalSkills) ? formData.professionalSkills : []).map((s) => (
                  <span key={s} className="bg-purple-100 text-purple-900 text-xs px-2 py-0.5 rounded-full font-medium">
                    {s}
                  </span>
                ))}
              </div>
              {formData.acquiredSkills && (
                <p className="text-xs text-slate-700 italic mt-1">
                  Additional: {formData.acquiredSkills}
                </p>
              )}
            </div>
          </div>

          {/* Declaration & Signature display */}
          <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl space-y-3">
            <div>
              <span className="text-[10px] font-black uppercase text-amber-900 block mb-1">Applicant Declaration</span>
              <p className="text-xs text-amber-900 font-serif italic">
                &ldquo;I declare that the information provided in this application is true and correct to the best of my knowledge.&rdquo;
              </p>
              <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-800 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Declaration Accepted &amp; Confirmed</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-amber-200/60">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Digital Signature</span>
                {formData.signatureData ? (
                  <img src={formData.signatureData} alt="Applicant Signature" className="h-10 max-w-[150px] object-contain" />
                ) : (
                  <span className="text-xs text-rose-500">Signature Missing</span>
                )}
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Date</span>
                <span className="text-xs font-semibold text-slate-800">{formData.signatureDate}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onEdit}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-white font-bold text-xs flex items-center justify-center gap-1.5 transition"
          >
            <Edit3 className="w-4 h-4 text-purple-700" />
            <span>Edit Information</span>
          </button>

          <div className="flex w-full sm:w-auto gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-1/2 sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 font-semibold text-xs"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSubmit}
              disabled={isSubmitting}
              className="w-1/2 sm:w-auto px-6 py-2.5 bg-gradient-to-r from-purple-800 to-indigo-900 hover:from-purple-900 hover:to-indigo-950 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow transition"
            >
              <Send className="w-4 h-4 text-amber-300" />
              <span>{isSubmitting ? 'Submitting...' : 'Confirm & Submit'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
