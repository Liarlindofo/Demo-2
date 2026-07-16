'use client';

import Link from 'next/link';
import { Logo } from '@/components/logo';
import { UserProfileDropdown } from '@/components/user-profile-dropdown';

export default function TarefasLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 bg-[#141415]/95 backdrop-blur-sm border-b border-[#2a2a2e] flex items-center justify-between px-4 py-2">
        <Link href="/dashboard" className="hover:opacity-80 transition-opacity">
          <Logo />
        </Link>
        <UserProfileDropdown />
      </header>
      <div className="flex-1">{children}</div>
    </div>
  );
}
