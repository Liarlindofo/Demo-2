/** Remove máscara e retorna apenas dígitos do CPF */
export function limparCPF(cpf: string | null | undefined): string {
  if (!cpf) return '';
  return cpf.replace(/\D/g, '').slice(0, 11);
}

/** Valida CPF pelos dígitos verificadores */
export function validarCPF(cpf: string | null | undefined): boolean {
  const digits = limparCPF(cpf);
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i], 10) * (10 - i);
  let rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  if (rest !== parseInt(digits[9], 10)) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i], 10) * (11 - i);
  rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  return rest === parseInt(digits[10], 10);
}

export function formatarCPF(cpf: string | null | undefined): string {
  if (!cpf) return '—';
  const d = limparCPF(cpf);
  if (d.length !== 11) return cpf;
  return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/** Idade em anos completos na data de referência (default: hoje) */
export function calcularIdade(dataNascimento: Date, referencia = new Date()): number {
  let idade = referencia.getFullYear() - dataNascimento.getFullYear();
  const m = referencia.getMonth() - dataNascimento.getMonth();
  if (m < 0 || (m === 0 && referencia.getDate() < dataNascimento.getDate())) {
    idade--;
  }
  return idade;
}

export function validarDataNascimento(data: Date): string | null {
  if (!(data instanceof Date) || Number.isNaN(data.getTime())) {
    return 'Data de nascimento inválida';
  }
  const hoje = new Date();
  hoje.setHours(23, 59, 59, 999);
  if (data > hoje) return 'Data de nascimento não pode ser futura';
  const idade = calcularIdade(data);
  if (Number.isNaN(idade) || idade > 120) return 'Data de nascimento inválida';
  if (idade < 16) return 'Idade mínima de 16 anos para trabalho';
  return null;
}
