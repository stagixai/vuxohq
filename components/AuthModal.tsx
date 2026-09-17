'use client';

import React, { useState } from 'react';
import { ShieldCheck, Mail, Lock, User, Briefcase, ArrowRight, CheckCircle, X } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user: { email: string; full_name?: string }) => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [specialty, setSpecialty] = useState('Orthopedic Surgery');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (mode === 'signup') {
        // Simulating Supabase Auth Sign-Up with trigger mapping
        setTimeout(() => {
          setIsLoading(false);
          setSuccessMsg('Account created & profile trigger registered! Check email for activation link.');
          if (onSuccess) onSuccess({ email, full_name: fullName });
        }, 1200);
      } else {
        // Simulating Supabase Auth Sign-In
        setTimeout(() => {
          setIsLoading(false);
          setSuccessMsg('Successfully authenticated to VUXO Gateway.');
          if (onSuccess) onSuccess({ email });
          setTimeout(() => onClose(), 1000);
        }, 1000);
      }
    } catch (err) {
      setIsLoading(false);
      setErrorMsg(err instanceof Error ? err.message : 'Authentication failed.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative max-w-md w-full bg-[#0A0A0A] border border-[#D4AF37]/30 rounded-2xl p-6 md:p-8 shadow-[0_0_50px_rgba(212,175,55,0.15)] text-left">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-white/5 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="h-8 w-8 rounded bg-gradient-to-br from-[#D4AF37] to-[#AA7C11] flex items-center justify-center font-black text-black tracking-tighter text-lg">
            V
          </div>
          <div>
            <h3 className="font-bold text-white text-lg tracking-wide">
              VUXO<span className="text-[#D4AF37]">.AUTH</span>
            </h3>
            <p className="text-[10px] text-neutral-400 uppercase tracking-wider">
              B2B Operator & Medical Identity Layer
            </p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-white/10 mb-6 text-sm font-semibold">
          <button
            onClick={() => setMode('signup')}
            className={`flex-1 pb-3 text-center border-b-2 transition-all ${
              mode === 'signup'
                ? 'border-[#D4AF37] text-[#D4AF37]'
                : 'border-transparent text-neutral-500 hover:text-neutral-300'
            }`}
          >
            Register Operator
          </button>
          <button
            onClick={() => setMode('signin')}
            className={`flex-1 pb-3 text-center border-b-2 transition-all ${
              mode === 'signin'
                ? 'border-[#D4AF37] text-[#D4AF37]'
                : 'border-transparent text-neutral-500 hover:text-neutral-300'
            }`}
          >
            Sign In
          </button>
        </div>

        {/* Feedback Messages */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs text-emerald-400 flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <>
              <div>
                <label className="text-xs text-neutral-400 font-medium mb-1 block">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-3 text-neutral-500" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Dr. Alexander Vance"
                    className="w-full bg-neutral-900 border border-white/10 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#D4AF37] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-neutral-400 font-medium mb-1 block">Specialty / Role</label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 absolute left-3 top-3 text-neutral-500" />
                  <select
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    className="w-full bg-neutral-900 border border-white/10 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#D4AF37] transition-all"
                  >
                    <option value="Orthopedic Surgery">Orthopedic Surgery</option>
                    <option value="Neurosurgery">Neurosurgery</option>
                    <option value="Executive Operations">Executive Operations</option>
                    <option value="Clinical AI Director">Clinical AI Director</option>
                    <option value="General Operator">General Operator</option>
                  </select>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="text-xs text-neutral-400 font-medium mb-1 block">Work Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-neutral-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@clinic.com"
                className="w-full bg-neutral-900 border border-white/10 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#D4AF37] transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-neutral-400 font-medium mb-1 block">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-neutral-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-neutral-900 border border-white/10 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#D4AF37] transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#D4AF37] hover:bg-[#C59B27] disabled:opacity-50 text-black font-bold py-3 rounded-lg text-sm transition-all shadow-[0_0_20px_rgba(212,175,55,0.2)] flex items-center justify-center space-x-2 mt-2"
          >
            <span>{isLoading ? 'Processing...' : mode === 'signup' ? 'Create Pilot Identity' : 'Authenticate'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-neutral-500">
          <span className="flex items-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Supabase RLS Protected</span>
          </span>
          <span>vuxohq.tech</span>
        </div>
      </div>
    </div>
  );
}
