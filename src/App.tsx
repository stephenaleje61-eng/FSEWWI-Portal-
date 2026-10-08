import React, { useState, useEffect } from 'react';
import { HeaderMarquee } from './components/HeaderMarquee.tsx';
import { OrganizationHeader } from './components/OrganizationHeader.tsx';
import { AuthPage } from './components/AuthPage.tsx';
import { UserDashboard } from './components/UserDashboard.tsx';
import { ApplicationForm } from './components/ApplicationForm.tsx';
import { ReviewModal } from './components/ReviewModal.tsx';
import { PrintSlipModal } from './components/PrintSlipModal.tsx';
import { AdminPanel } from './components/AdminPanel.tsx';
import { OfflineIndicator } from './components/OfflineIndicator.tsx';
import {
  UserSession,
  ApplicationRecord,
  ApplicantProfileRecord,
  PhotoRecord,
  ApplicationFormData
} from './types.ts';
import { safeStorage } from './utils/safeStorage.ts';
import { CheckCircle2, ShieldCheck, HeartHandshake } from 'lucide-react';

export default function App() {
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [currentView, setCurrentView] = useState<'dashboard' | 'form' | 'admin'>('dashboard');
  
  // Applicant records
  const [application, setApplication] = useState<ApplicationRecord | null>(null);
  const [applicant, setApplicant] = useState<ApplicantProfileRecord | null>(null);
  const [photo, setPhoto] = useState<PhotoRecord | null>(null);

  // Form & Review states
  const [formReviewData, setFormReviewData] = useState<ApplicationFormData | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  // Print slip state
  const [isPrintSlipOpen, setIsPrintSlipOpen] = useState(false);
  const [submissionSuccessModal, setSubmissionSuccessModal] = useState<{
    referenceNumber: string;
    submittedAt: string;
  } | null>(null);

  // Check saved session on load
  useEffect(() => {
    try {
      const saved = safeStorage.getItem('fsewwi_user_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && parsed.uid) {
          setUserSession(parsed);
          if (parsed.isAdmin) {
            setCurrentView('admin');
          }
        } else {
          safeStorage.removeItem('fsewwi_user_session');
        }
      }
    } catch {
      safeStorage.removeItem('fsewwi_user_session');
    }
  }, []);

  // Fetch applicant application on user change
  const fetchMyApplication = async (uid: string) => {
    try {
      const res = await fetch('/api/application/my', {
        headers: {
          Authorization: `Bearer ${uid}`,
        },
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data && data.success) {
        setApplication(data.application || null);
        setApplicant(data.applicant || null);
        setPhoto(data.photo || null);
      }
    } catch (err) {
      console.warn('Network issue fetching user application:', err);
    }
  };

  useEffect(() => {
    if (userSession && !userSession.isAdmin) {
      fetchMyApplication(userSession.uid);
    }
  }, [userSession]);

  const handleLoginSuccess = (user: {
    uid: string;
    email: string;
    name?: string;
    role?: string;
    isAdmin?: boolean;
  }) => {
    const session: UserSession = {
      uid: user.uid,
      email: user.email,
      name: user.name,
      role: (user.role as any) || 'applicant',
      isAdmin: user.isAdmin || false,
    };
    setUserSession(session);
    safeStorage.setItem('fsewwi_user_session', JSON.stringify(session));

    if (session.isAdmin) {
      setCurrentView('admin');
    } else {
      setCurrentView('dashboard');
      fetchMyApplication(user.uid);
    }
  };

  const handleLogout = () => {
    setUserSession(null);
    setApplication(null);
    setApplicant(null);
    setPhoto(null);
    safeStorage.removeItem('fsewwi_user_session');
    setCurrentView('dashboard');
  };

  // Save Draft
  const handleSaveDraft = async (formData: ApplicationFormData) => {
    if (!userSession) return;
    setIsSavingDraft(true);
    try {
      const res = await fetch('/api/application/save-draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userSession.uid}`,
        },
        body: JSON.stringify({
          ...formData,
          photoUrl: formData.photoUrl,
        }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchMyApplication(userSession.uid);
      }
    } catch (err) {
      console.error('Failed to save draft:', err);
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Review & Submit
  const handleOpenReview = (formData: ApplicationFormData) => {
    setFormReviewData(formData);
    setIsReviewOpen(true);
  };

  const handleConfirmSubmit = async () => {
    if (!userSession || !formReviewData) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/application/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userSession.uid}`,
        },
        body: JSON.stringify(formReviewData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Submission failed');
      }

      setIsReviewOpen(false);
      await fetchMyApplication(userSession.uid);
      setCurrentView('dashboard');

      setSubmissionSuccessModal({
        referenceNumber: data.referenceNumber,
        submittedAt: data.submittedAt || new Date().toISOString(),
      });
    } catch (err: any) {
      alert(err.message || 'Submission error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      
      {/* 1. TOP HORIZONTALLY SCROLLING MARQUEE */}
      <HeaderMarquee />

      {/* 2. MAIN HEADER WITH EMBLEM & CONTACT DETAILS */}
      <OrganizationHeader
        userEmail={userSession?.email}
        role={userSession?.role}
        onLogout={handleLogout}
        onOpenAdmin={() => setCurrentView('admin')}
        onOpenDashboard={() => setCurrentView('dashboard')}
      />

      {/* 3. MAIN BODY */}
      <main className="flex-1">
        {!userSession ? (
          /* Login & Registration Screen */
          <AuthPage onLoginSuccess={handleLoginSuccess} />
        ) : currentView === 'admin' ? (
          /* Admin / Screening Panel */
          <AdminPanel
            userEmail={userSession.email}
            userRole={userSession.role}
            onLogout={handleLogout}
            onBackToPortal={() => setCurrentView('dashboard')}
          />
        ) : currentView === 'form' ? (
          /* Digital Application Form (fields 1 to 9) */
          <div>
            <div className="max-w-4xl mx-auto px-4 pt-4 flex items-center justify-between">
              <button
                onClick={() => setCurrentView('dashboard')}
                className="text-xs font-bold text-purple-800 hover:text-purple-950 flex items-center gap-1 py-1 px-2.5 rounded-lg hover:bg-purple-50 transition"
              >
                &larr; Back to Dashboard
              </button>
            </div>
            <ApplicationForm
              userEmail={userSession.email}
              initialData={
                applicant
                  ? {
                      title: applicant.title,
                      surname: applicant.surname,
                      otherNames: applicant.otherNames,
                      phoneNumber: applicant.phoneNumber,
                      nationality: applicant.nationality,
                      state: applicant.state,
                      lga: applicant.lga,
                      highestQualification: applicant.highestQualification,
                      clergyName: applicant.clergyName || '',
                      childrenCount: applicant.childrenCount,
                      childrenInSchool: applicant.childrenInSchool,
                      childrenOutOfSchool: applicant.childrenOutOfSchool,
                      professionalSkills: typeof applicant.professionalSkills === 'string'
                        ? applicant.professionalSkills.split(',').map((s) => s.trim()).filter(Boolean)
                        : Array.isArray(applicant.professionalSkills)
                        ? (applicant.professionalSkills as string[])
                        : [],
                      acquiredSkills: applicant.acquiredSkills || '',
                      declarationAccepted: application?.declarationAccepted || false,
                      signatureData: application?.signatureData || '',
                      signatureDate: application?.signatureDate || new Date().toISOString().split('T')[0],
                      photoUrl: photo?.photoStorageUrl || '',
                      photoVerified: photo?.isVerified || false,
                    }
                  : undefined
              }
              onSaveDraft={handleSaveDraft}
              onReview={handleOpenReview}
              isSavingDraft={isSavingDraft}
            />
          </div>
        ) : (
          /* User Dashboard */
          <UserDashboard
            userSession={userSession}
            application={application}
            applicant={applicant}
            photo={photo}
            onNewOrEditApplication={() => setCurrentView('form')}
            onViewPrintSlip={() => setIsPrintSlipOpen(true)}
            onLogout={handleLogout}
          />
        )}
      </main>

      {/* 4. FOOTER ENQUIRIES STRIP MATCHING ORIGINAL PAPER FORM */}
      <footer className="bg-slate-900 text-slate-300 py-6 px-4 border-t border-slate-800 no-print">
        <div className="max-w-6xl mx-auto text-center space-y-2">
          <p className="text-xs sm:text-sm font-semibold tracking-wide text-amber-300">
            For Enquiries Please Call: 07081470032, 07033593882, 07030682031, 08069532690 &amp; 07032126924
          </p>
          <p className="text-[11px] text-slate-400">
            Headquarters: Beside Tetris Filling Station, 2nd Gate Federal Low-Cost Housing Estate, North Bank, Makurdi, Benue State, Nigeria.
          </p>
          <p className="text-[10px] text-slate-400 pt-2 border-t border-slate-800">
            &copy; {new Date().getFullYear()} Foundation for the Support &amp; Empowerment of Widows &amp; Widowers Initiative (FSEWWI). All Rights Reserved.
          </p>
        </div>
      </footer>

      {/* Review Modal */}
      {formReviewData && (
        <ReviewModal
          formData={formReviewData}
          isOpen={isReviewOpen}
          onClose={() => setIsReviewOpen(false)}
          onEdit={() => setIsReviewOpen(false)}
          onSubmit={handleConfirmSubmit}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Submission Success Dialog */}
      {submissionSuccessModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 text-center border border-slate-200">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <h3 className="text-xl font-black text-slate-900 uppercase font-serif">
              Application Submitted!
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              Your application has been securely recorded and transmitted to the FSEWWI screening committee.
            </p>

            <div className="my-5 p-4 bg-purple-50 rounded-2xl border border-purple-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-900 block">
                Official Reference Number
              </span>
              <span className="text-xl font-black font-mono text-purple-950 tracking-wider">
                {submissionSuccessModal.referenceNumber}
              </span>
              <span className="text-[11px] text-slate-500 block mt-1">
                Keep this reference number for all future inquiries.
              </span>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setSubmissionSuccessModal(null);
                  setIsPrintSlipOpen(true);
                }}
                className="flex-1 py-3 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow transition"
              >
                Print Application Slip
              </button>
              <button
                type="button"
                onClick={() => setSubmissionSuccessModal(null)}
                className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Slip Modal */}
      {isPrintSlipOpen && application && (
        <PrintSlipModal
          isOpen={isPrintSlipOpen}
          onClose={() => setIsPrintSlipOpen(false)}
          referenceNumber={application.referenceNumber}
          applicantData={applicant}
          photoUrl={photo?.photoStorageUrl || ''}
          signatureData={application.signatureData}
          signatureDate={application.signatureDate}
          status={application.status}
          submittedAt={application.submittedAt}
        />
      )}

      {/* Offline Connectivity Notification */}
      <OfflineIndicator />

    </div>
  );
}
