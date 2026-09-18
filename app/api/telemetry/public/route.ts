import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const revalidate = 60; // ISR: Revalidate every 60 seconds

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin.rpc('get_public_telemetry');

    if (error) {
      console.warn('RPC get_public_telemetry error, using direct query fallback:', error.message);
      const { data: logData } = await supabaseAdmin
        .from('SynthesisLog')
        .select('characterCount, latencyMs, audioDurationSeconds')
        .is('deleted_at', null);

      const { count: sessionCount } = await supabaseAdmin
        .from('ChatSession')
        .select('*', { count: 'exact', head: true });

      const logs = logData || [];
      const totalChars = logs.reduce((acc, curr) => acc + (curr.characterCount || 0), 0);
      const totalAudioSecs = logs.reduce((acc, curr) => acc + (curr.audioDurationSeconds || 0), 0);
      const avgLatency = logs.length > 0 ? Math.round(logs.reduce((acc, curr) => acc + (curr.latencyMs || 0), 0) / logs.length) : 0;
      const hoursSaved = Math.round((totalChars / 12000) * 10) / 10;

      return NextResponse.json({
        totalCharacters: totalChars,
        hoursSaved,
        totalSessions: sessionCount || 0,
        avgLatencyMs: avgLatency,
        totalAudioSeconds: totalAudioSecs,
      });
    }

    const totalChars = data?.total_characters || 0;
    const hoursSaved = Math.round((totalChars / 12000) * 10) / 10;

    return NextResponse.json({
      totalCharacters: totalChars,
      hoursSaved,
      totalSessions: data?.total_sessions || 0,
      avgLatencyMs: data?.avg_latency_ms || 0,
      totalAudioSeconds: data?.total_audio_seconds || 0,
    });
  } catch (error) {
    console.error('Public telemetry error:', error);
    return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 });
  }
}
