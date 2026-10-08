import React, { useState, useEffect } from 'react';
import {
  Save,
  Send,
  AlertCircle,
  CheckCircle,
  FileText,
  User,
  Phone,
  MapPin,
  GraduationCap,
  Users,
  Briefcase,
  Check,
  Plus,
  Trash2
} from 'lucide-react';
import { ApplicationFormData } from '../types.ts';
import { PassportPhotoCapture } from './PassportPhotoCapture.tsx';
import { SignaturePad } from './SignaturePad.tsx';
import { NIGERIA_STATES_LGAS, NIGERIAN_STATES } from '../data/nigeriaLocations.ts';

interface ApplicationFormProps {
  initialData?: Partial<ApplicationFormData>;
  onSaveDraft: (formData: ApplicationFormData) => Promise<void>;
  onReview: (formData: ApplicationFormData) => void;
  isSavingDraft: boolean;
  userEmail: string;
}

const TITLE_OPTIONS = ['Mrs.', 'Mr.', 'Dr.', 'Prof.', 'Alhaji', 'Haji', 'Chief', 'Other'];
const EDUCATION_OPTIONS = [
  'No Formal Education',
  'Primary',
  'Secondary',
  'NCE',
  'OND',
  'HND',
  "Bachelor's Degree",
  "Master's Degree",
  'PhD',
  'Other',
];

const PREDEFINED_SKILLS = [
  'Tailoring',
  'Farming',
  'Trading',
  'Catering',
  'Hairdressing',
  'Teaching',
  'Computer Skills',
  'Carpentry',
  'Healthcare',
  'Business',
  'Knitting & Weaving',
  'Poultry & Livestock',
  'Soap Making',
  'Other',
];

