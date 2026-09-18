'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Loader2 } from 'lucide-react';

const ADMIN_WHITELIST = ['ops@stagixai.com', 'admin@vuxohq.tech'];

export default function AccessGate({ children }: { children: React.ReactNode }) {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAccess = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/');
        return;
      }

      // Whitelisted admin emails bypass waitlist checks
      if (user.email && ADMIN_WHITELIST.includes(user.email.toLowerCase())) {
        setIsAuthorized(true);
        return;
      }

      const { data, error } = await supabase
        .from('Waitlist')
        .select('status')
        .eq('email', user.email)
        .single();

      if (!error && data?.status === 'approved') {
        setIsAuthorized(true);
      } else {
        router.push('/waitlist');
      }
    };

    checkAccess();
  }, [router]);

  if (isAuthorized === null) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center text-neutral-300 font-sans space-y-4">
        <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin" />
        <span className="text-xs uppercase tracking-widest text-neutral-500 font-mono">
          Verifying Cryptographic Access Gate...
        </span>
      </div>
    );
  }

  if (!isAuthorized) return null;

  return <>{children}</>;
}
