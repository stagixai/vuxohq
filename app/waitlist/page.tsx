'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Mail, CheckCircle2, Clock, Send, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export default function WaitlistPage() {
  const [email, setEmail] = useState('');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) {
        setUserEmail(user.email);
        setEmail(user.email);
        fetchStatus(user.email);
      }
    });
  }, []);

  const fetchStatus = async (userMail: string) => {
    const { data } = await supabase
      .from('Waitlist')
      .select('status')
      .eq('email', userMail)
      .single();

    if (data?.status) {
      setStatus(data.status as 'pending' | 'approved' | 'rejected');
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(data.message);
        setStatus('pending');
      } else {
        setMessage(data.error || 'Failed to submit registration');
      }
    } catch {
      setMessage('Network error submitting waitlist request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col font-sans selection:bg-[#D4AF37] selection:text-black">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between bg-[#0A0A0A]/90 backdrop-blur">
        <div className="flex items-center space-x-4">
          <Link
            href="/"
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-400 hover:text-white transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded bg-gradient-to-br from-[#D4AF37] to-[#AA7C11] flex items-center justify-center font-black text-black tracking-tighter text-lg">
              V
            </div>
            <span className="font-bold tracking-widest text-lg text-white">
              VUXO<span className="text-[#D4AF37]">.ACCESS</span>
            </span>
          </div>
        </div>
        <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full flex items-center space-x-1.5">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Beta Access Gate</span>
        </span>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 max-w-xl mx-auto w-full text-center">
        <div className="p-3 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] mb-6">
          <Sparkles className="w-8 h-8" />
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-3">
          VUXO Infrastructure Beta Waitlist
        </h1>
        <p className="text-neutral-400 text-sm leading-relaxed mb-8">
          VUXO is currently in high-demand enterprise beta preview. Dictation terminals and voice synthesis APIs are strictly gated to authorized clinical partners.
        </p>

        {status === 'approved' ? (
          <div className="bg-emerald-500/10 border border-emerald-500/30 p-6 rounded-2xl w-full text-left space-y-3">
            <div className="flex items-center space-x-2 text-emerald-400 font-bold">
              <CheckCircle2 className="w-5 h-5" />
              <span>Access Approved</span>
            </div>
            <p className="text-xs text-neutral-300">
              Your account ({userEmail}) has been authorized for VUXO Executive Terminal access.
            </p>
            <Link
              href="/vuxo"
              className="inline-block mt-2 bg-[#D4AF37] text-black font-bold px-4 py-2 rounded-lg text-xs hover:bg-[#C59B27] transition-all"
            >
              Launch VUXO Terminal →
            </Link>
          </div>
        ) : status === 'pending' ? (
          <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 p-6 rounded-2xl w-full text-left space-y-3">
            <div className="flex items-center space-x-2 text-[#D4AF37] font-bold">
              <Clock className="w-5 h-5 animate-spin" />
              <span>Application Under Review</span>
            </div>
            <p className="text-xs text-neutral-300">
              Your email ({userEmail || email}) is registered on our access waitlist. Priority approval invites are issued weekly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleJoin} className="w-full space-y-4">
            <div className="relative flex items-center bg-neutral-900 border border-white/10 rounded-xl focus-within:border-[#D4AF37] transition-all p-1.5">
              <Mail className="w-5 h-5 text-neutral-500 ml-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter enterprise clinical email..."
                className="flex-1 bg-transparent px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-[#D4AF37] hover:bg-[#C59B27] disabled:opacity-40 text-black font-bold px-4 py-2 rounded-lg text-xs transition-all flex items-center space-x-1.5"
              >
                <span>Request Access</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
            {message && <p className="text-xs text-[#D4AF37] mt-2">{message}</p>}
          </form>
        )}
      </main>
    </div>
  );
}
