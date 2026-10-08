import type { GuiaMensal } from './types';
import { paraNumero } from './apuracaoPgdas';

const NUM = '(\\d{1,3}(?:\\.\\d{3})*,\\d{2})';
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

function dataIso(br: string | undefined): string | undefined {
  const m = br?.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : undefined;
}

/** Nome do tributo a partir do código de receita da DCTFWeb. */
export function rotuloCodigo(codigo: string, denominacao: string): string {
  const d = denominacao.toUpperCase();
  if (codigo === '1082' || /EMPREGADO/.test(d)) return 'INSS dos empregados';
  if (codigo === '1099' || /CONTRIB INDIVIDUAL/.test(d)) return 'INSS do pró-labore';
  if (/IRRF|IMPOSTO DE RENDA|^0561|^0588/.test(`${codigo} ${d}`)) return 'IRRF';
  if (/TERCEIROS|SALARIO-EDUCA|SENAI|SESI|SENAC|SESC|SEBRAE|INCRA/.test(d)) return 'Terceiros';
  if (/RAT|GILRAT|RISCO/.test(d)) return 'RAT';
  if (/PATRONAL|EMPRESA/.test(d)) return 'INSS patronal';
  return denominacao.trim();
}

/** Descrição da guia a partir dos tributos que a compõem (ex.: "INSS - empregados + pró-labore"). */
export function descricaoComposicao(composicao: GuiaMensal['composicao']): string {
  const nomes = [...new Set(composicao.map((c) => c.denominacao))];
  const soInss = nomes.every((n) => n.startsWith('INSS') || n === 'Terceiros' || n === 'RAT');
  const partes = nomes.map((n) => n.replace(/^INSS (?:dos |do )?/, '')).filter((n) => n !== 'INSS');
  return nomes.length === 0
      ? 'DARF - DCTFWeb'
      : soInss
        ? partes.length > 0 ? `INSS - ${partes.join(' + ')}` : 'INSS'
        : nomes.includes('IRRF') && nomes.length === 1
          ? 'IRRF'
          : `INSS e IRRF - ${partes.filter((x) => x !== 'IRRF').join(' + ')}`;
}

/** DARF numerado gerado pela DCTFWeb (Sicalc/SENDA). */
function interpretarDarf(texto: string): GuiaMensal | undefined {
  if (!/Documento de Arrecada[çc][ãa]o de Receitas Federais/i.test(texto) || !/Composi[çc][ãa]o do Documento/i.test(texto)) return undefined;
  const cnpj = texto.match(/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/)?.[0];
  const numero = texto.match(/N[úu]mero:? (\d{2}\.\d{2}\.\d{5}\.\d{7}-\d)/i)?.[1] ?? texto.match(/\d{2}\.\d{2}\.\d{5}\.\d{7}-\d/)?.[0];
  const vencimento = dataIso(texto.match(/Pagar (?:este documento )?at[ée]:? (\d{2}\/\d{2}\/\d{4})/i)?.[1]);
  let competencia = texto.match(/PA:? ?(\d{2}\/\d{4})/)?.[1];
  if (!competencia) {
    const m = texto.match(new RegExp(`(${MESES.join('|')})\\/(\\d{4})`, 'i'));
    if (m) competencia = `${String(MESES.indexOf(m[1].toLowerCase()) + 1).padStart(2, '0')}/${m[2]}`;
  }
  const valor = paraNumero(texto.match(new RegExp(`Valor:? ${NUM}`))?.[1] ?? texto.match(new RegExp(`Valor Total do Documento ${NUM}`, 'i'))?.[1] ?? '0');
  if (!cnpj || !vencimento || !competencia || valor <= 0) return undefined;

  const bloco = texto.slice(texto.search(/Composi[çc][ãa]o do Documento/i)).split(/ Totais /i)[0];
  const composicao: GuiaMensal['composicao'] = [];
  for (const m of bloco.matchAll(new RegExp(`\\b(\\d{4}) ([A-ZÀ-Ú][A-ZÀ-Ú0-9 \\-./%]*?) ((?:${NUM} ?)+)`, 'g'))) {
    const valores = m[3].trim().split(' ').map(paraNumero);
    composicao.push({ codigo: m[1], denominacao: rotuloCodigo(m[1], m[2]), valor: valores[valores.length - 1] });
  }
  const descricao = descricaoComposicao(composicao);

  return {
    id: numero ?? `darf-${competencia}-${valor}`,
    tipo: 'dctfweb',
    cnpj,
    razaoSocial: texto.match(/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2} (.+?) Per[íi]odo de Apura/i)?.[1]?.trim() ?? '',
    descricao,
    competencia,
    vencimento,
    valor,
    composicao,
    status: 'nao-informado',
  };
}

/** GFD - Guia do FGTS Digital. */
function interpretarGfd(texto: string): GuiaMensal | undefined {
  if (!/Guia do FGTS Digital/i.test(texto)) return undefined;
  const cnpj = texto.match(/Empregador (\d{2}\.\d{3}\.\d{3}(?:\/\d{4}-\d{2})?)/)?.[1] ?? texto.match(/\d{2}\.\d{3}\.\d{3}/)?.[0];
  const vencimento = dataIso(texto.match(/Pagar este documento at[ée]:? (\d{2}\/\d{2}\/\d{4})/i)?.[1]);
  const competencia = texto.match(/Tag:? \d+ (\d{2}\/\d{4})/i)?.[1] ?? texto.match(/(\d{2}\/\d{4}) \d+ Total FGTS/i)?.[1];
  const valor = paraNumero(texto.match(new RegExp(`Total da Guia:? ${NUM}`, 'i'))?.[1] ?? texto.match(new RegExp(`Valor a recolher:? ${NUM}`, 'i'))?.[1] ?? '0');
  if (!cnpj || !vencimento || !competencia || valor <= 0) return undefined;
  const trabalhadores = texto.match(/\d{2}\/\d{4} (\d+) Total FGTS/i)?.[1];
  return {
    id: texto.match(/Identificador:? (\d{10,}-?\d?)/i)?.[1] ?? `fgts-${competencia}-${valor}`,
    tipo: 'fgts',
    cnpj,
    razaoSocial: texto.match(/Raz[ãa]o Social do Empregador (?:\d{2}\.\d{3}\.\d{3}(?:\/\d{4}-\d{2})? )?(.+?) N[úu]m\. de P[áa]g/i)?.[1]?.trim() ?? '',
    descricao: 'FGTS',
    competencia,
    vencimento,
    valor,
    composicao: [{ codigo: 'FGTS', denominacao: 'FGTS mensal', valor }],
    trabalhadores: trabalhadores ? Number(trabalhadores) : undefined,
    status: 'nao-informado',
  };
}

export function interpretarGuia(texto: string): GuiaMensal | undefined {
  return interpretarGfd(texto) ?? interpretarDarf(texto);
}
