import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Portal do Motoboy — Plateful',
  description: 'Acesse suas quinzenas e envie documentos',
};

export default function RiderLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {children}
    </div>
  );
}
