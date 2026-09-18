'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Mic,
  ShieldCheck,
  Zap,
  Send,
  Cpu,
  ArrowLeft,
  Paperclip,
  Sparkles,
  Copy,
  Check,
  Sliders,
  Radio,
  Trash2,
  Volume2,
  Loader2,
  Square,
  UserCheck,
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

class StreamingAudioPlayer {
  private audioContext: AudioContext | null = null;
  private queue: ArrayBuffer[] = [];
  private isPlaying = false;

  private async ensureContext() {
    if (!this.audioContext && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.audioContext = new AudioCtx();
      }
    }
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  public async addChunk(base64Audio: string) {
    await this.ensureContext();
    const base64Data = base64Audio.includes(',') ? base64Audio.split(',')[1] : base64Audio;
    const binaryString = window.atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    this.queue.push(bytes.buffer);
    if (!this.isPlaying) {
      this.playNext();
    }
  }

  private async playNext() {
    await this.ensureContext();
    if (this.queue.length === 0 || !this.audioContext) {
      this.isPlaying = false;
      return;
    }

    this.isPlaying = true;
    const chunk = this.queue.shift()!;

    try {
      const audioBuffer = await this.audioContext.decodeAudioData(chunk);
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);

      source.onended = () => {
        this.playNext();
      };

      source.start(0);
    } catch (error) {
      console.error('Audio decode error:', error);
      this.playNext();
    }
  }

  public clear() {
    this.queue = [];
    this.isPlaying = false;
  }
}

interface Attachment {
  mime_type: string;
  data: string;
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  provider?: string;
  attachments?: Attachment[];
}

