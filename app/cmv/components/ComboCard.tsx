'use client';

import { useState, useRef, useEffect } from 'react';
import { GlassWater, Package2, Pizza, Camera, Loader2, ImageOff, Eye, Download } from 'lucide-react';
import { DescricaoEditavel } from './DescricaoEditavel';
import type { ComboCMV } from '../types';
import { TAMANHO_LABELS } from '../types';
import { CMV_COLORS, CMV_META, getStatusLabel } from '../constants';
import { formatCurrency, formatPercent } from '../utils';

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

interface ComboCardProps {
  combo: ComboCMV;
  storeSlug?: string;
  onClick: () => void;
  onFotoUpload?: (url: string) => void;
  onDescricaoChange?: (descricao: string) => void;
}

const STATUS_BADGE_COLORS = {
  otimo: 'bg-green-500/20 text-green-400 border border-green-500/30',
  atencao: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  critico: 'bg-red-500/20 text-red-400 border border-red-500/30',
};

export const ComboCard = ({ combo, storeSlug, onClick, onFotoUpload, onDescricaoChange }: ComboCardProps) => {
  const cmvColor = CMV_COLORS[combo.status];
  const barWidth = Math.min(100, Math.max(0, combo.margem));
  const metaBarWidth = 100 - CMV_META;
  const semPreco = combo.precoVenda === 0;
  const temDesconto = combo.economia > 0.01;
  const totalItens = combo.itens.reduce((s, i) => s + i.quantidade, 0);
  const totalPizzas = combo.itens.filter(i => i.tipo === 'pizza').reduce((s, i) => s + i.quantidade, 0);
  const totalBebidas = combo.itens.filter(i => i.tipo === 'ingrediente').reduce((s, i) => s + i.quantidade, 0);
  const semProdutos = combo.itens.some(i => i.tipo === 'pizza' && i.numProdutos === 0);

  // Foto
  const [uploading, setUploading] = useState(false);
  const [fotoSrc, setFotoSrc] = useState(combo.fotoUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setFotoSrc(combo.fotoUrl); }, [combo.fotoUrl]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.files?.[0];
    if (!raw || !storeSlug) return;
    setUploading(true);
    try {
      const file = await comprimirImagem(raw);
      const fd = new FormData();
      fd.append('file', file);
      fd.append('saborId', `combo-${combo.id}`);
      fd.append('storeSlug', storeSlug);
      const res = await fetch('/api/cmv/foto', { method: 'POST', body: fd });
      const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      if (!res.ok) throw new Error(data.error ?? 'Erro no upload');
      setFotoSrc(data.url);
      onFotoUpload?.(data.url);
    } catch (err) {
      console.error('[ComboCard] Upload foto:', err);
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
      a.href = url; a.download = `${combo.nome}.jpg`;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(url);
    } catch (err) { console.error('[ComboCard] Download foto:', err); }
  };

  return (
    <div
      onClick={onClick}
      className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl overflow-hidden cursor-pointer hover:border-[#3a3a3e] hover:bg-[#202024] transition-all duration-200 select-none"
    >
      {/* Input oculto */}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
        onChange={handleFileChange} onClick={e => e.stopPropagation()} />

      {/* Foto */}
      {fotoSrc ? (
        <div className="relative w-full h-36 bg-[#141416] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={fotoSrc} alt={combo.nome} className="w-full h-full object-cover" onError={() => setFotoSrc(undefined)} />
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-end gap-1 px-2 py-1.5 bg-gradient-to-t from-black/75 to-transparent"
            onClick={e => e.stopPropagation()}>
            <button onClick={handleDownload} title="Baixar foto"
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
      ) : onFotoUpload ? (
        <button onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }} disabled={uploading}
          className="w-full h-20 flex flex-col items-center justify-center gap-1.5 bg-[#141416] hover:bg-[#1a1a1e] border-b border-[#2a2a2e] transition-colors"
          title="Adicionar foto">
          {uploading
            ? <Loader2 className="w-5 h-5 text-gray-600 animate-spin" />
            : <><ImageOff className="w-5 h-5 text-gray-700" /><span className="text-[10px] text-gray-700">Adicionar foto</span></>}
        </button>
      ) : null}

      {/* Conteúdo */}
      <div className="p-5">
        {/* Cabeçalho */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-md bg-orange-500/15 flex items-center justify-center shrink-0">
              <Package2 className="w-3.5 h-3.5 text-orange-400" />
            </div>
          <h3 className="font-semibold text-white text-sm leading-tight truncate">{combo.nome}</h3>
          <DescricaoEditavel
            valor={combo.descricao}
            onSalvar={onDescricaoChange}
          />
        </div>
        {!semPreco && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 ${STATUS_BADGE_COLORS[combo.status]}`}>
            {getStatusLabel(combo.status)}
          </span>
        )}
      </div>

        {/* Slots do combo */}
        <div className="ml-8 mb-3 space-y-1.5">
          {combo.itens.slice(0, 3).map(item => {
            if (item.tipo === 'ingrediente') {
              return (
                <div key={item.id} className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex items-center gap-1.5">
                    <GlassWater className="w-3 h-3 text-blue-400 shrink-0" />
                    <span className="text-xs text-white">
                      <span className="text-blue-400 font-medium mr-1">{item.quantidade}×</span>
                      <span className="font-medium">{item.nomeIngrediente}</span>
                    </span>
                  </div>
                  {item.precoItem > 0 && (
                    <span className="text-xs text-gray-600 shrink-0 mt-0.5">~{formatCurrency(item.precoItem)}</span>
                  )}
                </div>
              );
            }
            const catsLabel =
              item.categorias.length === 0 ? 'todas as categorias'
              : item.categorias.length <= 2 ? item.categorias.map(c => c.nome).join(', ')
              : `${item.categorias.slice(0, 2).map(c => c.nome).join(', ')} +${item.categorias.length - 2}`;
            return (
              <div key={item.id} className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex items-start gap-1.5">
                  <Pizza className="w-3 h-3 text-orange-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs text-white">
                      <span className="text-orange-400 font-medium mr-1">{item.quantidade}×</span>
                      <span className="font-medium">{TAMANHO_LABELS[item.tamanho]}</span>
                    </span>
                    <p className="text-xs text-gray-600 truncate">{catsLabel}</p>
                  </div>
                </div>
                {item.precoMedioUnitario > 0 && (
                  <span className="text-xs text-gray-600 shrink-0 mt-0.5">~{formatCurrency(item.precoItem)}</span>
                )}
              </div>
            );
          })}
          {combo.itens.length > 3 && (
            <p className="text-xs text-gray-600">+{combo.itens.length - 3} item{combo.itens.length - 3 !== 1 ? 's' : ''}</p>
          )}
          {combo.itens.length === 0 && (
            <p className="text-xs text-gray-600 italic">Nenhum item adicionado</p>
          )}
        </div>

        {/* Barra de margem */}
        {!semPreco && (
          <div className="relative h-1.5 bg-[#2a2a2e] rounded-full mb-4 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-300"
              style={{ width: `${barWidth}%`, backgroundColor: cmvColor }} />
            <div className="absolute top-0 bottom-0 w-px bg-red-500/60" style={{ left: `${metaBarWidth}%` }} />
          </div>
        )}

        {/* Valores */}
        <div className="space-y-1 mb-3">
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Custo médio</span>
            <span className="text-white font-medium">{formatCurrency(combo.custoTotal)}</span>
          </div>
          {combo.precoRegular > 0 && (
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Preço médio</span>
              <span className={`font-medium ${temDesconto ? 'text-gray-500 line-through' : 'text-white'}`}>
                {formatCurrency(combo.precoRegular)}
              </span>
            </div>
          )}
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Venda combo</span>
            <span className={`font-medium ${semPreco ? 'text-gray-600 italic' : 'text-white'}`}>
              {semPreco ? 'Não definido' : formatCurrency(combo.precoVenda)}
            </span>
          </div>
          {!semPreco && temDesconto && (
            <div className="flex justify-between text-xs">
              <span className="text-green-400">Economia</span>
              <span className="text-green-400 font-medium">
                -{formatCurrency(combo.economia)} ({((combo.economia / combo.precoRegular) * 100).toFixed(0)}% off)
              </span>
            </div>
          )}
          {!semPreco && (
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Margem</span>
              <span className="text-white font-medium">{formatPercent(combo.margem)}</span>
            </div>
          )}
        </div>

        {/* CMV + resumo */}
        <div className="flex items-end justify-between">
          {semPreco ? (
            <span className="text-sm text-gray-600 italic">Defina um preço de venda</span>
          ) : (
            <span className="text-2xl font-bold" style={{ color: cmvColor }}>{formatPercent(combo.cmvPercent)}</span>
          )}
          <span className="text-xs text-gray-500 text-right">
            {totalPizzas > 0 && <span>{totalPizzas} pizza{totalPizzas !== 1 ? 's' : ''}</span>}
            {totalPizzas > 0 && totalBebidas > 0 && <span className="mx-1">·</span>}
            {totalBebidas > 0 && <span>{totalBebidas} bebida{totalBebidas !== 1 ? 's' : ''}</span>}
            {totalItens === 0 && <span>—</span>}
            {semProdutos && <span className="text-yellow-600 ml-1">⚠</span>}
          </span>
        </div>

        {semProdutos && (
          <p className="text-xs text-yellow-600 mt-2">⚠ Alguns tamanhos/categorias sem produtos cadastrados</p>
        )}
      </div>
    </div>
  );
};
