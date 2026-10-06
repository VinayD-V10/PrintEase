import React, { useState } from 'react';
import {
  Lock,
  Mail,
  User as UserIcon,
  Phone,
  Shield,
  X,
  AlertCircle,
  Loader2,
  Store,
  GraduationCap,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { User } from '../types/printease';
import {
  clientAuthenticateUser,
  clientRegisterUser,
  saveClientCurrentUser,
} from '../data/mockData';

interface Props {
  onClose: () => void;
  onAuthSuccess: (user: User, token: string) => void;
  onOpenShopkeeperLogin?: () => void;
}

export const AuthModal: React.FC<Props> = ({
  onClose,
  onAuthSuccess,
  onOpenShopkeeperLogin,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === 'register') {
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      if (password.length < 4) {
        setError('Password must be at least 4 characters.');
        return;
      }
    }

    setLoading(true);
    const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
    const body =
      mode === 'login'
        ? { email: email.trim(), password }
        : { name: name.trim(), email: email.trim(), phone: phone.trim(), password };

    try {
      let authUser: User | null = null;
      let authToken: string | null = null;

      // Try server endpoint if backend is active
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        // CRITICAL FIX: Verify content-type is JSON before calling res.json()
        // On GitHub Pages or static host, 404 returns HTML ('<html>...'), which causes
        // "Unexpected token '<', '<html> <he'... is not valid JSON".
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await res.json();
          if (res.ok && data.user && data.token) {
            authUser = data.user;
            authToken = data.token;
          } else if (!res.ok) {
            throw new Error(data.error || 'Invalid email or password.');
          }
        }
      } catch (networkErr: any) {
        // If server responded with an explicit business error, respect it
        if (
          networkErr.message &&
          !networkErr.message.includes('JSON') &&
          !networkErr.message.includes('Unexpected token') &&
          !networkErr.message.includes('fetch')
        ) {
          throw networkErr;
        }
        // Otherwise fall through seamlessly to client authentication vault
      }

      // If backend was offline, static hosting, or unconfigured:
      if (!authUser || !authToken) {
        if (mode === 'login') {
          const result = clientAuthenticateUser(email, password);
          authUser = result.user;
          authToken = result.token;
        } else {
          const result = clientRegisterUser({ name, email, phone, password });
          authUser = result.user;
          authToken = result.token;
        }
      }

      saveClientCurrentUser(authUser);
      onAuthSuccess(authUser, authToken);
      onClose();
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('Unexpected token') || msg.includes('JSON')) {
        setError('Login credentials could not be verified. Please try again.');
      } else {
        setError(msg || 'Authentication failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = (userType: 'student' | 'vinay') => {
    setError(null);
    if (userType === 'student') {
      setEmail('student@college.edu');
      setPassword('student123');
    } else {
      setEmail('vinay8046d@gmail.com');
      setPassword('vinay123');
    }
    setMode('login');
  };

  const handleInstantDirectLogin = (userType: 'student' | 'vinay') => {
    setError(null);
    setLoading(true);
    try {
      const targetEmail = userType === 'student' ? 'student@college.edu' : 'vinay8046d@gmail.com';
      const targetPass = userType === 'student' ? 'student123' : 'vinay123';
      const result = clientAuthenticateUser(targetEmail, targetPass);
      saveClientCurrentUser(result.user);
      onAuthSuccess(result.user, result.token);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-[#422C09] via-[#5A3C0B] to-[#422C09] text-[#FFF5E1] flex items-center justify-between border-b border-[#C48B28]/30">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#EBC176] flex items-center gap-1.5">
              <UserIcon className="w-3.5 h-3.5 text-[#EBC176]" />
              <span>Customer &amp; Student Portal</span>
            </span>
            <h3 className="text-xl font-extrabold tracking-tight mt-0.5">
              {mode === 'login' ? 'Sign In to PrintEase' : 'Create Student Account'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Customer Demo Fill Buttons */}
        <div className="bg-amber-50/70 border-b border-amber-200/60 px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <span className="font-bold text-[#422C09] flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-[#C48B28]" />
            <span>1-Tap Customer Logins:</span>
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleInstantDirectLogin('vinay')}
              className="px-2.5 py-1 rounded-lg bg-[#C48B28] hover:bg-[#A3721E] text-[#FFF5E1] font-bold transition-colors flex items-center gap-1 cursor-pointer shadow-2xs text-[11px]"
              title="1-Tap Instant Sign In as Vinay"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>Vinay (Customer)</span>
            </button>
            <button
              type="button"
              onClick={() => handleInstantDirectLogin('student')}
              className="px-2.5 py-1 rounded-lg bg-[#5A3C0B] hover:bg-[#422C09] text-[#FFF5E1] font-bold transition-colors flex items-center gap-1 cursor-pointer shadow-2xs text-[11px]"
              title="1-Tap Instant Sign In as Aarav Patel"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Aarav (Student)</span>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Full Name *
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Vinay / Aarav"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#C48B28]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vinay8046d@gmail.com or your email"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#C48B28]"
              />
            </div>
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mobile Number *
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
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Password *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#C48B28] font-mono"
              />
            </div>
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Confirm Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#C48B28] font-mono"
                />
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-smooth btn-dual-shimmer w-full py-3 text-[#FFF5E1] font-extrabold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing In...</span>
              </>
            ) : (
              <span>{mode === 'login' ? 'Sign In' : 'Complete Registration'}</span>
            )}
          </button>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 text-xs">
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setError(null);
              }}
              className="font-semibold text-[#C48B28] hover:underline cursor-pointer"
            >
              {mode === 'login'
                ? "Don't have an account? Register here"
                : 'Already registered? Sign in'}
            </button>

            {onOpenShopkeeperLogin && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenShopkeeperLogin();
                }}
                className="text-slate-500 hover:text-[#422C09] flex items-center gap-1 cursor-pointer font-medium"
              >
                <Store className="w-3.5 h-3.5 text-[#C48B28]" />
                <span>Shopkeeper Portal</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

