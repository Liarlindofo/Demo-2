import { LojaProvider } from '@/contexts/LojaContext';

export default function RhLayout({ children }: { children: React.ReactNode }) {
  return (
    <LojaProvider>
      {children}
    </LojaProvider>
  );
}
