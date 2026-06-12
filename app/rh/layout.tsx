import { stackServerApp } from '@/stack';
import { LojaProvider } from '@/contexts/LojaContext';

export default async function RhLayout({ children }: { children: React.ReactNode }) {
  // Garante que só usuários autenticados via Stack Auth acessam o módulo RH
  await stackServerApp.getUser({ or: 'redirect' });

  return (
    <LojaProvider>
      {children}
    </LojaProvider>
  );
}
