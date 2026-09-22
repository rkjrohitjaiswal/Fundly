import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import { X, Loader2, AlertCircle, ArrowRight, UserCheck, ShieldCheck } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: 'signin' | 'signup';
  onClose: () => void;
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode = 'signin',
  onClose,
  onSuccess,
}) => {
  const { login, register } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (mode === 'signup') {
      if (!fullName.trim()) {
        setErrorMsg('Please enter your full name.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match.');
        return;
      }
      if (password.length < 6) {
        setErrorMsg('Password must be at least 6 characters.');
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        await register(fullName.trim(), email.trim(), password);
      } else {
        await login(email.trim(), password);
      }
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.message || 'Authentication error. Please check your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDemoPersona = async (demoEmail: string) => {
    setErrorMsg(null);
    setLoading(true);
    try {
      await login(demoEmail, 'password123');
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Demo sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="fundly-auth-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden animate-in zoom-in-95 duration-150 relative">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="p-6 pb-2 text-center">
          <div className="w-12 h-12 rounded-2xl bg-sky-500 text-white font-black text-2xl flex items-center justify-center mx-auto shadow-md shadow-sky-500/20 mb-3">
            F
          </div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">
            {mode === 'signup' ? 'Create your Fundly Account' : 'Welcome to Fundly'}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Peer-to-peer lending, made simple.
          </p>

          {/* Tab Switcher */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl mt-4 border border-slate-200/80">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setErrorMsg(null);
              }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mode === 'signin'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMsg(null);
              }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mode === 'signup'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Sign Up
            </button>
          </div>
        </div>

        {/* Demo Personas for Quick Review */}
        <div className="px-6 py-2">
          <div className="p-2.5 rounded-xl bg-sky-50/70 border border-sky-100 text-center">
            <span className="text-[10px] font-bold text-sky-800 uppercase tracking-wider block mb-1.5">
              Instant Demo Access
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleDemoPersona('sarah@fundly.demo')}
                className="py-1.5 px-1 rounded-lg bg-white border border-sky-200/70 text-[11px] font-semibold text-slate-700 hover:text-sky-600 hover:border-sky-300 transition-colors shadow-2xs"
              >
                Sarah (Lender)
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleDemoPersona('alex@fundly.demo')}
                className="py-1.5 px-1 rounded-lg bg-white border border-sky-200/70 text-[11px] font-semibold text-slate-700 hover:text-sky-600 hover:border-sky-300 transition-colors shadow-2xs"
              >
                Alex (Borrower)
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleDemoPersona('michael@fundly.demo')}
                className="py-1.5 px-1 rounded-lg bg-white border border-sky-200/70 text-[11px] font-semibold text-slate-700 hover:text-sky-600 hover:border-sky-300 transition-colors shadow-2xs"
              >
                Michael (Friend)
              </button>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 pt-2 space-y-3.5">
          {mode === 'signup' && (
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                Full Name
              </label>
              <input
                type="text"
                placeholder="e.g. Marcus Wright"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white transition-colors"
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
              Email Address
            </label>
            <input
              type="email"
              placeholder="you@fundly.demo"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white transition-colors"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                Password
              </label>
              {mode === 'signin' && (
                <button
                  type="button"
                  onClick={() => alert('For testing, use password123 with any demo account or register a new one.')}
                  className="text-[11px] text-sky-600 hover:underline font-medium"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white transition-colors"
            />
          </div>

          {mode === 'signup' && (
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                Confirm Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white transition-colors"
              />
            </div>
          )}

          {errorMsg && (
            <div className="flex items-center gap-1.5 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-600">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-sky-500 hover:bg-sky-600 active:scale-[0.99] text-white text-xs font-bold transition-all shadow-sm shadow-sky-500/20 flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>{mode === 'signup' ? 'Create Account' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Toggle helper */}
          <div className="text-center pt-2 text-xs text-slate-500">
            {mode === 'signup' ? (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setErrorMsg(null);
                  }}
                  className="font-bold text-sky-600 hover:underline"
                >
                  Sign In
                </button>
              </>
            ) : (
              <>
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setErrorMsg(null);
                  }}
                  className="font-bold text-sky-600 hover:underline"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
