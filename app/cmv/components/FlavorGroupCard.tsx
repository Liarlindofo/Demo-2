'use client';

import { useState, useRef, useEffect } from 'react';
import { CheckSquare, Square, Camera, Loader2, ImageOff, Eye, Download } from 'lucide-react';

async function comprimirImagem(file: File, maxMB = 3): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement('canvas');
      const MAX_DIM = 1920;
      let { width, height } = img;
      if (width > MAX_DIM || height > MAX_DIM) {
        if (width > height) { height = Math.round(height * MAX_DIM / width); width = MAX_DIM; }
        else { width = Math.round(width * MAX_DIM / height); height = MAX_DIM; }
      }
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
      let quality = 0.9;
      const attempt = () => canvas.toBlob(blob => {
        if (!blob) return reject(new Error('Falha ao comprimir'));
        if (blob.size > maxMB * 1024 * 1024 && quality > 0.3) { quality -= 0.1; attempt(); }
        else resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }));
      }, 'image/jpeg', quality);
      attempt();
    };
    img.onerror = reject;
    img.src = objectUrl;
  });
}
import type { FlavorGroup } from '../utils';
import { formatCurrency, formatPercent, getSugestoesPreco } from '../utils';
import { CMV_COLORS, CMV_META } from '../constants';

interface FlavorGroupCardProps {
  group: FlavorGroup;
  onClick: () => void;
  selectMode?: boolean;
  selectedCount?: number;
  storeSlug?: string;
  onFotoUpload?: (url: string) => void;
}

const BEBIDA_COLOR = '#06b6d4'; // cyan-500

const STATUS_BADGE: Record<FlavorGroup['statusGeral'], string> = {
  otimo: 'bg-green-500/20 text-green-400 border border-green-500/30',
  atencao: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  critico: 'bg-red-500/20 text-red-400 border border-red-500/30',
};

const STATUS_LABEL: Record<FlavorGroup['statusGeral'], string> = {
  otimo: 'Ótimo',
  atencao: 'Atenção',
  critico: 'Acima da meta',
};

