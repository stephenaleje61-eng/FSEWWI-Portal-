import React from 'react';
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Edit,
  Eye,
  Printer,
  Calendar,
  Phone,
  MapPin,
  Camera,
  LogOut,
  Send,
  HelpCircle,
  ShieldCheck,
  ChevronRight,
  Database,
  User,
  Heart
} from 'lucide-react';
import { ApplicationRecord, ApplicantProfileRecord, PhotoRecord, UserSession } from '../types.ts';
import { FsewwiLogo } from './FsewwiLogo.tsx';
import { PWAInstallButton } from './PWAInstallButton.tsx';

interface UserDashboardProps {
  userSession: UserSession;
  application: ApplicationRecord | null;
  applicant: ApplicantProfileRecord | null;
  photo: PhotoRecord | null;
  onNewOrEditApplication: () => void;
  onViewPrintSlip: () => void;
  onLogout: () => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({
  userSession,
  application,
  applicant,
  photo,
  onNewOrEditApplication,
  onViewPrintSlip,
  onLogout,
}) => {
  const status = application?.status || 'Draft';
  const verifStatus = userSession.verificationStatus || 'Pending';
  const accStatus = userSession.accountStatus || 'Active';

  // Status configuration
  const getStatusBadge = () => {
    switch (status) {
      case 'Approved':
        return {
          bg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
          title: 'Application Approved',
          description: 'Congratulations! Your welfare and empowerment assistance has been approved by the board.',
        };
      case 'Not Approved':
        return {
          bg: 'bg-rose-100 text-rose-900 border-rose-300',
          icon: <XCircle className="w-5 h-5 text-rose-600" />,
          title: 'Application Not Approved',
          description: 'Your application was not approved during this cycle. Please review officer notes or contact support.',
        };
      case 'Needs Correction':
        return {
          bg: 'bg-amber-100 text-amber-900 border-amber-300',
          icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
          title: 'Needs Correction',
          description: 'Additional verification or clearer details are requested by the screening officer.',
        };
      case 'Under Review':
        return {
          bg: 'bg-blue-100 text-blue-900 border-blue-300',
          icon: <Clock className="w-5 h-5 text-blue-600 animate-spin" />,
          title: 'Under Committee Review',
          description: 'Your application is actively undergoing scrutiny by the welfare committee.',
        };
      case 'Submitted':
        return {
          bg: 'bg-indigo-100 text-indigo-900 border-indigo-300',
          icon: <CheckCircle2 className="w-5 h-5 text-indigo-600" />,
          title: 'Application Submitted',
          description: 'Your application has been received and queued for committee review.',
        };
      case 'Draft':
      default:
        return {
          bg: 'bg-slate-100 text-slate-800 border-slate-300',
          icon: <FileText className="w-5 h-5 text-slate-600" />,
          title: 'Draft in Progress',
          description: 'Your application has not been submitted yet. Click edit to complete all sections.',
        };
    }
  };

  const statusConfig = getStatusBadge();
  const canEdit = status === 'Draft' || status === 'Needs Correction';

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      
      {/* Welcome Banner with Official Logo */}
      <div className="bg-gradient-to-r from-[#0b2d72] via-[#0f388a] to-[#082257] text-white rounded-2xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        
        <div className="relative z-10 space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Permanent Database Record: {userSession.uid}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black font-serif tracking-tight">
            Welcome, {userSession.fullName || userSession.name || applicant?.surname || userSession.email}
          </h2>
          <p className="text-xs sm:text-sm text-purple-200">
            Official Applicant Portal &bull; Foundation for the Support &amp; Empowerment of Widows &amp; Widowers Initiative (FSEWWI).
          </p>
        </div>

        {/* Official Emblem & Actions */}
        <div className="relative z-10 flex flex-col items-center sm:items-end gap-3 w-full md:w-auto">
          <div className="w-20 h-20 bg-white rounded-full p-1 border-2 border-amber-300 shadow flex items-center justify-center">
            <FsewwiLogo size="sm" />
          </div>

          <div className="flex gap-2">
            {canEdit ? (
              <button
                onClick={onNewOrEditApplication}
                className="bg-amber-400 hover:bg-amber-300 text-purple-950 font-black text-xs uppercase px-5 py-2.5 rounded-xl shadow-lg transition flex items-center justify-center gap-2"
              >
                <Edit className="w-4 h-4" />
                <span>{status === 'Draft' ? 'Continue Application' : 'Correct Application'}</span>
              </button>
            ) : (
              <button
                onClick={onViewPrintSlip}
                className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-5 py-2.5 rounded-xl border border-white/20 transition flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4 text-amber-300" />
                <span>View &amp; Print Slip</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* PWA Install Banner */}
      <PWAInstallButton variant="banner" />

      {/* Main Status & Verification Card */}
      <div className={`p-6 rounded-2xl border-2 ${statusConfig.bg} shadow-sm transition-all`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2 bg-white rounded-xl shadow-sm shrink-0">
              {statusConfig.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-slate-600">Application Status:</span>
                <span className="font-extrabold text-sm sm:text-base uppercase">{status}</span>
              </div>
              <h3 className="text-lg font-bold mt-0.5">{statusConfig.title}</h3>
              <p className="text-xs sm:text-sm mt-1 opacity-90">{statusConfig.description}</p>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm border border-slate-300/80 px-4 py-3 rounded-xl text-center sm:text-right shrink-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Registration Standing</span>
            <div className="flex items-center gap-2 justify-center sm:justify-end mt-0.5">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase ${
                verifStatus === 'Verified' ? 'bg-emerald-100 text-emerald-800' :
                verifStatus === 'Rejected' ? 'bg-rose-100 text-rose-800' :
                'bg-amber-100 text-amber-800'
              }`}>
                {verifStatus}
              </span>
              <span className="bg-blue-100 text-[#0f388a] px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">
                {accStatus}
              </span>
            </div>
          </div>
        </div>

        {application?.referenceNumber && (
          <div className="mt-4 pt-4 border-t border-current/20 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div>
              <span className="text-slate-500 font-bold uppercase tracking-wider mr-2">Application Reference:</span>
              <span className="font-mono font-black text-[#0f388a]">{application.referenceNumber}</span>
            </div>
            {application.submittedAt && (
              <span className="text-slate-600">
                Submitted on: {new Date(application.submittedAt).toLocaleDateString()}
              </span>
            )}
          </div>
        )}

        {application?.reviewNotes && (
          <div className="mt-3 bg-white/50 p-3 rounded-xl text-xs">
            <strong className="block mb-0.5 uppercase tracking-wider text-[11px]">Officer Review Remarks:</strong>
            <p className="italic">{application.reviewNotes}</p>
          </div>
        )}
      </div>

      {/* Profile & Application Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Passport Photo */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
            <Camera className="w-4 h-4 text-[#0f388a]" />
            <span>Passport Photograph</span>
          </div>

          <div className="w-32 h-36 rounded-xl border-2 border-slate-200 overflow-hidden shadow-inner bg-slate-50 flex items-center justify-center mb-3">
            {photo?.photoStorageUrl || userSession.profilePhoto ? (
              <img src={photo?.photoStorageUrl || userSession.profilePhoto} alt="Applicant Passport" className="w-full h-full object-cover" />
            ) : (
              <div className="p-3 text-slate-400 text-xs">No photograph uploaded yet</div>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-xs font-bold">
            {photo?.isVerified ? (
              <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Photo Attached
              </span>
            ) : (
              <span className="text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                Pending Verification
              </span>
            )}
          </div>
        </div>

        {/* Permanent Database Records Info */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm md:col-span-2 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Database className="w-4 h-4 text-[#0f388a]" />
              <span>Permanent Registration Profile (Cloud SQL PostgreSQL)</span>
            </h4>
            <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Active Database Record
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-[11px] text-slate-500 font-medium block">Full Name</span>
              <span className="font-bold text-slate-900 text-sm">
                {userSession.fullName || `${applicant?.title || ''} ${applicant?.surname || ''} ${applicant?.otherNames || ''}`}
              </span>
            </div>

            <div>
              <span className="text-[11px] text-slate-500 font-medium block">Email Address</span>
              <span className="font-bold text-slate-900 text-sm">{userSession.email}</span>
            </div>

            <div>
              <span className="text-[11px] text-slate-500 font-medium block">Phone Number</span>
              <span className="font-bold text-slate-900 text-sm">{userSession.phoneNumber || applicant?.phoneNumber || '—'}</span>
            </div>

            <div>
              <span className="text-[11px] text-slate-500 font-medium block">Location</span>
              <span className="font-bold text-slate-900 text-sm">
                {userSession.lga || applicant?.lga || 'Makurdi'} LGA, {userSession.state || applicant?.state || 'Benue'} State
              </span>
            </div>

            <div>
              <span className="text-[11px] text-slate-500 font-medium block">Widow / Widower Status</span>
              <span className="font-bold text-slate-900 text-sm">
                {userSession.widowStatus || 'Widow'} ({userSession.gender || 'Female'})
              </span>
            </div>

            <div>
              <span className="text-[11px] text-slate-500 font-medium block">Dependents Left Behind</span>
              <span className="font-bold text-slate-900 text-sm">
                {applicant?.childrenCount ?? 0} children ({applicant?.childrenInSchool ?? 0} in school, {applicant?.childrenOutOfSchool ?? 0} out)
              </span>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-2">
            {canEdit && (
              <button
                onClick={onNewOrEditApplication}
                className="bg-[#0f388a] hover:bg-blue-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition flex items-center gap-1.5"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>{status === 'Draft' ? 'Continue Application' : 'Edit Application'}</span>
              </button>
            )}

            {application?.referenceNumber && (
              <button
                onClick={onViewPrintSlip}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-4 py-2 rounded-xl transition flex items-center gap-1.5 border border-slate-300"
              >
                <Printer className="w-3.5 h-3.5 text-[#0f388a]" />
                <span>Print Official Slip</span>
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Support & Head Office Info */}
      <div className="bg-slate-100/80 rounded-2xl p-5 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-[#0f388a] shrink-0" />
          <span>Need assistance? Contact FSEWWI Makurdi HQ Desk: <strong>+234 806 252 5046</strong></span>
        </div>

        <button
          onClick={onLogout}
          className="text-rose-700 hover:text-rose-900 font-bold flex items-center gap-1 text-xs shrink-0"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

    </div>
  );
};
