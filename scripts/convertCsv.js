const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, '../../../ctos.csv');
const outputPath = path.join(__dirname, '../../../public/ctos.json');

try {
  console.log('Lendo ctos.csv...');
  const content = fs.readFileSync(csvPath, 'utf-8');
  // Dividir por quebra de linha física, lidando com CRLF
  const lines = content.split(/\r?\n/);
  
  if (lines.length === 0) {
    console.error('Arquivo vazio!');
    process.exit(1);
  }

  // A primeira linha contém os cabeçalhos
  const headers = lines[0].split(';');
  const codigoIdx = headers.indexOf('codigo');
  const enderecoIdx = headers.indexOf('endereco_completo');
  const lonIdx = headers.indexOf('longitude');
  const latIdx = headers.indexOf('latitude');

  console.log(`Indices detectados: codigo=${codigoIdx}, endereco_completo=${enderecoIdx}, lon=${lonIdx}, lat=${latIdx}`);

  if (codigoIdx === -1 || lonIdx === -1 || latIdx === -1) {
    console.error('Colunas obrigatórias não encontradas no CSV!');
    process.exit(1);
  }

  const ctos = [];

  // Regex para fazer split de ponto-e-vírgula respeitando aspas
  const splitRegex = /;(?=(?:(?:[^"]*"){2})*[^"]*$)/;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cells = line.split(splitRegex);
    
    // Remover aspas das células se houverem
    const cleanCell = (cell) => {
      if (!cell) return '';
      let c = cell.trim();
      if (c.startsWith('"') && c.endsWith('"')) {
        c = c.substring(1, c.length - 1).replace(/""/g, '"');
      }
      return c;
    };

    const codigo = cleanCell(cells[codigoIdx]);
    const endereco = cleanCell(cells[enderecoIdx]);
    const lon = cleanCell(cells[lonIdx]);
    const lat = cleanCell(cells[latIdx]);

    if (codigo) {
      ctos.push({
        c: codigo,
        e: endereco || '',
        lat: lat || '',
        lon: lon || ''
      });
    }
  }

  // Salvar o arquivo JSON final
  fs.writeFileSync(outputPath, JSON.stringify(ctos), 'utf-8');
  console.log(`Sucesso: ${ctos.length} CTOs convertidas e salvas em public/ctos.json (${(fs.statSync(outputPath).size / 1024).toFixed(2)} KB).`);
} catch (err) {
  console.error('Erro na conversão:', err);
}
