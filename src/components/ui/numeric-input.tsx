'use client';

import { useState, useEffect, useRef, type InputHTMLAttributes } from 'react';

interface NumericInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> {
  value: number;
  onChange: (value: number) => void;
  /** Casas decimais permitidas. 0 = inteiro. Default: 0 */
  decimals?: number;
  /** Valor mínimo. Default: sem limite */
  min?: number;
  /** Valor máximo. Default: sem limite */
  max?: number;
}

/**
 * Input numérico controlado sem os problemas comuns do React:
 * - Não volta para zero ao apagar o conteúdo
 * - Não exibe zeros à esquerda (050 → 50)
 * - Permite edição livre enquanto o campo está focado
 * - Sincroniza com o estado externo ao perder o foco
 */
export function NumericInput({
  value,
  onChange,
  decimals = 0,
  min,
  max,
  onBlur,
  ...props
}: NumericInputProps) {
  const [localValue, setLocalValue] = useState<string>(value === 0 ? '' : String(value));
  const isFocused = useRef(false);

  // Sincroniza quando o valor externo muda (mas não enquanto o usuário está digitando)
  useEffect(() => {
    if (!isFocused.current) {
      setLocalValue(value === 0 ? '' : String(value));
    }
  }, [value]);

  function parseValue(raw: string): number {
    if (raw === '' || raw === '-') return 0;
    const n = decimals > 0 ? parseFloat(raw) : parseInt(raw, 10);
    if (isNaN(n)) return 0;
    if (min !== undefined && n < min) return min;
    if (max !== undefined && n > max) return max;
    return n;
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    // Permite apenas padrões válidos durante a digitação
    const isValid = decimals > 0
      ? /^-?\d*\.?\d*$/.test(raw)
      : /^-?\d*$/.test(raw);
    if (!isValid && raw !== '') return;
    setLocalValue(raw);
    onChange(parseValue(raw));
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    isFocused.current = false;
    const n = parseValue(localValue);
    // Normaliza o display ao sair do campo (remove zeros à esquerda, etc.)
    setLocalValue(n === 0 ? '' : String(n));
    onChange(n);
    onBlur?.(e);
  }

  function handleFocus() {
    isFocused.current = true;
  }

  return (
    <input
      {...props}
      type="text"
      inputMode={decimals > 0 ? 'decimal' : 'numeric'}
      value={localValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
    />
  );
}
