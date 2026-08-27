import type { DadosEmpresa, LinhaTributo } from '../types';
import { aliquotaEfetivaCbsIbs, cronogramaTransicao } from '../reform';

export interface TributacaoIndireta {
  linhas: LinhaTributo[];
  totalMensal: number;
  aliquotaCbsIbsEfetiva: number;
}

/**
 * Calcula a tributação indireta (consumo) comum a Presumido e Real:
 * PIS/COFINS + ICMS/ISS "legados" (na proporção ainda não substituída) e
 * CBS/IBS (não cumulativo, com crédito sobre compras/insumos), conforme o
 * ano de simulação selecionado.
 */
export function calcularTributacaoIndireta(
  dados: DadosEmpresa,
  opts: { pisCofinsCumulativo: boolean; aliquotaPisCofinsLegado: number },
): TributacaoIndireta {
  const transicao = cronogramaTransicao(dados.anoSimulacao);
  const linhas: LinhaTributo[] = [];

  // PIS/COFINS legado (parcela ainda não substituída pela CBS)
  const fatorRemanescentePisCofins = 1 - transicao.reducaoPisCofins / 100;
  if (fatorRemanescentePisCofins > 0) {
    let pisCofinsMensal: number;
    if (opts.pisCofinsCumulativo) {
      pisCofinsMensal = dados.faturamentoMensal * (opts.aliquotaPisCofinsLegado / 100) * fatorRemanescentePisCofins;
    } else {
      const debito = dados.faturamentoMensal * (opts.aliquotaPisCofinsLegado / 100);
      const credito = dados.faturamentoMensal * (dados.percentualCompraInsumos / 100) * (opts.aliquotaPisCofinsLegado / 100);
      pisCofinsMensal = Math.max(debito - credito, 0) * fatorRemanescentePisCofins;
    }
    if (pisCofinsMensal > 0) {
      linhas.push({
        tributo: 'PIS/COFINS',
        valorMensal: pisCofinsMensal,
        valorAnual: pisCofinsMensal * 12,
        descricao: opts.pisCofinsCumulativo ? 'Regime cumulativo' : 'Regime não cumulativo, líquido de créditos',
      });
    }
  }

  // ICMS/ISS legado (parcela ainda não substituída pelo IBS), informado pelo contador
  const fatorRemanescenteIcmsIss = 1 - transicao.reducaoIcmsIss / 100;
  const icmsIssMensal = dados.faturamentoMensal * (dados.aliquotaEfetivaIcmsIss / 100) * fatorRemanescenteIcmsIss;
  if (icmsIssMensal > 0) {
    linhas.push({
      tributo: 'ICMS/ISS',
      valorMensal: icmsIssMensal,
      valorAnual: icmsIssMensal * 12,
      descricao: 'Alíquota efetiva informada, líquida de créditos já apropriados',
    });
  }

  // CBS + IBS (novo IVA dual), não cumulativo, com crédito sobre compras/insumos
  const aliquotaCheiaAno = transicao.aliquotaCbs + transicao.aliquotaIbs;
  const aliquotaCbsIbsEfetiva = aliquotaEfetivaCbsIbs(dados.mixReceita, aliquotaCheiaAno);
  const debitoCbsIbs = dados.faturamentoMensal * (aliquotaCbsIbsEfetiva / 100);
  const creditoCbsIbs = dados.faturamentoMensal * (dados.percentualCompraInsumos / 100) * (aliquotaCbsIbsEfetiva / 100);
  const cbsIbsMensal = Math.max(debitoCbsIbs - creditoCbsIbs, 0);
  if (aliquotaCheiaAno > 0) {
    linhas.push({
      tributo: 'CBS + IBS',
      valorMensal: cbsIbsMensal,
      valorAnual: cbsIbsMensal * 12,
      descricao: `Débito de ${aliquotaCbsIbsEfetiva.toFixed(2)}% sobre a receita, líquido de créditos sobre compras/insumos`,
    });
  }

  const totalMensal = linhas.reduce((acc, l) => acc + l.valorMensal, 0);
  return { linhas, totalMensal, aliquotaCbsIbsEfetiva };
}

export function calcularIrpjComAdicional(baseMensal: number): number {
  const baseAnual = baseMensal * 12;
  const limiteAnual = 20_000 * 12;
  const irpjNormal = baseAnual * 0.15;
  const adicional = baseAnual > limiteAnual ? (baseAnual - limiteAnual) * 0.1 : 0;
  return (irpjNormal + adicional) / 12;
}
