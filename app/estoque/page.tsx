import { EstoqueDashboard } from './components/EstoqueDashboard';

export const metadata = {
  title: 'Plateful Estoque',
  description: 'Contagem semanal de insumos',
};

export default function EstoquePage() {
  return <EstoqueDashboard />;
}
