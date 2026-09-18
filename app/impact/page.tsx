'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Clock, Zap, Activity } from 'lucide-react';

function useCountUp(end: number, duration: number = 2000) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let startTime: number;
    let animationFrame: number;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        animationFrame = requestAnimationFrame(step);
      }
    };
    animationFrame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration]);
  return count;
}

export default function ImpactDashboard() {
  const [metrics, setMetrics] = useState({
    totalCharacters: 0,
    hoursSaved: 0,
    totalSessions: 0,
    avgLatencyMs: 0,
    totalAudioSeconds: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await fetch('/api/telemetry/public');
        const data = await res.json();
        setMetrics({
          totalCharacters: data.totalCharacters || 0,
          hoursSaved: data.hoursSaved || 0,
          totalSessions: data.totalSessions || 0,
          avgLatencyMs: data.avgLatencyMs || 0,
          totalAudioSeconds: data.totalAudioSeconds || 0,
        });
      } catch (err) {
        console.error('Impact metrics fetch failed:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  const animatedChars = useCountUp(metrics.totalCharacters);
  const animatedHours = useCountUp(metrics.hoursSaved * 10) / 10;
  const animatedSessions = useCountUp(metrics.totalSessions);
  const animatedAudioMinutes = useCountUp(Math.round(metrics.totalAudioSeconds / 60));

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center text-[#D4AF37] font-mono space-y-3">
        <Activity className="w-8 h-8 animate-spin" />
        <span className="text-xs uppercase tracking-widest text-neutral-400">
          Initializing Impact Matrix Telemetry...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-gray-100 p-6 sm:p-10 font-sans flex flex-col items-center selection:bg-[#D4AF37] selection:text-black">
      {/* Top Header */}
      <header className="w-full max-w-5xl flex items-center justify-between border-b border-white/10 pb-6 mb-10">
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
              VUXO<span className="text-[#D4AF37]">.IMPACT</span>
            </span>
          </div>
        </div>

        <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full flex items-center space-x-2">
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          <span className="font-semibold uppercase text-[10px] tracking-wider">
            Live Stream • Opus Compressed
          </span>
        </span>
      </header>

      <div className="max-w-5xl w-full space-y-8">
        <div className="text-center space-y-3">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
            VUXO Infrastructure Impact
          </h1>
          <p className="text-neutral-400 text-sm sm:text-base max-w-2xl mx-auto">
            Real-time telemetry measuring administrative burnout mitigation, clinical voice synthesis throughput, and sub-second serverless latency.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Hours Saved */}
          <div className="bg-gradient-to-br from-[#D4AF37]/15 to-neutral-900/80 p-8 rounded-2xl border border-[#D4AF37]/30 backdrop-blur-sm relative overflow-hidden shadow-xl">
            <div className="absolute top-4 right-4 opacity-10">
              <Clock className="w-28 h-28 text-[#D4AF37]" />
            </div>
            <h3 className="text-neutral-400 text-xs uppercase font-bold tracking-widest mb-2">
              Administrative Hours Saved
            </h3>
            <p className="text-6xl font-black text-[#D4AF37] tracking-tight">{animatedHours}</p>
            <p className="text-neutral-400 text-xs mt-3">
              Restored to direct clinical and executive care
            </p>
          </div>

          {/* Audio Minutes Processed */}
          <div className="bg-gradient-to-br from-purple-900/20 to-neutral-900/80 p-8 rounded-2xl border border-purple-500/30 backdrop-blur-sm shadow-xl">
            <h3 className="text-neutral-400 text-xs uppercase font-bold tracking-widest mb-2">
              Audio Minutes Transcribed
            </h3>
            <p className="text-6xl font-black text-purple-400 tracking-tight">{animatedAudioMinutes}</p>
            <p className="text-neutral-400 text-xs mt-3">
              Processed via Groq Whisper AI (16kbps Opus)
            </p>
          </div>

          {/* Characters Processed */}
          <div className="bg-gradient-to-br from-blue-900/20 to-neutral-900/80 p-8 rounded-2xl border border-blue-500/30 backdrop-blur-sm shadow-xl">
            <h3 className="text-neutral-400 text-xs uppercase font-bold tracking-widest mb-2">
              Characters Transcribed
            </h3>
            <p className="text-6xl font-black text-blue-400 tracking-tight">{animatedChars.toLocaleString()}</p>
            <p className="text-neutral-400 text-xs mt-3">
              Zero-latency serverless JSON-base64 pipeline
            </p>
          </div>

          {/* Sessions */}
          <div className="bg-gradient-to-br from-emerald-900/20 to-neutral-900/80 p-8 rounded-2xl border border-emerald-500/30 backdrop-blur-sm shadow-xl">
            <h3 className="text-neutral-400 text-xs uppercase font-bold tracking-widest mb-2">
              Operator Sessions
            </h3>
            <p className="text-6xl font-black text-emerald-400 tracking-tight">{animatedSessions.toLocaleString()}</p>
            <p className="text-neutral-400 text-xs mt-3">
              Cryptographically secured via Supabase RLS
            </p>
          </div>
        </div>

        {/* Technical Specifications */}
        <div className="bg-neutral-900/80 p-6 rounded-2xl border border-white/10 shadow-lg">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center space-x-2">
            <Zap className="w-4 h-4 text-[#D4AF37]" />
            <span>Infrastructure Specifications</span>
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
            <div className="bg-black/40 p-3 rounded-lg border border-white/5">
              <span className="text-neutral-500 block">Avg Latency:</span>
              <span className="text-emerald-400 font-bold text-sm">{metrics.avgLatencyMs}ms</span>
            </div>
            <div className="bg-black/40 p-3 rounded-lg border border-white/5">
              <span className="text-neutral-500 block">Audio Codec:</span>
              <span className="text-blue-400 font-bold text-sm">Opus 16kbps</span>
            </div>
            <div className="bg-black/40 p-3 rounded-lg border border-white/5">
              <span className="text-neutral-500 block">Payload Reduction:</span>
              <span className="text-purple-400 font-bold text-sm">~95% Payload Efficiency</span>
            </div>
            <div className="bg-black/40 p-3 rounded-lg border border-white/5">
              <span className="text-neutral-500 block">SLA Uptime:</span>
              <span className="text-[#D4AF37] font-bold text-sm">99.9% Production</span>
            </div>
          </div>
        </div>

        <footer className="text-center text-neutral-500 text-xs pt-4 border-t border-white/5 space-y-1">
          <p>Data automatically refreshes every 30 seconds. PII is strictly isolated via Row-Level Security.</p>
          <p className="text-neutral-600">Engineered with Groq Whisper, ElevenLabs, Supabase RLS, and Next.js 15.</p>
        </footer>
      </div>
    </div>
  );
}
