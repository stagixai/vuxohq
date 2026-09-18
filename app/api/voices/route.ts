import { NextResponse } from 'next/server';

export async function GET() {
  const elevenKey = process.env.ELEVENLABS_API_KEY;

  if (!elevenKey) {
    return NextResponse.json(
      {
        voices: [
          { voice_id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel (Default)', category: 'premade' },
          { voice_id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi', category: 'premade' },
          { voice_id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella', category: 'premade' },
          { voice_id: 'ErXwobaYiN019PkySvjV', name: 'Antoni', category: 'premade' },
        ],
      },
      { status: 200 }
    );
  }

  try {
    const res = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: {
        Accept: 'application/json',
        'xi-api-key': elevenKey,
      },
    });

    if (!res.ok) {
      throw new Error(`ElevenLabs API returned HTTP ${res.status}`);
    }

    const data = await res.json();
    return NextResponse.json({ voices: data.voices || [] });
  } catch (err) {
    console.error('ElevenLabs voices proxy error:', err);
    return NextResponse.json(
      {
        voices: [
          { voice_id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel (Fallback)', category: 'premade' },
        ],
      },
      { status: 200 }
    );
  }
}
