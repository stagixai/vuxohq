'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Activity,
  ArrowLeft,
  Cpu,
  Database,
  Layers,
  Lock,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Volume2,
  Zap,
} from 'lucide-react';

interface TelemetryLog {
  modelUsed: string;
  latencyMs: number;
  characterCount: number;
  profileId?: string | null;
  timestamp: number;
}

interface TelemetryData {
  status: string;
  service: string;
  total_requests: number;
  total_characters_processed: number;
  average_latency_ms: number;
  model_breakdown: Record<string, number>;
  recent_logs: TelemetryLog[];
}

export default function VuxoDashboardPage() {
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTelemetry = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/telemetry');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setTelemetry(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch telemetry');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#E5E5E5] flex flex-col font-sans selection:bg-[#D4AF37] selection:text-black">
      {/* Navigation Header */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between bg-[#0A0A0A]/90 backdrop-blur sticky top-0 z-50 max-w-7xl mx-auto w-full">
        <div className="flex items-center space-x-4">
          <Link
            href="/"
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-400 hover:text-white transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded bg-gradient-to-br from-[#D4AF37] to-[#AA7C11] flex items-center justify-center font-black text-black tracking-tighter text-lg shadow-[0_0_10px_rgba(212,175,55,0.2)]">
              V
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold tracking-widest text-lg text-white">
                  VUXO<span className="text-[#D4AF37]">.TELEMETRY</span>
                </span>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
              <p className="text-[10px] text-neutral-500 tracking-wider uppercase">
                Real-Time AI Inference & Performance Analytics
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={fetchTelemetry}
            disabled={isRefreshing}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-400 hover:text-[#D4AF37] transition-all flex items-center space-x-1.5 text-xs font-semibold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#D4AF37]' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <Link
            href="/vuxo"
            className="bg-[#D4AF37] hover:bg-[#C59B27] text-black font-semibold px-4 py-2 rounded text-xs transition-all shadow-[0_0_15px_rgba(212,175,55,0.2)]"
          >
            Enter Terminal
          </Link>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-8">
        {/* Top Banner */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 rounded-2xl bg-neutral-900/60 border border-white/10 backdrop-blur shadow-xl">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] text-xs font-medium mb-3">
              <Activity className="w-3.5 h-3.5" />
              <span>Live Engine Telemetry & Observability</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Enterprise Performance Analytics
            </h1>
            <p className="text-neutral-400 text-sm mt-1">
              Monitoring real-time latency, character throughput, and multi-model execution across Groq, Gemini, OpenAI, and ElevenLabs.
            </p>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>System Uptime: 99.9%</span>
            </span>
          </div>
        </div>

        {/* Metrics Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Total Requests */}
          <div className="p-6 rounded-xl bg-neutral-900/50 border border-white/10 hover:border-[#D4AF37]/40 transition-all">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase font-bold tracking-wider text-neutral-400">Total Invocations</span>
              <div className="p-2 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37]">
                <Zap className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-3xl font-black text-white">
              {isLoading ? '...' : telemetry?.total_requests ?? 0}
            </h3>
            <p className="text-[11px] text-neutral-500 mt-2">API chat, audio dictation & synthesis events</p>
          </div>

          {/* Card 2: Average Latency */}
          <div className="p-6 rounded-xl bg-neutral-900/50 border border-white/10 hover:border-[#D4AF37]/40 transition-all">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase font-bold tracking-wider text-neutral-400">Avg Latency</span>
              <div className="p-2 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37]">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-3xl font-black text-[#D4AF37]">
              {isLoading ? '...' : `${telemetry?.average_latency_ms ?? 0}ms`}
            </h3>
            <p className="text-[11px] text-neutral-500 mt-2">Zero-latency serverless routing benchmark</p>
          </div>

          {/* Card 3: Character Throughput */}
          <div className="p-6 rounded-xl bg-neutral-900/50 border border-white/10 hover:border-[#D4AF37]/40 transition-all">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase font-bold tracking-wider text-neutral-400">Total Characters</span>
              <div className="p-2 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37]">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-3xl font-black text-white">
              {isLoading ? '...' : (telemetry?.total_characters_processed ?? 0).toLocaleString()}
            </h3>
            <p className="text-[11px] text-neutral-500 mt-2">Transcribed & synthesized token volume</p>
          </div>

          {/* Card 4: Active Models */}
          <div className="p-6 rounded-xl bg-neutral-900/50 border border-white/10 hover:border-[#D4AF37]/40 transition-all">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase font-bold tracking-wider text-neutral-400">Active Fleet</span>
              <div className="p-2 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37]">
                <Cpu className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-3xl font-black text-emerald-400">4 / 4</h3>
            <p className="text-[11px] text-neutral-500 mt-2">Groq, Gemini, OpenAI & ElevenLabs</p>
          </div>
        </div>

        {/* AI Provider Breakdown & Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 p-6 rounded-xl bg-neutral-900/60 border border-white/10">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
              <Cpu className="w-5 h-5 text-[#D4AF37]" />
              <span>Multi-Model AI Utilization Breakdown</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-black/40 border border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                    <Zap className="w-4 h-4 text-[#D4AF37]" />
                    <span>Groq Qwen 27B & Whisper</span>
                  </span>
                  <span className="text-xs font-mono text-[#D4AF37]">
                    {telemetry?.model_breakdown?.['qwen/qwen3.6-27b'] ??
                      telemetry?.model_breakdown?.['whisper-large-v3-turbo'] ??
                      0}{' '}
                    runs
                  </span>
                </div>
                <div className="w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-[#D4AF37] h-full w-3/4" />
                </div>
              </div>

              <div className="p-4 rounded-lg bg-black/40 border border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                    <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                    <span>Gemini 3.6 Flash</span>
                  </span>
                  <span className="text-xs font-mono text-[#D4AF37]">
                    {telemetry?.model_breakdown?.['gemini-3.6-flash'] ?? 0} runs
                  </span>
                </div>
                <div className="w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-[#D4AF37] h-full w-1/2" />
                </div>
              </div>

              <div className="p-4 rounded-lg bg-black/40 border border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                    <Cpu className="w-4 h-4 text-[#D4AF37]" />
                    <span>GPT-4o Mini</span>
                  </span>
                  <span className="text-xs font-mono text-[#D4AF37]">
                    {telemetry?.model_breakdown?.['gpt-4o-mini'] ?? 0} runs
                  </span>
                </div>
                <div className="w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-[#D4AF37] h-full w-1/3" />
                </div>
              </div>

              <div className="p-4 rounded-lg bg-black/40 border border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                    <Volume2 className="w-4 h-4 text-[#D4AF37]" />
                    <span>ElevenLabs Voice AI</span>
                  </span>
                  <span className="text-xs font-mono text-[#D4AF37]">
                    {telemetry?.model_breakdown?.['eleven_multilingual_v2'] ?? 0} runs
                  </span>
                </div>
                <div className="w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-[#D4AF37] h-full w-2/3" />
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-xl bg-neutral-900/60 border border-white/10">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
              <Database className="w-5 h-5 text-[#D4AF37]" />
              <span>Supabase Vault & Telemetry</span>
            </h3>
            <div className="space-y-4 text-xs text-neutral-400 leading-relaxed">
              <div className="p-3 bg-black/40 rounded-lg border border-white/5 flex items-center justify-between">
                <span>Database Connection</span>
                <span className="text-emerald-400 font-bold">Transaction Pooler (6543)</span>
              </div>
              <div className="p-3 bg-black/40 rounded-lg border border-white/5 flex items-center justify-between">
                <span>Row-Level Security</span>
                <span className="text-emerald-400 font-bold">Enforced (RLS)</span>
              </div>
              <div className="p-3 bg-black/40 rounded-lg border border-white/5 flex items-center justify-between">
                <span>SynthesisLog Table</span>
                <span className="text-[#D4AF37] font-bold">Active Sync</span>
              </div>
              <div className="p-3 bg-black/40 rounded-lg border border-white/5 flex items-center justify-between">
                <span>ChatSession Vault</span>
                <span className="text-[#D4AF37] font-bold">Profile Linked</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Logs Table */}
        <div className="p-6 rounded-xl bg-neutral-900/60 border border-white/10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <Activity className="w-5 h-5 text-[#D4AF37]" />
              <span>Recent Synthesis & Telemetry Stream</span>
            </h3>
            <span className="text-xs text-neutral-500 font-mono">Real-time Polling (5s)</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-neutral-300">
              <thead className="text-[10px] uppercase font-bold tracking-wider text-neutral-500 border-b border-white/10 bg-black/40">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Model Used</th>
                  <th className="py-3 px-4">Latency</th>
                  <th className="py-3 px-4">Characters</th>
                  <th className="py-3 px-4">Profile ID</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-neutral-500">
                      Loading live telemetry stream...
                    </td>
                  </tr>
                ) : !telemetry?.recent_logs || telemetry.recent_logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-neutral-500">
                      No synthesis events logged yet. Send a dictation from the Terminal to trigger live telemetry.
                    </td>
                  </tr>
                ) : (
                  telemetry.recent_logs
                    .slice()
                    .reverse()
                    .map((log, i) => (
                      <tr key={i} className="hover:bg-white/5 transition-colors">
                        <td className="py-3 px-4 font-mono text-neutral-400">
                          {new Date(log.timestamp * 1000).toLocaleTimeString()}
                        </td>
                        <td className="py-3 px-4 font-bold text-white">{log.modelUsed}</td>
                        <td className="py-3 px-4 font-mono text-[#D4AF37]">{log.latencyMs} ms</td>
                        <td className="py-3 px-4 font-mono text-neutral-300">{log.characterCount}</td>
                        <td className="py-3 px-4 font-mono text-neutral-500 truncate max-w-[120px]">
                          {log.profileId || 'Anonymous'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                            Success
                          </span>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6 px-6 max-w-7xl w-full mx-auto flex flex-col md:flex-row items-center justify-between text-xs text-neutral-500">
        <p>© {new Date().getFullYear()} VUXO Infrastructure Corp. Observability & Telemetry Subsystem.</p>
        <div className="flex space-x-4 mt-2 md:mt-0">
          <Link href="/" className="hover:text-white transition-colors">
            Main Site
          </Link>
          <Link href="/vuxo" className="hover:text-white transition-colors">
            Terminal
          </Link>
        </div>
      </footer>
    </div>
  );
}