export default function VuxoTerminalPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        'Welcome to the VUXO Executive Terminal. Select your AI provider and send a brief or clinical dictation to begin synthesis.',
      provider: 'System',
    },
  ]);
  const [input, setInput] = useState('');
  const [provider, setProvider] = useState<'groq' | 'gemini' | 'openai'>('groq');
  const [isStreaming, setIsStreaming] = useState(true);
  const [temperature, setTemperature] = useState(0.7);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isDictating, setIsDictating] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [attachment, setAttachment] = useState<{ name: string; data: string; mime_type: string } | null>(null);
  const [userProfile, setUserProfile] = useState<{ id: string; email: string; full_name?: string } | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const [synthesizingIndex, setSynthesizingIndex] = useState<number | null>(null);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const streamingAudioPlayerRef = useRef<StreamingAudioPlayer | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    streamingAudioPlayerRef.current = new StreamingAudioPlayer();

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserProfile({
          id: session.user.id,
          email: session.user.email || '',
          full_name: session.user.user_metadata?.full_name,
        });
        setAccessToken(session.access_token);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUserProfile({
          id: session.user.id,
          email: session.user.email || '',
          full_name: session.user.user_metadata?.full_name,
        });
        setAccessToken(session.access_token);
      } else {
        setUserProfile(null);
        setAccessToken(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const getAuthHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-profile-id': userProfile?.id || '',
    };
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    return headers;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target?.result as string;
      setAttachment({
        name: file.name,
        data: base64Data,
        mime_type: file.type || 'image/jpeg',
      });
    };
    reader.readAsDataURL(file);
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleSynthesizeTts = async (text: string, index: number) => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }

    if (playingIndex === index) {
      setPlayingIndex(null);
      if (streamingAudioPlayerRef.current) streamingAudioPlayerRef.current.clear();
      return;
    }

    setSynthesizingIndex(index);
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          text,
          profile_id: userProfile?.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'TTS Synthesis failed' }));
        throw new Error(errorData.detail || `HTTP ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;

      setSynthesizingIndex(null);
      setPlayingIndex(index);

      audio.onended = () => {
        setPlayingIndex(null);
        currentAudioRef.current = null;
      };

      audio.onerror = () => {
        setPlayingIndex(null);
        currentAudioRef.current = null;
        alert('Failed to play audio stream.');
      };

      await audio.play();
    } catch (err) {
      setSynthesizingIndex(null);
      setPlayingIndex(null);
      alert(`ElevenLabs TTS Error: ${err instanceof Error ? err.message : 'Synthesis failed'}`);
    }
  };

  // Groq Whisper Microphone Dictation Pipeline
  const toggleDictation = async () => {
    if (!isDictating) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1, // Mono
            sampleRate: 16000, // 16kHz optimal for Whisper and keeps payload small
            echoCancellation: true,
            noiseSuppression: true,
          },
        });
        audioChunksRef.current = [];
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          if (recordingTimeoutRef.current) {
            clearTimeout(recordingTimeoutRef.current);
            recordingTimeoutRef.current = null;
          }
          stream.getTracks().forEach((track) => track.stop());
          const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' });
          if (audioBlob.size === 0) {
            setIsDictating(false);
            return;
          }

          setIsTranscribing(true);
          try {
            const reader = new FileReader();
            reader.onloadend = async () => {
              const base64Data = (reader.result as string).split(',')[1];
              try {
                const res = await fetch('/api/transcribe', {
                  method: 'POST',
                  headers: getAuthHeaders(),
                  body: JSON.stringify({
                    audio_base64: base64Data,
                    filename: 'dictation.webm',
                    profile_id: userProfile?.id,
                  }),
                });

                if (!res.ok) {
                  const errJson = await res.json().catch(() => ({ detail: 'Transcription failed' }));
                  throw new Error(errJson.detail || `HTTP ${res.status}`);
                }

                const data = await res.json();
                if (data.text) {
                  setInput((prev) => (prev ? `${prev} ${data.text}` : data.text));
                }
              } catch (err) {
                alert(`Groq Whisper Dictation Error: ${err instanceof Error ? err.message : 'Transcription failed'}`);
              } finally {
                setIsTranscribing(false);
                setIsDictating(false);
              }
            };
            reader.readAsDataURL(audioBlob);
          } catch (err) {
            alert(`Audio processing error: ${err instanceof Error ? err.message : 'Failed'}`);
            setIsTranscribing(false);
            setIsDictating(false);
          }
        };

        mediaRecorder.start(250);
        setIsDictating(true);

        // Auto-stop recording at 30s to prevent Vercel Serverless 4.5MB payload limit
        recordingTimeoutRef.current = setTimeout(() => {
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
            alert('Recording automatically stopped at 30 seconds to optimize serverless processing payload.');
          }
        }, 30000);
      } catch (err) {
        alert(`Microphone access error: ${err instanceof Error ? err.message : 'Permission denied'}`);
        setIsDictating(false);
      }
    } else {
      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current);
        recordingTimeoutRef.current = null;
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setIsDictating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !attachment) || isLoading) return;

    const userMessageContent = input.trim();
    const userMessage: Message = {
      role: 'user',
      content: userMessageContent,
      attachments: attachment ? [{ mime_type: attachment.mime_type, data: attachment.data }] : undefined,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setAttachment(null);
    setIsLoading(true);

    // Sync ChatSession to Supabase if authenticated
    if (userProfile?.id && userMessageContent) {
      supabase
        .from('ChatSession')
        .insert({
          profileId: userProfile.id,
          title: userMessageContent.slice(0, 45) || 'Clinical Dictation Session',
        })
        .then(({ error }) => {
          if (error) console.log('ChatSession sync skipped:', error.message);
        });
    }

    try {
      if (isStreaming) {
        const response = await fetch('/api/chat/stream', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            messages: newMessages.map((m) => ({
              role: m.role,
              content: m.content,
              attachments: m.attachments,
            })),
            model_provider: provider,
            temperature,
            stream: true,
            profile_id: userProfile?.id,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let assistantContent = '';

        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: '', provider: provider.toUpperCase() },
        ]);

        if (reader) {
          let done = false;
          while (!done) {
            const { value, done: doneReading } = await reader.read();
            done = doneReading;
            const chunkValue = decoder.decode(value, { stream: true });
            const lines = chunkValue.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const dataStr = line.replace('data: ', '').trim();
                if (dataStr === '[DONE]') break;
                try {
                  const parsed = JSON.parse(dataStr);
                  if (parsed.token) {
                    assistantContent += parsed.token;
                    setMessages((prev) => {
                      const updated = [...prev];
                      const lastMsg = updated[updated.length - 1];
                      if (lastMsg && lastMsg.role === 'assistant') {
                        lastMsg.content = assistantContent;
                      }
                      return updated;
                    });
                  } else if (parsed.error) {
                    assistantContent += `\n[Error: ${parsed.error}]`;
                  }
                } catch {
                  // Ignore JSON parse errors on partial chunks
                }
              }
            }
          }
        }
      } else {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            messages: newMessages.map((m) => ({
              role: m.role,
              content: m.content,
              attachments: m.attachments,
            })),
            model_provider: provider,
            temperature,
            stream: false,
            profile_id: userProfile?.id,
          }),
        });

        const data = await response.json();
        if (response.ok) {
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: data.response,
              provider: data.provider,
            },
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: `[Error ${response.status}: ${data.detail || 'Request failed'}]`,
              provider: 'System Error',
            },
          ]);
        }
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `[Network Error: ${err instanceof Error ? err.message : 'Failed to reach VUXO AI Gateway'}]`,
          provider: 'System Error',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#E5E5E5] flex flex-col font-sans selection:bg-[#D4AF37] selection:text-black">
      {/* Top Header */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between bg-[#0A0A0A]/90 backdrop-blur sticky top-0 z-50">
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
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold tracking-widest text-lg text-white">
                  VUXO<span className="text-[#D4AF37]">.TERMINAL</span>
                </span>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
              <p className="text-[10px] text-neutral-500 tracking-wider uppercase">
                Groq Whisper AI Dictation & Voice Synthesis Gateway
              </p>
            </div>
          </div>
        </div>

        {/* Model Selector Pills */}
        <div className="hidden md:flex items-center bg-neutral-900 border border-white/10 rounded-lg p-1 space-x-1">
          <button
            onClick={() => setProvider('groq')}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-all flex items-center space-x-1.5 ${
              provider === 'groq'
                ? 'bg-[#D4AF37] text-black shadow-[0_0_15px_rgba(212,175,55,0.3)]'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Groq (Qwen 27B)</span>
          </button>
          <button
            onClick={() => setProvider('gemini')}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-all flex items-center space-x-1.5 ${
              provider === 'gemini'
                ? 'bg-[#D4AF37] text-black shadow-[0_0_15px_rgba(212,175,55,0.3)]'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Gemini 3.6 Flash</span>
          </button>
          <button
            onClick={() => setProvider('openai')}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-all flex items-center space-x-1.5 ${
              provider === 'openai'
                ? 'bg-[#D4AF37] text-black shadow-[0_0_15px_rgba(212,175,55,0.3)]'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>GPT-4o Mini</span>
          </button>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/dashboard"
            className="text-xs font-semibold text-neutral-400 hover:text-[#D4AF37] px-3 py-1 rounded bg-white/5 border border-white/10 transition-all hidden sm:inline"
          >
            Telemetry
          </Link>
          {userProfile ? (
            <span className="text-xs text-[#D4AF37] bg-[#D4AF37]/10 border border-[#D4AF37]/30 px-3 py-1 rounded-full flex items-center space-x-1.5">
              <UserCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline max-w-[140px] truncate">
                {userProfile.full_name || userProfile.email}
              </span>
            </span>
          ) : (
            <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">256-Bit Encrypted</span>
            </span>
          )}
        </div>
      </header>

      {/* Control Bar */}
      <div className="bg-neutral-950 border-b border-white/5 px-6 py-2 flex flex-wrap items-center justify-between text-xs text-neutral-400 gap-3">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5">
            <Sliders className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Temp: {temperature}</span>
            <input
              type="range"
              min="0.0"
              max="2.0"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-20 accent-[#D4AF37] cursor-pointer"
            />
          </div>
          <button
            onClick={() => setIsStreaming(!isStreaming)}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded border transition-all ${
              isStreaming
                ? 'border-[#D4AF37]/50 bg-[#D4AF37]/10 text-[#D4AF37]'
                : 'border-white/10 bg-white/5 text-neutral-400'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Stream: {isStreaming ? 'ON' : 'OFF'}</span>
          </button>
        </div>

        <div className="md:hidden flex items-center space-x-2">
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value as 'groq' | 'gemini' | 'openai')}
            className="bg-neutral-900 border border-white/10 text-white text-xs rounded px-2 py-1"
          >
            <option value="groq">Groq Qwen 27B</option>
            <option value="gemini">Gemini 3.6 Flash</option>
            <option value="openai">GPT-4o Mini</option>
          </select>
        </div>
      </div>

      {/* Main Chat Stream Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 overflow-y-auto space-y-6">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${
              msg.role === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            <div className="flex items-center space-x-2 mb-1 px-1">
              <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-500">
                {msg.role === 'user'
                  ? userProfile?.full_name || 'Operator'
                  : msg.provider || provider.toUpperCase()}
              </span>
            </div>

            <div
              className={`relative max-w-2xl rounded-xl p-5 border text-sm leading-relaxed shadow-lg pb-10 ${
                msg.role === 'user'
                  ? 'bg-[#D4AF37]/10 border-[#D4AF37]/30 text-white rounded-tr-none'
                  : 'bg-neutral-900/80 border-white/10 text-neutral-200 rounded-tl-none'
              }`}
            >
              {msg.attachments && (
                <div className="mb-3 p-2 bg-black/40 rounded border border-white/10 text-xs text-[#D4AF37] flex items-center space-x-2">
                  <Paperclip className="w-3.5 h-3.5" />
                  <span>Multimodal Attachment Encoded</span>
                </div>
              )}

              <p className="whitespace-pre-wrap">{msg.content}</p>

              {msg.role === 'assistant' && msg.content && (
                <div className="absolute bottom-3 right-3 flex items-center space-x-2">
                  <button
                    onClick={() => handleSynthesizeTts(msg.content, idx)}
                    disabled={synthesizingIndex === idx}
                    className={`flex items-center space-x-1.5 px-2 py-1 rounded text-xs transition-all border ${
                      playingIndex === idx
                        ? 'bg-[#D4AF37] text-black border-[#D4AF37] font-bold shadow-[0_0_10px_rgba(212,175,55,0.4)]'
                        : 'bg-black/40 hover:bg-black/80 text-[#D4AF37] hover:text-white border-white/10'
                    }`}
                    title="Synthesize Voice Audio via ElevenLabs"
                  >
                    {synthesizingIndex === idx ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#D4AF37]" />
                        <span className="text-[10px]">Synthesizing...</span>
                      </>
                    ) : playingIndex === idx ? (
                      <>
                        <Volume2 className="w-3.5 h-3.5 animate-pulse" />
                        <span className="text-[10px]">Playing Audio</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3.5 h-3.5" />
                        <span className="text-[10px] hidden sm:inline">ElevenLabs Voice</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleCopy(msg.content, idx)}
                    className="p-1.5 rounded bg-black/40 hover:bg-black/80 text-neutral-400 hover:text-white transition-all border border-white/5"
                    title="Copy to clipboard"
                  >
                    {copiedIndex === idx ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex flex-col items-start">
            <div className="flex items-center space-x-2 mb-1 px-1">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#D4AF37]">
                {provider.toUpperCase()} Engine Processing...
              </span>
            </div>
            <div className="bg-neutral-900/80 border border-white/10 rounded-xl rounded-tl-none p-4 flex items-center space-x-3">
              <div className="w-2 h-2 rounded-full bg-[#D4AF37] animate-ping" />
              <span className="text-xs text-neutral-400 animate-pulse">Synthesizing response tokens...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Bottom Input Drawer */}
      <footer className="border-t border-white/10 bg-[#0A0A0A]/95 p-4 sticky bottom-0 z-40 backdrop-blur">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-3">
          {attachment && (
            <div className="inline-flex items-center space-x-2 bg-neutral-900 border border-[#D4AF37]/40 px-3 py-1.5 rounded-lg text-xs text-[#D4AF37]">
              <Paperclip className="w-3.5 h-3.5" />
              <span className="truncate max-w-xs">{attachment.name}</span>
              <button
                type="button"
                onClick={() => setAttachment(null)}
                className="text-neutral-400 hover:text-red-400"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="relative flex items-center bg-neutral-900 border border-white/10 rounded-xl focus-within:border-[#D4AF37] transition-all p-1.5">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept="image/*,application/pdf"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 text-neutral-400 hover:text-[#D4AF37] transition-colors rounded-lg hover:bg-white/5"
              title="Attach File / Image"
            >
              <Paperclip className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={toggleDictation}
              disabled={isTranscribing}
              className={`p-2.5 transition-colors rounded-lg flex items-center space-x-1 ${
                isDictating
                  ? 'bg-red-500/20 text-red-400 animate-pulse border border-red-500/40'
                  : isTranscribing
                  ? 'bg-[#D4AF37]/20 text-[#D4AF37]'
                  : 'text-neutral-400 hover:text-[#D4AF37] hover:bg-white/5'
              }`}
              title="Groq Whisper Dictation"
            >
              {isTranscribing ? (
                <Loader2 className="w-5 h-5 animate-spin text-[#D4AF37]" />
              ) : isDictating ? (
                <Square className="w-5 h-5 fill-red-400" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                isTranscribing
                  ? 'Groq Whisper AI processing audio...'
                  : isDictating
                  ? 'Recording live audio... Click red button to finish & transcribe with Groq Whisper'
                  : 'Enter clinical dictation or prompt...'
              }
              className="flex-1 bg-transparent px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none"
            />

            <button
              type="submit"
              disabled={(!input.trim() && !attachment) || isLoading}
              className="bg-[#D4AF37] hover:bg-[#C59B27] disabled:opacity-40 disabled:hover:bg-[#D4AF37] text-black font-bold p-3 rounded-lg transition-all shadow-[0_0_20px_rgba(212,175,55,0.2)]"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </footer>
    </div>
  );
}