export const ApplicationForm: React.FC<ApplicationFormProps> = ({
  initialData,
  onSaveDraft,
  onReview,
  isSavingDraft,
  userEmail,
}) => {
  const [formData, setFormData] = useState<ApplicationFormData>({
    title: initialData?.title || 'Mrs.',
    surname: initialData?.surname || '',
    otherNames: initialData?.otherNames || '',
    phoneNumber: initialData?.phoneNumber || '',
    nationality: initialData?.nationality || 'Nigerian',
    state: initialData?.state || 'Benue',
    lga: initialData?.lga || 'Makurdi',
    highestQualification: initialData?.highestQualification || 'Secondary',
    clergyName: initialData?.clergyName || '',
    childrenCount: initialData?.childrenCount ?? 0,
    childrenInSchool: initialData?.childrenInSchool ?? 0,
    childrenOutOfSchool: initialData?.childrenOutOfSchool ?? 0,
    professionalSkills: initialData?.professionalSkills || ['Tailoring'],
    customProfessionalSkill: initialData?.customProfessionalSkill || '',
    acquiredSkills: initialData?.acquiredSkills || '',
    declarationAccepted: initialData?.declarationAccepted || false,
    signatureData: initialData?.signatureData || '',
    signatureDate: initialData?.signatureDate || new Date().toISOString().split('T')[0],
    photoUrl: initialData?.photoUrl || '',
    photoVerified: initialData?.photoVerified || false,
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [draftSavedToast, setDraftSavedToast] = useState(false);
  const [customSkillInput, setCustomSkillInput] = useState('');

  // Available LGAs for current state
  const availableLgas = NIGERIA_STATES_LGAS[formData.state] || [];

  // Update LGA if state changes and current LGA is not valid for new state
  const handleStateChange = (newState: string) => {
    const lgasForState = NIGERIA_STATES_LGAS[newState] || [];
    setFormData((prev) => ({
      ...prev,
      state: newState,
      lga: lgasForState[0] || '',
    }));
  };

  // Toggle skills
  const toggleSkill = (skill: string) => {
    setFormData((prev) => {
      const exists = prev.professionalSkills.includes(skill);
      const nextSkills = exists
        ? prev.professionalSkills.filter((s) => s !== skill)
        : [...prev.professionalSkills, skill];
      return { ...prev, professionalSkills: nextSkills };
    });
  };

  const handleAddCustomSkill = () => {
    if (customSkillInput.trim() && !formData.professionalSkills.includes(customSkillInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        professionalSkills: [...prev.professionalSkills, customSkillInput.trim()],
      }));
      setCustomSkillInput('');
    }
  };

  // Validate form
  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.surname.trim()) {
      errors.surname = 'Please enter your surname.';
    }
    if (!formData.otherNames.trim()) {
      errors.otherNames = 'Please enter your other names.';
    }

    const cleanPhone = formData.phoneNumber.replace(/\s+/g, '');
    if (!cleanPhone) {
      errors.phoneNumber = 'Please enter your phone number.';
    } else if (!/^(\+?234|0)[789][01]\d{8}$/.test(cleanPhone)) {
      errors.phoneNumber = 'Please enter a valid Nigerian phone number (e.g. 08062525046 or +2348062525046).';
    }

    if (!formData.state) {
      errors.state = 'Please select your state.';
    }
    if (!formData.lga) {
      errors.lga = 'Please select your LGA.';
    }
    if (!formData.highestQualification) {
      errors.highestQualification = 'Please select your highest educational qualification.';
    }

    // Children validation
    if (formData.childrenCount < 0) {
      errors.childrenCount = 'Number of children cannot be negative.';
    }
    if (formData.childrenInSchool < 0) {
      errors.childrenInSchool = 'Cannot be negative.';
    }
    if (formData.childrenOutOfSchool < 0) {
      errors.childrenOutOfSchool = 'Cannot be negative.';
    }
    if (formData.childrenInSchool + formData.childrenOutOfSchool > formData.childrenCount) {
      errors.childrenSchooling = `Total children in school (${formData.childrenInSchool}) and out of school (${formData.childrenOutOfSchool}) cannot exceed total children (${formData.childrenCount}).`;
    }

    if (formData.professionalSkills.length === 0) {
      errors.professionalSkills = 'Please select or enter at least one professional skill.';
    }

    if (!formData.photoUrl || !formData.photoVerified) {
      errors.photo = 'Please capture or upload a passport photograph and confirm verification.';
    }

    if (!formData.declarationAccepted) {
      errors.declaration = 'You must agree to the declaration statement to proceed.';
    }

    if (!formData.signatureData) {
      errors.signature = 'Please provide your digital signature using the signature pad.';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveDraftClick = async () => {
    try {
      await onSaveDraft(formData);
      setDraftSavedToast(true);
      setTimeout(() => setDraftSavedToast(false), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onReview(formData);
    } else {
      // Scroll to first error
      const firstError = document.querySelector('.border-rose-500');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Draft saved toast */}
      {draftSavedToast && (
        <div className="fixed top-20 right-4 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-bounce">
          <CheckCircle className="w-5 h-5" />
          <span className="text-sm font-semibold">Draft successfully saved! You can resume anytime.</span>
        </div>
      )}

      {/* Form Container */}
      <form onSubmit={handleSubmitReview} className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        
        {/* Top Paper Header Bar */}
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 p-6 text-white text-center relative border-b-4 border-amber-400">
          <span className="inline-block bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-2">
            Official Application Form 2026
          </span>
          <h2 className="text-xl sm:text-2xl font-black font-serif tracking-tight uppercase text-white">
            WIDOWS &amp; WIDOWERS WELFARE &amp; EMPOWERMENT SCHEME
          </h2>
          <p className="text-xs sm:text-sm text-purple-200 mt-1 max-w-2xl mx-auto">
            Please fill out all numbered sections accurately. All submitted information is processed under strict confidentiality and verification standards.
          </p>
        </div>

        <div className="p-6 sm:p-8 space-y-8">
          
          {/* Top Row: Passport Photograph & Instructions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start pb-6 border-b border-slate-200">
            <div className="md:col-span-2 space-y-3">
              <div className="bg-purple-50/80 border border-purple-200 rounded-xl p-4">
                <h3 className="text-sm font-bold text-purple-950 flex items-center gap-1.5 mb-1">
                  <FileText className="w-4 h-4 text-purple-700" />
                  Applicant Instructions
                </h3>
                <ul className="text-xs text-purple-900/80 space-y-1 list-disc list-inside">
                  <li>Ensure your face is clearly visible when capturing your passport photograph.</li>
                  <li>Provide active telephone numbers for SMS / WhatsApp welfare updates.</li>
                  <li>Dynamic LGA selection automatically adapts to your chosen Nigerian state.</li>
                  <li>You can save your progress as a draft and return whenever convenient.</li>
                </ul>
              </div>

              {validationErrors.photo && (
                <div className="p-3 bg-rose-50 border border-rose-300 rounded-lg text-xs font-semibold text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{validationErrors.photo}</span>
                </div>
              )}
            </div>

            {/* Passport Photo Box matching [ Affix Passport Here ] on original paper */}
            <div className="md:col-span-1 flex justify-center md:justify-end">
              <PassportPhotoCapture
                photoUrl={formData.photoUrl}
                isVerified={formData.photoVerified}
                onPhotoVerified={(url) => {
                  setFormData((prev) => ({ ...prev, photoUrl: url, photoVerified: true }));
                  setValidationErrors((prev) => ({ ...prev, photo: '' }));
                }}
              />
            </div>
          </div>

          {/* Section 1: TITLE */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-purple-700 text-white font-black text-xs flex items-center justify-center">1</span>
              <label htmlFor="field-title" className="text-sm font-black text-slate-900 tracking-wide uppercase">
                Title <span className="text-rose-500">*</span>
              </label>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2 pt-1">
              {TITLE_OPTIONS.map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setFormData({ ...formData, title: t })}
                  className={`py-2 px-3 text-xs font-bold rounded-lg border transition ${
                    formData.title === t
                      ? 'bg-purple-700 text-white border-purple-700 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Section 2: FULL NAME (Surname & Other Names) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-purple-700 text-white font-black text-xs flex items-center justify-center">2</span>
              <label className="text-sm font-black text-slate-900 tracking-wide uppercase">
                Full Name <span className="text-rose-500">*</span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Surname (Last Name) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ogbole"
                  value={formData.surname}
                  onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
                  className={`w-full px-3.5 py-2.5 rounded-lg border ${
                    validationErrors.surname ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-300 focus:border-purple-600'
                  } text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 transition font-medium`}
                />
                {validationErrors.surname && (
                  <p className="text-[11px] text-rose-600 font-medium mt-1">{validationErrors.surname}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Other Names (First &amp; Middle Names) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Grace Victoria"
                  value={formData.otherNames}
                  onChange={(e) => setFormData({ ...formData, otherNames: e.target.value })}
                  className={`w-full px-3.5 py-2.5 rounded-lg border ${
                    validationErrors.otherNames ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-300 focus:border-purple-600'
                  } text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 transition font-medium`}
                />
                {validationErrors.otherNames && (
                  <p className="text-[11px] text-rose-600 font-medium mt-1">{validationErrors.otherNames}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: PHONE NUMBER */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-purple-700 text-white font-black text-xs flex items-center justify-center">3</span>
              <label htmlFor="field-phone" className="text-sm font-black text-slate-900 tracking-wide uppercase">
                Phone Number <span className="text-rose-500">*</span>
              </label>
            </div>

            <div className="relative max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Phone className="w-4 h-4 text-purple-700" />
              </div>
              <input
                id="field-phone"
                type="tel"
                placeholder="08062525046 or +234..."
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                className={`w-full pl-9 pr-3.5 py-2.5 rounded-lg border ${
                  validationErrors.phoneNumber ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-300 focus:border-purple-600'
                } text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 transition font-medium`}
              />
            </div>
            {validationErrors.phoneNumber && (
              <p className="text-[11px] text-rose-600 font-medium">{validationErrors.phoneNumber}</p>
            )}
            <p className="text-[11px] text-slate-500">Official welfare notifications will be sent to this line.</p>
          </div>

          {/* Section 4: NATIONALITY / STATE / LGA */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-purple-700 text-white font-black text-xs flex items-center justify-center">4</span>
              <label className="text-sm font-black text-slate-900 tracking-wide uppercase">
                Nationality / State / Local Government Area (LGA) <span className="text-rose-500">*</span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nationality</label>
                <input
                  type="text"
                  value={formData.nationality}
                  onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-slate-50 text-slate-800 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  State of Origin / Residence <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.state}
                  onChange={(e) => handleStateChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 text-sm font-medium focus:ring-2 focus:ring-purple-200 focus:border-purple-600"
                >
                  {NIGERIAN_STATES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Local Government Area (LGA) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.lga}
                  onChange={(e) => setFormData({ ...formData, lga: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 text-sm font-medium focus:ring-2 focus:ring-purple-200 focus:border-purple-600"
                >
                  {availableLgas.map((lg) => (
                    <option key={lg} value={lg}>
                      {lg}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 5: HIGHEST EDUCATIONAL QUALIFICATION */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-purple-700 text-white font-black text-xs flex items-center justify-center">5</span>
              <label htmlFor="field-education" className="text-sm font-black text-slate-900 tracking-wide uppercase">
                Highest Educational Qualification <span className="text-rose-500">*</span>
              </label>
            </div>

            <div className="max-w-md">
              <select
                id="field-education"
                value={formData.highestQualification}
                onChange={(e) => setFormData({ ...formData, highestQualification: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 text-sm font-medium focus:ring-2 focus:ring-purple-200 focus:border-purple-600"
              >
                {EDUCATION_OPTIONS.map((edu) => (
                  <option key={edu} value={edu}>
                    {edu}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Section 6: CLERGY / RELIGIOUS LEADER */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-purple-700 text-white font-black text-xs flex items-center justify-center">6</span>
              <label htmlFor="field-clergy" className="text-sm font-black text-slate-900 tracking-wide uppercase">
                Name of your Priest / Pastor / Imam / Clergy Person, if applicable
              </label>
            </div>
            <p className="text-xs text-slate-500">Optional: Used solely for community reference and verification.</p>

            <div className="max-w-lg">
              <input
                id="field-clergy"
                type="text"
                placeholder="e.g. Rev. Fr. Emmanuel Terver / Pastor John Okafor / Imam Abdul"
                value={formData.clergyName}
                onChange={(e) => setFormData({ ...formData, clergyName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-purple-200 focus:border-purple-600"
              />
            </div>
          </div>

          {/* Section 7: NUMBER OF CHILDREN LEFT BEHIND BY LATE SPOUSE */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-purple-700 text-white font-black text-xs flex items-center justify-center">7</span>
              <label htmlFor="field-children-count" className="text-sm font-black text-slate-900 tracking-wide uppercase">
                Number of Children Left Behind by Late Spouse <span className="text-rose-500">*</span>
              </label>
            </div>

            <div className="max-w-xs">
              <input
                id="field-children-count"
                type="number"
                min="0"
                max="30"
                value={formData.childrenCount}
                onChange={(e) => setFormData({ ...formData, childrenCount: Math.max(0, parseInt(e.target.value, 10) || 0) })}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm font-bold focus:ring-2 focus:ring-purple-200 focus:border-purple-600"
              />
            </div>
            {validationErrors.childrenCount && (
              <p className="text-[11px] text-rose-600 font-medium">{validationErrors.childrenCount}</p>
            )}
          </div>

          {/* Section 8: CHILDREN'S SCHOOLING STATUS */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-purple-700 text-white font-black text-xs flex items-center justify-center">8</span>
              <label className="text-sm font-black text-slate-900 tracking-wide uppercase">
                Children&apos;s Schooling Status
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  (a) Number of Children in School
                </label>
                <input
                  type="number"
                  min="0"
                  max={formData.childrenCount}
                  value={formData.childrenInSchool}
                  onChange={(e) => setFormData({ ...formData, childrenInSchool: Math.max(0, parseInt(e.target.value, 10) || 0) })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm font-bold focus:ring-2 focus:ring-purple-200"
                />
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  (b) Number of Children Out of School
                </label>
                <input
                  type="number"
                  min="0"
                  max={formData.childrenCount}
                  value={formData.childrenOutOfSchool}
                  onChange={(e) => setFormData({ ...formData, childrenOutOfSchool: Math.max(0, parseInt(e.target.value, 10) || 0) })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm font-bold focus:ring-2 focus:ring-purple-200"
                />
              </div>
            </div>

            {validationErrors.childrenSchooling && (
              <div className="p-2.5 bg-rose-50 border border-rose-300 rounded-lg text-xs font-semibold text-rose-700 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{validationErrors.childrenSchooling}</span>
              </div>
            )}
          </div>

          {/* Section 9: SKILLS */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-purple-700 text-white font-black text-xs flex items-center justify-center">9</span>
              <label className="text-sm font-black text-slate-900 tracking-wide uppercase">
                Skills &amp; Vocations <span className="text-rose-500">*</span>
              </label>
            </div>

            {/* (a) Professional Skills */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase">
                (a) Professional Skills (Select all applicable or add your own)
              </label>
              
              <div className="flex flex-wrap gap-2">
                {PREDEFINED_SKILLS.map((sk) => {
                  const isSelected = formData.professionalSkills.includes(sk);
                  return (
                    <button
                      type="button"
                      key={sk}
                      onClick={() => toggleSkill(sk)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition flex items-center gap-1 ${
                        isSelected
                          ? 'bg-purple-700 text-white border-purple-700 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                      <span>{sk}</span>
                    </button>
                  );
                })}
              </div>

              {/* Add custom skill */}
              <div className="flex gap-2 max-w-sm pt-2">
                <input
                  type="text"
                  placeholder="Add other skill (e.g. Baking, Beading)"
                  value={customSkillInput}
                  onChange={(e) => setCustomSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomSkill();
                    }
                  }}
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-purple-200"
                />
                <button
                  type="button"
                  onClick={handleAddCustomSkill}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-lg transition flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </button>
              </div>

              {validationErrors.professionalSkills && (
                <p className="text-[11px] text-rose-600 font-medium">{validationErrors.professionalSkills}</p>
              )}
            </div>

            {/* (b) Acquired Skills */}
            <div className="space-y-1 pt-2">
              <label className="block text-xs font-bold text-slate-700 uppercase">
                (b) Acquired Skills, if any
              </label>
              <textarea
                rows={2}
                placeholder="Describe any other vocational training, craft, or apprenticeships acquired..."
                value={formData.acquiredSkills}
                onChange={(e) => setFormData({ ...formData, acquiredSkills: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-600"
              />
            </div>
          </div>

          {/* Section 6 & 7: APPLICANT DECLARATION & SIGNATURE */}
          <div className="pt-6 border-t border-slate-200 space-y-6">
            
            {/* Declaration Box */}
            <div className="bg-amber-50/70 border border-amber-300 rounded-xl p-5">
              <h4 className="text-xs font-black uppercase text-amber-950 tracking-wider mb-2">
                Applicant Declaration
              </h4>
              <p className="text-xs text-amber-900 font-serif italic leading-relaxed">
                &ldquo;I declare that the information provided in this application is true and correct to the best of my knowledge.&rdquo;
              </p>

              <label className="mt-3 flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.declarationAccepted}
                  onChange={(e) => setFormData({ ...formData, declarationAccepted: e.target.checked })}
                  className="mt-0.5 w-4 h-4 rounded text-purple-700 focus:ring-purple-600 border-slate-300"
                />
                <span className="text-xs font-bold text-slate-800">
                  I agree to the declaration above and affirm the truth of this registration. <span className="text-rose-500">*</span>
                </span>
              </label>

              {validationErrors.declaration && (
                <p className="text-[11px] text-rose-600 font-semibold mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {validationErrors.declaration}
                </p>
              )}
            </div>

            {/* Signature & Thumbprint & Date */}
            <div className="space-y-2">
              <SignaturePad
                signatureData={formData.signatureData}
                onSignatureChange={(sig) => {
                  setFormData((prev) => ({ ...prev, signatureData: sig }));
                  setValidationErrors((prev) => ({ ...prev, signature: '' }));
                }}
                dateString={formData.signatureDate}
                onDateChange={(date) => setFormData((prev) => ({ ...prev, signatureDate: date }))}
              />
              {validationErrors.signature && (
                <p className="text-[11px] text-rose-600 font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {validationErrors.signature}
                </p>
              )}
            </div>

          </div>

          {/* Action Buttons */}
          <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              type="button"
              onClick={handleSaveDraftClick}
              disabled={isSavingDraft}
              className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-sm flex items-center justify-center gap-2 transition shadow-sm"
            >
              <Save className="w-4 h-4 text-purple-700" />
              <span>{isSavingDraft ? 'Saving Draft...' : 'Save Draft & Continue Later'}</span>
            </button>

            <button
              type="submit"
              className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-purple-800 via-indigo-900 to-purple-900 hover:from-purple-900 hover:to-indigo-950 text-white rounded-xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition transform hover:-translate-y-0.5"
            >
              <Send className="w-4 h-4 text-amber-300" />
              <span>Review &amp; Submit Application</span>
            </button>
          </div>

        </div>
      </form>
    </div>
  );
};
