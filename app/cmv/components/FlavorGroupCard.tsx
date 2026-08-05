'use client';

import { CheckSquare, Square } from 'lucide-react';
import type { FlavorGroup } from '../utils';
import { formatCurrency, formatPercent, getSugestoesPreco } from '../utils';
import { CMV_COLORS, CMV_META } from '../constants';
import { DescricaoEditavel } from './DescricaoEditavel';
import { FotoManager } from './FotoManager';

interface FlavorGroupCardProps {
  group: FlavorGroup;
  onClick: () => void;
  selectMode?: boolean;
  selectedCount?: number;
  storeSlug?: string;
  onFotosChange?: (fotos: string[]) => void;
  onDescricaoChange?: (descricao: string) => void;
}

const BEBIDA_COLOR = '#06b6d4';

const STATUS_BADGE: Record<FlavorGroup['statusGeral'], string> = {
  otimo: 'bg-green-500/20 text-green-400 border border-green-500/30',
  atencao: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  critico: 'bg-red-500/20 text-red-400 border border-red-500/30',
};

const STATUS_LABEL: Record<FlavorGroup['statusGeral'], string> = {
  otimo: 'Ótimo', atencao: 'Atenção', critico: 'Acima da meta',
};

export const FlavorGroupCard = ({
  group, storeSlug, onClick, selectMode, selectedCount = 0, onFotosChange, onDescricaoChange,
}: FlavorGroupCardProps) => {
  const isGrupoBebidas = group.produtos.every(p => p.tipoPrecificacao === 'bebidas');
  const cmvColor = isGrupoBebidas ? BEBIDA_COLOR : CMV_COLORS[group.statusGeral];
  const metaBarWidth = 100 - CMV_META;
  const categoriaLabel = [...new Set(group.produtos.map(p => p.categoria))].join(' · ');
  const allSelected = selectedCount === group.produtos.length;
  const someSelected = selectedCount > 0 && !allSelected;

  const produtosComSugestoes = group.produtos
    .map(p => ({ product: p, sugestoes: getSugestoesPreco(p) }))
    .filter(({ sugestoes }) => sugestoes.length > 0);

  // Usa o representante do grupo (primeiro produto) para a foto
  const primeiroId = group.produtos[0]?.id ?? group.nome;
  const groupSlug  = encodeURIComponent(group.nome.toLowerCase().replace(/\s+/g, '-'));
  const produtoId  = groupSlug; // mantém compatibilidade com uploads anteriores por nome
  const fotos = group.produtos[0]?.fotos ?? (group.produtos[0]?.fotoUrl ? [group.produtos[0].fotoUrl] : []);

  return (
    <div
      onClick={onClick}
      className={`relative bg-[#1c1c1e] border rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 select-none ${
        selectMode
          ? allSelected   ? 'border-red-500/60 bg-red-500/5 hover:border-red-500/80'
          : someSelected  ? 'border-red-500/30 hover:border-red-500/50'
                          : 'border-[#2a2a2e] hover:border-red-500/30'
          : 'border-[#2a2a2e] hover:border-[#3a3a3e] hover:bg-[#202024]'
      }`}
    >
      {/* Checkbox em modo seleção */}
      {selectMode && (
        <div className="absolute top-3 right-3 z-10 pointer-events-none">
          {allSelected ? <CheckSquare className="w-5 h-5 text-red-400 drop-shadow" />
          : someSelected ? (
            <div className="w-5 h-5 rounded border-2 border-red-400 bg-red-400/20 flex items-center justify-center">
              <div className="w-2.5 h-0.5 bg-red-400 rounded" />
            </div>
          ) : <Square className="w-5 h-5 text-gray-400 drop-shadow" />}
        </div>
      )}

      {/* Galeria de fotos/vídeos */}
      {!selectMode && (
        <div onClick={e => e.stopPropagation()}>
          <FotoManager
            fotos={fotos}
            nome={group.nome}
            storeSlug={storeSlug}
            produtoId={produtoId}
            onFotosChange={onFotosChange}
          />
        </div>
      )}

      {/* Conteúdo */}
      <div className="p-5">
        {/* Nome + badge */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-white text-sm leading-tight">{group.nome}</h3>
            <p className="text-xs text-gray-500 mt-1 truncate" title={categoriaLabel}>{categoriaLabel}</p>
            {!selectMode && (
              <DescricaoEditavel valor={group.produtos[0]?.descricao} onSalvar={onDescricaoChange} />
            )}
          </div>
          {!selectMode && (
            isGrupoBebidas
              ? <span className="text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 bg-cyan-500/15 text-cyan-400 border border-cyan-500/25">Bebida</span>
              : <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 ${STATUS_BADGE[group.statusGeral]}`}>{STATUS_LABEL[group.statusGeral]}</span>
          )}
          {selectMode && someSelected && !allSelected && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 bg-red-500/15 text-red-400 border border-red-500/30">{selectedCount}/{group.produtos.length}</span>
          )}
        </div>

        {/* Barra de margem média */}
        <div className="relative h-1.5 bg-[#2a2a2e] rounded-full mb-4 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(0, 100 - group.cmvMedio))}%`, backgroundColor: cmvColor }} />
          {!isGrupoBebidas && (
            <div className="absolute top-0 bottom-0 w-px bg-red-500/60" style={{ left: `${metaBarWidth}%` }} />
          )}
        </div>

        {/* Mini badges de variações */}
        <div className="flex flex-wrap gap-1 mb-3">
          {group.produtos.map(p => {
            const isBebidaProd = p.tipoPrecificacao === 'bebidas';
            const varColor = isBebidaProd ? BEBIDA_COLOR : CMV_COLORS[p.status];
            const sizeLabel = p.nome.replace(group.nome, '').trim() || p.nome;
            return (
              <span key={p.id} className="text-xs px-1.5 py-0.5 rounded-md border font-medium"
                style={{ color: varColor, borderColor: `${varColor}40`, backgroundColor: `${varColor}12` }}>
                {sizeLabel}
              </span>
            );
          })}
        </div>

        {/* CMV médio + contagem */}
        <div className="flex items-end justify-between">
          <div>
            <span className="text-2xl font-bold" style={{ color: cmvColor }}>
              {group.cmvMedio.toFixed(1)}%
            </span>
            <span className="text-xs text-gray-500 ml-1">médio</span>
          </div>
          <div className="text-xs text-gray-500 text-right">
            <div>{formatCurrency(group.custoMedio)} custo</div>
            <div>{group.produtos.length} tamanho{group.produtos.length !== 1 ? 's' : ''}</div>
          </div>
        </div>

        {/* Sugestões de preço por tamanho */}
        {!selectMode && produtosComSugestoes.length > 0 && (
          <div className="mt-3 bg-amber-500/10 border border-amber-500/25 rounded-lg px-2.5 py-2 space-y-1">
            <div className="flex items-center gap-1 mb-1">
              <span className="text-xs">💡</span>
              <span className="text-xs text-amber-300 font-medium">Sugestão de venda</span>
            </div>
            {produtosComSugestoes.map(({ product, sugestoes }) => {
              const sizeLabel = product.nome.replace(group.nome, '').trim() || product.nome;
              return sugestoes.map(s => (
                <div key={`${product.id}-${s.targetCMV}`} className="flex items-center justify-between gap-2">
                  <span className="text-xs text-amber-400/70 truncate">
                    {sizeLabel || product.nome}<span className="text-amber-500/50 ml-1">({s.targetCMV}%)</span>
                  </span>
                  <span className="text-xs font-bold text-amber-300 shrink-0 tabular-nums">
                    {formatCurrency(product.precoVenda)} <span className="text-amber-500/80">→</span> {formatCurrency(s.precoSugerido)}
                  </span>
                </div>
              ));
            })}
          </div>
        )}
      </div>
    </div>
  );
};
