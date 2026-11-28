// Guarda: firebase-admin só pode ser usado no runtime do servidor (api/).
// Importá-lo no cliente expõe credenciais e aumenta drasticamente o bundle.
const fs = require('fs');
const path = require('path');

const raizCliente = path.join(process.cwd(), 'src');

function listarArquivos(diretorio) {
  if (!fs.existsSync(diretorio)) return [];
  return fs.readdirSync(diretorio, { withFileTypes: true }).flatMap((entrada) => {
    const caminho = path.join(diretorio, entrada.name);
    if (entrada.isDirectory()) return listarArquivos(caminho);
    return /\.(ts|tsx|js|jsx)$/.test(entrada.name) ? [caminho] : [];
  });
}

const padrao = /\b(from\s+['"]firebase-admin(?:\/[^'"]*)?['"]|require\(\s*['"]firebase-admin(?:\/[^'"]*)?['"]\s*\))/;
const infratores = listarArquivos(raizCliente).filter((arquivo) =>
  padrao.test(fs.readFileSync(arquivo, 'utf8'))
);

if (infratores.length > 0) {
  console.error('❌ firebase-admin encontrado no cliente:');
  infratores.forEach((arquivo) => console.error('  - ' + path.relative(process.cwd(), arquivo)));
  process.exit(1);
}

console.log('✅ OK: firebase-admin não é importado pelo cliente.');
