import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const profileId = searchParams.get('profile_id') || request.headers.get('x-profile-id');

  if (!profileId) {
    return NextResponse.json({ error: 'Missing profile_id parameter' }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from('SynthesisLog')
      .select('*')
      .eq('profileId', profileId)
      .order('createdAt', { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const totalRequests = data.length;
    const totalChars = data.reduce((sum, log) => sum + (log.characterCount || 0), 0);
    const avgLatency =
      totalRequests > 0
        ? Math.round(data.reduce((sum, log) => sum + (log.latencyMs || 0), 0) / totalRequests)
        : 0;

    return NextResponse.json({
      status: 'Active',
      profile_id: profileId,
      total_requests: totalRequests,
      total_characters_processed: totalChars,
      average_latency_ms: avgLatency,
      logs: data,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Telemetry query failed' },
      { status: 500 }
    );
  }
}
