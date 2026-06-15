import { stackServerApp } from '@/stack';
import { LojaProvider } from '@/contexts/LojaContext';
import { RhClientWrapper } from '@/components/rh/RhClientWrapper';

export default async function RhLayout({ children }: { children: React.ReactNode }) {
  // Garante que só usuários autenticados via Stack Auth acessam o módulo RH
  await stackServerApp.getUser({ or: 'redirect' });

  return (
    <LojaProvider>
      <RhClientWrapper>
        {children}
      </RhClientWrapper>
    </LojaProvider>
  );
}
