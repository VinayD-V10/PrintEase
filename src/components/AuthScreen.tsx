import React, { useState, useEffect, useRef } from 'react';
import {
  Printer,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User as UserIcon,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Phone,
  Server,
  RefreshCw,
} from 'lucide-react';
import { User } from '../types/printease';
import { saveClientCurrentUser, maskDestination } from '../data/mockData';
import { apiFetch, setStoredToken, isGitHubPages, getApiBaseUrl, isBackendConfigured } from '../config/api';
import { BackendConfigModal } from './BackendConfigModal';

export type AuthMode =
  | 'customer-login'
  | 'signup'
  | 'owner-login'
  | 'forgot-password'
  | 'reset-password'
  | 'user-login'; // backwards compatibility alias for customer-login

interface Props {
  initialMode?: AuthMode;
  onAuthSuccess: (user: User, token: string, targetPortal: 'customer' | 'shopkeeper') => void;
  onCancel?: () => void;
}

export const AuthScreen: React.FC<Props> = ({
  initialMode = 'customer-login',
  onAuthSuccess,
  onCancel,
}) => {
  // Normalize initial mode
  const normalizedInitial =
    initialMode === 'user-login'
      ? 'customer-login'
      : initialMode === 'owner-login'
      ? 'owner-login'
      : initialMode;

  const [mode, setMode] = useState<AuthMode>(normalizedInitial);

  // Customer login method: 'otp' (primary email OTP) or 'password' (secondary password login)
  const [customerMethod, setCustomerMethod] = useState<'otp' | 'password'>('otp');

  // Step tracking within Customer Login: 'email' | 'otp'
  const [customerStep, setCustomerStep] = useState<'email' | 'otp'>('email');

  // Step tracking within Sign Up: 'form' -> 'otp'
  const [signupStep, setSignupStep] = useState<'form' | 'otp'>('form');

  // Step tracking within Owner Login: 'credentials' -> 'otp'
  const [ownerStep, setOwnerStep] = useState<'credentials' | 'otp'>('credentials');

  // Input states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Sign up inputs
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');

  // Owner specific inputs
  const [ownerEmail, setOwnerEmail] = useState('vinay8046d@gmail.com');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [showOwnerPassword, setShowOwnerPassword] = useState(false);

  // Forgot password inputs
  const [forgotEmail, setForgotEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // OTP State
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [otpDestination, setOtpDestination] = useState('');
  const [otpPurpose, setOtpPurpose] = useState<'login' | 'signup' | 'forgot_password' | 'owner_login'>('login');
  const [resendCooldown, setResendCooldown] = useState(30);

  // Status & messages
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showBackendConfig, setShowBackendConfig] = useState(false);

  // Input refs for 6 OTP boxes
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // 1. Resend cooldown countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    const isOtpActive =
      (mode === 'customer-login' && customerStep === 'otp') ||
      (mode === 'signup' && signupStep === 'otp') ||
      (mode === 'owner-login' && ownerStep === 'otp') ||
      (mode === 'forgot-password' && customerStep === 'otp');

    if (isOtpActive && resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [mode, customerStep, signupStep, ownerStep, resendCooldown]);

  // 2. Auto-focus first OTP digit box when transitioning to OTP step
  useEffect(() => {
    const isOtpActive =
      (mode === 'customer-login' && customerStep === 'otp') ||
      (mode === 'signup' && signupStep === 'otp') ||
      (mode === 'owner-login' && ownerStep === 'otp');

    if (isOtpActive) {
      const focusTimer = setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 120);
      return () => clearTimeout(focusTimer);
    }
  }, [mode, customerStep, signupStep, ownerStep]);

  // Friendly message translator
  const getFriendlyErrorMessage = (rawError?: string): string => {
    if (!rawError) return 'Something went wrong. Please check your connection and try again.';
    const lower = rawError.toLowerCase();

    // Preserve informative server & configuration errors verbatim
    if (
      lower.includes('supabase') ||
      lower.includes('rate limit') ||
      lower.includes('smtp') ||
      lower.includes('configured') ||
      lower.includes('backend error') ||
      lower.includes('http') ||
      lower.includes('vercel') ||
      lower.includes('wait')
    ) {
      return rawError;
    }

    if (lower.includes('valid email')) {
      return 'Please enter a valid email address.';
    }
    if (lower.includes('no account registered') || lower.includes('account not found') || (lower.includes('user') && lower.includes('not found'))) {
      return 'No account registered with this email address. Please sign up.';
    }
    if (lower.includes('incorrect password') || lower.includes('wrong password') || lower.includes('invalid credentials')) {
      return 'Incorrect password. Please try again.';
    }
    if (lower.includes('incorrect') || lower.includes('invalid verification code') || lower.includes('invalid otp')) {
      return 'That OTP is incorrect. Please check your email and try again.';
    }
    if (lower.includes('expired')) {
      return 'This OTP has expired. Please request a new OTP.';
    }
    if (lower.includes('too many') || lower.includes('maximum attempts') || lower.includes('lockout')) {
      return 'Too many incorrect attempts. Please wait and request a new OTP.';
    }
    if (lower.includes('failed to fetch') || lower.includes('network') || lower.includes('unable to reach')) {
      return 'Unable to reach PrintEase backend. Please verify your connection or backend URL configuration.';
    }
    return rawError;
  };

  /**
   * Safely reads and parses API response, extracting the real backend error or HTTP status
   */
  const parseAuthResponse = async (res: Response): Promise<any> => {
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.message || `Server responded with status ${res.status}`);
      }
      return data;
    }

    // Response is not JSON (HTML error or plain text from Vercel lambda)
    const rawText = (await res.text()).trim();
    if (res.status === 404) {
      throw new Error(
        'Backend route not found (HTTP 404). Please ensure your Vercel backend is deployed and VITE_API_BASE_URL points to it.'
      );
    }
    if (res.status >= 500) {
      const cleaned = rawText.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim().slice(0, 200);
      throw new Error(
        cleaned
          ? `Backend Server Error (${res.status}): ${cleaned}`
          : `Backend Server Error (HTTP ${res.status}). Check Vercel function logs.`
      );
    }
    throw new Error(`Unexpected server response (HTTP ${res.status}). Verify backend deployment.`);
  };

  // -------------------------------------------------------------
  // MANUAL OTP INPUT HANDLERS
  // (Allows typing, arrow navigation, backspace, and paste)
  // -------------------------------------------------------------
  const handleOtpBoxChange = (index: number, val: string) => {
    const clean = val.replace(/\D/g, '');
    if (!clean && val !== '') return;

    const next = [...otpDigits];

    // Handle paste of full 6-digit code into any box
    if (clean.length > 1) {
      const chars = clean.slice(0, 6).split('');
      chars.forEach((c, i) => {
        if (i < 6) next[i] = c;
      });
      setOtpDigits(next);
      const targetFocus = Math.min(chars.length, 5);
      otpInputRefs.current[targetFocus]?.focus();
      return;
    }

    // Single digit manual entry
    next[index] = clean ? clean.slice(-1) : '';
    setOtpDigits(next);

    // Auto-advance to next box
    if (clean && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpBoxKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        otpInputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      otpInputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      e.preventDefault();
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpBoxPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const next = [...otpDigits];
    pasted.split('').forEach((ch, idx) => {
      if (idx < 6) next[idx] = ch;
    });
    setOtpDigits(next);

    const nextIndex = Math.min(pasted.length, 5);
    otpInputRefs.current[nextIndex]?.focus();
  };

  // -------------------------------------------------------------
  // 1. CUSTOMER LOGIN: PRIMARY EMAIL OTP FLOW
  // (Enter email -> click Send OTP -> verify OTP -> login)
  // -------------------------------------------------------------
  const handleCustomerSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || cleanEmail.length < 5) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await parseAuthResponse(res);
      if (!data.success) {
        throw new Error(data.error || 'Failed to send OTP');
      }

      const dest = data.destination || maskDestination(cleanEmail);
      const cooldown = data.cooldown_seconds || 30;
      const msg = data.message || 'A 6-digit verification code has been sent to your email.';

      setOtpDestination(dest);
      setOtpPurpose('login');
      setOtpDigits(['', '', '', '', '', '']);
      setResendCooldown(cooldown);
      setSuccessMessage(msg);
      setCustomerStep('otp');
    } catch (err: any) {
      setError(getFriendlyErrorMessage(err.message));
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // CUSTOMER LOGIN: SECONDARY PASSWORD LOGIN FLOW
  // (Enter email/phone + password -> verify credentials -> login)
  // -------------------------------------------------------------
  const handleCustomerPasswordLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const cleanIdentifier = email.trim().toLowerCase();
    if (!cleanIdentifier) {
      setError('Please enter your email address or phone number.');
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: cleanIdentifier,
          password,
        }),
      });

      const data = await parseAuthResponse(res);
      if (!data.user || !data.token) {
        throw new Error(data.error || 'Invalid credentials');
      }

      const loggedUser: User = data.user;
      const token: string = data.token;

      setStoredToken(token);
      saveClientCurrentUser(loggedUser);
      setSuccessMessage('Logged in successfully!');

      setTimeout(() => {
        onAuthSuccess(loggedUser, token, loggedUser.role === 'admin' ? 'shopkeeper' : 'customer');
      }, 400);
    } catch (err: any) {
      setError(getFriendlyErrorMessage(err.message));
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // 2. SIGN-UP FLOW: FORM SUBMIT -> SEND OTP -> OTP STEP
  // -------------------------------------------------------------
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || cleanEmail.length < 5) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!password) {
      setError('Enter your password');
      return;
    }

    if (password.length < 4) {
      setError('Password must be at least 4 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: cleanEmail,
          phone: phone.trim(),
          password,
        }),
      });

      const data = await parseAuthResponse(res);
      if (!data.success) {
        throw new Error(data.error || 'Failed to create account');
      }

      const dest = data.destination || maskDestination(cleanEmail);
      const cooldown = data.cooldown_seconds || 30;
      const msg = data.message || 'A 6-digit verification code has been sent to your email.';

      setOtpDestination(dest);
      setOtpPurpose('signup');
      setOtpDigits(['', '', '', '', '', '']);
      setResendCooldown(cooldown);
      setSuccessMessage(msg);
      setSignupStep('otp');
    } catch (err: any) {
      setError(getFriendlyErrorMessage(err.message));
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // 3. OWNER / ADMIN LOGIN FLOW
  // (Owner Email -> Owner Password -> Owner OTP)
  // -------------------------------------------------------------
  const handleOwnerCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const cleanOwnerEmail = ownerEmail.trim().toLowerCase();
    if (!cleanOwnerEmail || !cleanOwnerEmail.includes('@')) {
      setError('Please enter authorized administrator email.');
      return;
    }

    if (!ownerPassword) {
      setError('Enter your administrator password');
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch('/api/auth/login-otp-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: cleanOwnerEmail,
          password: ownerPassword,
          role: 'admin',
        }),
      });

      const data = await parseAuthResponse(res);
      if (!data.success) {
        throw new Error(data.error || 'Authentication failed');
      }

      const dest = data.destination || maskDestination(cleanOwnerEmail);
      const cooldown = data.cooldown_seconds || 30;
      const msg = data.message || 'Administrator verification code dispatched.';

      setOtpDestination(dest);
      setOtpPurpose('owner_login');
      setOtpDigits(['', '', '', '', '', '']);
      setResendCooldown(cooldown);
      setSuccessMessage(msg);
      setOwnerStep('otp');
    } catch (err: any) {
      setError(getFriendlyErrorMessage(err.message));
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // 4. UNIFIED OTP VERIFICATION
  // -------------------------------------------------------------
  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const enteredOtp = otpDigits.join('');

    if (enteredOtp.length !== 6) {
      setError('Enter the 6-digit OTP sent to your email.');
      return;
    }

    setLoading(true);
    try {
      const targetIdentifier =
        otpPurpose === 'owner_login'
          ? ownerEmail.trim().toLowerCase()
          : (email || forgotEmail).trim().toLowerCase();

      const res = await apiFetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: targetIdentifier,
          otp: enteredOtp,
          purpose: otpPurpose,
        }),
      });

      const data = await parseAuthResponse(res);
      if (!data.success) {
        throw new Error(data.error || 'Invalid or expired OTP');
      }

      if (otpPurpose === 'forgot_password') {
        setMode('reset-password');
        setSuccessMessage('OTP verified successfully. Create your new password.');
        return;
      }

      const verifiedUser: User = data.user;
      const token: string = data.token;

      if (!verifiedUser || !token) {
        throw new Error('Verification completed but user profile was not returned.');
      }

      setStoredToken(token);
      saveClientCurrentUser(verifiedUser);
      setSuccessMessage('Verified successfully');

      const targetPortal =
        otpPurpose === 'owner_login' || verifiedUser.role === 'admin'
          ? 'shopkeeper'
          : 'customer';

      setTimeout(() => {
        onAuthSuccess(verifiedUser, token, targetPortal);
      }, 500);
    } catch (err: any) {
      setError(getFriendlyErrorMessage(err.message));
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // 5. RESEND OTP HANDLER
  // -------------------------------------------------------------
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || loading) return;
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      const targetIdentifier =
        otpPurpose === 'owner_login'
          ? ownerEmail.trim().toLowerCase()
          : (email || forgotEmail).trim().toLowerCase();

      const res = await apiFetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: targetIdentifier, purpose: otpPurpose }),
      });

      const data = await parseAuthResponse(res);
      if (!data.success) {
        throw new Error(data.error || 'Failed to resend OTP');
      }

      const cooldown = data.cooldown_seconds || 30;
      const msg = data.message || 'A fresh OTP has been sent to your email.';

      setResendCooldown(cooldown);
      setOtpDigits(['', '', '', '', '', '']);
      setSuccessMessage(msg);
    } catch (err: any) {
      setError(getFriendlyErrorMessage(err.message));
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // 6. FORGOT & RESET PASSWORD
  // -------------------------------------------------------------
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const cleanId = (forgotEmail || email).trim().toLowerCase();

    if (!cleanId || !cleanId.includes('@')) {
      setError('Please enter your registered email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch('/api/auth/forgot-password-otp-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: cleanId }),
      });

      const data = await parseAuthResponse(res);
      if (!data.success) {
        throw new Error(data.error || 'Account not found');
      }

      const dest = data.destination || maskDestination(cleanId);
      const msg = data.message || 'Password recovery verification code sent.';

      setOtpDestination(dest);
      setOtpPurpose('forgot_password');
      setOtpDigits(['', '', '', '', '', '']);
      setResendCooldown(30);
      setSuccessMessage(msg);
      setCustomerStep('otp');
    } catch (err: any) {
      setError(getFriendlyErrorMessage(err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 4) {
      setError('Password must be at least 4 characters.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const cleanId = (forgotEmail || email).trim().toLowerCase();
      const enteredOtp = otpDigits.join('');

      const res = await apiFetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: cleanId,
          otp: enteredOtp,
          purpose: 'forgot_password',
          new_password: newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(getFriendlyErrorMessage(data.error || 'Failed to update password'));
      }

      setSuccessMessage('Password reset successfully! Please log in.');
      setPassword('');
      setNewPassword('');
      setConfirmNewPassword('');

      setTimeout(() => {
        setSuccessMessage(null);
        setMode('customer-login');
        setCustomerStep('email');
        setCustomerMethod('password');
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF5E1] text-[#422C09] flex flex-col justify-center items-center px-4 py-8 sm:px-6 w-full max-w-full overflow-x-hidden selection:bg-[#422C09] selection:text-[#FFF5E1]">
      <div className="w-full max-w-md mx-auto">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#422C09] text-[#FFF5E1] shadow-lg shadow-[#422C09]/20 mb-3 border border-[#C48B28]/30">
            <Printer className="w-7 h-7 text-[#C48B28]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#422C09] tracking-tight">
            Print<span className="text-[#C48B28]">Ease</span>
          </h1>
          <p className="text-xs text-[#5A3C0B]/80 font-semibold mt-1">
            "Your Documents. Our Priority." — Upload • Pay • Print • Done!
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-[#422C09]/10 border border-[#C48B28]/25 overflow-hidden transition-all duration-300">
          {/* Card Top Banner */}
          <div
            className={`px-6 py-5 text-[#FFF5E1] border-b ${
              mode === 'owner-login'
                ? 'bg-gradient-to-r from-[#2A1B05] via-[#422C09] to-[#2A1B05] border-[#C48B28]/40'
                : 'bg-gradient-to-r from-[#422C09] via-[#5A3C0B] to-[#422C09] border-[#C48B28]/30'
            }`}
          >
            <div>
              <span className="text-[10px] font-black tracking-wider uppercase text-[#EBC176] flex items-center gap-1.5">
                {mode === 'owner-login' ? (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-[#EBC176]" />
                    <span>Administrator Console</span>
                  </>
                ) : (
                  <>
                    <UserIcon className="w-3.5 h-3.5 text-[#EBC176]" />
                    <span>Customer &amp; Student Portal</span>
                  </>
                )}
              </span>

              <h2 className="text-xl font-black text-[#FFF5E1] mt-1 tracking-tight">
                {mode === 'customer-login' && customerStep === 'otp' && 'Verify your email'}
                {mode === 'customer-login' && customerStep === 'email' && 'Customer & Student Portal'}
                {mode === 'signup' && signupStep === 'form' && 'Create your PrintEase Account'}
                {mode === 'signup' && signupStep === 'otp' && 'Verify your email'}
                {mode === 'owner-login' && ownerStep === 'credentials' && 'PrintEase Owner Portal'}
                {mode === 'owner-login' && ownerStep === 'otp' && 'Verify Administrator OTP'}
                {mode === 'forgot-password' && 'Reset Password'}
                {mode === 'reset-password' && 'New Password'}
              </h2>

              <p className="text-xs text-[#FFF5E1]/80 mt-0.5">
                {mode === 'customer-login' && customerStep === 'otp' && 'Enter the 6-digit code sent to your email'}
                {mode === 'customer-login' && customerStep === 'email' && (customerMethod === 'password' ? 'Login with your password' : 'Login to order your prints')}
                {mode === 'signup' && signupStep === 'form' && 'Sign up to order campus prints'}
                {mode === 'signup' && signupStep === 'otp' && 'Enter the 6-digit OTP sent to your email.'}
                {mode === 'owner-login' && ownerStep === 'credentials' && 'Secure access for PrintEase administrators'}
                {mode === 'owner-login' && ownerStep === 'otp' && 'Enter the 6-digit OTP sent to your email.'}
                {mode === 'forgot-password' && 'Enter your registered email address'}
                {mode === 'reset-password' && 'Create your new password'}
              </p>
            </div>
          </div>

          {/* Feedback & Alert Messages */}
          <div className="px-6 pt-4">
            {!isBackendConfigured() && isGitHubPages() && (
              <div className="p-3 mb-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-start justify-between gap-2 shadow-xs">
                <div className="flex items-start gap-2">
                  <Server className="w-4 h-4 shrink-0 text-amber-700 mt-0.5" />
                  <div>
                    <span className="font-bold">Backend Connection Required:</span> Your frontend is hosted on GitHub Pages. Connect your Vercel backend URL to send live OTP emails.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowBackendConfig(true)}
                  className="px-2.5 py-1 text-[11px] font-bold bg-[#422C09] text-[#FFF5E1] rounded-lg hover:bg-[#5A3C0B] transition cursor-pointer shrink-0"
                >
                  Connect API
                </button>
              </div>
            )}
            {error && (
              <div
                role="alert"
                className="p-3 mb-2 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2 animate-fadeIn"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <span className="font-semibold leading-relaxed">{error}</span>
              </div>
            )}
            {successMessage && (
              <div
                role="status"
                className="p-3 mb-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2 animate-fadeIn"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                <span className="font-semibold leading-relaxed">{successMessage}</span>
              </div>
            )}
          </div>

          {/* ============================================================== */}
          {/* FLOW 1: CUSTOMER / STUDENT LOGIN                               */}
          {/* (PRIMARY: EMAIL OTP LOGIN | SECONDARY: PASSWORD LOGIN)         */}
          {/* ============================================================== */}
          {mode === 'customer-login' && customerStep === 'email' && (
            <div className="p-6 space-y-4">
              {customerMethod === 'otp' ? (
                /* PRIMARY METHOD: EMAIL OTP LOGIN */
                <form onSubmit={handleCustomerSendOtp} className="space-y-4">
                  <div>
                    <label
                      htmlFor="customer-email-otp"
                      className="block text-xs font-bold text-[#422C09] mb-1.5"
                    >
                      Email Address <span className="text-rose-600">*</span>
                    </label>
                    <div className="relative">
                      <input
                        id="customer-email-otp"
                        type="email"
                        required
                        autoFocus
                        disabled={loading}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="student@college.edu or name@example.com"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-[#C48B28] focus:bg-white rounded-xl text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#C48B28]/20 transition-all font-medium disabled:opacity-60"
                      />
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !email.trim()}
                    className="w-full py-3 px-4 bg-[#C48B28] hover:bg-[#A9741D] active:bg-[#8F6218] text-[#FFF5E1] font-black rounded-xl text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.99]"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-[#FFF5E1]" />
                        <span>Sending OTP...</span>
                      </>
                    ) : (
                      <>
                        <span>Send OTP</span>
                        <ArrowRight className="w-4 h-4 text-[#FFF5E1]" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                /* SECONDARY METHOD: PASSWORD LOGIN */
                <form onSubmit={handleCustomerPasswordLoginSubmit} className="space-y-4">
                  <div>
                    <label
                      htmlFor="customer-identifier"
                      className="block text-xs font-bold text-[#422C09] mb-1.5"
                    >
                      Email or Phone Number <span className="text-rose-600">*</span>
                    </label>
                    <div className="relative">
                      <input
                        id="customer-identifier"
                        type="text"
                        required
                        autoFocus
                        disabled={loading}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="student@college.edu or +91 98765 43210"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-[#C48B28] focus:bg-white rounded-xl text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#C48B28]/20 transition-all font-medium disabled:opacity-60"
                      />
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label
                        htmlFor="customer-pwd"
                        className="block text-xs font-bold text-[#422C09]"
                      >
                        Password <span className="text-rose-600">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setError(null);
                          setSuccessMessage(null);
                          setForgotEmail(email);
                          setMode('forgot-password');
                        }}
                        className="text-xs font-semibold text-[#C48B28] hover:text-[#5A3C0B] hover:underline cursor-pointer"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        id="customer-pwd"
                        type={showPassword ? 'text' : 'password'}
                        required
                        disabled={loading}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="w-full pl-10 pr-11 py-3 bg-slate-50 border border-slate-200 focus:border-[#C48B28] focus:bg-white rounded-xl text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#C48B28]/20 transition-all font-medium disabled:opacity-60"
                      />
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !email.trim() || !password}
                    className="w-full py-3 px-4 bg-[#C48B28] hover:bg-[#A9741D] active:bg-[#8F6218] text-[#FFF5E1] font-black rounded-xl text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.99]"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-[#FFF5E1]" />
                        <span>Logging in...</span>
                      </>
                    ) : (
                      <>
                        <span>Customer Login</span>
                        <ArrowRight className="w-4 h-4 text-[#FFF5E1]" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Toggle between OTP and Password Login */}
              <div className="text-center pt-1">
                {customerMethod === 'otp' ? (
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setSuccessMessage(null);
                      setCustomerMethod('password');
                    }}
                    className="text-xs font-semibold text-[#5A3C0B]/80 hover:text-[#422C09] hover:underline cursor-pointer"
                  >
                    Login with password instead
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setSuccessMessage(null);
                      setCustomerMethod('otp');
                    }}
                    className="text-xs font-semibold text-[#C48B28] hover:text-[#5A3C0B] hover:underline cursor-pointer"
                  >
                    Login with Email OTP
                  </button>
                )}
              </div>

              {/* Sign Up Action */}
              <div className="text-center">
                <p className="text-xs text-slate-600">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setSuccessMessage(null);
                      setMode('signup');
                      setSignupStep('form');
                    }}
                    className="font-bold text-[#C48B28] hover:text-[#5A3C0B] hover:underline cursor-pointer"
                  >
                    Sign Up
                  </button>
                </p>
              </div>

              {/* Separator to Owner Login */}
              <div className="border-t border-slate-100 pt-3 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setSuccessMessage(null);
                    setMode('owner-login');
                    setOwnerStep('credentials');
                  }}
                  className="text-xs font-bold text-[#5A3C0B]/75 hover:text-[#422C09] hover:underline flex items-center justify-center gap-1.5 mx-auto cursor-pointer transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#C48B28]" />
                  <span>Owner / Admin Login</span>
                </button>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* STEP 3 (FOR ALL FLOWS): MANUAL OTP VERIFICATION                */}
          {/* ============================================================== */}
          {((mode === 'customer-login' && customerStep === 'otp') ||
            (mode === 'signup' && signupStep === 'otp') ||
            (mode === 'owner-login' && ownerStep === 'otp')) && (
            <div className="p-6 space-y-5">
              {/* Destination Pill */}
              <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-2xl flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Mail className="w-4 h-4 text-[#C48B28] shrink-0" />
                  <span className="text-xs font-bold text-[#422C09] truncate">
                    {otpDestination || email || ownerEmail}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setSuccessMessage(null);
                    setOtpDigits(['', '', '', '', '', '']);
                    if (mode === 'customer-login') setCustomerStep('email');
                    if (mode === 'signup') setSignupStep('form');
                    if (mode === 'owner-login') setOwnerStep('credentials');
                  }}
                  className="text-[11px] font-bold text-[#C48B28] hover:text-[#5A3C0B] hover:underline shrink-0 cursor-pointer"
                >
                  Change email
                </button>
              </div>

              <form onSubmit={handleVerifyOtpSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-[#422C09] text-center mb-2">
                    Enter the 6-digit OTP sent to your email.
                  </label>

                  {/* 6 Individual Manual Typing Boxes */}
                  <div className="flex items-center justify-center gap-2 sm:gap-2.5">
                    {otpDigits.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => {
                          otpInputRefs.current[index] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={digit}
                        disabled={loading}
                        onChange={(e) => handleOtpBoxChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpBoxKeyDown(index, e)}
                        onPaste={handleOtpBoxPaste}
                        className={`w-11 h-14 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-black font-mono rounded-xl border-2 transition-all focus:outline-hidden disabled:opacity-50 ${
                          digit
                            ? 'border-[#C48B28] bg-amber-50/40 text-[#422C09]'
                            : 'border-slate-200 bg-slate-50 text-slate-800 focus:border-[#C48B28] focus:bg-white focus:ring-2 focus:ring-[#C48B28]/20'
                        }`}
                        aria-label={`Digit ${index + 1}`}
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || otpDigits.join('').length !== 6}
                  className="w-full py-3 px-4 bg-[#C48B28] hover:bg-[#A9741D] active:bg-[#8F6218] text-[#FFF5E1] font-black rounded-xl text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.99]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#FFF5E1]" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <span>Verify OTP</span>
                      <ArrowRight className="w-4 h-4 text-[#FFF5E1]" />
                    </>
                  )}
                </button>
              </form>

              {/* Resend OTP with Cooldown & Change email */}
              <div className="flex items-center justify-between text-xs pt-1 px-1">
                <div>
                  {resendCooldown > 0 ? (
                    <span className="text-slate-400 font-medium">
                      Resend OTP in{' '}
                      <span className="font-bold font-mono text-[#5A3C0B]">
                        {resendCooldown}s
                      </span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={loading}
                      onClick={handleResendOtp}
                      className="font-bold text-[#C48B28] hover:text-[#5A3C0B] hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Resend OTP</span>
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setSuccessMessage(null);
                    setOtpDigits(['', '', '', '', '', '']);
                    if (mode === 'customer-login') setCustomerStep('email');
                    if (mode === 'signup') setSignupStep('form');
                    if (mode === 'owner-login') setOwnerStep('credentials');
                  }}
                  className="font-semibold text-slate-500 hover:text-slate-800 hover:underline cursor-pointer"
                >
                  Change email
                </button>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* FLOW 2: SIGN UP (EMAIL -> PASSWORD -> CONFIRM PASSWORD -> SEND OTP) */}
          {/* ============================================================== */}
          {mode === 'signup' && signupStep === 'form' && (
            <div className="p-6 space-y-4">
              <form onSubmit={handleSignUpSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="signup-name-input"
                    className="block text-xs font-bold text-[#422C09] mb-1.5"
                  >
                    Full Name <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="signup-name-input"
                      type="text"
                      required
                      autoFocus
                      disabled={loading}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Vinay Sharma"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-[#C48B28] focus:bg-white rounded-xl text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#C48B28]/20 transition-all font-medium disabled:opacity-60"
                    />
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="signup-email-input"
                    className="block text-xs font-bold text-[#422C09] mb-1.5"
                  >
                    Email Address <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="signup-email-input"
                      type="email"
                      required
                      disabled={loading}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="student@college.edu"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-[#C48B28] focus:bg-white rounded-xl text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#C48B28]/20 transition-all font-medium disabled:opacity-60"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="signup-password-input"
                    className="block text-xs font-bold text-[#422C09] mb-1.5"
                  >
                    Password <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="signup-password-input"
                      type={showPassword ? 'text' : 'password'}
                      required
                      disabled={loading}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a secure password"
                      className="w-full pl-10 pr-11 py-3 bg-slate-50 border border-slate-200 focus:border-[#C48B28] focus:bg-white rounded-xl text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#C48B28]/20 transition-all font-medium disabled:opacity-60"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="signup-confirm-password-input"
                    className="block text-xs font-bold text-[#422C09] mb-1.5"
                  >
                    Confirm Password <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="signup-confirm-password-input"
                      type={showPassword ? 'text' : 'password'}
                      required
                      disabled={loading}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your password"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-[#C48B28] focus:bg-white rounded-xl text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#C48B28]/20 transition-all font-medium disabled:opacity-60"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="signup-phone-input"
                    className="block text-xs font-bold text-[#422C09] mb-1.5"
                  >
                    Phone Number <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <div className="relative">
                    <input
                      id="signup-phone-input"
                      type="tel"
                      disabled={loading}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-[#C48B28] focus:bg-white rounded-xl text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#C48B28]/20 transition-all font-medium disabled:opacity-60"
                    />
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !name.trim() || !email.trim() || !password}
                  className="w-full py-3 px-4 bg-[#C48B28] hover:bg-[#A9741D] active:bg-[#8F6218] text-[#FFF5E1] font-black rounded-xl text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.99]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#FFF5E1]" />
                      <span>Sending OTP...</span>
                    </>
                  ) : (
                    <>
                      <span>Send OTP</span>
                      <ArrowRight className="w-4 h-4 text-[#FFF5E1]" />
                    </>
                  )}
                </button>
              </form>

              {/* Already have account */}
              <div className="text-center pt-1">
                <p className="text-xs text-slate-600">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setSuccessMessage(null);
                      setMode('customer-login');
                      setCustomerStep('email');
                    }}
                    className="font-bold text-[#C48B28] hover:text-[#5A3C0B] hover:underline cursor-pointer"
                  >
                    Log In
                  </button>
                </p>
              </div>

              {/* Separator to Owner Login */}
              <div className="border-t border-slate-100 pt-3 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setSuccessMessage(null);
                    setMode('owner-login');
                    setOwnerStep('credentials');
                  }}
                  className="text-xs font-bold text-[#5A3C0B]/75 hover:text-[#422C09] hover:underline flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#C48B28]" />
                  <span>Owner / Admin Login</span>
                </button>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* FLOW 3: OWNER / ADMIN LOGIN (OWNER EMAIL -> PASSWORD -> OTP)  */}
          {/* ============================================================== */}
          {mode === 'owner-login' && ownerStep === 'credentials' && (
            <div className="p-6 space-y-4">
              {/* Security Shield Banner */}
              <div className="p-3 bg-amber-50 border border-amber-200/90 rounded-2xl flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-[#C48B28] shrink-0" />
                <div>
                  <div className="text-xs font-bold text-[#422C09]">
                    Restricted Administrator Area
                  </div>
                  <div className="text-[11px] text-[#5A3C0B]/80 font-mono">
                    Owner credentials &amp; 2FA verification required.
                  </div>
                </div>
              </div>

              <form onSubmit={handleOwnerCredentialsSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="owner-email-input"
                    className="block text-xs font-bold text-[#422C09] mb-1.5"
                  >
                    Owner Email <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="owner-email-input"
                      type="email"
                      required
                      autoFocus
                      disabled={loading}
                      value={ownerEmail}
                      onChange={(e) => setOwnerEmail(e.target.value)}
                      placeholder="vinay8046d@gmail.com"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-[#C48B28] focus:bg-white rounded-xl text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#C48B28]/20 transition-all font-mono font-medium disabled:opacity-60"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="owner-password-input"
                    className="block text-xs font-bold text-[#422C09] mb-1.5"
                  >
                    Owner Password <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="owner-password-input"
                      type={showOwnerPassword ? 'text' : 'password'}
                      required
                      disabled={loading}
                      value={ownerPassword}
                      onChange={(e) => setOwnerPassword(e.target.value)}
                      placeholder="Enter administrator password"
                      className="w-full pl-10 pr-11 py-3 bg-slate-50 border border-slate-200 focus:border-[#C48B28] focus:bg-white rounded-xl text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#C48B28]/20 transition-all font-medium disabled:opacity-60"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <button
                      type="button"
                      onClick={() => setShowOwnerPassword(!showOwnerPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                      title={showOwnerPassword ? 'Hide password' : 'Show password'}
                    >
                      {showOwnerPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !ownerEmail.trim() || !ownerPassword}
                  className="w-full py-3 px-4 bg-[#422C09] hover:bg-[#322107] text-[#FFF5E1] font-black rounded-xl text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.99] border border-[#C48B28]/40"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#FFF5E1]" />
                      <span>Sending OTP...</span>
                    </>
                  ) : (
                    <>
                      <span>Continue</span>
                      <ArrowRight className="w-4 h-4 text-[#FFF5E1]" />
                    </>
                  )}
                </button>
              </form>

              {/* Back to Customer Login */}
              <div className="border-t border-slate-100 pt-3 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setSuccessMessage(null);
                    setMode('customer-login');
                    setCustomerStep('email');
                  }}
                  className="text-xs font-bold text-[#5A3C0B] hover:text-[#422C09] hover:underline flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Customer &amp; Student Portal</span>
                </button>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* FLOW 4: FORGOT PASSWORD                                        */}
          {/* ============================================================== */}
          {mode === 'forgot-password' && (
            <div className="p-6 space-y-4">
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="forgot-email-input"
                    className="block text-xs font-bold text-[#422C09] mb-1.5"
                  >
                    Registered Email Address <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="forgot-email-input"
                      type="email"
                      required
                      autoFocus
                      disabled={loading}
                      value={forgotEmail || email}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="student@college.edu"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-[#C48B28] focus:bg-white rounded-xl text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#C48B28]/20 transition-all font-medium disabled:opacity-60"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !(forgotEmail || email).trim()}
                  className="w-full py-3 px-4 bg-[#C48B28] hover:bg-[#A9741D] active:bg-[#8F6218] text-[#FFF5E1] font-black rounded-xl text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.99]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#FFF5E1]" />
                      <span>Sending OTP...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Reset Code</span>
                      <ArrowRight className="w-4 h-4 text-[#FFF5E1]" />
                    </>
                  )}
                </button>
              </form>

              <div className="border-t border-slate-100 pt-3 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setSuccessMessage(null);
                    setMode('customer-login');
                    setCustomerStep('email');
                    setCustomerMethod('password');
                  }}
                  className="text-xs font-bold text-slate-600 hover:text-slate-900 hover:underline cursor-pointer"
                >
                  ← Back to Login
                </button>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* FLOW 5: RESET PASSWORD (NEW PASSWORD INPUT)                   */}
          {/* ============================================================== */}
          {mode === 'reset-password' && (
            <div className="p-6 space-y-4">
              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="reset-new-password"
                    className="block text-xs font-bold text-[#422C09] mb-1.5"
                  >
                    New Password <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="reset-new-password"
                    type="password"
                    required
                    autoFocus
                    disabled={loading}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter at least 4 characters"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-[#C48B28] focus:bg-white rounded-xl text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#C48B28]/20 transition-all font-medium disabled:opacity-60"
                  />
                </div>

                <div>
                  <label
                    htmlFor="reset-confirm-password"
                    className="block text-xs font-bold text-[#422C09] mb-1.5"
                  >
                    Confirm New Password <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="reset-confirm-password"
                    type="password"
                    required
                    disabled={loading}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Re-enter your new password"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-[#C48B28] focus:bg-white rounded-xl text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#C48B28]/20 transition-all font-medium disabled:opacity-60"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !newPassword || newPassword !== confirmNewPassword}
                  className="w-full py-3 px-4 bg-[#C48B28] hover:bg-[#A9741D] active:bg-[#8F6218] text-[#FFF5E1] font-black rounded-xl text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.99]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#FFF5E1]" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <span>Update Password</span>
                  )}
                </button>
              </form>

              <div className="border-t border-slate-100 pt-3 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setSuccessMessage(null);
                    setMode('customer-login');
                    setCustomerStep('email');
                    setCustomerMethod('password');
                  }}
                  className="text-xs font-bold text-slate-600 hover:text-slate-900 hover:underline cursor-pointer"
                >
                  ← Back to Login
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer info & discreet Backend Config modal trigger */}
        <div className="mt-6 flex items-center justify-between px-2 text-[11px] text-[#5A3C0B]/70">
          <span>PrintEase Secure Printing</span>
          <button
            type="button"
            onClick={() => setShowBackendConfig(true)}
            className="flex items-center gap-1 hover:text-[#422C09] hover:underline cursor-pointer"
            title="Configure Backend API Server URL"
          >
            <Server className="w-3 h-3 text-[#C48B28]" />
            <span>API Server: {getApiBaseUrl() ? 'Configured' : (isGitHubPages() ? 'Not set' : 'Local')}</span>
          </button>
        </div>
      </div>

      {/* Backend API Configuration Modal */}
      <BackendConfigModal
        isOpen={showBackendConfig}
        onClose={() => setShowBackendConfig(false)}
      />
    </div>
  );
};
