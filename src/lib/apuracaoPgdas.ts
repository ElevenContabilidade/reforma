import type { AnexoSimples, ApuracaoPgdas, ReceitaMensal, TributoDas } from './types';
import { TRIBUTOS_DAS } from './types';
import { normalizar } from './text';

const NUM = '(\\d{1,3}(?:\\.\\d{3})*,\\d{2})';

/** Converte "1.234.567,89" -> 1234567.89 */
export function paraNumero(valor: string): number {
  const num = parseFloat(valor.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(num) ? num : 0;
}

/** Pega os três valores (Mercado Interno, Externo, Total) de uma linha do bloco 2.1. */
function linhaReceita(texto: string, rotulo: string): number | undefined {
  const re = new RegExp(`${rotulo}\\s+${NUM}\\s+${NUM}\\s+${NUM}`, 'i');
  const m = texto.match(re);
  if (m) return paraNumero(m[3]);
  const simples = texto.match(new RegExp(`${rotulo}\\s+${NUM}`, 'i'));
  return simples ? paraNumero(simples[1]) : undefined;
}

function competenciaDoTexto(texto: string): string | undefined {
  const intervalo = texto.match(/Per[ií]odo de Apura[çc][ãa]o(?: \(PA\))?:? \d{2}\/(\d{2}\/\d{4})/i);
  if (intervalo) return intervalo[1];
  const simples = texto.match(/(?:Per[ií]odo de Apura[çc][ãa]o(?: \(PA\))?|Compet[êe]ncia):? (\d{2}\/\d{4})/i);
  return simples?.[1];
}

function receitasDoBloco(bloco: string | undefined): Map<string, number> {
  const mapa = new Map<string, number>();
  if (!bloco) return mapa;
  for (const m of bloco.matchAll(new RegExp(`(\\d{2}\\/\\d{4}) ${NUM}`, 'g'))) {
    mapa.set(m[1], (mapa.get(m[1]) ?? 0) + paraNumero(m[2]));
  }
  return mapa;
}

function receitasAnteriores(texto: string): ReceitaMensal[] {
  const interno = texto.match(/2\.2\.1\) Mercado Interno(.*?)2\.2\.2\)/i)?.[1];
  const externo = texto.match(/2\.2\.2\) Mercado Externo(.*?)2\.3\)/i)?.[1];
  const total = receitasDoBloco(interno);
  for (const [comp, valor] of receitasDoBloco(externo)) total.set(comp, (total.get(comp) ?? 0) + valor);
  return [...total.entries()]
    .map(([competencia, valor]) => ({ competencia, valor }))
    .sort((a, b) => chaveCompetencia(a.competencia).localeCompare(chaveCompetencia(b.competencia)));
}

/** Linha de valores por tributo (IRPJ ... ISS Total) do "Total Geral da Empresa". */
function tributosDoTexto(texto: string): { tributos: Partial<Record<TributoDas, number>>; total?: number } {
  const inicio = texto.search(/2\.8\) Total Geral da Empresa/i);
  const trecho = inicio >= 0 ? texto.slice(inicio) : texto;
  const re = new RegExp(`IRPJ CSLL COFINS PIS\\/Pasep INSS\\/CPP ICMS IPI ISS Total((?: ${NUM}){9})`, 'i');
  const m = trecho.match(re);
  if (!m) return { tributos: {} };
  const valores = m[1].trim().split(' ').map(paraNumero);
  const tributos: Partial<Record<TributoDas, number>> = {};
  TRIBUTOS_DAS.forEach((t, i) => {
    if (valores[i] > 0) tributos[t] = valores[i];
  });
  return { tributos, total: valores[8] };
}

/**
 * Pagamentos do bloco "Informações da Arrecadação do DAS" do extrato do
 * PGDAS-D (linhas "Data de Pagamento  Banco/Agência  Valor Pago").
 */
