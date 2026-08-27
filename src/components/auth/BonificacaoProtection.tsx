'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@stackframe/stack';
import ToolLock from '@/components/ui/ToolLock';
import { Loader2 } from 'lucide-react';

/** Gate do Plano de Bonificação (mesmo critério da API: RH / equipe / legado). */
export default function BonificacaoProtection({ children }: { children: React.ReactNode }) {
  const user = useUser({ or: 'return-null' });
  const [ok, setOk] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      if (!user) {
        if (!cancelled) setOk(false);
        return;
      }
      try {
        const res = await fetch(`/api/bonificacao/access?_t=${Date.now()}`, { cache: 'no-store' });
        if (!cancelled) setOk(res.ok);
      } catch {
        if (!cancelled) setOk(false);
      }
    }

    check();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  if (ok === null) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!ok) {
    return <ToolLock toolName="RH" />;
  }

  return <>{children}</>;
}
