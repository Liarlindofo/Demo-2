'use client';

import { useState, useRef } from 'react';
import {
  Camera, Loader2, ImageOff, Images, X, Trash2,
  Star, Plus, Download, ArrowLeft, ArrowRight, Play,
} from 'lucide-react';

// ─── helpers ─────────────────────────────────────────────────────────────────

const MAX_VIDEO_MB = 50;
const MAX_IMAGE_MB = 3;

async function comprimirImagem(file: File, maxMB = MAX_IMAGE_MB): Promise<File> {
  if (!file.type.startsWith('image/')) return file; // vídeos: sem compressão
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

/** Upload direto ao Supabase via URL assinada (evita limite 413 do Vercel). */
async function uploadMidia(file: File, saborId: string, storeSlug: string): Promise<string> {
  const signRes = await fetch('/api/cmv/foto', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      saborId,
      storeSlug,
      contentType: file.type || 'application/octet-stream',
      fileName: file.name,
    }),
  });
  const signData = await signRes.json().catch(() => ({ error: `HTTP ${signRes.status}` }));
  if (!signRes.ok) throw new Error(signData.error || `Falha ao preparar upload (${signRes.status})`);

  // Formato esperado pelo Storage (igual ao uploadToSignedUrl do supabase-js)
  const body = new FormData();
  body.append('cacheControl', '3600');
  body.append('', file);

  const uploadRes = await fetch(signData.signedUrl, {
    method: 'PUT',
    headers: { 'x-upsert': 'false' },
    body,
  });
  if (!uploadRes.ok) {
    const detail = await uploadRes.text().catch(() => '');
    throw new Error(detail || `Upload falhou (${uploadRes.status})`);
  }

  return signData.publicUrl as string;
}

function isVideo(url: string) {
  return /\.(mp4|mov|webm|avi|mkv)(\?|$)/i.test(url);
}

async function downloadMidia(url: string, nome: string) {
  const cleanUrl = url.split('?')[0];
  const ext = cleanUrl.split('.').pop() ?? 'jpg';
  const res = await fetch(url);
  const blob = await res.blob();
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl; a.download = `${nome}.${ext}`;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(blobUrl);
}

// ─── Miniatura ────────────────────────────────────────────────────────────────

