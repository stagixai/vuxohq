import Link from 'next/link';
import { Mic, ShieldCheck, Zap, ArrowRight, Activity, Cpu } from 'lucide-react';

export default function VuxoLandingPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#E5E5E5] font-sans selection:bg-[#D4AF37] selection:text-black">
      {/* Top Navigation / Header */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 rounded bg-gradient-to-br from-[#D4AF37] to-[#AA7C11] flex items-center justify-center font-black text-black tracking-tighter text-lg">
            V
          </div>
          <span className="font-bold tracking-widest text-xl text-white">VUXO<span className="text-[#D4AF37]">.HQ</span></span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="hidden md:inline-block text-xs uppercase tracking-widest px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[#D4AF37]">
            Secure B2B Infrastructure
          </span>
          <Link
            href="/vuxo"
            className="bg-[#D4AF37] hover:bg-[#C59B27] text-black font-semibold px-5 py-2 rounded text-sm transition-all shadow-[0_0_20px_rgba(212,175,55,0.2)]"
          >
            Launch Terminal
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-6 pt-24 pb-20 text-center">
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
            href="#architecture"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium px-8 py-4 rounded-lg transition-all text-base"
          >
            <span>Explore Architecture</span>
          </a>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="architecture" className="max-w-7xl mx-auto px-6 py-20 border-t border-white/10">
        <div className="text-center mb-16">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Engineered for Precision</h2>
          <p className="text-neutral-400 text-sm md:text-base">Built on modern asynchronous pipelines, zero-latency inference, and state-of-the-art voice cloning.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="p-8 rounded-xl bg-neutral-900/50 border border-white/10 hover:border-[#D4AF37]/50 transition-all group">
            <div className="h-12 w-12 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] mb-6 group-hover:scale-110 transition-transform">
              <Mic className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Surgical Voice Dictation</h3>
            <p className="text-neutral-400 text-sm leading-relaxed">
              Capture raw clinical notes or complex executive briefs with robust background noise suppression and real-time Whisper transcription.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-8 rounded-xl bg-neutral-900/50 border border-white/10 hover:border-[#D4AF37]/50 transition-all group">
            <div className="h-12 w-12 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] mb-6 group-hover:scale-110 transition-transform">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">ElevenLabs Voice Synthesis</h3>
            <p className="text-neutral-400 text-sm leading-relaxed">
              Instantly generate studio-grade multi-lingual executive audio deliverables, summaries, and thought-leadership assets using customized voice clones.
            </p>
          </div>

          {/* Feature 3 */}
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

      {/* Footer */}
      <footer className="border-t border-white/10 py-10 text-center text-neutral-500 text-xs">
        <p>© {new Date().getFullYear()} VUXO Infrastructure Corp. All rights reserved. Operating on vuxohq.tech</p>
      </footer>
    </div>
  );
}
