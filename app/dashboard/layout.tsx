'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@stackframe/stack';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Settings, User, Moon, Sun, LogOut, Menu, Link2, FileBarChart2, MessageSquare, ClipboardCheck, Tag, Lock, Package, BarChart2, Warehouse, ShoppingBag, ChevronDown, ChevronRight, Users, ListChecks, Bot, Clock } from 'lucide-react';
import { Logo } from '@/components/logo';
import { AppProvider } from '@/contexts/app-context';
import { useRouter } from 'next/navigation';
import { useToolPermissions } from '@/hooks/useToolPermissions';
import { SystemTool } from '@/types/admin';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [ifoodOpen, setIfoodOpen] = useState(false);
  const pathname = usePathname();
  
  // Usar Stack Auth real - redireciona para login se não autenticado
  const user = useUser({ or: 'redirect' });
  const { permissions, loading: permissionsLoading } = useToolPermissions();
  
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
                  <SheetContent side="left" className="w-64 bg-[#141415] border-[#374151] text-white flex flex-col">
                    <div className="flex flex-col gap-2 mt-8 flex-1 overflow-y-auto pb-6 pr-1 [&::-webkit-scrollbar]:w-[3px] [&::-webkit-scrollbar-track]:transparent [&::-webkit-scrollbar-thumb]:bg-[#374151] [&::-webkit-scrollbar-thumb]:rounded-full">
                      {/* Conexões */}
                      {permissionsLoading ? (
                        <div className="px-4 py-3 text-gray-400 text-sm">Carregando permissões...</div>
                      ) : (
                        <>
                          {/* Produtos */}
                          {permissions[SystemTool.PRODUTOS] ? (
                            <Link 
                              href="/produtos" 
                              onClick={() => setIsSidebarOpen(false)}
                              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                                pathname === '/produtos' 
                                  ? 'bg-[#001F05] text-green-400' 
                                  : 'text-gray-300 hover:bg-[#374151] hover:text-white'
                              }`}
                            >
                              <Package className="h-5 w-5" />
                              <span className="font-medium">Produtos</span>
                            </Link>
                          ) : (
                            <div className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-500 cursor-not-allowed">
                              <Lock className="h-5 w-5" />
                              <span className="font-medium">Produtos</span>
                            </div>
                          )}
                          
                          {permissions[SystemTool.CONEXOES] ? (
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
                          ) : (
                            <div className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-500 cursor-not-allowed">
                              <Lock className="h-5 w-5" />
                              <span className="font-medium">Conexões</span>
                            </div>
                          )}
                          
                          {/* Central de Relatórios */}
                          {permissions[SystemTool.AGENDAMENTO_RELATORIOS] ? (
                            <Link 
                              href="/relatorios" 
                              onClick={() => setIsSidebarOpen(false)}
                              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                                pathname === '/relatorios' || pathname?.startsWith('/relatorios/')
                                  ? 'bg-[#001F05] text-green-400' 
                                  : 'text-gray-300 hover:bg-[#374151] hover:text-white'
                              }`}
                            >
                              <FileBarChart2 className="h-5 w-5" />
                              <span className="font-medium">Central de Relatórios</span>
                            </Link>
                          ) : (
                            <div className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-500 cursor-not-allowed">
                              <Lock className="h-5 w-5" />
                              <span className="font-medium">Central de Relatórios</span>
                            </div>
                          )}
                          
                          {/* WhatsApp Chat */}
                          {permissions[SystemTool.WHATSAPP_CHAT] ? (
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
                          ) : (
                            <div className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-500 cursor-not-allowed">
                              <Lock className="h-5 w-5" />
                              <span className="font-medium">WhatsApp Chat</span>
                            </div>
                          )}
                          
                          {/* Checklist */}
                          {permissions[SystemTool.CHECKLIST] ? (
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
                          ) : (
                            <div className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-500 cursor-not-allowed">
                              <Lock className="h-5 w-5" />
                              <span className="font-medium">Checklist</span>
                            </div>
                          )}
                          
                          {/* Etiquetagem */}
                          {permissions[SystemTool.ETIQUETAGEM] ? (
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
                          ) : (
                            <div className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-500 cursor-not-allowed">
                              <Lock className="h-5 w-5" />
                              <span className="font-medium">Etiquetagem</span>
                            </div>
                          )}

                          {/* CMV */}
                          {permissions[SystemTool.CMV] ? (
                            <Link 
                              href="/cmv" 
                              onClick={() => setIsSidebarOpen(false)}
                              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                                pathname?.startsWith('/cmv') 
                                  ? 'bg-[#001F05] text-green-400' 
                                  : 'text-gray-300 hover:bg-[#374151] hover:text-white'
                              }`}
                            >
                              <BarChart2 className="h-5 w-5" />
                              <span className="font-medium">CMV</span>
                            </Link>
                          ) : (
                            <div className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-500 cursor-not-allowed">
                              <Lock className="h-5 w-5" />
                              <span className="font-medium">CMV</span>
                            </div>
                          )}

                          {/* Estoque */}
                          {permissions[SystemTool.ESTOQUE] ? (
                            <Link
                              href="/estoque"
                              onClick={() => setIsSidebarOpen(false)}
                              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                                pathname?.startsWith('/estoque')
                                  ? 'bg-amber-500/15 text-amber-400'
                                  : 'text-gray-300 hover:bg-[#374151] hover:text-white'
                              }`}
                            >
                              <Warehouse className="h-5 w-5" />
                              <span className="font-medium">Estoque</span>
                            </Link>
                          ) : (
                            <div className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-500 cursor-not-allowed">
                              <Lock className="h-5 w-5" />
                              <span className="font-medium">Estoque</span>
                            </div>
                          )}

                          {/* RH */}
                          {permissions[SystemTool.RH] ? (
                            <Link
                              href="/rh"
                              onClick={() => setIsSidebarOpen(false)}
                              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                                pathname?.startsWith('/rh') || pathname?.startsWith('/bonificacao')
                                  ? 'bg-amber-500/15 text-amber-400'
                                  : 'text-gray-300 hover:bg-[#374151] hover:text-white'
                              }`}
                            >
                              <Users className="h-5 w-5" />
                              <span className="font-medium">RH</span>
                            </Link>
                          ) : (
                            <div className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-500 cursor-not-allowed">
                              <Lock className="h-5 w-5" />
                              <span className="font-medium">RH</span>
                            </div>
                          )}

                          {/* Pontos */}
                          {permissions[SystemTool.PONTOS] ? (
                            <Link
                              href="/pontos"
                              onClick={() => setIsSidebarOpen(false)}
                              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                                pathname?.startsWith('/pontos')
                                  ? 'bg-amber-500/15 text-amber-400'
                                  : 'text-gray-300 hover:bg-[#374151] hover:text-white'
                              }`}
                            >
                              <Clock className="h-5 w-5" />
                              <span className="font-medium">Pontos</span>
                            </Link>
                          ) : (
                            <div className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-500 cursor-not-allowed">
                              <Lock className="h-5 w-5" />
                              <span className="font-medium">Pontos</span>
                            </div>
                          )}

                          {/* Tarefas */}
                          {permissions[SystemTool.TAREFAS] ? (
                            <Link
                              href="/tarefas"
                              onClick={() => setIsSidebarOpen(false)}
                              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                                pathname?.startsWith('/tarefas')
                                  ? 'bg-amber-500/15 text-amber-400'
                                  : 'text-gray-300 hover:bg-[#374151] hover:text-white'
                              }`}
                            >
                              <ListChecks className="h-5 w-5" />
                              <span className="font-medium">Tarefas</span>
                            </Link>
                          ) : (
                            <div className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-500 cursor-not-allowed">
                              <Lock className="h-5 w-5" />
                              <span className="font-medium">Tarefas</span>
                            </div>
                          )}

                          {/* Chat */}
                          {permissions[SystemTool.CHAT] ? (
                            <Link
                              href="/chat"
                              onClick={() => setIsSidebarOpen(false)}
                              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                                pathname?.startsWith('/chat')
                                  ? 'bg-cyan-500/15 text-cyan-400'
                                  : 'text-gray-300 hover:bg-[#374151] hover:text-white'
                              }`}
                            >
                              <Bot className="h-5 w-5" />
                              <span className="font-medium">Chat</span>
                            </Link>
                          ) : (
                            <div className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-500 cursor-not-allowed">
                              <Lock className="h-5 w-5" />
                              <span className="font-medium">Chat</span>
                            </div>
                          )}

                          {/* iFood */}
                          {permissions[SystemTool.IFOOD] ? (
                            <div>
                              <button
                                onClick={() => setIfoodOpen((o) => !o)}
                                className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-colors ${
                                  pathname?.startsWith('/ifood')
                                    ? 'bg-red-900/20 text-red-400'
                                    : 'text-gray-300 hover:bg-[#374151] hover:text-white'
                                }`}
                              >
                                <span className="flex items-center gap-3">
                                  <ShoppingBag className="h-5 w-5" />
                                  <span className="font-medium">iFood</span>
                                </span>
                                {ifoodOpen
                                  ? <ChevronDown className="h-4 w-4" />
                                  : <ChevronRight className="h-4 w-4" />}
                              </button>

                              {ifoodOpen && (
                                <div className="mt-1 ml-4 pl-4 border-l border-[#374151] space-y-1">
                                  {[
                                    { label: 'Configurações', href: '/ifood/configuracoes' },
                                    { label: 'Operacional', href: '/ifood/operacional' },
                                    { label: 'Financeiro', href: '/ifood/financeiro' },
                                    { label: 'Cardápio', href: '/ifood/cardapio' },
                                  ].map((sub) => (
                                    <Link
                                      key={sub.href}
                                      href={sub.href}
                                      onClick={() => setIsSidebarOpen(false)}
                                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                                        pathname === sub.href
                                          ? 'bg-red-900/20 text-red-400'
                                          : 'text-gray-400 hover:bg-[#374151] hover:text-white'
                                      }`}
                                    >
                                      {sub.label}
                                    </Link>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-500 cursor-not-allowed">
                              <Lock className="h-5 w-5" />
                              <span className="font-medium">iFood</span>
                            </div>
                          )}
                        </>
                      )}
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