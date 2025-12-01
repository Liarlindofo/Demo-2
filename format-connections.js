const fs = require('fs');

// Ler o arquivo
let content = fs.readFileSync('app/connections/page.tsx', 'utf8');
const lines = content.split('\n');

// Se a linha 32 (índice 31) contém muito código, vamos processá-la
if (lines.length >= 32 && lines[31] && lines[31].length > 1000) {
  const longLine = lines[31];
  
  // Quebrar a linha longa em pontos lógicos
  let formatted = longLine
    // Quebrar após comentários
    .replace(/\}\s*\/\/\s*URL da sua API\s*/g, '}\n\n// URL da sua API\n')
    // Quebrar antes de const/let/var
    .replace(/([;}])\s*(const|let|var|export|function|interface|type)\s+/g, '$1\n$2 ')
    // Quebrar após chaves de fechamento de função
    .replace(/\}\s*$/gm, '}\n')
    // Quebrar após ponto e vírgula (mas não dentro de strings)
    .replace(/;\s+(?![^"]*"[^"]*;)/g, ';\n')
    // Quebrar antes de return
    .replace(/\s+return\s+/g, '\n  return ')
    // Quebrar antes de if/else
    .replace(/\s+(if|else|try|catch|finally)\s*\(/g, '\n  $1 (')
    // Quebrar após chaves de abertura
    .replace(/\{\s+/g, '{\n    ')
    // Quebrar antes de chaves de fechamento
    .replace(/\s+\}/g, '\n  }')
    // Limpar múltiplas quebras de linha
    .replace(/\n{3,}/g, '\n\n')
    // Adicionar indentação básica
    .split('\n')
    .map((line, index, arr) => {
      // Adicionar indentação baseada no contexto
      if (line.trim().startsWith('const ') || line.trim().startsWith('let ') || line.trim().startsWith('var ')) {
        return '  ' + line.trim();
      }
      if (line.trim().startsWith('export default')) {
        return line.trim();
      }
      if (line.trim().startsWith('function ')) {
        return line.trim();
      }
      if (line.trim().startsWith('//')) {
        return '  ' + line.trim();
      }
      if (line.trim().startsWith('if ') || line.trim().startsWith('return ')) {
        return '    ' + line.trim();
      }
      return line;
    })
    .join('\n');
  
  // Substituir a linha longa pela versão formatada
  lines[31] = formatted;
  
  // Salvar o arquivo
  fs.writeFileSync('app/connections/page.tsx', lines.join('\n'));
  console.log('Arquivo formatado!');
} else {
  console.log('Arquivo não precisa de formatação ou estrutura diferente');
}

