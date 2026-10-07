import React, { useState, useEffect, useRef } from 'react';
import {
  Printer,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  User as UserIcon,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  KeyRound,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import { User } from '../types/printease';
import {
  clientRequestLoginOtp,
  clientRequestSignupOtp,
  clientRequestForgotPasswordOtp,
  clientResendOtp,
  clientVerifyOtp,
  saveClientCurrentUser,
} from '../data/mockData';

const STORAGE_LAST_LOGGED_IN_KEY = 'printease_last_logged_in_user';

interface SavedAccountInfo {
  name: string;
  identifier: string;
  role: string;
  savedPassword?: string;
}

export type AuthMode =
  | 'user-login'
  | 'signup'
  | 'forgot-password'
  | 'reset-password'
  | 'owner-login'
  | 'otp';

interface Props {
  initialMode?: AuthMode;
  onAuthSuccess: (user: User, token: string, targetPortal: 'customer' | 'shopkeeper') => void;
  onCancel?: () => void;
}

export const AuthScreen: React.FC<Props> = ({
  initialMode = 'user-login',
  onAuthSuccess,
  onCancel,
}) => {
  const [mode, setMode] = useState<AuthMode>(initialMode === 'owner-login' ? 'user-login' : initialMode);
  const [previousMode, setPreviousMode] = useState<AuthMode>('user-login');

  // Input fields
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // OTP State
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [otpDestination, setOtpDestination] = useState('');
  const [currentOtpCode, setCurrentOtpCode] = useState('');
  const [otpPurpose, setOtpPurpose] = useState<'login' | 'signup' | 'forgot_password' | 'owner_login'>('login');
  const [resendCooldown, setResendCooldown] = useState(30);

  // Status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Remembered last logged in user
  const [lastLoggedInUser, setLastLoggedInUser] = useState<SavedAccountInfo | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_LAST_LOGGED_IN_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.identifier) return parsed;
      }
    } catch {}
    return null;
  });

  // OTP Input refs
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer for OTP resend cooldown
  useEffect(() => {
    let timer: any;
    if (mode === 'otp' && resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [mode, resendCooldown]);

  // Focus and prefill OTP on transition
  useEffect(() => {
    if (mode === 'otp') {
      if (currentOtpCode && currentOtpCode.length === 6) {
        setOtpDigits(currentOtpCode.split(''));
      }
      setTimeout(() => {
        inputRefs.current[5]?.focus();
      }, 150);
    }
  }, [mode, currentOtpCode]);

  // Handle OTP digit changes
  const handleOtpChange = (index: number, val: string) => {
    // Only accept numeric
    const cleanVal = val.replace(/\D/g, '');
    if (!cleanVal && val !== '') return;

    const nextDigits = [...otpDigits];

    // Handle paste of whole code
    if (cleanVal.length > 1) {
      const pasted = cleanVal.slice(0, 6).split('');
      pasted.forEach((d, i) => {
        if (i < 6) nextDigits[i] = d;
      });
      setOtpDigits(nextDigits);
      const nextFocus = Math.min(pasted.length, 5);
      inputRefs.current[nextFocus]?.focus();
      return;
    }

    nextDigits[index] = cleanVal ? cleanVal.slice(-1) : '';
    setOtpDigits(nextDigits);

    // Auto-advance
    if (cleanVal && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleFillOtp = () => {
    if (currentOtpCode && currentOtpCode.length === 6) {
      setOtpDigits(currentOtpCode.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  // 1. Submit User Login
  const handleUserLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!identifier.trim() || !password) {
      setError('Please enter your email or phone number and password.');
      return;
    }

    setLoading(true);
    try {
      let dest = '';
      let code = '';

      // Try server endpoint
      try {
        const res = await fetch('/api/auth/login-otp-request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier: identifier.trim(), password, role: 'customer' }),
        });
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await res.json();
          if (res.ok && data.success) {
            dest = data.destination;
            code = data.otp_preview || '';
          } else if (!res.ok) {
            throw new Error(data.error || 'Failed to authenticate user.');
          }
        }
      } catch (srvErr: any) {
        if (srvErr.message && !srvErr.message.includes('fetch') && !srvErr.message.includes('JSON')) {
          throw srvErr;
        }
      }

      // Offline fallback
      if (!dest) {
        const localRes = clientRequestLoginOtp(identifier.trim(), password, 'customer');
        dest = localRes.destination;
        code = localRes.otp;
      }

      setOtpDestination(dest);
      setCurrentOtpCode(code);
      setOtpPurpose('login');
      setOtpDigits(['', '', '', '', '', '']);
      setResendCooldown(30);
      setPreviousMode('user-login');
      setMode('otp');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Submit Owner Login
  const handleOwnerLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!identifier.trim() || !password) {
      setError('Please enter authorized owner credentials.');
      return;
    }

    setLoading(true);
    try {
      let dest = '';
      let code = '';

      try {
        const res = await fetch('/api/auth/login-otp-request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier: identifier.trim(), password, role: 'admin' }),
        });
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await res.json();
          if (res.ok && data.success) {
            dest = data.destination;
            code = data.otp_preview || '';
          } else if (!res.ok) {
            throw new Error(data.error || 'Invalid owner credentials.');
          }
        }
      } catch (srvErr: any) {
        if (srvErr.message && !srvErr.message.includes('fetch') && !srvErr.message.includes('JSON')) {
          throw srvErr;
        }
      }

      if (!dest) {
        const localRes = clientRequestLoginOtp(identifier.trim(), password, 'admin');
        dest = localRes.destination;
        code = localRes.otp;
      }

      setOtpDestination(dest);
      setCurrentOtpCode(code);
      setOtpPurpose('owner_login');
      setOtpDigits(['', '', '', '', '', '']);
      setResendCooldown(30);
      setPreviousMode('owner-login');
      setMode('otp');
    } catch (err: any) {
      setError(err.message || 'Owner authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Submit Sign Up
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!identifier.trim() || !identifier.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 4) {
      setError('Password must be at least 4 characters.');
      return;
    }

    setLoading(true);
    try {
      let dest = '';
      let code = '';

      try {
        const res = await fetch('/api/auth/signup-otp-request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            email: identifier.trim(),
            phone: phone.trim(),
            password,
          }),
        });
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await res.json();
          if (res.ok && data.success) {
            dest = data.destination;
            code = data.otp_preview || '';
          } else if (!res.ok) {
            throw new Error(data.error || 'Failed to initialize account registration.');
          }
        }
      } catch (srvErr: any) {
        if (srvErr.message && !srvErr.message.includes('fetch') && !srvErr.message.includes('JSON')) {
          throw srvErr;
        }
      }

      if (!dest) {
        const localRes = clientRequestSignupOtp({
          name: name.trim(),
          email: identifier.trim(),
          phone: phone.trim(),
          password,
        });
        dest = localRes.destination;
        code = localRes.otp;
      }

      setOtpDestination(dest);
      setCurrentOtpCode(code);
      setOtpPurpose('signup');
      setOtpDigits(['', '', '', '', '', '']);
      setResendCooldown(30);
      setPreviousMode('signup');
      setMode('otp');
    } catch (err: any) {
      setError(err.message || 'Account registration failed.');
    } finally {
      setLoading(false);
    }
  };

  // 4. Submit Forgot Password Request
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!identifier.trim()) {
      setError('Please enter your registered email or phone number.');
      return;
    }

    setLoading(true);
    try {
      let dest = '';
      let code = '';

      try {
        const res = await fetch('/api/auth/forgot-password-otp-request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier: identifier.trim() }),
        });
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await res.json();
          if (res.ok && data.success) {
            dest = data.destination;
            code = data.otp_preview || '';
          } else if (!res.ok) {
            throw new Error(data.error || 'Account not found.');
          }
        }
      } catch (srvErr: any) {
        if (srvErr.message && !srvErr.message.includes('fetch') && !srvErr.message.includes('JSON')) {
          throw srvErr;
        }
      }

      if (!dest) {
        const localRes = clientRequestForgotPasswordOtp(identifier.trim());
        dest = localRes.destination;
        code = localRes.otp;
      }

      setOtpDestination(dest);
      setCurrentOtpCode(code);
      setOtpPurpose('forgot_password');
      setOtpDigits(['', '', '', '', '', '']);
      setResendCooldown(30);
      setPreviousMode('forgot-password');
      setMode('otp');
    } catch (err: any) {
      setError(err.message || 'Unable to find an account with this information.');
    } finally {
      setLoading(false);
    }
  };

  // 5. Verify OTP
  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const enteredOtp = otpDigits.join('');
    if (enteredOtp.length !== 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    setLoading(true);
    try {
      let verifiedUser: User | null = null;
      let token: string | null = null;
      let isSuccess = false;

      try {
        const res = await fetch('/api/auth/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identifier: identifier.trim(),
            otp: enteredOtp,
            purpose: otpPurpose,
          }),
        });
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await res.json();
          if (res.ok && data.success) {
            isSuccess = true;
            verifiedUser = data.user || null;
            token = data.token || null;
          } else if (!res.ok) {
            throw new Error(data.error || 'Invalid OTP code.');
          }
        }
      } catch (srvErr: any) {
        if (srvErr.message && !srvErr.message.includes('fetch') && !srvErr.message.includes('JSON')) {
          throw srvErr;
        }
      }

      if (!isSuccess) {
        const localRes = clientVerifyOtp(identifier.trim(), enteredOtp, otpPurpose);
        if (localRes.success) {
          isSuccess = true;
          verifiedUser = localRes.user || null;
          token = localRes.token || `pe_tok_${Date.now()}`;
        }
      }

      // Handle based on purpose
      if (otpPurpose === 'forgot_password') {
        // Navigate to Reset Password Screen
        setMode('reset-password');
        setSuccessMessage('OTP verified successfully. Please enter your new password.');
        return;
      }

      // Successful login or signup
      setSuccessMessage(
        otpPurpose === 'signup'
          ? 'Account created successfully! Redirecting...'
          : 'Login successful! Redirecting...'
      );

      setTimeout(() => {
        if (verifiedUser && token) {
          const targetPortal = otpPurpose === 'owner_login' ? 'shopkeeper' : 'customer';
          saveClientCurrentUser(verifiedUser);

          // Save who logged in so that on logout, ONLY that user shows in login
          const savedAccount: SavedAccountInfo = {
            name: verifiedUser.name || identifier.trim(),
            identifier: identifier.trim() || verifiedUser.email || verifiedUser.phone || '',
            role: verifiedUser.role || (otpPurpose === 'owner_login' ? 'admin' : 'customer'),
            savedPassword: password || undefined,
          };
          try {
            localStorage.setItem(STORAGE_LAST_LOGGED_IN_KEY, JSON.stringify(savedAccount));
          } catch {}
          setLastLoggedInUser(savedAccount);

          onAuthSuccess(verifiedUser, token, targetPortal);
        }
      }, 700);
    } catch (err: any) {
      setError(err.message || 'OTP verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // 6. Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setError(null);
    setLoading(true);
    try {
      let nextCode = '';
      try {
        const res = await fetch('/api/auth/resend-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier: identifier.trim(), purpose: otpPurpose }),
        });
        const data = await res.json().catch(() => null);
        if (data?.otp_preview) nextCode = data.otp_preview;
      } catch {}

      if (!nextCode) {
        const localRes = clientResendOtp(identifier.trim());
        nextCode = localRes.otp;
      }

      setCurrentOtpCode(nextCode);
      setResendCooldown(30);
      setOtpDigits(['', '', '', '', '', '']);
      setSuccessMessage('A new verification OTP has been sent.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError('Could not resend code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // 7. Reset Password Submit
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 4) {
      setError('New password must be at least 4 characters long.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      try {
        await fetch('/api/auth/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identifier: identifier.trim(),
            otp: '123456',
            purpose: 'forgot_password',
            new_password: newPassword,
          }),
        });
      } catch {}

      clientVerifyOtp(identifier.trim(), '123456', 'forgot_password', newPassword);

      setSuccessMessage('Password reset successful! You can now log in with your new password.');
      setPassword('');
      setConfirmPassword('');
      setNewPassword('');
      setConfirmNewPassword('');

      setTimeout(() => {
        setSuccessMessage(null);
        setMode('user-login');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  // Quick Demo account fill helper
  const handleQuickFill = (accIdentifier: string, accPass: string) => {
    setIdentifier(accIdentifier);
    setPassword(accPass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#FFF5E1] text-[#5A3C0B] flex flex-col justify-center items-center px-4 py-8 sm:px-6 w-full max-w-full overflow-x-hidden selection:bg-[#5A3C0B] selection:text-[#FFF5E1]">
      <div className="w-full max-w-md mx-auto">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#5A3C0B] text-[#FFF5E1] shadow-lg mb-3">
            <Printer className="w-8 h-8 text-[#C48B28]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#5A3C0B] tracking-tight">
            Print<span className="text-[#C48B28]">Ease</span>
          </h1>
          <p className="text-xs text-[#5A3C0B]/70 font-semibold mt-1">
            "Your Documents. Our Priority." — Upload • Pay • Print • Done!
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-[#C48B28]/25 overflow-hidden transition-all duration-300">
          {/* Card Top Banner */}
          <div className="px-6 py-5 bg-gradient-to-r from-[#422C09] via-[#5A3C0B] to-[#422C09] text-[#FFF5E1] border-b border-[#C48B28]/30">
            <div>
              <span className="text-[10px] font-black tracking-wider uppercase text-[#EBC176] flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-[#EBC176]" />
                <span>{mode === 'owner-login' ? 'Shop Owner & Staff Console' : 'Customer & Student Portal'}</span>
              </span>
              <h2 className="text-xl font-black text-[#FFF5E1] mt-0.5 tracking-tight">
                {mode === 'user-login' && 'Welcome Back'}
                {mode === 'signup' && 'Create Account'}
                {mode === 'forgot-password' && 'Reset Password'}
                {mode === 'reset-password' && 'New Password'}
                {mode === 'owner-login' && 'Owner & Staff Login'}
                {mode === 'otp' && 'Verify OTP'}
              </h2>
              <p className="text-xs text-[#FFF5E1]/80 mt-0.5">
                {mode === 'user-login' && 'Login to order campus prints'}
                {mode === 'signup' && 'Sign up for fast and secure campus printing'}
                {mode === 'forgot-password' && 'Enter your registered email or phone number'}
                {mode === 'reset-password' && 'Create your new password'}
                {mode === 'owner-login' && 'Management credentials required for shop console'}
                {mode === 'otp' && 'Enter the 6-digit OTP code to complete verification'}
              </p>
            </div>
          </div>

          {/* Alert Messages */}
          <div className="px-6 pt-4">
            {error && (
              <div className="p-3 mb-2 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2 animate-fadeIn">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span className="font-semibold">{error}</span>
              </div>
            )}
            {successMessage && (
              <div className="p-3 mb-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span className="font-semibold">{successMessage}</span>
              </div>
            )}
          </div>

          {/* ============================================================== */}
          {/* VIEW 1: USER LOGIN                                             */}
          {/* ============================================================== */}
          {mode === 'user-login' && (
            <form onSubmit={handleUserLoginSubmit} className="p-6 space-y-4">
              {/* Recently Logged In Account (Shows ONLY the user who actually logged in) */}
              {lastLoggedInUser && lastLoggedInUser.role === 'customer' && (
                <div className="p-3 bg-[#FFF5E1]/80 border border-[#C48B28]/35 rounded-2xl animate-fadeIn">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase text-[#5A3C0B]/80 tracking-wider mb-2">
                    <div className="flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-[#C48B28]" />
                      <span>Saved Account</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        localStorage.removeItem(STORAGE_LAST_LOGGED_IN_KEY);
                        setLastLoggedInUser(null);
                      }}
                      className="text-[10px] font-bold text-slate-400 hover:text-rose-600 cursor-pointer transition-colors"
                      title="Clear saved account"
                    >
                      Clear
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleQuickFill(lastLoggedInUser.identifier, lastLoggedInUser.savedPassword || '')}
                    className="w-full flex items-center justify-between p-2.5 bg-white hover:bg-[#FFF5E1] border border-[#C48B28]/40 rounded-xl transition-all cursor-pointer group shadow-2xs text-left"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#5A3C0B] to-[#7A5212] text-[#FFF5E1] flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
                        {lastLoggedInUser.name ? lastLoggedInUser.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-black text-[#5A3C0B] truncate">
                          {lastLoggedInUser.name}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono truncate">
                          {lastLoggedInUser.identifier}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-black text-[#C48B28] group-hover:translate-x-0.5 transition-transform shrink-0 flex items-center gap-1">
                      <span>Fill</span>
                      <span>→</span>
                    </span>
                  </button>
                </div>
              )}

              {/* Email or Phone Number */}
              <div>
                <label className="block text-xs font-bold text-[#5A3C0B] mb-1">
                  Email or Phone Number *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="name@example.com or +91 98765 43210"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#C48B28]"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-[#5A3C0B]">
                    Password *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setMode('forgot-password');
                    }}
                    className="text-xs font-bold text-[#C48B28] hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-10 py-2.5 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#C48B28]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Single Customer Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[48px] py-3.5 bg-[#C48B28] hover:bg-[#d99d33] active:bg-[#B37A1F] text-[#422C09] font-black text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed focus:outline-hidden focus:ring-2 focus:ring-[#C48B28]/50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#422C09]" />
                    <span>Validating credentials...</span>
                  </>
                ) : (
                  <>
                    <UserIcon className="w-4 h-4 text-[#422C09]" />
                    <span>Customer Login</span>
                  </>
                )}
              </button>

              {/* Sign up prompt */}
              <div className="text-center pt-2 text-xs">
                <span className="text-slate-600">Don't have an account? </span>
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setMode('signup');
                  }}
                  className="font-bold text-[#C48B28] hover:underline cursor-pointer"
                >
                  Sign Up
                </button>
              </div>

              {/* Owner Login text link directly underneath Sign Up */}
              <div className="text-center pt-1 text-xs">
                <span className="text-slate-600">Are you the owner? </span>
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setIdentifier('');
                    setPassword('');
                    setMode('owner-login');
                  }}
                  className="font-bold text-[#C48B28] hover:underline cursor-pointer"
                >
                  Owner Login
                </button>
              </div>
            </form>
          )}

          {/* ============================================================== */}
          {/* VIEW 2: SIGN UP FLOW                                            */}
          {/* ============================================================== */}
          {mode === 'signup' && (
            <form onSubmit={handleSignUpSubmit} className="p-6 space-y-3.5">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-[#5A3C0B] mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Vinay Kumar / Priya Sen"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#C48B28]"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-bold text-[#5A3C0B] mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="student@college.edu"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#C48B28]"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-xs font-bold text-[#5A3C0B] mb-1">
                  Phone Number *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#C48B28]"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-[#5A3C0B] mb-1">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-10 py-2 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#C48B28]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-bold text-[#5A3C0B] mb-1">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-10 py-2 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#C48B28]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Create Account Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-[#5A3C0B] to-[#7A5212] hover:from-[#422C09] hover:to-[#5A3C0B] text-[#FFF5E1] font-black text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#C48B28]" />
                    <span>Sending verification OTP...</span>
                  </>
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Return to Login */}
              <div className="text-center pt-1 text-xs">
                <span className="text-slate-600">Already have an account? </span>
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setMode('user-login');
                  }}
                  className="font-bold text-[#C48B28] hover:underline cursor-pointer"
                >
                  Log In
                </button>
              </div>
            </form>
          )}

          {/* ============================================================== */}
          {/* VIEW 3: FORGOT PASSWORD                                         */}
          {/* ============================================================== */}
          {mode === 'forgot-password' && (
            <form onSubmit={handleForgotPasswordSubmit} className="p-6 space-y-4">
              <p className="text-xs text-slate-600">
                Please enter your registered email address or phone number. We will send you a 6-digit OTP to reset your password.
              </p>

              <div>
                <label className="block text-xs font-bold text-[#5A3C0B] mb-1">
                  Registered Email or Phone *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="name@example.com or +91 98765 43210"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#C48B28]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-[#5A3C0B] to-[#7A5212] hover:from-[#422C09] hover:to-[#5A3C0B] text-[#FFF5E1] font-black text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#C48B28]" />
                    <span>Sending OTP...</span>
                  </>
                ) : (
                  <>
                    <span>Send Verification OTP</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setMode('user-login');
                  }}
                  className="text-xs font-bold text-[#5A3C0B] hover:underline cursor-pointer flex items-center justify-center gap-1 mx-auto"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Login</span>
                </button>
              </div>
            </form>
          )}

          {/* ============================================================== */}
          {/* VIEW 4: RESET NEW PASSWORD                                      */}
          {/* ============================================================== */}
          {mode === 'reset-password' && (
            <form onSubmit={handleResetPasswordSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#5A3C0B] mb-1">
                  New Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#C48B28]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#5A3C0B] mb-1">
                  Confirm New Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#C48B28]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-[#5A3C0B] to-[#7A5212] hover:from-[#422C09] hover:to-[#5A3C0B] text-[#FFF5E1] font-black text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#C48B28]" />
                    <span>Updating password...</span>
                  </>
                ) : (
                  <span>Save New Password &amp; Login</span>
                )}
              </button>
            </form>
          )}

          {/* ============================================================== */}
          {/* VIEW 5: OWNER / ADMIN SECURE LOGIN                              */}
          {/* ============================================================== */}
          {mode === 'owner-login' && (
            <form onSubmit={handleOwnerLoginSubmit} className="p-6 space-y-4">
              {/* Owner Credentials Helper & 1-Click Access Card */}
              <div className="p-3.5 bg-gradient-to-br from-amber-50 to-[#FFF5E1] border-2 border-[#C48B28]/50 rounded-2xl shadow-xs animate-fadeIn">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-black text-[#5A3C0B]">
                    <KeyRound className="w-4 h-4 text-[#C48B28]" />
                    <span>Owner Login Credentials</span>
                  </div>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#5A3C0B] text-[#FFF5E1] tracking-wide">
                    Authorized Access
                  </span>
                </div>

                <p className="text-[11px] text-[#5A3C0B]/80 mb-2.5">
                  Use the official shopkeeper login below or click one of the quick-fill buttons:
                </p>

                <div className="space-y-1.5 text-xs bg-white/95 p-2.5 rounded-xl border border-[#C48B28]/25 font-mono text-[#422C09]">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-sans font-semibold">Owner ID:</span>
                    <strong className="text-[#5A3C0B] select-all font-mono">admin@printease.com</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-sans font-semibold">Password:</span>
                    <strong className="text-[#5A3C0B] select-all font-mono">admin123</strong>
                  </div>
                  <div className="pt-1.5 border-t border-slate-100 flex justify-between items-center text-[11px] text-slate-500 font-sans">
                    <span>Developer / Co-Owner:</span>
                    <span className="font-mono text-[#5A3C0B] font-semibold">vinay8046d@gmail.com</span>
                  </div>
                </div>

                {/* 1-Click Auto Fill Buttons */}
                <div className="grid grid-cols-2 gap-2 mt-2.5">
                  <button
                    type="button"
                    onClick={() => handleQuickFill('admin@printease.com', 'admin123')}
                    className="py-2 px-2.5 bg-[#5A3C0B] hover:bg-[#422C09] text-[#FFF5E1] text-[11px] font-black rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer group hover:scale-[1.02]"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#C48B28]" />
                    <span>Auto-fill Admin</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickFill('vinay8046d@gmail.com', 'vinay123')}
                    className="py-2 px-2.5 bg-white hover:bg-[#FFF5E1] text-[#5A3C0B] border border-[#C48B28]/50 text-[11px] font-black rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer group hover:scale-[1.02]"
                  >
                    <UserIcon className="w-3.5 h-3.5 text-[#C48B28]" />
                    <span>Auto-fill Vinay</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#5A3C0B] mb-1">
                  Authorized Owner Email / Phone *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="admin@printease.com (or admin)"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#C48B28]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#5A3C0B] mb-1">
                  Owner Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-10 py-2.5 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#C48B28]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[48px] py-3.5 bg-gradient-to-r from-[#5A3C0B] to-[#7A5212] hover:from-[#422C09] hover:to-[#5A3C0B] text-[#FFF5E1] font-black text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#C48B28]" />
                    <span>Verifying owner credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Authenticate &amp; Request OTP</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Text link to return to Customer Login */}
              <div className="text-center pt-2 text-xs">
                <span className="text-slate-600">Are you a customer? </span>
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setIdentifier('');
                    setPassword('');
                    setMode('user-login');
                  }}
                  className="font-bold text-[#C48B28] hover:underline cursor-pointer"
                >
                  Customer Login
                </button>
              </div>
            </form>
          )}

          {/* ============================================================== */}
          {/* VIEW 6: OTP VERIFICATION PAGE                                  */}
          {/* ============================================================== */}
          {mode === 'otp' && (
            <form onSubmit={handleVerifyOtpSubmit} className="p-6 space-y-5">
              {/* Recipient info & change option */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-[11px] text-slate-500 block">OTP Sent to:</span>
                  <span className="font-extrabold text-[#5A3C0B]">{otpDestination || identifier}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setMode(previousMode);
                  }}
                  className="text-xs font-bold text-[#C48B28] hover:underline cursor-pointer"
                >
                  Change Email / Phone
                </button>
              </div>

              {/* Simulation Delivery Banner (shows the 6 digits directly so user is never stuck) */}
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-950 flex flex-col sm:flex-row items-center justify-between gap-2 shadow-xs">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">
                      Simulated SMS / Email OTP
                    </div>
                    <div className="text-sm font-black font-mono tracking-widest text-emerald-900">
                      {currentOtpCode || '123456'}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleFillOtp}
                  className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-2xs"
                >
                  Auto-fill Code
                </button>
              </div>

              {/* 6-Digit Inputs */}
              <div>
                <label className="block text-xs font-bold text-center text-[#5A3C0B] mb-2 uppercase tracking-wider">
                  Enter 6-Digit Verification Code
                </label>
                <div className="flex items-center justify-between gap-1.5 sm:gap-2 max-w-xs mx-auto">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        inputRefs.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      className="w-9 sm:w-11 h-12 sm:h-13 text-center text-lg sm:text-xl font-black font-mono bg-slate-50 border-2 border-slate-300 rounded-xl focus:bg-white focus:border-[#C48B28] focus:ring-2 focus:ring-[#C48B28]/30 focus:outline-hidden transition-all text-slate-900"
                    />
                  ))}
                </div>
              </div>

              {/* Verify OTP Button */}
              <button
                type="submit"
                disabled={loading || otpDigits.join('').length !== 6}
                className="w-full py-3 bg-gradient-to-r from-[#5A3C0B] to-[#7A5212] hover:from-[#422C09] hover:to-[#5A3C0B] text-[#FFF5E1] font-black text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#C48B28]" />
                    <span>Verifying code...</span>
                  </>
                ) : (
                  <>
                    <span>Verify OTP</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Resend and Countdown */}
              <div className="flex flex-col sm:flex-row items-center justify-between text-xs gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || loading}
                  className={`font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                    resendCooldown > 0
                      ? 'text-slate-400 cursor-not-allowed'
                      : 'text-[#C48B28] hover:underline'
                  }`}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Resend OTP</span>
                </button>

                <span className="text-slate-500 font-medium">
                  {resendCooldown > 0 ? (
                    <>Resend code in <strong className="text-[#5A3C0B] font-mono">{resendCooldown}s</strong></>
                  ) : (
                    <span className="text-emerald-700 font-semibold">You can resend now</span>
                  )}
                </span>
              </div>
            </form>
          )}
        </div>

        {/* Security Trust Badges */}
        <div className="mt-6 flex items-center justify-center gap-4 text-[11px] text-[#5A3C0B]/70 font-semibold text-center">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#C48B28]" />
            256-Bit SSL Encrypted
          </span>
          <span>•</span>
          <span>CAMPUS VERIFIED</span>
          <span>•</span>
          <span>MULTI-FACTOR AUTH</span>
        </div>
      </div>
    </div>
  );
};
