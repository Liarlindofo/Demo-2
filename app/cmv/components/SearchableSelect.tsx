'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, X, ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  sublabel?: string;  // Informação extra (ex: preço)
  group?: string;     // Agrupamento opcional
  badge?: string;     // Badge extra (ex: "receita")
  badgeClass?: string;
}

interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  accentColor?: 'green' | 'purple';
}

export const SearchableSelect = ({
  value,
  onChange,
  options,
  placeholder = 'Selecionar...',
  className = '',
  accentColor = 'green',
}: SearchableSelectProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find(o => o.value === value);

  // Fechar ao clicar fora
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Focar o input ao abrir
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  // Filtrar por busca (ignora acentos e case)
  const normalize = (s: string) =>
    s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  const filtered = search
    ? options.filter(o => normalize(o.label).includes(normalize(search)))
    : options;

  // Agrupar
  const groups = filtered.reduce<Record<string, SelectOption[]>>((acc, opt) => {
    const g = opt.group ?? '';
    if (!acc[g]) acc[g] = [];
    acc[g].push(opt);
    return acc;
  }, {});

  const borderFocus =
    accentColor === 'purple' ? 'border-purple-500/60' : 'border-green-500/60';
  const inputFocus =
    accentColor === 'purple' ? 'focus:border-purple-500' : 'focus:border-green-500';
  const activeItem =
    accentColor === 'purple'
      ? 'bg-purple-500/10 text-purple-400'
      : 'bg-green-500/10 text-green-400';

  const handleSelect = (v: string) => {
    onChange(v);
    setOpen(false);
    setSearch('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearch('');
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`w-full flex items-center justify-between gap-2 bg-[#2a2a2e] border rounded-lg px-2 py-1.5 text-sm text-left transition-colors ${
          open ? borderFocus : 'border-[#374151] hover:border-[#4a4a50]'
        }`}
      >
        <span className={`flex-1 truncate ${selectedOption ? 'text-white' : 'text-gray-500'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {value && (
            <span
              onClick={handleClear}
              className="p-0.5 text-gray-600 hover:text-gray-400 rounded cursor-pointer"
            >
              <X className="w-3 h-3" />
            </span>
          )}
          <ChevronDown
            className={`w-3 h-3 text-gray-400 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-[60] top-full left-0 right-0 mt-1 bg-[#1c1c1e] border border-[#374151] rounded-xl shadow-2xl overflow-hidden">
          {/* Campo de busca */}
          <div className="p-2 border-b border-[#2a2a2e]">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
              <input
                ref={inputRef}
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Escape') { setOpen(false); setSearch(''); }
                  if (e.key === 'Enter' && filtered.length === 1) handleSelect(filtered[0].value);
                }}
                placeholder="Buscar..."
                className={`w-full bg-[#2a2a2e] border border-[#374151] rounded-lg pl-7 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none ${inputFocus}`}
              />
            </div>
          </div>

          {/* Lista de opções */}
          <div className="max-h-56 overflow-y-auto">
            {/* Opção vazia */}
            <button
              type="button"
              onClick={() => handleSelect('')}
              className="w-full text-left px-3 py-2 text-xs text-gray-600 hover:text-gray-400 hover:bg-white/5 transition-colors"
            >
              — {placeholder} —
            </button>

            {Object.keys(groups).length === 0 ? (
              <p className="px-3 py-4 text-xs text-gray-500 text-center">Nenhum resultado para "{search}"</p>
            ) : (
              Object.entries(groups).map(([group, items]) => (
                <div key={group}>
                  {group && (
                    <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-[#141416] border-t border-[#2a2a2e]">
                      {group}
                    </div>
                  )}
                  {items.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleSelect(opt.value)}
                      className={`w-full text-left px-3 py-2 text-sm transition-colors flex items-center justify-between gap-2 ${
                        opt.value === value ? activeItem : 'text-white hover:bg-white/5'
                      }`}
                    >
                      <span className="flex-1 truncate">{opt.label}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        {opt.sublabel && (
                          <span className="text-xs text-gray-500">{opt.sublabel}</span>
                        )}
                        {opt.badge && (
                          <span
                            className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${
                              opt.badgeClass ?? 'bg-gray-500/20 text-gray-400'
                            }`}
                          >
                            {opt.badge}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
