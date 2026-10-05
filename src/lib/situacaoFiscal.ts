import type { PendenciaFiscal, SituacaoFiscal } from './types';
import { paraNumero } from './apuracaoPgdas';

const NUM = '(\\d{1,3}(?:\\.\\d{3})*,\\d{2})';
const PA = '(\\d{2}\\/\\d{4}|\\d[ºo°]? ?TRIM\\/\\d{4}|\\d{4})';
const DATA = '(\\d{2})\\/(\\d{2})\\/(\\d{4})';
const SITUACAO = '(DEVEDOR(?: \\([A-Z]+\\))?|A VENCER|EXIG\\.? SUSP[A-Z.]*|SUSP[A-Z.]*(?: - [A-Z]+)?|EM PARCELAMENTO|[A-Z]+)';

/** Fim de um bloco: próxima pendência, outro diagnóstico ou final do relatório. */
function recortarBloco(texto: string, inicio: RegExp): string | undefined {
  const idx = texto.search(inicio);
  if (idx < 0) return undefined;
  const resto = texto.slice(idx).replace(inicio, '');
  const fim = resto.search(/Pend[êe]ncia ?- |Diagn[óo]stico Fiscal na|Final do Relat[óo]rio/i);
  return fim >= 0 ? resto.slice(0, fim) : resto;
}

/** Remove cabeçalhos de tabela/página que podem ficar grudados no nome da receita. */
function limparReceita(bruto: string): string {
  let r = bruto.replace(/.*Situa[çc][ãa]o /i, '').replace(/CNPJ: [\d./-]+/gi, '').replace(/\s+/g, ' ').trim();
  if (r.length > 40) r = r.slice(-40).replace(/^\S*\s/, '');
  return r;
}

function debitosSief(texto: string): PendenciaFiscal[] {
  const bloco = recortarBloco(texto, /Pend[êe]ncia ?- ?D[ée]bito \(SIEF\)/i);
  if (!bloco) return [];
  const re = new RegExp(`(.+?) ${PA} ${DATA} ${NUM} ${NUM} ${NUM} ${NUM} ${NUM} ${SITUACAO}(?= |$)`, 'g');
  const pendencias: PendenciaFiscal[] = [];
  for (const m of bloco.matchAll(re)) {
    pendencias.push({
      origem: 'receita',
      receita: limparReceita(m[1]),
      competencia: m[2],
      vencimento: `${m[5]}-${m[4]}-${m[3]}`,
      valorOriginal: paraNumero(m[6]),
      saldoDevedor: paraNumero(m[7]),
      multa: paraNumero(m[8]),
      juros: paraNumero(m[9]),
      total: paraNumero(m[10]),
      situacao: m[11],
    });
  }
  return pendencias;
}

/** Inscrições em dívida ativa (PGFN). O layout traz um bloco por inscrição. */
function inscricoesPgfn(texto: string): PendenciaFiscal[] {
  const bloco = recortarBloco(texto, /Pend[êe]ncia ?- ?Inscri[çc][ãa]o(?: \([A-Z]+\))?/i);
  if (!bloco) return [];
  return bloco
    .split(/Inscri[çc][ãa]o:? /i)
    .slice(1)
    .map((trecho): PendenciaFiscal => {
      const valores = [...trecho.matchAll(new RegExp(NUM, 'g'))].map((m) => paraNumero(m[1]));
      const inscrito = trecho.match(new RegExp(`Inscrito em:? ${DATA}`, 'i'));
      return {
        origem: 'pgfn',
        inscricao: trecho.match(/^([\d. -]+?)(?= [A-Za-z])/)?.[1]?.trim(),
        receita: trecho.match(/Receita:? (?:\d{4}(?:-\d{2})? ?-? ?)?(.+?)(?= Inscrito| Data| Ajuiza| Processo| Situa|$)/i)?.[1]?.trim() ?? 'Dívida ativa',
        vencimento: inscrito ? `${inscrito[3]}-${inscrito[2]}-${inscrito[1]}` : undefined,
        total: valores.length > 0 ? valores[valores.length - 1] : undefined,
        situacao: trecho.match(/Situa[çc][ãa]o:? (.+?)(?= Tipo| Devedor| Processo|$)/i)?.[1]?.trim().slice(0, 40) ?? 'Inscrita',
      };
    })
    .filter((p) => p.inscricao || p.total);
}

/**
 * Interpreta o texto do Relatório de Situação Fiscal (e-CAC). Retorna
 * undefined quando o PDF não é esse relatório.
 */
export function interpretarSituacaoFiscal(texto: string, hoje = new Date()): SituacaoFiscal | undefined {
  if (!/Diagn[óo]stico Fiscal|Situa[çc][ãa]o Fiscal/i.test(texto)) return undefined;
  const cnpj = texto.match(/CNPJ:? (\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})/)?.[1] ?? texto.match(/CNPJ:? (\d{2}\.\d{3}\.\d{3})/)?.[1];
  if (!cnpj) return undefined;
  const emissao = texto.match(new RegExp(`(?:Data da consulta|Data de emiss[ãa]o|Emitido em|Data):? ${DATA}`, 'i'));
  const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return {
    cnpj,
    razaoSocial: texto.match(/CNPJ:? \d{2}\.\d{3}\.\d{3} - (.+?) Dados Cadastrais/i)?.[1]?.trim() ?? '',
    dataReferencia: emissao ? `${emissao[3]}-${emissao[2]}-${emissao[1]}` : iso(hoje),
    pendencias: [...debitosSief(texto), ...inscricoesPgfn(texto)],
  };
}

/** Competências (MM/AAAA) de DAS que a Receita aponta como devedoras. */
export function competenciasDasDevedoras(sf: SituacaoFiscal | undefined): Set<string> {
  return new Set(
    (sf?.pendencias ?? [])
      .filter((p) => p.origem === 'receita' && /SIMPLES/i.test(p.receita) && p.competencia && /^\d{2}\/\d{4}$/.test(p.competencia))
      .map((p) => p.competencia as string),
  );
}
