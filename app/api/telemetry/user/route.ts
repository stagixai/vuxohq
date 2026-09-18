import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const token = authHeader.replace('Bearer ', '');

  // Verify user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(token);
  if (userError || !user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

  // Fetch Recent Chat Sessions
  const { data: sessions, error: sessionError } = await supabase
    .from('ChatSession')
    .select('id, title, createdAt')
    .eq('profileId', user.id)
    .order('createdAt', { ascending: false })
    .limit(10);

  // Fetch Aggregated Telemetry
  const { data: telemetry, error: telemetryError } = await supabase
    .from('SynthesisLog')
    .select('latencyMs, characterCount, modelUsed')
    .eq('profileId', user.id);

  if (sessionError || telemetryError) {
    return NextResponse.json({ error: 'Failed to fetch telemetry' }, { status: 500 });
  }

  const totalChars = telemetry?.reduce((acc, curr) => acc + (curr.characterCount || 0), 0) || 0;
  const avgLatency = telemetry?.length
    ? Math.round(telemetry.reduce((acc, curr) => acc + (curr.latencyMs || 0), 0) / telemetry.length)
    : 0;

  return NextResponse.json({
    user: { id: user.id, email: user.email },
    summary: {
      totalSessions: sessions?.length || 0,
      totalCharacters: totalChars,
      avgLatencyMs: avgLatency,
    },
    recentSessions: sessions || [],
  });
}
