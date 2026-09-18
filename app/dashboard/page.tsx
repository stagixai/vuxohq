'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Activity, ShieldCheck, Zap } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface UserTelemetryData {
  user: { id: string; email: string };
  summary: {
    totalSessions: number;
    totalCharacters: number;
    avgLatencyMs: number;
  };
  recentSessions: Array<{
    id: string;
    title: string;
    createdAt?: string;
    created_at?: string;
  }>;
}

export default function Dashboard() {
  const [data, setData] = useState<UserTelemetryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTelemetry = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/telemetry/user', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error('Telemetry fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTelemetry();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-neutral-300 p-8 font-mono flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 rounded-full bg-[#D4AF37] animate-ping" />
          <span>Loading VUXO Operator Dashboard...</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-neutral-300 p-8 font-mono flex flex-col items-center justify-center space-y-4">
        <div className="h-10 w-10 rounded bg-gradient-to-br from-[#D4AF37] to-[#AA7C11] flex items-center justify-center font-black text-black text-xl mb-2">
          V
        </div>
        <h2 className="text-xl font-bold text-white">Authentication Required</h2>
        <p className="text-sm text-neutral-400">Please sign in to your operator account to view telemetry analytics.</p>
        <div className="flex space-x-4 mt-4">
          <Link
            href="/"
            className="bg-[#D4AF37] hover:bg-[#C59B27] text-black font-bold px-6 py-2.5 rounded text-sm transition-all shadow-[0_0_20px_rgba(212,175,55,0.2)]"
          >
            Operator Sign In
          </Link>
          <Link
            href="/vuxo"
            className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium px-6 py-2.5 rounded text-sm transition-all"
          >
            Terminal
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-neutral-200 p-6 md:p-10 font-mono selection:bg-[#D4AF37] selection:text-black">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-6">
          <div className="flex items-center space-x-4">
            <Link
              href="/vuxo"
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-400 hover:text-white transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded bg-gradient-to-br from-[#D4AF37] to-[#AA7C11] flex items-center justify-center font-black text-black tracking-tighter text-lg">
                V
              </div>
              <h1 className="text-2xl font-bold text-[#D4AF37]">VUXO Operator Dashboard</h1>
            </div>
          </div>
          <span className="bg-neutral-900 border border-[#D4AF37]/30 px-4 py-1.5 rounded-full text-xs text-[#D4AF37] font-semibold flex items-center space-x-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{data.user.email}</span>
          </span>
        </div>

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-neutral-900/80 p-6 rounded-xl border border-white/10 hover:border-[#D4AF37]/40 transition-all">
            <div className="flex items-center justify-between text-neutral-400 mb-2">
              <h3 className="text-xs uppercase tracking-wider font-bold">Total Sessions</h3>
              <Zap className="w-4 h-4 text-[#D4AF37]" />
            </div>
            <p className="text-4xl font-extrabold text-white mt-2">{data.summary.totalSessions}</p>
          </div>

          <div className="bg-neutral-900/80 p-6 rounded-xl border border-white/10 hover:border-[#D4AF37]/40 transition-all">
            <div className="flex items-center justify-between text-neutral-400 mb-2">
              <h3 className="text-xs uppercase tracking-wider font-bold">Avg. Latency</h3>
              <Activity className="w-4 h-4 text-[#D4AF37]" />
            </div>
            <p className="text-4xl font-extrabold text-[#D4AF37] mt-2">
              {data.summary.avgLatencyMs} <span className="text-lg text-neutral-500 font-normal">ms</span>
            </p>
          </div>

          <div className="bg-neutral-900/80 p-6 rounded-xl border border-white/10 hover:border-[#D4AF37]/40 transition-all">
            <div className="flex items-center justify-between text-neutral-400 mb-2">
              <h3 className="text-xs uppercase tracking-wider font-bold">Characters Processed</h3>
              <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
            </div>
            <p className="text-4xl font-extrabold text-emerald-400 mt-2">
              {data.summary.totalCharacters.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Recent Sessions List */}
        <div className="bg-neutral-900/60 p-6 rounded-xl border border-white/10">
          <h2 className="text-lg font-bold text-white mb-6 border-b border-white/10 pb-3 flex items-center justify-between">
            <span>Recent Operator Dictations</span>
            <span className="text-xs font-normal text-neutral-500">Supabase ChatSession Vault</span>
          </h2>
          <ul className="space-y-3">
            {data.recentSessions.map((session) => {
              const dateVal = session.createdAt || session.created_at;
              return (
                <li
                  key={session.id}
                  className="bg-black/50 p-4 rounded-lg border border-white/5 flex flex-col sm:flex-row justify-between sm:items-center gap-2 hover:border-[#D4AF37]/40 transition-colors"
                >
                  <span className="font-medium text-white truncate max-w-lg">
                    {session.title || 'Untitled Clinical Session'}
                  </span>
                  <span className="text-neutral-500 text-xs shrink-0">
                    {dateVal ? new Date(dateVal).toLocaleDateString() : ''}{' '}
                    {dateVal ? new Date(dateVal).toLocaleTimeString() : ''}
                  </span>
                </li>
              );
            })}
            {data.recentSessions.length === 0 && (
              <li className="text-neutral-500 text-sm italic py-4 text-center">
                No dictation sessions recorded yet. Start a session in the terminal to view session logs.
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