export const FlavorGroupCard = ({
  group, storeSlug, onClick, selectMode, selectedCount = 0, onFotoUpload,
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

  // Foto — usa a do primeiro produto do grupo (todos compartilham a mesma)
  const [uploading, setUploading] = useState(false);
  const [fotoSrc, setFotoSrc] = useState(group.produtos[0]?.fotoUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setFotoSrc(group.produtos[0]?.fotoUrl); }, [group.produtos]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.files?.[0];
    if (!raw || !storeSlug) return;
    setUploading(true);
    try {
      const file = await comprimirImagem(raw);
      const groupSlug = encodeURIComponent(group.nome.toLowerCase().replace(/\s+/g, '-'));
      const fd = new FormData();
      fd.append('file', file);
      fd.append('saborId', groupSlug);
      fd.append('storeSlug', storeSlug);
      const res = await fetch('/api/cmv/foto', { method: 'POST', body: fd });
      const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      if (!res.ok) throw new Error(data.error ?? 'Erro no upload');
      setFotoSrc(data.url);
      onFotoUpload?.(data.url);
    } catch (err) {
      console.error('[FlavorGroupCard] Upload foto:', err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleView = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!fotoSrc) return;
    window.open(fotoSrc.split('?')[0], '_blank');
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!fotoSrc) return;
    try {
      const res = await fetch(fotoSrc);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${group.nome}.jpg`;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(url);
    } catch (err) { console.error('[FlavorGroupCard] Download foto:', err); }
  };

  return (
    <div
      onClick={onClick}
      className={`relative bg-[#1c1c1e] border rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 select-none ${
        selectMode
          ? allSelected
            ? 'border-red-500/60 bg-red-500/5 hover:border-red-500/80'
            : someSelected
            ? 'border-red-500/30 hover:border-red-500/50'
            : 'border-[#2a2a2e] hover:border-red-500/30'
          : 'border-[#2a2a2e] hover:border-[#3a3a3e] hover:bg-[#202024]'
      }`}
    >
      {/* Input de upload (oculto) */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        onClick={e => e.stopPropagation()}
      />

      {/* Foto do produto */}
      {fotoSrc ? (
        <div className="relative w-full h-36 bg-[#141416] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={fotoSrc} alt={group.nome} className="w-full h-full object-cover" onError={() => setFotoSrc(undefined)} />
          {/* Barra de ações — sempre visível */}
          <div
            className="absolute bottom-0 left-0 right-0 flex items-center justify-end gap-1 px-2 py-1.5 bg-gradient-to-t from-black/75 to-transparent"
            onClick={e => e.stopPropagation()}
          >
            <button onClick={handleDownload} title="Baixar foto original"
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-black/50 hover:bg-black/80 text-white transition-colors">
              <Download className="w-3.5 h-3.5" />
            </button>
            <button onClick={handleView} title="Visualizar foto"
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-black/50 hover:bg-black/80 text-white transition-colors">
              <Eye className="w-3.5 h-3.5" />
            </button>
            {onFotoUpload && !selectMode && (
              <button onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }} disabled={uploading}
                title="Trocar foto"
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-black/50 hover:bg-black/80 text-white transition-colors disabled:opacity-50">
                {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        </div>
      ) : onFotoUpload && !selectMode ? (
        <button
          onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}
          disabled={uploading}
          className="w-full h-20 flex flex-col items-center justify-center gap-1.5 bg-[#141416] hover:bg-[#1a1a1e] border-b border-[#2a2a2e] transition-colors"
          title="Adicionar foto"
        >
          {uploading
            ? <Loader2 className="w-5 h-5 text-gray-600 animate-spin" />
            : <><ImageOff className="w-5 h-5 text-gray-700" /><span className="text-[10px] text-gray-700">Adicionar foto</span></>}
        </button>
      ) : null}

      {/* Conteúdo */}
      <div className="p-5">

      {/* Checkbox em modo seleção */}
      {selectMode && (
        <div className="absolute top-3 right-3 z-10 pointer-events-none">
          {allSelected ? (
            <CheckSquare className="w-5 h-5 text-red-400 drop-shadow" />
          ) : someSelected ? (
            <div className="w-5 h-5 rounded border-2 border-red-400 bg-red-400/20 flex items-center justify-center">
              <div className="w-2.5 h-0.5 bg-red-400 rounded" />
            </div>
          ) : (
            <Square className="w-5 h-5 text-gray-400 drop-shadow" />
          )}
        </div>
      )}

      {/* Nome + badge */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-white text-sm leading-tight">{group.nome}</h3>
          <p className="text-xs text-gray-500 mt-1 truncate" title={categoriaLabel}>
            {categoriaLabel}
          </p>
        </div>
        {!selectMode && (
          isGrupoBebidas ? (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 bg-cyan-500/15 text-cyan-400 border border-cyan-500/25">
              Bebida
            </span>
          ) : (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 ${STATUS_BADGE[group.statusGeral]}`}>
              {STATUS_LABEL[group.statusGeral]}
            </span>
          )
        )}
        {selectMode && someSelected && !allSelected && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 bg-red-500/15 text-red-400 border border-red-500/30">
            {selectedCount}/{group.produtos.length}
          </span>
        )}
      </div>

      {/* Barra de margem média */}
      <div className="relative h-1.5 bg-[#2a2a2e] rounded-full mb-4 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${Math.min(100, Math.max(0, 100 - group.cmvMedio))}%`,
            backgroundColor: cmvColor,
          }}
        />
        {!isGrupoBebidas && (
          <div
            className="absolute top-0 bottom-0 w-px bg-red-500/60"
            style={{ left: `${metaBarWidth}%` }}
          />
        )}
      </div>

      {/* Mini badges de variações */}
      <div className="flex flex-wrap gap-1 mb-3">
        {group.produtos.map(p => {
          const isBebidaProd = p.tipoPrecificacao === 'bebidas';
          const varColor = isBebidaProd ? BEBIDA_COLOR : CMV_COLORS[p.status];
          const sizeLabel = p.nome.replace(group.nome, '').trim() || p.nome;
          return (
            <span
              key={p.id}
              className="text-xs px-1.5 py-0.5 rounded-md border font-medium"
              style={{
                color: varColor,
                borderColor: `${varColor}40`,
                backgroundColor: `${varColor}12`,
              }}
            >
              {sizeLabel}
            </span>
          );
        })}
      </div>

      {/* CMV médio + contagem */}
      <div className="flex items-end justify-between">
        <div>
          <span className="text-2xl font-bold" style={{ color: cmvColor }}>
            {formatPercent(group.cmvMedio)}
          </span>
          <span className="text-xs text-gray-500 ml-1">médio</span>
        </div>
        <span className="text-xs text-gray-500">
          {group.produtos.length} {group.produtos.length === 1 ? 'tamanho' : 'tamanhos'}
        </span>
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
                  {sizeLabel || product.nome}
                  <span className="text-amber-500/50 ml-1">({s.targetCMV}%)</span>
                </span>
                <span className="text-xs font-bold text-amber-300 shrink-0 tabular-nums">
                  {formatCurrency(product.precoVenda)}{' '}
                  <span className="text-amber-500/80">→</span>{' '}
                  {formatCurrency(s.precoSugerido)}
                </span>
              </div>
            ));
          })}
        </div>
      )}
      </div>{/* fim p-5 */}
    </div>
  );
};
