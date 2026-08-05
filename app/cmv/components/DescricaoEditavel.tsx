'use client';

import { useState, useRef, useEffect } from 'react';

interface DescricaoEditavelProps {
  valor?: string;
  onSalvar?: (novoValor: string) => void;
  placeholder?: string;
  maxLength?: number;
}

/**
 * Campo de descrição editável inline.
 * - Clique no texto ou no placeholder para entrar em modo de edição.
 * - Salva no blur ou com Ctrl+Enter / Cmd+Enter.
 * - Cancela com Escape.
 */
export function DescricaoEditavel({
  valor,
  onSalvar,
  placeholder = 'Adicionar descrição…',
  maxLength = 300,
}: DescricaoEditavelProps) {
  const [editando, setEditando] = useState(false);
  const [draft, setDraft] = useState(valor ?? '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sincroniza quando prop muda externamente
  useEffect(() => { if (!editando) setDraft(valor ?? ''); }, [valor, editando]);

  // Foco automático ao entrar em edição
  useEffect(() => {
    if (editando) {
      textareaRef.current?.focus();
      textareaRef.current?.select();
    }
  }, [editando]);

  const salvar = () => {
    const trimmed = draft.trim();
    onSalvar?.(trimmed);
    setEditando(false);
  };

  const cancelar = () => {
    setDraft(valor ?? '');
    setEditando(false);
  };

  if (!onSalvar) {
    // Read-only: só exibe se tiver conteúdo
    if (!valor) return null;
    return <p className="text-xs text-gray-500 leading-relaxed mt-1">{valor}</p>;
  }

  if (editando) {
    return (
      <div className="mt-1.5" onClick={e => e.stopPropagation()}>
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={salvar}
          onKeyDown={e => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); salvar(); }
            if (e.key === 'Escape') { e.preventDefault(); cancelar(); }
          }}
          maxLength={maxLength}
          rows={3}
          placeholder={placeholder}
          className="w-full bg-[#0a0a0a] border border-orange-500/40 rounded-lg px-2.5 py-1.5 text-xs text-gray-300 placeholder-gray-600 resize-none focus:outline-none focus:border-orange-500/70 transition-colors leading-relaxed"
        />
        <p className="text-[10px] text-gray-700 mt-0.5 text-right">
          {draft.length}/{maxLength} · Ctrl+Enter salva · Esc cancela
        </p>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={e => { e.stopPropagation(); setEditando(true); }}
      className="block w-full text-left mt-1.5 group/desc"
      title="Clique para editar a descrição"
    >
      {valor ? (
        <p className="text-xs text-gray-500 leading-relaxed group-hover/desc:text-gray-400 transition-colors line-clamp-3">
          {valor}
        </p>
      ) : (
        <span className="text-[10px] text-gray-700 group-hover/desc:text-gray-500 transition-colors italic">
          {placeholder}
        </span>
      )}
    </button>
  );
}
