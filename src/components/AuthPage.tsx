import React, { useState } from 'react';
import {
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  UserPlus,
  KeyRound,
  User,
  Phone,
  Calendar,
  MapPin,
  IdCard,
  Heart
} from 'lucide-react';
import { FsewwiLogo } from './FsewwiLogo.tsx';
import { PWAInstallButton } from './PWAInstallButton.tsx';
import { NIGERIA_STATES_LGAS, NIGERIAN_STATES } from '../data/nigeriaLocations.ts';

interface AuthPageProps {
  onLoginSuccess: (user: {
    uid: string;
    email: string;
    name?: string;
    fullName?: string;
    role?: string;
    isAdmin?: boolean;
    verificationStatus?: string;
    accountStatus?: string;
  }) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'admin'>('login');
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Permanent Registration form state (Full permanent record)
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regGender, setRegGender] = useState('Female');
  const [regDateOfBirth, setRegDateOfBirth] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regState, setRegState] = useState('Benue');
  const [regLga, setRegLga] = useState('Makurdi');
  const [regWidowStatus, setRegWidowStatus] = useState<'Widow' | 'Widower'>('Widow');
  const [regIdType, setRegIdType] = useState('National ID (NIN)');
  const [regIdNumber, setRegIdNumber] = useState('');

  // Admin form state
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminRole, setAdminRole] = useState('reviewer');

  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Forgot password modal
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitted, setForgotSubmitted] = useState(false);

  // Available LGAs for selected registration state
  const availableLgas = NIGERIA_STATES_LGAS[regState] || [];

  const handleStateChange = (stateName: string) => {
    setRegState(stateName);
    const lgasForState = NIGERIA_STATES_LGAS[stateName] || [];
    setRegLga(lgasForState[0] || '');
  };

  // 1. Permanent Registration to Database
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      if (!regFullName.trim()) throw new Error('Please enter your full name.');
      if (!regEmail.trim()) throw new Error('Please enter your email address.');
      if (!regPhone.trim()) throw new Error('Please enter your phone number.');
      if (!regPassword || regPassword.length < 6) throw new Error('Password must be at least 6 characters.');
      if (regPassword !== regConfirmPassword) throw new Error('Passwords do not match.');

      const res = await fetch('/api/auth/register-permanent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: regFullName.trim(),
          email: regEmail.trim(),
          password: regPassword,
          phoneNumber: regPhone.trim(),
          gender: regGender,
          dateOfBirth: regDateOfBirth,
          address: regAddress.trim(),
          state: regState,
          lga: regLga,
          widowStatus: regWidowStatus,
          identificationType: regIdType,
          identificationNumber: regIdNumber.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed.');
      }

      setSuccessMsg('Account permanently registered in PostgreSQL database! Redirecting...');
      setTimeout(() => {
        onLoginSuccess({
          uid: data.user.uid,
          email: data.user.email,
          name: data.user.fullName,
          fullName: data.user.fullName,
          role: data.user.role,
          isAdmin: false,
          verificationStatus: data.user.verificationStatus,
          accountStatus: data.user.accountStatus,
        });
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration error');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Permanent Login against Database
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      if (!loginEmail.trim() || !loginPassword) {
        throw new Error('Please enter your registered email address and password.');
      }

      const res = await fetch('/api/auth/login-permanent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginEmail.trim(),
          password: loginPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed.');
      }

      onLoginSuccess({
        uid: data.user.uid,
        email: data.user.email,
        name: data.user.fullName,
        fullName: data.user.fullName,
        role: data.user.role,
        isAdmin: data.user.role !== 'applicant',
        verificationStatus: data.user.verificationStatus,
        accountStatus: data.user.accountStatus,
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Admin Staff Login
  const handleAdminLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      if (!adminEmail.trim() || !adminPassword) {
        throw new Error('Please enter staff email and password.');
      }

      const res = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: adminEmail.trim(),
          password: adminPassword,
          role: adminRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Admin login failed.');
      }

      onLoginSuccess({
        uid: data.user.uid,
        email: data.user.email,
        name: data.user.name,
        role: data.user.role,
        isAdmin: true,
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Staff authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotSubmitted(true);
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center py-10 px-4 sm:px-6">
      {/* PWA Direct Installation Banner for Mobile & Android Applicants */}
      <div className={`w-full ${mode === 'register' ? 'max-w-2xl' : 'max-w-md'} mb-4 no-print`}>
        <PWAInstallButton variant="banner" />
      </div>

      <div className={`w-full ${mode === 'register' ? 'max-w-2xl' : 'max-w-md'} bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden transition-all duration-300`}>
        
        {/* Card Header with Official Uploaded Emblem */}
        <div className="bg-gradient-to-br from-[#0b2d72] via-[#0f388a] to-[#082257] p-6 sm:p-8 text-white text-center relative">
          
          <div className="flex justify-center mb-2">
            <div className="w-24 h-24 sm:w-28 sm:h-28 bg-white rounded-full p-1.5 shadow-xl border-2 border-amber-300 flex items-center justify-center">
              <FsewwiLogo size="lg" />
            </div>
          </div>

          <h2 className="text-xl font-black font-serif uppercase tracking-tight text-white mt-1">
            {mode === 'admin' ? 'Staff & Administrator Portal' : 'FSEWWI Official Portal'}
          </h2>
          <p className="text-xs text-purple-200 max-w-sm mx-auto mt-0.5">
            Foundation for the Support &amp; Empowerment of Widows &amp; Widowers Initiative
          </p>

          {/* Mode Switcher */}
          <div className="mt-5 grid grid-cols-3 gap-1 bg-black/25 p-1 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => { setMode('login'); setErrorMsg(null); setSuccessMsg(null); }}
              className={`py-1.5 rounded-lg transition ${mode === 'login' ? 'bg-white text-[#0f388a] shadow' : 'text-purple-200 hover:text-white'}`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setErrorMsg(null); setSuccessMsg(null); }}
              className={`py-1.5 rounded-lg transition ${mode === 'register' ? 'bg-white text-[#0f388a] shadow' : 'text-purple-200 hover:text-white'}`}
            >
              Register (New)
            </button>
            <button
              type="button"
              onClick={() => { setMode('admin'); setErrorMsg(null); setSuccessMsg(null); }}
              className={`py-1.5 rounded-lg transition ${mode === 'admin' ? 'bg-amber-400 text-purple-950 shadow' : 'text-amber-300 hover:text-white'}`}
            >
              Staff Portal
            </button>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-6 sm:p-8 space-y-5">
          
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-800 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* 1. SIGN IN FORM */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4 text-[#0f388a]" />
                  </div>
                  <input
                    type="email"
                    required
                    placeholder="applicant@example.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-purple-200 focus:border-[#0f388a]"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => { setForgotEmail(loginEmail); setShowForgotPassword(true); }}
                    className="text-[11px] font-bold text-[#0f388a] hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4 text-[#0f388a]" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-purple-200 focus:border-[#0f388a]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-[#0b2d72] to-[#0f388a] hover:from-[#09255e] hover:to-[#0b2d72] text-white rounded-xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition"
              >
                <span>{isLoading ? 'Authenticating with Database...' : 'Sign In to Dashboard'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-2 text-center">
                <span className="text-xs text-slate-500">Don&apos;t have an account yet? </span>
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="text-xs font-bold text-[#0f388a] hover:underline"
                >
                  Register Here
                </button>
              </div>
            </form>
          )}

          {/* 2. PERMANENT REGISTRATION FORM (Full Database Profile) */}
          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="bg-blue-50/70 border border-blue-200 p-3 rounded-xl text-xs text-blue-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#0f388a] shrink-0" />
                <span>All registration information is saved permanently into the PostgreSQL database.</span>
              </div>

              {/* Full Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Grace Victoria Ogbole"
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-purple-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      placeholder="applicant@example.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-purple-200"
                    />
                  </div>
                </div>
              </div>

              {/* Phone & Date of Birth */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="tel"
                      required
                      placeholder="08062525046"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-purple-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Date of Birth
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="date"
                      value={regDateOfBirth}
                      onChange={(e) => setRegDateOfBirth(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-purple-200"
                    />
                  </div>
                </div>
              </div>

              {/* Gender & Widow/Widower Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Gender
                  </label>
                  <select
                    value={regGender}
                    onChange={(e) => {
                      setRegGender(e.target.value);
                      if (e.target.value === 'Male') setRegWidowStatus('Widower');
                      if (e.target.value === 'Female') setRegWidowStatus('Widow');
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium bg-white"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Widow / Widower Status <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRegWidowStatus('Widow')}
                      className={`py-1.5 px-3 rounded-lg border text-xs font-bold transition flex items-center justify-center gap-1 ${
                        regWidowStatus === 'Widow' ? 'bg-[#0f388a] text-white border-[#0f388a]' : 'bg-white text-slate-700 border-slate-300'
                      }`}
                    >
                      <Heart className="w-3.5 h-3.5" />
                      Widow
                    </button>
                    <button
                      type="button"
                      onClick={() => setRegWidowStatus('Widower')}
                      className={`py-1.5 px-3 rounded-lg border text-xs font-bold transition flex items-center justify-center gap-1 ${
                        regWidowStatus === 'Widower' ? 'bg-[#0f388a] text-white border-[#0f388a]' : 'bg-white text-slate-700 border-slate-300'
                      }`}
                    >
                      <Heart className="w-3.5 h-3.5" />
                      Widower
                    </button>
                  </div>
                </div>
              </div>

              {/* State & LGA */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    State of Residence / Origin <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={regState}
                    onChange={(e) => handleStateChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium bg-white"
                  >
                    {NIGERIAN_STATES.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Local Government Area (LGA) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={regLga}
                    onChange={(e) => setRegLga(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium bg-white"
                  >
                    {availableLgas.map((lg) => (
                      <option key={lg} value={lg}>{lg}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Address / Location */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Residential Street Address
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="e.g. Beside Federal Low-Cost Housing, Makurdi"
                    value={regAddress}
                    onChange={(e) => setRegAddress(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-purple-200"
                  />
                </div>
              </div>

              {/* Identification Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Identification Type
                  </label>
                  <select
                    value={regIdType}
                    onChange={(e) => setRegIdType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium bg-white"
                  >
                    <option value="National ID (NIN)">National ID (NIN)</option>
                    <option value="Voter's Card">Voter&apos;s Card</option>
                    <option value="Driver's License">Driver&apos;s License</option>
                    <option value="Community Identification">Community Identification</option>
                    <option value="International Passport">International Passport</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    ID Number (Optional)
                  </label>
                  <div className="relative">
                    <IdCard className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="e.g. NIN 12345678901"
                      value={regIdNumber}
                      onChange={(e) => setRegIdNumber(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-purple-200"
                    />
                  </div>
                </div>
              </div>

              {/* Password & Confirm */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Secure Password <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="At least 6 chars"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-purple-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Confirm Password <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Re-type password"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-purple-200"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-[#0b2d72] via-[#0f388a] to-[#082257] text-white rounded-xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition mt-2 hover:shadow-xl"
              >
                <UserPlus className="w-4 h-4 text-amber-300" />
                <span>{isLoading ? 'Creating Permanent Database Record...' : 'Complete Permanent Registration'}</span>
              </button>

              <div className="text-center pt-2">
                <span className="text-xs text-slate-500">Already registered? </span>
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-xs font-bold text-[#0f388a] hover:underline"
                >
                  Sign In to Your Account
                </button>
              </div>
            </form>
          )}

          {/* 3. STAFF / ADMIN LOGIN FORM */}
          {mode === 'admin' && (
            <form onSubmit={handleAdminLoginSubmit} className="space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Authorized Staff Access:</strong> Super Admin, Welfare Reviewers, and Registration Desk Officers.
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Staff Role
                </label>
                <select
                  value={adminRole}
                  onChange={(e) => setAdminRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-amber-300 bg-white"
                >
                  <option value="super_admin">Super Administrator (Full DB Rights)</option>
                  <option value="administrator">Administrator (Operations &amp; Backups)</option>
                  <option value="reviewer">Reviewer (Welfare Committee)</option>
                  <option value="data_entry_officer">Data Entry / Registration Desk</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Official Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="admin@fsewwi.org"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-amber-200"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Security Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-amber-200"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-purple-950 rounded-xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition"
              >
                <span>{isLoading ? 'Verifying Admin Credentials...' : 'Authenticate Staff Access'}</span>
                <KeyRound className="w-4 h-4" />
              </button>

              <div className="pt-2 flex flex-wrap justify-center gap-2 text-[10px]">
                <button
                  type="button"
                  onClick={() => {
                    setAdminEmail('admin@fsewwi.org');
                    setAdminPassword('adminHQ2026');
                    setAdminRole('super_admin');
                  }}
                  className="text-[#0f388a] hover:underline font-semibold"
                >
                  Super Admin
                </button>
                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  onClick={() => {
                    setAdminEmail('reviewer@fsewwi.org');
                    setAdminPassword('reviewer2026');
                    setAdminRole('reviewer');
                  }}
                  className="text-[#0f388a] hover:underline font-semibold"
                >
                  Reviewer
                </button>
                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  onClick={() => {
                    setAdminEmail('data@fsewwi.org');
                    setAdminPassword('desk2026');
                    setAdminRole('data_entry_officer');
                  }}
                  className="text-[#0f388a] hover:underline font-semibold"
                >
                  Desk Officer
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Footer info */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-center text-xs text-slate-500">
          Makurdi Headquarters: Beside Tetris Filling Station, North Bank, Benue State
        </div>

      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center border border-slate-200">
            <KeyRound className="w-10 h-10 text-[#0f388a] mx-auto mb-2" />
            <h3 className="font-bold text-base text-slate-900 mb-1">Account Recovery</h3>
            <p className="text-xs text-slate-600 mb-4">
              Enter your registered email address to receive password reset instructions.
            </p>

            {forgotSubmitted ? (
              <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-semibold mb-4 border border-emerald-200">
                Password reset instructions have been dispatched to <strong>{forgotEmail}</strong>.
              </div>
            ) : (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-3">
                <input
                  type="email"
                  required
                  placeholder="applicant@example.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-purple-200"
                />
                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#0f388a] text-white rounded-xl text-xs font-bold uppercase shadow"
                >
                  Send Recovery Link
                </button>
              </form>
            )}

            <button
              type="button"
              onClick={() => { setShowForgotPassword(false); setForgotSubmitted(false); }}
              className="mt-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              Back to Login
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