function pagamentosDoTexto(texto: string): { data: string; valor: number }[] {
  const inicio = texto.search(/Informa[çc][õo]es da Arrecada[çc][ãa]o do DAS/i);
  if (inicio < 0) return [];
  const resto = texto.slice(inicio + 20);
  // O bloco termina no próximo título numerado (ex.: "6.3)", "7)") ou no rodapé da página.
  const fim = resto.search(/ \d{1,2}(?:\.\d{1,2})*\) [A-ZÀ-Ú]| P[áa]gina \d/);
  const bloco = fim >= 0 ? resto.slice(0, fim) : resto.slice(0, 1500);
  const pagamentos: { data: string; valor: number }[] = [];
  for (const m of bloco.matchAll(new RegExp(`(\\d{2})\\/(\\d{2})\\/(\\d{4}) \\S+ ${NUM}`, 'g'))) {
    pagamentos.push({ data: `${m[3]}-${m[2]}-${m[1]}`, valor: paraNumero(m[4]) });
  }
  return pagamentos;
}

function anexosDoTexto(textoNormalizado: string): AnexoSimples[] {
  const encontrados = new Set<AnexoSimples>();
  for (const m of textoNormalizado.matchAll(/tributad[ao]s pelo anexo (i{1,3}v?|v)\b/g)) {
    encontrados.add(m[1].toUpperCase() as AnexoSimples);
  }
  return [...encontrados];
}

/** Valor do débito no "Resumo da Declaração" (2º número após o rótulo). */
function resumo(texto: string): number | undefined {
  const m = texto.match(new RegExp(`Valor Total do D[ée]bito Declarado \\(R\\$\\) ${NUM} ${NUM}`, 'i'));
  return m ? paraNumero(m[2]) : undefined;
}

/** "09/2026" -> "2026-09" (ordenável). */
export function chaveCompetencia(competencia: string): string {
  const [mes, ano] = competencia.split('/');
  return `${ano}-${mes}`;
}

/**
 * Interpreta o texto (com espaços já normalizados) do extrato/declaração do
 * PGDAS-D. Retorna undefined quando o PDF não parece ser uma declaração.
 */
export function interpretarDeclaracao(texto: string): ApuracaoPgdas | undefined {
  const competencia = competenciaDoTexto(texto);
  const receitaPA = linhaReceita(texto, 'Receita Bruta do PA \\(RPA\\)(?: - (?:Compet[êe]ncia|Caixa))?');
  if (!competencia || receitaPA === undefined) return undefined;

  const textoNormalizado = normalizar(texto);
  const { tributos, total } = tributosDoTexto(texto);
  const pagamentos = pagamentosDoTexto(texto);
  const valorPago = pagamentos.reduce((s, p) => s + p.valor, 0);
  const valorDas = total ?? (resumo(texto) ?? 0);
  // Considera quitado quando o total pago cobre o DAS (centavos de tolerância).
  const quitado = pagamentos.length > 0 && valorPago >= valorDas - 0.05;

  return {
    competencia,
    cnpj: texto.match(/CNPJ (?:Matriz|Estabelecimento):? (\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})/i)?.[1] ?? '',
    razaoSocial: texto.match(/Nome empresarial:? (.+?) Data de abertura/i)?.[1]?.trim() ?? '',
    municipio: texto.match(/Munic[ií]pio:? (.+?) UF:/i)?.[1]?.trim(),
    uf: texto.match(/UF:? ([A-Z]{2})\b/)?.[1],
    anexos: anexosDoTexto(textoNormalizado),
    receitaPA,
    rbt12: linhaReceita(texto, 'anteriores ao PA \\(RBT12\\)') ?? 0,
    rba: linhaReceita(texto, 'corrente \\(RBA\\)'),
    rbaa: linhaReceita(texto, 'anterior \\(RBAA\\)'),
    valorDas,
    tributos,
    receitasAnteriores: receitasAnteriores(texto),
    fatorR: texto.match(/Fator r = (.+?) 2\.5\)/i)?.[1]?.trim(),
    numeroDeclaracao: texto.match(/N[ºo°] da Declara[çc][ãa]o:? (\d+)/i)?.[1],
    retificadora: /Declara[çc][ãa]o Retificadora/i.test(texto),
    dataTransmissao: texto.match(/transmiss[ãa]o da Declara[çc][ãa]o:? (\d{2}\/\d{2}\/\d{4})/i)?.[1],
    status: quitado ? 'pago' : pagamentos.length > 0 ? 'aberto' : 'nao-informado',
    dataPagamento: pagamentos.length > 0 ? pagamentos.map((p) => p.data).sort().at(-1) : undefined,
    valorPago: pagamentos.length > 0 ? valorPago : undefined,
  };
}
