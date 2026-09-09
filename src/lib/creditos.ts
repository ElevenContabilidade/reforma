import type { DadosEmpresa, ResultadoRegime } from './types';
import { aliquotaEfetivaCbsIbs, cronogramaTransicao } from './reform';

/**
 * Estima o crédito mensal recuperável sobre compras/insumos em cada regime —
 * quanto do valor pago em compras a empresa consegue abater do próprio
 * tributo devido. Reflete a mesma lógica usada nas calculadoras (crédito
 * não cumulativo de CBS/IBS e, no Lucro Real, também de PIS/COFINS); o
 * Simples Nacional "puro" não gera esse crédito.
 */
export function estimarCreditoMensalCompras(dados: DadosEmpresa, regime: ResultadoRegime['regime']): number {
  if (regime === 'simples') return 0;

  const transicao = cronogramaTransicao(dados.anoSimulacao);
  const aliquotaCheiaAno = transicao.aliquotaCbs + transicao.aliquotaIbs;
  const aliquotaCbsIbsEfetiva = aliquotaEfetivaCbsIbs(dados.mixReceita, aliquotaCheiaAno);
  const baseCompras = dados.faturamentoMensal * (dados.percentualCompraInsumos / 100);
  const creditoCbsIbs = baseCompras * (aliquotaCbsIbsEfetiva / 100);

  if (regime === 'real') {
    const fatorRemanescentePisCofins = 1 - transicao.reducaoPisCofins / 100;
    const creditoPisCofins = baseCompras * 0.0925 * fatorRemanescentePisCofins;
    return creditoCbsIbs + creditoPisCofins;
  }

  // presumido: PIS/COFINS cumulativo, sem crédito. simples-híbrido: crédito só no CBS/IBS apurado por fora.
  return creditoCbsIbs;
}
