'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Mic,
  ShieldCheck,
  Zap,
  ArrowRight,
  Cpu,
  Activity,
  Lock,
  Play,
  Pause,
  Volume2,
  Sparkles,
  Layers,
  Database,
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

export default function VuxoWebsite() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeSampleIndex, setActiveSampleIndex] = useState(0);
  const [audioProgress, setAudioProgress] = useState(0);

  // Staggered animation variants
  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 },
  };

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

  const currentSample = AUDIO_SAMPLES[activeSampleIndex];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#E5E5E5] font-sans selection:bg-[#D4AF37] selection:text-black">
      {/* Top Navigation */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between max-w-7xl mx-auto sticky top-0 bg-[#0A0A0A]/90 backdrop-blur z-40">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 rounded bg-gradient-to-br from-[#D4AF37] to-[#AA7C11] flex items-center justify-center font-black text-black tracking-tighter text-lg shadow-[0_0_10px_rgba(212,175,55,0.2)]">
            V
          </div>
          <span className="font-bold tracking-widest text-xl text-white">
            VUXO<span className="text-[#D4AF37]">.HQ</span>
          </span>
        </div>
        <div className="flex items-center space-x-6">
          <span className="hidden md:inline-flex items-center space-x-2 text-xs uppercase tracking-widest px-3 py-1 rounded-full bg-white/5 border border-white/10 text-neutral-400">
            <Lock className="w-3 h-3 text-[#D4AF37]" />
            <span>HIPAA-Ready Architecture</span>
          </span>
          <Link
            href="/dashboard"
            className="text-sm font-semibold hover:text-[#D4AF37] transition-colors hidden sm:inline"
          >
            Telemetry
          </Link>
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="text-sm font-semibold hover:text-[#D4AF37] transition-colors"
          >
            Operator Login
          </button>
          <Link
            href="/vuxo"
            className="bg-[#D4AF37] hover:bg-[#C59B27] text-black font-semibold px-5 py-2 rounded text-sm transition-all shadow-[0_0_20px_rgba(212,175,55,0.2)]"
          >
            Access Terminal
          </Link>
        </div>
      </header>

      {/* Hero Section with Framer Motion Stagger */}
      <section className="max-w-5xl mx-auto px-6 pt-24 pb-20 text-center">
        <motion.div
          initial="hidden"
          animate="visible"
          transition={{ staggerChildren: 0.15 }}
          className="flex flex-col items-center"
        >
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] text-xs font-medium mb-8"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Secure B2B Medical & Executive Infrastructure</span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6 leading-tight"
          >
            Transform Spoken Expertise Into <br className="hidden md:block" />
            <span className="bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#AA7C11] bg-clip-text text-transparent">
              Structured Clinical Output
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="text-lg md:text-xl text-neutral-400 max-w-2xl mx-auto mb-10"
          >
            VUXO is a high-performance dictation and synthesis engine built for surgical operators and enterprise executives. Powered by real-time AI inference and studio-grade voice cloning.
          </motion.p>

          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full"
          >
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-[#D4AF37] hover:bg-[#C59B27] text-black font-bold px-8 py-4 rounded-lg transition-all text-base shadow-[0_0_30px_rgba(212,175,55,0.3)] hover:scale-105"
            >
              <span>Register Operator Account</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <Link
              href="/vuxo"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium px-8 py-4 rounded-lg transition-all text-base hover:scale-105"
            >
              <span>Enter VUXO Terminal</span>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Tech Stack Banner */}
      <section className="border-y border-white/10 bg-neutral-950 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-xs uppercase tracking-widest text-neutral-500 mb-6 font-semibold">
            Enterprise Stack & Hardware Accelerators
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

      {/* Voice Synthesis Interactive Demo */}
      <section id="demo" className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] text-xs font-medium mb-4">
            <Volume2 className="w-3.5 h-3.5" />
            <span>Voice Synthesis Engine</span>
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">ElevenLabs Audio Preview</h2>
          <p className="text-neutral-400 text-sm max-w-xl mx-auto">
            Test low-latency voice synthesis across surgical dictations, executive board briefs, and multilingual clinical notes.
          </p>
        </div>

        <div className="bg-neutral-900/60 border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur shadow-2xl">
          {/* Sample Tabs */}
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
                  <p className="text-xs text-neutral-400">ElevenLabs Multilingual V2 Model</p>
                </div>
              </div>

              {/* Animated Waveform */}
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

            <div className="w-full bg-neutral-800 rounded-full h-1.5 mb-4 overflow-hidden">
              <div
                className="bg-[#D4AF37] h-full transition-all duration-300"
                style={{ width: `${audioProgress}%` }}
              />
            </div>

            <div className="bg-neutral-950/80 p-4 rounded-lg border border-white/5">
              <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-500 mb-1 block">
                Synthetic Transcript Output
              </span>
              <p className="text-sm text-neutral-300 italic">"{currentSample.transcript}"</p>
            </div>
          </div>
        </div>
      </section>

      {/* Infrastructure Specs */}
      <section className="max-w-7xl mx-auto px-6 py-20 border-t border-white/10">
        <div className="text-center mb-16">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Engineered for Precision & Privacy</h2>
          <p className="text-neutral-400 text-sm md:text-base">Built on modern asynchronous pipelines, zero-latency inference, and state-of-the-art encryption.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 rounded-xl bg-neutral-900/50 border border-white/10 hover:border-[#D4AF37]/50 transition-all group">
            <div className="h-12 w-12 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] mb-6 group-hover:scale-110 transition-transform">
              <Mic className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Surgical Voice Dictation</h3>
            <p className="text-neutral-400 text-sm leading-relaxed">
              Capture raw clinical notes with robust background noise suppression and real-time Whisper API transcription.
            </p>
          </div>

          <div className="p-8 rounded-xl bg-neutral-900/50 border border-white/10 hover:border-[#D4AF37]/50 transition-all group">
            <div className="h-12 w-12 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] mb-6 group-hover:scale-110 transition-transform">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">ElevenLabs Voice Synthesis</h3>
            <p className="text-neutral-400 text-sm leading-relaxed">
              Instantly generate studio-grade multi-lingual executive audio deliverables using low-latency asynchronous Webhooks.
            </p>
          </div>

          <div className="p-8 rounded-xl bg-neutral-900/50 border border-white/10 hover:border-[#D4AF37]/50 transition-all group">
            <div className="h-12 w-12 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] mb-6 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Row-Level Security</h3>
            <p className="text-neutral-400 text-sm leading-relaxed">
              Fully encrypted end-to-end architecture with isolated Supabase data environments ensuring strict medical data compliance.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-10 px-6 flex flex-col md:flex-row items-center justify-between max-w-7xl mx-auto text-neutral-500 text-xs">
        <p>© {new Date().getFullYear()} VUXO Infrastructure Corp. All rights reserved.</p>
        <div className="flex space-x-4 mt-4 md:mt-0">
          <span className="hover:text-white cursor-pointer">Privacy Policy</span>
          <span className="hover:text-white cursor-pointer">Terms of Service</span>
        </div>
      </footer>

      {/* Auth Modal Integration */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
}
