'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useUser } from '@stackframe/stack';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Settings, User, Moon, Sun, LogOut, MessageCircle, MessageSquare, Menu, X } from 'lucide-react';
import { Logo } from '@/components/logo';
import { AppProvider } from '@/contexts/app-context';
import { useRouter } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Usar Stack Auth real - redireciona para login se não autenticado
  const user = useUser({ or: 'redirect' });
  
  const router = useRouter();

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleLogout = async () => {
    if (user?.signOut) {
      await user.signOut();
    }
    router.push('/');
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-white">Carregando...</div>
      </div>
    );
  }

  return (
    <AppProvider>
      <div className={isDarkMode ? 'min-h-screen dark' : 'min-h-screen'}>
        <div className="bg-black text-white min-h-screen">
          <header className="bg-[#141415]/95 backdrop-blur-sm border-b border-[#374151] sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between py-4">
                <div className="flex items-center gap-6">
                  <Link href="/" className="hover:opacity-80 transition-opacity">
                    <Logo />
                  </Link>
                  <nav className="hidden md:flex items-center gap-2">
                    <Link href="/connections">
                      <Button variant="ghost" size="sm" className="h-9 px-4 text-green-500 hover:text-green-400 hover:bg-green-500/10">
                        Conexões Saipos
                      </Button>
                    </Link>
                    <Link href="/whatsapp-config">
                      <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-green-500 hover:text-green-400 hover:bg-green-500/10" title="Configurar WhatsApp Business">
                        <MessageCircle className="h-5 w-5" />
                      </Button>
                    </Link>
                    <Link href="/whatsapp-tools">
                      <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-blue-500 hover:text-blue-400 hover:bg-blue-500/10" title="Ferramentas WhatsApp">
                        <MessageSquare className="h-5 w-5" />
                      </Button>
                    </Link>
                  </nav>
                  
                  {/* Menu Mobile */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="md:hidden h-9 w-9 p-0 text-white hover:bg-[#374151]"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  >
                    {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                  </Button>
                </div>
                <div className="flex items-center gap-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.profileImageUrl || '/avatars/01.png'} alt={user.displayName || 'User'} />
                        <AvatarFallback className="bg-[#001F05] text-white">
                          {user.displayName?.charAt(0)?.toUpperCase() || user.primaryEmail?.charAt(0)?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-[#141415] border-[#374151] text-white">
                    <DropdownMenuItem className="hover:bg-[#374151] focus:bg-[#374151]">
                      <User className="mr-2 h-4 w-4" />
                      {user.displayName || 'Usuario'}
                    </DropdownMenuItem>
                    <DropdownMenuItem className="hover:bg-[#374151] focus:bg-[#374151] text-xs text-gray-400">
                      {user.primaryEmail}
                    </DropdownMenuItem>
                    <DropdownMenuItem className="hover:bg-[#374151] focus:bg-[#374151]" onClick={toggleDarkMode}>
                      {isDarkMode ? (<><Sun className="mr-2 h-4 w-4" />Modo claro</>) : (<><Moon className="mr-2 h-4 w-4" />Modo escuro</>)}
                    </DropdownMenuItem>
                    <DropdownMenuItem className="hover:bg-[#374151] focus:bg-[#374151]">
                      <Settings className="mr-2 h-4 w-4" />
                      Configuracoes
                    </DropdownMenuItem>
                    <DropdownMenuItem className="hover:bg-[#374151] focus:bg-[#374151] text-red-400" onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                </div>
              </div>
              
              {/* Menu Mobile Dropdown */}
              {isMobileMenuOpen && (
                <div className="md:hidden border-t border-[#374151] py-4 space-y-2">
                  <Link href="/connections" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start text-green-500 hover:text-green-400 hover:bg-green-500/10">
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Conexões Saipos
                    </Button>
                  </Link>
                  <Link href="/whatsapp-config" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start text-green-500 hover:text-green-400 hover:bg-green-500/10">
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Configurar WhatsApp
                    </Button>
                  </Link>
                  <Link href="/whatsapp-tools" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start text-blue-500 hover:text-blue-400 hover:bg-blue-500/10">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Ferramentas WhatsApp
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </header>
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </AppProvider>
  );
}