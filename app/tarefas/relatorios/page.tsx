import { BarChart3 } from 'lucide-react';

export default function TarefasRelatoriosPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Relatórios</h1>
            <p className="text-sm text-gray-400 mt-0.5">Acompanhe a execução e desempenho por loja</p>
          </div>
        </div>
        <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-10 text-center">
          <BarChart3 className="w-12 h-12 text-gray-700 mx-auto mb-3" />
          <p className="text-white font-semibold">Em construção</p>
          <p className="text-sm text-gray-500 mt-1">Os relatórios de execução serão implementados em breve.</p>
        </div>
      </div>
    </div>
  );
}
