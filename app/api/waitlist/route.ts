import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('Waitlist')
      .insert({ email: email.toLowerCase().trim() })
      .select()
      .single();

    if (error && error.code === '23505') {
      return NextResponse.json(
        { message: 'You are already registered on the VUXO waitlist.', status: 'already_registered' },
        { status: 200 }
      );
    }

    if (error) {
      console.error('Waitlist insertion error:', error);
      return NextResponse.json({ error: 'Failed to join waitlist' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Successfully joined the VUXO waitlist!',
      data,
    });
  } catch (err) {
    console.error('Waitlist API Exception:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