function Thumb({ url, isCapa, onClick }: { url: string; isCapa: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
        isCapa ? 'border-amber-500' : 'border-[#2a2a2e] hover:border-[#4a4a4e]'
      }`}>
      {isVideo(url)
        ? <div className="w-full h-full bg-[#141416] flex flex-col items-center justify-center gap-1">
            <Play className="w-6 h-6 text-gray-400" />
            <span className="text-[10px] text-gray-600">vídeo</span>
          </div>
        : <img src={url} alt="" className="w-full h-full object-cover" />
      }
      {isCapa && (
        <span className="absolute top-1 left-1 bg-amber-500 text-black text-[9px] font-bold px-1.5 py-0.5 rounded-md">
          CAPA
        </span>
      )}
    </button>
  );
}

// ─── Lightbox ─────────────────────────────────────────────────────────────────

function Lightbox({ fotos, index, nome, onClose, onPrev, onNext }:
  { fotos: string[]; index: number; nome: string; onClose: () => void; onPrev: () => void; onNext: () => void }) {
  const url = fotos[index];
  return (
    <div className="fixed inset-0 bg-black/95 flex flex-col z-[70]" onClick={onClose}>
      <div className="flex items-center justify-between px-4 py-3 shrink-0" onClick={e => e.stopPropagation()}>
        <span className="text-sm text-gray-300">{nome} · {index + 1}/{fotos.length}</span>
        <div className="flex gap-2">
          <button onClick={() => downloadMidia(url, nome)}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
            <Download className="w-4 h-4" />
          </button>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center px-4 relative" onClick={e => e.stopPropagation()}>
        {fotos.length > 1 && (
          <>
            <button onClick={onPrev}
              className="absolute left-2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-10">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button onClick={onNext}
              className="absolute right-2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-10">
              <ArrowRight className="w-5 h-5" />
            </button>
          </>
        )}
        {isVideo(url)
          ? <video src={url} controls className="max-h-[70vh] max-w-full rounded-xl" />
          : <img src={url} alt={nome} className="max-h-[70vh] max-w-full object-contain rounded-xl" />
        }
      </div>
    </div>
  );
}

// ─── Modal Galeria ────────────────────────────────────────────────────────────

interface GaleriaProps {
  fotos: string[];
  nome: string;
  uploading: boolean;
  onClose: () => void;
  onAddClick: () => void;
  onSetCapa: (idx: number) => void;
  onDelete: (idx: number) => void;
}

function GaleriaModal({ fotos, nome, uploading, onClose, onAddClick, onSetCapa, onDelete }: GaleriaProps) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  if (lightboxIdx !== null) {
    return (
      <Lightbox
        fotos={fotos} index={lightboxIdx} nome={nome} onClose={() => setLightboxIdx(null)}
        onPrev={() => setLightboxIdx(i => i! > 0 ? i! - 1 : fotos.length - 1)}
        onNext={() => setLightboxIdx(i => i! < fotos.length - 1 ? i! + 1 : 0)}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl w-full max-w-md shadow-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-[#2a2a2e] shrink-0">
          <div>
            <h3 className="text-base font-semibold text-white">Galeria — {nome}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{fotos.length} arquivo{fotos.length !== 1 ? 's' : ''} · 1ª foto = capa do card</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {fotos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <ImageOff className="w-10 h-10 text-gray-700" />
              <p className="text-sm text-gray-500">Nenhuma mídia adicionada</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {fotos.map((url, i) => (
                <div key={url} className="space-y-1.5">
                  <Thumb url={url} isCapa={i === 0} onClick={() => setLightboxIdx(i)} />
                  <div className="flex gap-1">
                    {i > 0 && (
                      <button onClick={() => onSetCapa(i)} title="Definir como capa"
                        className="flex-1 flex items-center justify-center py-1 rounded-lg bg-[#2a2a2e] hover:bg-amber-500/20 hover:text-amber-400 text-gray-500 transition-colors text-xs gap-1">
                        <Star className="w-3 h-3" /> Capa
                      </button>
                    )}
                    <button onClick={() => onDelete(i)} title="Remover"
                      className="w-7 h-6 flex items-center justify-center rounded-lg bg-[#2a2a2e] hover:bg-red-500/20 hover:text-red-400 text-gray-500 transition-colors">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Adicionar */}
        <div className="px-4 pb-4 pt-2 border-t border-[#2a2a2e] shrink-0">
          <button onClick={onAddClick} disabled={uploading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#2a2a2e] hover:bg-[#3a3a3e] text-gray-300 text-sm font-medium transition-colors disabled:opacity-50">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {uploading ? 'Enviando…' : 'Adicionar foto ou vídeo'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── FotoManager (principal) ──────────────────────────────────────────────────

interface FotoManagerProps {
  fotos: string[];
  nome: string;
  storeSlug?: string;
  produtoId: string;      // saborId ou combo-{id}
  onFotosChange?: (fotos: string[]) => void;
}

export function FotoManager({ fotos, nome, storeSlug, produtoId, onFotosChange }: FotoManagerProps) {
  const [uploading, setUploading]     = useState(false);
  const [galeriaAberta, setGaleria]   = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const capa = fotos[0];
  const editable = !!onFotosChange && !!storeSlug;

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0 || !storeSlug) return;
    setUploading(true);
    const novasUrls: string[] = [];
    for (const raw of Array.from(files)) {
      try {
        const isVid = raw.type.startsWith('video/');
        const maxBytes = (isVid ? MAX_VIDEO_MB : MAX_IMAGE_MB) * 1024 * 1024;
        // Vídeos grandes: valida antes; imagens são comprimidas abaixo
        if (isVid && raw.size > maxBytes) {
          console.error(`[FotoManager] Vídeo muito grande (${(raw.size / 1024 / 1024).toFixed(1)} MB). Máx: ${MAX_VIDEO_MB} MB`);
          alert(`Vídeo muito grande (${(raw.size / 1024 / 1024).toFixed(1)} MB). Máximo: ${MAX_VIDEO_MB} MB.`);
          continue;
        }
        const file = await comprimirImagem(raw);
        const url = await uploadMidia(file, produtoId, storeSlug);
        novasUrls.push(url);
      } catch (err) {
        console.error('[FotoManager] Upload error:', err);
        alert(err instanceof Error ? err.message : 'Falha no upload');
      }
    }
    if (novasUrls.length > 0) onFotosChange?.([...fotos, ...novasUrls]);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSetCapa = (idx: number) => {
    const novo = [...fotos];
    const [item] = novo.splice(idx, 1);
    novo.unshift(item);
    onFotosChange?.(novo);
  };

  const handleDelete = (idx: number) => {
    const novo = fotos.filter((_, i) => i !== idx);
    onFotosChange?.(novo);
  };

  return (
    <>
      {/* Input de upload (oculto) */}
      <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple className="hidden"
        onChange={e => handleFiles(e.target.files)} onClick={e => e.stopPropagation()} />

      {/* Galeria modal */}
      {galeriaAberta && (
        <GaleriaModal
          fotos={fotos} nome={nome} uploading={uploading}
          onClose={() => setGaleria(false)}
          onAddClick={() => fileInputRef.current?.click()}
          onSetCapa={handleSetCapa}
          onDelete={handleDelete}
        />
      )}

      {/* Área de foto no card */}
      {capa ? (
        <div className="relative w-full h-36 bg-[#141416] overflow-hidden">
          {isVideo(capa)
            ? <div className="w-full h-full flex items-center justify-center bg-[#141416]">
                <Play className="w-8 h-8 text-gray-500" />
              </div>
            : <img src={capa} alt={nome} className="w-full h-full object-cover"
                onError={() => onFotosChange?.(fotos.slice(1))} />
          }
          {/* Barra inferior */}
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-end gap-1 px-2 py-1.5 bg-gradient-to-t from-black/75 to-transparent"
            onClick={e => e.stopPropagation()}>
            <button onClick={() => downloadMidia(capa, nome)} title="Baixar capa"
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-black/50 hover:bg-black/80 text-white transition-colors">
              <Download className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setGaleria(true)} title="Abrir galeria"
              className="flex items-center gap-1 px-2 h-7 rounded-lg bg-black/50 hover:bg-black/80 text-white transition-colors text-xs">
              <Images className="w-3.5 h-3.5" />
              {fotos.length > 1 && <span>{fotos.length}</span>}
            </button>
            {editable && (
              <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                title="Adicionar foto/vídeo"
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-black/50 hover:bg-black/80 text-white transition-colors disabled:opacity-50">
                {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        </div>
      ) : editable ? (
        <button onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }} disabled={uploading}
          className="w-full h-20 flex flex-col items-center justify-center gap-1.5 bg-[#141416] hover:bg-[#1a1a1e] border-b border-[#2a2a2e] transition-colors"
          title="Adicionar foto ou vídeo">
          {uploading
            ? <Loader2 className="w-5 h-5 text-gray-600 animate-spin" />
            : <><ImageOff className="w-5 h-5 text-gray-700" /><span className="text-[10px] text-gray-700">Adicionar foto ou vídeo</span></>}
        </button>
      ) : null}
    </>
  );
}
