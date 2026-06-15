'use client';

import { AppProvider } from '@/contexts/app-context';
import { useUser } from '@stackframe/stack';
import { UserProfileDropdown } from '@/components/user-profile-dropdown';

export default function ConnectionsLayout({ children }: { children: React.ReactNode }) {
  const user = useUser({ or: 'redirect' });

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        Carregando...
      </div>
    );
  }

  return (
    <AppProvider>
      <div className="min-h-screen flex flex-col">
        <header className="sticky top-0 z-50 bg-[#141415]/95 backdrop-blur-sm border-b border-[#374151] flex items-center justify-end px-4 py-2">
          <UserProfileDropdown />
        </header>
        <div className="flex-1">{children}</div>
      </div>
    </AppProvider>
  );
}


