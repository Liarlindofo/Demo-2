'use client';

import { useUser } from '@stackframe/stack';
import { AppProvider } from '@/contexts/app-context';

export default function IfoodLayout({ children }: { children: React.ReactNode }) {
  const user = useUser({ or: 'redirect' });

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        Carregando...
      </div>
    );
  }

  return <AppProvider>{children}</AppProvider>;
}
