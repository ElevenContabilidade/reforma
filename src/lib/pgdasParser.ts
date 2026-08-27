import * as pdfjsLib from 'pdfjs-dist';
// Importado como texto (não como URL de arquivo) para funcionar também em
// builds "single-file" (ex.: artifact), onde não há um servidor de assets.
import pdfjsWorkerSource from 'pdfjs-dist/build/pdf.worker.min.mjs?raw';
import type { AnexoSimples, DadosExtraidosPgdas } from './types';

const workerBlob = new Blob([pdfjsWorkerSource], { type: 'text/javascript' });
pdfjsLib.GlobalWorkerOptions.workerSrc = URL.createObjectURL(workerBlob);

function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

/** Converte "1.234.567,89" -> 1234567.89 */
function paraNumero(valor: string): number {
  const limpo = valor.replace(/[^\d,.-]/g, '').trim();
  const semMilhar = limpo.replace(/\./g, '').replace(',', '.');
  const num = parseFloat(semMilhar);
  return Number.isFinite(num) ? num : 0;
}

function buscarValorAposRotulo(textoNormalizado: string, textoOriginal: string, rotulos: string[]): number | undefined {
  for (const rotulo of rotulos) {
    const rotuloNorm = normalizar(rotulo);
    const idx = textoNormalizado.indexOf(rotuloNorm);
    if (idx === -1) continue;
    const trecho = textoOriginal.slice(idx, idx + rotulo.length + 120);
    const match = trecho.match(/R?\$?\s*([\d.]{1,15},\d{2})/);
    if (match) return paraNumero(match[1]);
  }
  return undefined;
}

function detectarAnexo(textoNormalizado: string): AnexoSimples | undefined {
  const match = textoNormalizado.match(/anexo\s*(i{1,3}v?|v)\b/);
  if (!match) return undefined;
  const romano = match[1].toUpperCase();
  if (['I', 'II', 'III', 'IV', 'V'].includes(romano)) return romano as AnexoSimples;
  return undefined;
}

function detectarCompetencia(textoOriginal: string): string | undefined {
  const match = textoOriginal.match(/(?:per[ií]odo de apura[çc][ãa]o|compet[êe]ncia)\D{0,15}(\d{2}\/\d{4})/i);
  return match?.[1];
}

export async function extrairDadosPgdas(arquivo: File): Promise<DadosExtraidosPgdas> {
  const buffer = await arquivo.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

  let textoCompleto = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const pagina = await pdf.getPage(i);
    const conteudo = await pagina.getTextContent();
    textoCompleto += conteudo.items.map((item) => ('str' in item ? item.str : '')).join(' ') + '\n';
  }

  const textoNormalizado = normalizar(textoCompleto);

  const rbt12 = buscarValorAposRotulo(textoNormalizado, textoCompleto, [
    'RBT12',
    'Receita Bruta Total nos doze meses anteriores ao PA',
    'Receita Bruta Acumulada nos 12 meses anteriores',
  ]);

  const faturamentoMensal = buscarValorAposRotulo(textoNormalizado, textoCompleto, [
    'Receita Bruta do PA (RPA)',
    'Receita Bruta do PA',
    'Receita Bruta Informada',
  ]);

  const folhaPagamento12m = buscarValorAposRotulo(textoNormalizado, textoCompleto, [
    'FS12',
    'Folha de Salarios incluidos encargos',
    'Massa Salarial',
  ]);

  const valorDas = buscarValorAposRotulo(textoNormalizado, textoCompleto, [
    'Valor total do debito',
    'Total Geral do Debito',
    'Valor do DAS',
  ]);

  const anexo = detectarAnexo(textoNormalizado);
  const competencia = detectarCompetencia(textoCompleto);

  const textoDetectado = Boolean(rbt12 || faturamentoMensal || folhaPagamento12m || valorDas || anexo);

  return { rbt12, faturamentoMensal, folhaPagamento12m, anexo, valorDas, competencia, textoDetectado };
}
