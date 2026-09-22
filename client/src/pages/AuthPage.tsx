import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { ArrowRight, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, register } = useAuth();

  const [isRegister, setIsRegister] = useState(searchParams.get('mode') === 'signup');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      if (isRegister) {
        if (!displayName.trim()) {
          setErrorMsg('Full name is required.');
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
        await register(displayName.trim(), email.trim(), password);
      } else {
        await login(email.trim(), password);
      }
      navigate('/');
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.message || 'Authentication failed. Please verify credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await login(demoEmail, 'password123');
      navigate('/');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="auth-screen"
      className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-center px-4 py-8 font-sans"
    >
      <div className="w-full max-w-sm mx-auto space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div
            onClick={() => navigate('/')}
            className="cursor-pointer w-12 h-12 rounded-2xl bg-sky-500 text-white font-black text-2xl flex items-center justify-center mx-auto shadow-md shadow-sky-500/20"
          >
            F
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">FUNDLY</h1>
          <p className="text-xs text-slate-500 font-medium">Peer-to-peer lending, made simple.</p>
        </div>

        {/* Demo Fast-Login Box */}
        <div className="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-100 space-y-2 text-center shadow-xs">
          <span className="text-[10px] font-bold text-sky-800 uppercase tracking-wider block">
            One-Click Demo Personas
          </span>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleDemoLogin('sarah@fundly.demo')}
              className="py-1.5 px-1 rounded-xl bg-white hover:bg-slate-50 border border-sky-200/80 text-[11px] font-bold text-slate-700 hover:text-sky-600 transition-colors shadow-2xs"
            >
              Sarah (Lender)
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleDemoLogin('alex@fundly.demo')}
              className="py-1.5 px-1 rounded-xl bg-white hover:bg-slate-50 border border-sky-200/80 text-[11px] font-bold text-slate-700 hover:text-sky-600 transition-colors shadow-2xs"
            >
              Alex (Borrower)
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleDemoLogin('michael@fundly.demo')}
              className="py-1.5 px-1 rounded-xl bg-white hover:bg-slate-50 border border-sky-200/80 text-[11px] font-bold text-slate-700 hover:text-sky-600 transition-colors shadow-2xs"
            >
              Michael (Friend)
            </button>
          </div>
        </div>

        {/* Auth Card */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-md space-y-4">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => {
                setIsRegister(false);
                setErrorMsg(null);
              }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                !isRegister ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegister(true);
                setErrorMsg(null);
              }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                isRegister ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {isRegister && (
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Marcus Wright"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white"
                  required
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                Email Address
              </label>
              <input
                type="email"
                placeholder="name@fundly.demo"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white"
                required
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  Password
                </label>
                {!isRegister && (
                  <button
                    type="button"
                    onClick={() => alert('For testing, use password123 with any demo account.')}
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
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white"
                required
              />
            </div>

            {isRegister && (
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  Confirm Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white"
                  required
                />
              </div>
            )}

            {errorMsg && (
              <div className="flex items-center gap-1.5 p-2 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-600">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-sm shadow-sky-500/20"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>{isRegister ? 'Create Account' : 'Sign In'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="text-center pt-2 text-xs text-slate-500">
              {isRegister ? (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegister(false);
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
                      setIsRegister(true);
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

        <div className="text-center text-xs text-slate-500">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="hover:text-sky-600 underline font-medium"
          >
            &larr; Back to Public Marketplace
          </button>
        </div>
      </div>
    </div>
  );
};
