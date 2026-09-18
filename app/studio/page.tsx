'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import {
  Mic,
  Sparkles,
  ArrowLeft,
  Copy,
  Check,
  Share2,
  ThumbsUp,
  RotateCcw,
  MapPin,
  Briefcase,
  Globe,
  ShieldCheck,
  Send,
  Loader2,
  Square,
  Zap,
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface GBPPost {
  title: string;
  content: string;
  hashtags: string[];
  cta: string;
}

interface LinkedInPost {
  hook: string;
  content: string;
  hashtags: string[];
  cta: string;
}

interface ContentSuite {
  post_id: string;
  gbp_post: GBPPost;
  linkedin_post: LinkedInPost;
  approval_url: string;
  status: string;
}

export default function ContentStudioPage() {
  const [industry, setIndustry] = useState('Cardiology / MedSpa');
  const [location, setLocation] = useState('La Jolla, CA');
  const [transcript, setTranscript] = useState('');
  const [isDictating, setIsDictating] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [contentSuite, setContentSuite] = useState<ContentSuite | null>(null);
  const [approvalStatus, setApprovalStatus] = useState<'idle' | 'approved' | 'rejected'>('idle');
  const [copiedSection, setCopiedSection] = useState<'gbp' | 'linkedin' | null>(null);
  const [publishStatus, setPublishStatus] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const getAuthHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (typeof window !== 'undefined') {
      const sessionStr = localStorage.getItem('sb-vuxo-auth-token');
      if (sessionStr) {
        try {
          const sessionObj = JSON.parse(sessionStr);
          if (sessionObj.access_token) {
            headers['Authorization'] = `Bearer ${sessionObj.access_token}`;
          }
        } catch {
          // ignore error
        }
      }
    }
    return headers;
  };

  // Voice Note Recording via 16kbps Opus Pipeline
  const toggleDictation = async () => {
    if (!isDictating) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            sampleRate: 16000,
            echoCancellation: true,
            noiseSuppression: true,
          },
        });
        audioChunksRef.current = [];

        const mimeType =
          typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
            ? 'audio/webm;codecs=opus'
            : 'audio/webm';

        const recorder = new MediaRecorder(stream, {
          mimeType,
          audioBitsPerSecond: 16000,
        });

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) audioChunksRef.current.push(event.data);
        };

        recorder.onstop = async () => {
          stream.getTracks().forEach((track) => track.stop());
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
          await processVoiceNote(audioBlob);
        };

        mediaRecorderRef.current = recorder;
        recorder.start(250);
        setIsDictating(true);
      } catch (err) {
        alert(`Microphone Access Error: ${err instanceof Error ? err.message : 'Permission denied'}`);
      }
    } else {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setIsDictating(false);
    }
  };

  const processVoiceNote = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Audio = reader.result as string;
        const response = await fetch('/api/transcribe', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ audio_base64: base64Audio }),
        });

        const data = await response.json();
        if (response.ok && data.text) {
          setTranscript((prev) => (prev ? `${prev}\n\n${data.text}` : data.text));
        } else {
          alert(`Transcription Failed: ${data.detail || 'Server error'}`);
        }
        setIsTranscribing(false);
      };
      reader.readAsDataURL(audioBlob);
    } catch (err) {
      setIsTranscribing(false);
      alert(`Transcription Error: ${err instanceof Error ? err.message : 'Failed to send audio'}`);
    }
  };

  const handleGenerateSuite = async () => {
    if (!transcript.trim()) {
      alert('Please record a voice note or enter a transcript first.');
      return;
    }

    setIsGenerating(true);
    setContentSuite(null);
    setApprovalStatus('idle');
    setPublishStatus(null);

    try {
      const response = await fetch('/api/content/generate', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          transcript,
          industry,
          location,
        }),
      });

      const data = await response.json();
      if (response.ok && data.gbp_post) {
        setContentSuite(data);
      } else {
        alert(`Content Generation Failed: ${data.detail || 'Server error'}`);
      }
    } catch (err) {
      alert(`Generation Error: ${err instanceof Error ? err.message : 'Network error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApprove = async (approved: boolean) => {
    if (!contentSuite) return;

    try {
      const response = await fetch('/api/content/approve', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          post_id: contentSuite.post_id,
          approved,
          feedback: approved ? 'Approved by client' : 'Revision requested',
        }),
      });

      if (response.ok) {
        setApprovalStatus(approved ? 'approved' : 'rejected');
      }
    } catch (err) {
      console.error('Approval Error:', err);
    }
  };

  const handlePublishPlatform = async (platform: 'gbp' | 'linkedin') => {
    if (!contentSuite) return;

    setPublishStatus(`Publishing to ${platform === 'gbp' ? 'Google Business Profile' : 'LinkedIn'}...`);
    try {
      const response = await fetch(`/api/content/publish/${platform}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          post_id: contentSuite.post_id,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setPublishStatus(`Successfully published to ${platform === 'gbp' ? 'Google Business Profile' : 'LinkedIn'}!`);
      }
    } catch (err) {
      setPublishStatus(`Failed to publish: ${err instanceof Error ? err.message : 'Network error'}`);
    }
  };

  const handleCopy = (text: string, section: 'gbp' | 'linkedin') => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#E5E5E5] flex flex-col font-sans selection:bg-[#D4AF37] selection:text-black">
      {/* Top Header */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between bg-[#0A0A0A]/90 backdrop-blur sticky top-0 z-50">
        <div className="flex items-center space-x-4">
          <Link
            href="/vuxo"
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-400 hover:text-white transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded bg-gradient-to-br from-[#D4AF37] to-[#AA7C11] flex items-center justify-center font-black text-black tracking-tighter text-lg">
              S
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold tracking-widest text-lg text-white">
                  VUXO<span className="text-[#D4AF37]">.CONTENT_STUDIO</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30 uppercase tracking-wider">
                  $10k/mo Recurring Suite
                </span>
              </div>
              <p className="text-[10px] text-neutral-500 tracking-wider uppercase">
                Voice Note to GBP & LinkedIn Post Automation Engine
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full flex items-center space-x-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Gemini 3.6 Flash Engine</span>
          </span>
        </div>
      </header>

      {/* Main Studio Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-8">
        {/* Banner Hero */}
        <div className="bg-gradient-to-r from-neutral-900 via-neutral-900 to-[#D4AF37]/10 border border-white/10 rounded-2xl p-6 relative overflow-hidden">
          <div className="max-w-3xl relative z-10 space-y-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Turn 3 Minutes of Expertise into 2 Platform-Optimized Posts
            </h1>
            <p className="text-sm text-neutral-400 leading-relaxed">
              Record a brief voice note about a recent client case, medical insight, or local market trend. VUXO synthesizes it into a local SEO Google Business Profile post and a high-converting LinkedIn thought leadership piece.
            </p>
          </div>
        </div>

        {/* Input Configuration & Voice Recorder Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Config Controls */}
          <div className="bg-neutral-900/60 border border-white/10 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#D4AF37] flex items-center space-x-2">
              <Briefcase className="w-4 h-4" />
              <span>Client Profile Settings</span>
            </h2>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1 flex items-center space-x-1">
                  <Briefcase className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Industry / Specialty</span>
                </label>
                <input
                  type="text"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="e.g. Cardiology, MedSpa, Real Estate"
                  className="w-full bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1 flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Target City / Location</span>
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. La Jolla, CA"
                  className="w-full bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              {/* Dictation Controller Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={toggleDictation}
                  disabled={isTranscribing}
                  className={`w-full py-3 px-4 rounded-xl font-semibold text-xs transition-all flex items-center justify-center space-x-2 ${
                    isDictating
                      ? 'bg-rose-600 text-white animate-pulse shadow-[0_0_20px_rgba(225,29,72,0.4)]'
                      : 'bg-gradient-to-r from-[#D4AF37] to-[#AA7C11] text-black hover:opacity-90 shadow-[0_0_15px_rgba(212,175,55,0.25)]'
                  }`}
                >
                  {isTranscribing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Transcribing Voice Note (Whisper)...</span>
                    </>
                  ) : isDictating ? (
                    <>
                      <Square className="w-4 h-4 fill-white" />
                      <span>Stop Dictation (Click to Process)</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4" />
                      <span>Record Voice Note (3-5 mins)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right Raw Transcript Area & Action */}
          <div className="lg:col-span-2 bg-neutral-900/60 border border-white/10 rounded-xl p-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-white flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-[#D4AF37]" />
                  <span>Voice Note Transcript</span>
                </h2>
                {transcript && (
                  <button
                    onClick={() => setTranscript('')}
                    className="text-[11px] text-neutral-500 hover:text-neutral-300 transition-colors"
                  >
                    Clear Text
                  </button>
                )}
              </div>
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Speak your voice note above or paste your raw client transcript here..."
                rows={6}
                className="w-full bg-neutral-950 border border-white/10 rounded-lg p-3 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-[#D4AF37] resize-none leading-relaxed"
              />
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleGenerateSuite}
                disabled={isGenerating || !transcript.trim()}
                className={`w-full py-3 px-6 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-2 ${
                  isGenerating || !transcript.trim()
                    ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                    : 'bg-[#D4AF37] text-black hover:bg-[#b5942d] shadow-[0_0_20px_rgba(212,175,55,0.3)]'
                }`}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Gemini 3.6 Flash Synthesizing Posts...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Content Suite (GBP + LinkedIn)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Output Suite Display */}
        {contentSuite && (
          <div className="space-y-6 pt-4 animate-in fade-in duration-500">
            {/* Approval Banner */}
            <div className="bg-neutral-900 border border-white/10 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="h-3 w-3 rounded-full bg-[#D4AF37] animate-ping" />
                <div>
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Content Suite Ready for Client Approval
                  </span>
                  <p className="text-[11px] text-neutral-400">
                    Post ID: <code className="text-[#D4AF37]">{contentSuite.post_id.slice(0, 8)}</code>
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                {approvalStatus === 'approved' ? (
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 rounded-lg flex items-center space-x-2">
                    <Check className="w-4 h-4" />
                    <span>Suite Approved for Publishing</span>
                  </span>
                ) : approvalStatus === 'rejected' ? (
                  <span className="text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/30 px-4 py-2 rounded-lg flex items-center space-x-2">
                    <RotateCcw className="w-4 h-4" />
                    <span>Revision Requested</span>
                  </span>
                ) : (
                  <>
                    <button
                      onClick={() => handleApprove(false)}
                      className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-400 text-xs font-semibold transition-all flex items-center space-x-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Request Revision</span>
                    </button>
                    <button
                      onClick={() => handleApprove(true)}
                      className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] flex items-center space-x-1.5"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>Approve Suite</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {publishStatus && (
              <div className="p-3 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-lg text-xs text-[#D4AF37] font-semibold text-center">
                {publishStatus}
              </div>
            )}

            {/* Generated Dual Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Card 1: Google Business Profile Post */}
              <div className="bg-neutral-900/80 border border-white/10 rounded-2xl p-6 flex flex-col justify-between space-y-4 hover:border-[#D4AF37]/40 transition-all">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="flex items-center space-x-2">
                      <Globe className="w-5 h-5 text-blue-400" />
                      <span className="font-bold text-sm text-white">Google Business Profile (GBP)</span>
                    </div>
                    <span className="text-[10px] text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded font-mono">
                      250-350 Words | Local SEO
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-white mb-2">{contentSuite.gbp_post.title}</h3>
                    <p className="text-xs text-neutral-300 leading-relaxed whitespace-pre-line bg-neutral-950/80 p-4 rounded-xl border border-white/5 max-h-96 overflow-y-auto">
                      {contentSuite.gbp_post.content}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1.5">
                      {contentSuite.gbp_post.hashtags.map((tag, i) => (
                        <span key={i} className="text-[10px] bg-white/5 border border-white/10 text-neutral-400 px-2 py-0.5 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-[#D4AF37] font-semibold">CTA: {contentSuite.gbp_post.cta}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                  <button
                    onClick={() => handleCopy(contentSuite.gbp_post.content, 'gbp')}
                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-neutral-300 transition-all flex items-center space-x-1.5"
                  >
                    {copiedSection === 'gbp' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSection === 'gbp' ? 'Copied' : 'Copy GBP Post'}</span>
                  </button>

                  <button
                    onClick={() => handlePublishPlatform('gbp')}
                    className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all flex items-center space-x-1.5 shadow-[0_0_10px_rgba(37,99,235,0.3)]"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Publish to GBP</span>
                  </button>
                </div>
              </div>

              {/* Card 2: LinkedIn Post */}
              <div className="bg-neutral-900/80 border border-white/10 rounded-2xl p-6 flex flex-col justify-between space-y-4 hover:border-[#D4AF37]/40 transition-all">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="flex items-center space-x-2">
                      <Share2 className="w-5 h-5 text-sky-400" />
                      <span className="font-bold text-sm text-white">LinkedIn Thought Leadership</span>
                    </div>
                    <span className="text-[10px] text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded font-mono">
                      1,000-1,500 Words | Broetry
                    </span>
                  </div>

                  <div>
                    <div className="p-2.5 bg-sky-500/10 border border-sky-500/20 rounded-lg mb-3">
                      <p className="text-xs font-semibold text-sky-300 italic">Hook: "{contentSuite.linkedin_post.hook}"</p>
                    </div>
                    <p className="text-xs text-neutral-300 leading-relaxed whitespace-pre-line bg-neutral-950/80 p-4 rounded-xl border border-white/5 max-h-96 overflow-y-auto">
                      {contentSuite.linkedin_post.content}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1.5">
                      {contentSuite.linkedin_post.hashtags.map((tag, i) => (
                        <span key={i} className="text-[10px] bg-white/5 border border-white/10 text-neutral-400 px-2 py-0.5 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-[#D4AF37] font-semibold">CTA: {contentSuite.linkedin_post.cta}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                  <button
                    onClick={() => handleCopy(contentSuite.linkedin_post.content, 'linkedin')}
                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-neutral-300 transition-all flex items-center space-x-1.5"
                  >
                    {copiedSection === 'linkedin' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSection === 'linkedin' ? 'Copied' : 'Copy LinkedIn Post'}</span>
                  </button>

                  <button
                    onClick={() => handlePublishPlatform('linkedin')}
                    className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition-all flex items-center space-x-1.5 shadow-[0_0_10px_rgba(2,132,199,0.3)]"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Publish to LinkedIn</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
