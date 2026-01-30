'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@stackframe/stack';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Settings, User, Moon, Sun, LogOut, Menu, Link2, Calendar, MessageSquare, ClipboardCheck, Tag } from 'lucide-react';
import { Logo } from '@/components/logo';
import { AppProvider } from '@/contexts/app-context';
import { useRouter } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();
  
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
            <div className="w-full px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between py-4">
                {/* Menu Hamburger - Esquerda */}
                <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                  <SheetTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 w-9 p-0 text-white hover:bg-[#374151]"
                    >
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-64 bg-[#141415] border-[#374151] text-white">
                    <div className="flex flex-col gap-4 mt-8">
                      <Link 
                        href="/connections" 
                        onClick={() => setIsSidebarOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                          pathname === '/connections' 
                            ? 'bg-[#001F05] text-green-400' 
                            : 'text-gray-300 hover:bg-[#374151] hover:text-white'
                        }`}
                      >
                        <Link2 className="h-5 w-5" />
                        <span className="font-medium">Conexões</span>
                      </Link>
                      
                      <Link 
                        href="/whatsapp-config" 
                        onClick={() => setIsSidebarOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                          pathname === '/whatsapp-config' 
                            ? 'bg-[#001F05] text-green-400' 
                            : 'text-gray-300 hover:bg-[#374151] hover:text-white'
                        }`}
                      >
                        <Calendar className="h-5 w-5" />
                        <span className="font-medium">Agendamento de relatório</span>
                      </Link>
                      
                      <Link 
                        href="/whatsapp-tools" 
                        onClick={() => setIsSidebarOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                          pathname === '/whatsapp-tools' 
                            ? 'bg-[#001F05] text-green-400' 
                            : 'text-gray-300 hover:bg-[#374151] hover:text-white'
                        }`}
                      >
                        <MessageSquare className="h-5 w-5" />
                        <span className="font-medium">WhatsApp Chat</span>
                      </Link>
                      
                      <Link 
                        href="/checklist" 
                        onClick={() => setIsSidebarOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                          pathname?.startsWith('/checklist') 
                            ? 'bg-[#001F05] text-green-400' 
                            : 'text-gray-300 hover:bg-[#374151] hover:text-white'
                        }`}
                      >
                        <ClipboardCheck className="h-5 w-5" />
                        <span className="font-medium">Checklist</span>
                      </Link>
                      
                      <Link 
                        href="/etiquetagem" 
                        onClick={() => setIsSidebarOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                          pathname?.startsWith('/etiquetagem') 
                            ? 'bg-[#001F05] text-green-400' 
                            : 'text-gray-300 hover:bg-[#374151] hover:text-white'
                        }`}
                      >
                        <Tag className="h-5 w-5" />
                        <span className="font-medium">Etiquetagem</span>
                      </Link>
                    </div>
                  </SheetContent>
                </Sheet>
                
                {/* Logo - Centro */}
                <div className="absolute left-1/2 transform -translate-x-1/2">
                  <Link href="/dashboard" className="hover:opacity-80 transition-opacity">
                    <Logo />
                  </Link>
                </div>
                
                {/* Avatar - Direita */}
                <div className="flex items-center gap-4 ml-auto">
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
            </div>
          </header>
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </AppProvider>
  );
}