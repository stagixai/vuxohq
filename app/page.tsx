'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Mic,
  ShieldCheck,
  Zap,
  ArrowRight,
  Cpu,
  Play,
  Pause,
  Volume2,
  CheckCircle,
  Database,
  Sparkles,
  Layers,
  Lock,
} from 'lucide-react';

import AuthModal from '@/components/AuthModal';

interface AudioSample {
  title: string;
  category: string;
  duration: string;
  transcript: string;
}

const AUDIO_SAMPLES: AudioSample[] = [
  {
    title: 'Surgical Dictation Brief',
    category: 'Clinical Specialist',
    duration: '0:24',
    transcript:
      'Patient presented with acute right quadrant pain. Surgical intervention completed with zero intraoperative complications. Post-op vitals stable.',
  },
  {
    title: 'Executive Board Memo',
    category: 'Executive Voice Clone',
    duration: '0:32',
    transcript:
      'Q3 infrastructure migration concluded ahead of schedule. Latency reduced by 42% across all regional endpoints.',
  },
  {
    title: 'Multilingual Clinical Synthesis',
    category: 'Global Fleet Engine',
    duration: '0:28',
    transcript:
      'Synthesizing bi-lingual patient documentation in Spanish and English with medical term fidelity preserved.',
  },
];

export default function VuxoLandingPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeSampleIndex, setActiveSampleIndex] = useState(0);
  const [audioProgress, setAudioProgress] = useState(0);

  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);


  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setAudioProgress((prev) => {
          if (prev >= 100) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 4;
        });
      }, 300);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const togglePlay = (index: number) => {
    if (activeSampleIndex === index) {
      setIsPlaying(!isPlaying);
    } else {
      setActiveSampleIndex(index);
      setAudioProgress(0);
      setIsPlaying(true);
    }
  };

  const handleWaitlistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || isSubmitting) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      setEmail('');
    }, 1000);
  };

  const currentSample = AUDIO_SAMPLES[activeSampleIndex];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#E5E5E5] font-sans selection:bg-[#D4AF37] selection:text-black">
      {/* Top Navigation / Header */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between max-w-7xl mx-auto sticky top-0 bg-[#0A0A0A]/90 backdrop-blur z-50">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 rounded bg-gradient-to-br from-[#D4AF37] to-[#AA7C11] flex items-center justify-center font-black text-black tracking-tighter text-lg">
            V
          </div>
          <span className="font-bold tracking-widest text-xl text-white">
            VUXO<span className="text-[#D4AF37]">.HQ</span>
          </span>
        </div>
        <div className="flex items-center space-x-3 sm:space-x-4">
          <button
            onClick={() => setIsAuthOpen(true)}
            className="text-xs uppercase tracking-widest px-3.5 py-2 rounded border border-white/10 bg-white/5 hover:bg-white/10 text-[#D4AF37] transition-all font-semibold"
          >
            Operator Auth
          </button>
          <Link
            href="/vuxo"
            className="bg-[#D4AF37] hover:bg-[#C59B27] text-black font-semibold px-5 py-2 rounded text-sm transition-all shadow-[0_0_20px_rgba(212,175,55,0.2)]"
          >
            Launch Terminal
          </Link>
        </div>
      </header>


      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-6 pt-24 pb-16 text-center">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] text-xs font-medium mb-8">
          <Zap className="w-3.5 h-3.5" />
          <span>Next-Gen Executive Voice & Clinical Synthesis Engine</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
          Turn Spoken Expertise Into <br />
          <span className="bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#AA7C11] bg-clip-text text-transparent">
            Enterprise Output & Voice Assets
          </span>
        </h1>
        <p className="text-lg md:text-xl text-neutral-400 max-w-2xl mx-auto mb-10">
          Automated voice dictation, structured clinical documentation, and studio-grade executive voice synthesis built for high-ticket operators and surgical specialists.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/vuxo"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-[#D4AF37] hover:bg-[#C59B27] text-black font-bold px-8 py-4 rounded-lg transition-all text-base shadow-[0_0_30px_rgba(212,175,55,0.3)]"
          >
            <span>Enter VUXO Terminal</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
          <a
            href="#demo"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium px-8 py-4 rounded-lg transition-all text-base"
          >
            <Volume2 className="w-5 h-5 text-[#D4AF37]" />
            <span>Hear Voice Engine</span>
          </a>
        </div>
      </section>

      {/* Tech Stack Banner */}
      <section className="border-y border-white/10 bg-neutral-950 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-xs uppercase tracking-widest text-neutral-500 mb-6 font-semibold">
            Enterprise Engine Stack & Hardware Accelerators
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-14 opacity-80">
            <div className="flex items-center space-x-2 text-sm font-bold text-neutral-300">
              <Layers className="w-4 h-4 text-[#D4AF37]" />
              <span>Next.js 15</span>
            </div>
            <div className="flex items-center space-x-2 text-sm font-bold text-neutral-300">
              <Zap className="w-4 h-4 text-[#D4AF37]" />
              <span>FastAPI Async</span>
            </div>
            <div className="flex items-center space-x-2 text-sm font-bold text-neutral-300">
              <Sparkles className="w-4 h-4 text-[#D4AF37]" />
              <span>ElevenLabs Voice</span>
            </div>
            <div className="flex items-center space-x-2 text-sm font-bold text-neutral-300">
              <Cpu className="w-4 h-4 text-[#D4AF37]" />
              <span>Groq Qwen 27B</span>
            </div>
            <div className="flex items-center space-x-2 text-sm font-bold text-neutral-300">
              <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
              <span>Gemini 3.6 Flash</span>
            </div>
            <div className="flex items-center space-x-2 text-sm font-bold text-neutral-300">
              <Database className="w-4 h-4 text-[#D4AF37]" />
              <span>Supabase Vault</span>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Voice Synthesis Demo */}
      <section id="demo" className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] text-xs font-medium mb-4">
            <Volume2 className="w-3.5 h-3.5" />
            <span>Interactive Demo</span>
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">ElevenLabs Voice Synthesis Preview</h2>
          <p className="text-neutral-400 text-sm max-w-xl mx-auto">
            Test studio-grade voice clones synthesized in real-time across clinical, executive, and multilingual modes.
          </p>
        </div>

        <div className="bg-neutral-900/60 border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur shadow-2xl">
          {/* Sample Selector Tabs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
            {AUDIO_SAMPLES.map((sample, idx) => (
              <button
                key={idx}
                onClick={() => togglePlay(idx)}
                className={`p-4 rounded-xl border text-left transition-all ${
                  activeSampleIndex === idx
                    ? 'border-[#D4AF37] bg-[#D4AF37]/10 shadow-[0_0_20px_rgba(212,175,55,0.15)]'
                    : 'border-white/5 bg-black/40 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#D4AF37]">
                    {sample.category}
                  </span>
                  <span className="text-xs text-neutral-500">{sample.duration}</span>
                </div>
                <h4 className="text-sm font-bold text-white mb-1">{sample.title}</h4>
              </button>
            ))}
          </div>

          {/* Player Widget */}
          <div className="bg-black/60 border border-white/10 rounded-xl p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => togglePlay(activeSampleIndex)}
                  className="h-12 w-12 rounded-full bg-[#D4AF37] hover:bg-[#C59B27] text-black flex items-center justify-center transition-all shadow-[0_0_20px_rgba(212,175,55,0.3)]"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </button>
                <div>
                  <h3 className="font-bold text-white text-base">{currentSample.title}</h3>
                  <p className="text-xs text-neutral-400">Synthesized via ElevenLabs V2 Engine</p>
                </div>
              </div>

              {/* Animated Waveform Visualization */}
              <div className="flex items-center space-x-1 h-8 px-4 py-1 bg-neutral-900 rounded-lg border border-white/5">
                {[40, 70, 30, 90, 60, 100, 50, 80, 40, 90, 60, 30].map((height, i) => (
                  <div
                    key={i}
                    style={{ height: isPlaying ? `${height}%` : '20%' }}
                    className={`w-1 rounded-full transition-all duration-200 ${
                      isPlaying ? 'bg-[#D4AF37]' : 'bg-neutral-700'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-neutral-800 rounded-full h-1.5 mb-4 overflow-hidden">
              <div
                className="bg-[#D4AF37] h-full transition-all duration-300"
                style={{ width: `${audioProgress}%` }}
              />
            </div>

            {/* Transcript Preview */}
            <div className="bg-neutral-950/80 p-4 rounded-lg border border-white/5">
              <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-500 mb-1 block">
                Synthetic Transcript Output
              </span>
              <p className="text-sm text-neutral-300 italic">"{currentSample.transcript}"</p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="architecture" className="max-w-7xl mx-auto px-6 py-20 border-t border-white/10">
        <div className="text-center mb-16">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Engineered for Precision</h2>
          <p className="text-neutral-400 text-sm md:text-base">
            Built on modern asynchronous pipelines, zero-latency inference, and state-of-the-art voice cloning.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 rounded-xl bg-neutral-900/50 border border-white/10 hover:border-[#D4AF37]/50 transition-all group">
            <div className="h-12 w-12 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] mb-6 group-hover:scale-110 transition-transform">
              <Mic className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Surgical Voice Dictation</h3>
            <p className="text-neutral-400 text-sm leading-relaxed">
              Capture raw clinical notes or complex executive briefs with robust background noise suppression and real-time Whisper transcription.
            </p>
          </div>

          <div className="p-8 rounded-xl bg-neutral-900/50 border border-white/10 hover:border-[#D4AF37]/50 transition-all group">
            <div className="h-12 w-12 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] mb-6 group-hover:scale-110 transition-transform">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">ElevenLabs Voice Synthesis</h3>
            <p className="text-neutral-400 text-sm leading-relaxed">
              Instantly generate studio-grade multi-lingual executive audio deliverables, summaries, and thought-leadership assets using customized voice clones.
            </p>
          </div>

          <div className="p-8 rounded-xl bg-neutral-900/50 border border-white/10 hover:border-[#D4AF37]/50 transition-all group">
            <div className="h-12 w-12 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] mb-6 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Secure Pipeline Routing</h3>
            <p className="text-neutral-400 text-sm leading-relaxed">
              Fully encrypted end-to-end architecture with automated Supabase storage and webhook dispatching built for high-accountability practices.
            </p>
          </div>
        </div>
      </section>

      {/* Institutional Waitlist Form */}
      <section className="max-w-4xl mx-auto px-6 py-20 border-t border-white/10">
        <div className="bg-gradient-to-b from-neutral-900 to-black border border-[#D4AF37]/30 rounded-2xl p-8 md:p-12 text-center relative overflow-hidden shadow-[0_0_50px_rgba(212,175,55,0.1)]">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] text-xs font-medium mb-6">
            <Lock className="w-3.5 h-3.5" />
            <span>Pilot Access Program</span>
          </div>

          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
            Request Enterprise Pilot Access
          </h2>
          <p className="text-neutral-400 text-sm md:text-base max-w-lg mx-auto mb-8">
            Join surgical specialists, medical directors, and executive operators currently deploying VUXO voice synthesis pipelines.
          </p>

          {submitted ? (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6 inline-flex items-center space-x-3 text-emerald-400">
              <CheckCircle className="w-6 h-6" />
              <div className="text-left">
                <h4 className="font-bold text-white">Pilot Request Registered</h4>
                <p className="text-xs text-neutral-400">Our engineering team will reach out with your private gateway credentials.</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleWaitlistSubmit} className="max-w-md mx-auto flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter work email (e.g. operator@clinic.com)"
                className="flex-1 bg-neutral-950 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#D4AF37] transition-all"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#D4AF37] hover:bg-[#C59B27] disabled:opacity-50 text-black font-bold px-6 py-3 rounded-lg text-sm transition-all shadow-[0_0_20px_rgba(212,175,55,0.2)] whitespace-nowrap"
              >
                {isSubmitting ? 'Registering...' : 'Request Access'}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-10 text-center text-neutral-500 text-xs">
        <p>© {new Date().getFullYear()} VUXO Infrastructure Corp. All rights reserved. Operating on vuxohq.tech</p>
      </footer>

      {/* Supabase B2B Auth Modal */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </div>
  );
}

