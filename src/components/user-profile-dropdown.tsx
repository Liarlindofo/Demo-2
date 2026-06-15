'use client';

import { useState } from 'react';
import { useUser } from '@stackframe/stack';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { User, Sun, Moon, Settings, LogOut } from 'lucide-react';

export function UserProfileDropdown() {
  const user = useUser({ or: 'return-null' });
  const [isDarkMode, setIsDarkMode] = useState(true);
  const router = useRouter();

  if (!user) return null;

  const handleLogout = async () => {
    await user.signOut();
    router.push('/');
  };

  const initials =
    user.displayName?.charAt(0)?.toUpperCase() ||
    user.primaryEmail?.charAt(0)?.toUpperCase() ||
    'U';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0 hover:bg-[#374151]">
          <Avatar className="h-8 w-8">
            <AvatarImage
              src={user.profileImageUrl || undefined}
              alt={user.displayName || 'Usuario'}
            />
            <AvatarFallback className="bg-[#001F05] text-white text-sm font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-[#141415] border-[#374151] text-white w-56">
        <DropdownMenuItem className="hover:bg-[#374151] focus:bg-[#374151] cursor-default">
          <User className="mr-2 h-4 w-4 shrink-0" />
          <span className="truncate">{user.displayName || 'Usuario'}</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="hover:bg-[#374151] focus:bg-[#374151] text-xs text-gray-400 cursor-default">
          <span className="truncate pl-6">{user.primaryEmail}</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-[#374151]" />
        <DropdownMenuItem
          className="hover:bg-[#374151] focus:bg-[#374151] cursor-pointer"
          onClick={() => setIsDarkMode(!isDarkMode)}
        >
          {isDarkMode ? (
            <>
              <Sun className="mr-2 h-4 w-4" />
              Modo claro
            </>
          ) : (
            <>
              <Moon className="mr-2 h-4 w-4" />
              Modo escuro
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem className="hover:bg-[#374151] focus:bg-[#374151] cursor-pointer">
          <Settings className="mr-2 h-4 w-4" />
          Configuracoes
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-[#374151]" />
        <DropdownMenuItem
          className="hover:bg-[#374151] focus:bg-[#374151] text-red-400 cursor-pointer"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
