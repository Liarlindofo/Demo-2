'use client';

import { useState, useRef, useEffect } from 'react';
import { Copy, Pencil, Check, X, Camera, Loader2, ImageOff, Eye, Download } from 'lucide-react';

/** Comprime imagem para no máximo `maxMB` MB usando Canvas (client-side). */
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
import type { ProductCMV } from '../types';
import { CMV_COLORS, CMV_META, getStatusLabel } from '../constants';
import { formatCurrency, formatPercent, getSugestoesPreco } from '../utils';

interface PizzaCardProps {
  product: ProductCMV;
  storeSlug?: string;
  onClick: () => void;
  selectMode?: boolean;
  selected?: boolean;
  onClone?: () => void;
  onRename?: (newName: string) => void;
  onFotoUpload?: (url: string) => void;
}

const STATUS_BADGE_COLORS = {
  otimo: 'bg-green-500/20 text-green-400 border border-green-500/30',
  atencao: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  critico: 'bg-red-500/20 text-red-400 border border-red-500/30',
};

const BEBIDA_COLOR = '#06b6d4'; // cyan-500

export const PizzaCard = ({
  product, storeSlug, onClick, selectMode, selected, onClone, onRename, onFotoUpload,
}: PizzaCardProps) => {
  const isBebida = product.tipoPrecificacao === 'bebidas';
  const cmvColor = isBebida ? BEBIDA_COLOR : CMV_COLORS[product.status];
  const barWidth = Math.min(100, Math.max(0, product.margem));
  const metaBarWidth = 100 - CMV_META;
  const sugestoes = getSugestoesPreco(product);

  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(product.nome);
  const inputRef = useRef<HTMLInputElement>(null);

  // Foto
  const [uploading, setUploading] = useState(false);
  const [fotoSrc, setFotoSrc] = useState(product.fotoUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setFotoSrc(product.fotoUrl); }, [product.fotoUrl]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.files?.[0];
    if (!raw || !storeSlug) return;
    setUploading(true);
    try {
      const file = await comprimirImagem(raw);   // comprime antes de enviar
      const fd = new FormData();
      fd.append('file', file);
      fd.append('saborId', product.id);
      fd.append('storeSlug', storeSlug);
      const res = await fetch('/api/cmv/foto', { method: 'POST', body: fd });
      const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      if (!res.ok) throw new Error(data.error ?? 'Erro no upload');
      setFotoSrc(data.url);
      onFotoUpload?.(data.url);
    } catch (err) {
      console.error('[PizzaCard] Upload foto:', err);
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
      a.href = url; a.download = `${product.nome}.jpg`;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(url);
    } catch (err) { console.error('[PizzaCard] Download foto:', err); }
  };

  useEffect(() => {
    if (isRenaming) {
      setRenameValue(product.nome);
      setTimeout(() => inputRef.current?.select(), 10);
    }
  }, [isRenaming, product.nome]);

  const commitRename = () => {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== product.nome) {
      onRename?.(trimmed);
    }
    setIsRenaming(false);
  };

  const cancelRename = () => {
    setRenameValue(product.nome);
    setIsRenaming(false);
  };

  const handleCardClick = () => {
    if (isRenaming) return;
    onClick();
  };

  return (
    <div
      onClick={handleCardClick}
      className={`group relative bg-[#1c1c1e] border rounded-2xl overflow-hidden transition-all duration-200 select-none ${
        selectMode
          ? selected
            ? 'border-red-500/60 bg-red-500/5 cursor-pointer'
            : 'border-[#2a2a2e] hover:border-red-500/30 cursor-pointer'
          : 'border-[#2a2a2e] hover:border-[#3a3a3e] hover:bg-[#202024] cursor-pointer'
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
        <div className="relative w-full h-36 bg-[#141416] overflow-hidden group/foto">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={fotoSrc}
            alt={product.nome}
            className="w-full h-full object-cover"
            onError={() => setFotoSrc(undefined)}
          />
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
            {onFotoUpload && (
              <button onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }} disabled={uploading}
                title="Trocar foto"
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-black/50 hover:bg-black/80 text-white transition-colors disabled:opacity-50">
                {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        </div>
      ) : onFotoUpload && !selectMode ? (
        /* Placeholder clicável quando sem foto */
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

      {/* Conteúdo do card */}
      <div className="p-5">
      {/* Cabeçalho: Nome + Status Badge */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0 flex-1">
          {isRenaming ? (
            <div
              className="flex items-center gap-1"
              onClick={e => e.stopPropagation()}
            >
              <input
                ref={inputRef}
                value={renameValue}
                onChange={e => setRenameValue(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') commitRename();
                  if (e.key === 'Escape') cancelRename();
                }}
                className="flex-1 bg-[#141416] border border-orange-500/50 rounded-lg px-2 py-0.5 text-sm text-white font-semibold focus:outline-none focus:border-orange-500 min-w-0"
                autoComplete="off"
              />
              <button
                onClick={commitRename}
                className="w-6 h-6 flex items-center justify-center rounded-md bg-green-500/20 hover:bg-green-500/30 text-green-400 transition-colors shrink-0"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={cancelRename}
                className="w-6 h-6 flex items-center justify-center rounded-md bg-[#2a2a2e] hover:bg-[#333] text-gray-400 transition-colors shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <h3 className="font-semibold text-white text-sm leading-tight">{product.nome}</h3>
          )}
          <p className="text-xs text-gray-500 mt-1 truncate" title={product.categoria}>
            {product.categoria}
          </p>
        </div>
        {isBebida ? (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 bg-cyan-500/15 text-cyan-400 border border-cyan-500/25">
            Bebida
          </span>
        ) : (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 ${STATUS_BADGE_COLORS[product.status]}`}>
            {getStatusLabel(product.status)}
          </span>
        )}
      </div>

      {/* Barra de margem */}
      <div className="relative h-1.5 bg-[#2a2a2e] rounded-full mb-4 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${barWidth}%`, backgroundColor: cmvColor }}
        />
        {!isBebida && (
          <div
            className="absolute top-0 bottom-0 w-px bg-red-500/60"
            style={{ left: `${metaBarWidth}%` }}
          />
        )}
      </div>

      {/* Detalhes */}
      <div className="space-y-1 mb-3">
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">Custo</span>
          <span className="text-white font-medium">{formatCurrency(product.custo)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">Venda</span>
          <span className="text-white font-medium">{formatCurrency(product.precoVenda)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">Margem</span>
          <span className="text-white font-medium">{formatPercent(product.margem)}</span>
        </div>
      </div>

      {/* Sugestão de preço */}
      {sugestoes.length > 0 && (
        <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/25 rounded-lg px-2.5 py-1.5 mb-3">
          <span className="text-amber-400 text-xs">💡</span>
          <div className="min-w-0 flex-1">
            <span className="text-xs text-amber-300 font-medium">Sugestão de venda</span>
            {sugestoes.map(s => (
              <div key={s.targetCMV} className="flex items-center justify-between gap-1 mt-0.5">
                <span className="text-xs text-amber-400/70">para {s.targetCMV}% CMV</span>
                <span className="text-xs font-bold text-amber-300 tabular-nums">
                  {formatCurrency(product.precoVenda)}{' '}
                  <span className="text-amber-500/80">→</span>{' '}
                  {formatCurrency(s.precoSugerido)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CMV e ingredientes */}
      <div className="flex items-end justify-between">
        <span className="text-2xl font-bold" style={{ color: cmvColor }}>
          {formatPercent(product.cmvPercent)}
        </span>
        <span className="text-xs text-gray-500">
          {product.numIngredientes} ingr.
        </span>
      </div>

      {/* Ações rápidas — aparecem no hover (apenas fora do modo seleção) */}
      {!selectMode && !isRenaming && (onClone || onRename) && (
        <div
          className="absolute bottom-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={e => e.stopPropagation()}
        >
          {onRename && (
            <button
              title="Renomear produto"
              onClick={() => setIsRenaming(true)}
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#2a2a2e] hover:bg-orange-500/20 hover:text-orange-400 text-gray-400 transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
          {onClone && (
            <button
              title="Clonar produto"
              onClick={onClone}
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#2a2a2e] hover:bg-blue-500/20 hover:text-blue-400 text-gray-400 transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
      </div>{/* fim p-5 */}
    </div>
  );
};
