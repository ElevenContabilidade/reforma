import type { DadosEmpresa, LinhaTributo, ResultadoRegime } from '../types';
import { REPARTICAO_DAS, aliquotaEfetivaSimples } from '../simplesTables';
import { anexoEfetivo } from './simples';
import { aliquotaEfetivaCbsIbs, cronogramaTransicao } from '../reform';

/**
 * Simples Nacional "híbrido": a empresa permanece no Simples para
 * IRPJ/CSLL/CPP (e para a parcela de ICMS/ISS ainda não migrada), mas opta
 * por apurar CBS/IBS "por fora" do DAS, pelo regime regular e não
 * cumulativo — gerando crédito integral a clientes do regime normal e
 * aproveitando crédito sobre suas próprias compras/insumos.
 */
export function calcularSimplesHibrido(dados: DadosEmpresa): ResultadoRegime {
  const { anexo, fatorRPercentual } = anexoEfetivo(dados);
  const aliquotaDasCheia = aliquotaEfetivaSimples(anexo, dados.rbt12);
  const dasCheioMensal = dados.faturamentoMensal * (aliquotaDasCheia / 100);
  const reparticao = REPARTICAO_DAS[anexo];
  const transicao = cronogramaTransicao(dados.anoSimulacao);

  // Parcelas do DAS que permanecem recolhidas normalmente pelo Simples.
  const pctIrpjCsllCpp = reparticao.irpj + reparticao.csll + reparticao.cpp;
  const pctIcmsIssRemanescente = (reparticao.icms + reparticao.iss) * (1 - transicao.reducaoIcmsIss / 100);
  const pctPisCofinsRemanescente = (reparticao.pis + reparticao.cofins) * (1 - transicao.reducaoPisCofins / 100);
  const pctIpi = reparticao.ipi;

  const dasReduzidoMensal =
    dasCheioMensal * ((pctIrpjCsllCpp + pctIcmsIssRemanescente + pctPisCofinsRemanescente + pctIpi) / 100);

  const linhasDas: LinhaTributo[] = [
    {
      tributo: 'IRPJ + CSLL + CPP (via DAS)',
      valorMensal: dasCheioMensal * (pctIrpjCsllCpp / 100),
      valorAnual: dasCheioMensal * (pctIrpjCsllCpp / 100) * 12,
      descricao: 'Permanece recolhido pelo Simples Nacional',
    },
  ];
  if (pctIcmsIssRemanescente > 0) {
    linhasDas.push({
      tributo: 'ICMS/ISS remanescente (via DAS)',
      valorMensal: dasCheioMensal * (pctIcmsIssRemanescente / 100),
      valorAnual: dasCheioMensal * (pctIcmsIssRemanescente / 100) * 12,
      descricao: `${(100 - transicao.reducaoIcmsIss).toFixed(0)}% ainda não migrado para o IBS`,
    });
  }
  if (pctPisCofinsRemanescente > 0) {
    linhasDas.push({
      tributo: 'PIS/COFINS remanescente (via DAS)',
      valorMensal: dasCheioMensal * (pctPisCofinsRemanescente / 100),
      valorAnual: dasCheioMensal * (pctPisCofinsRemanescente / 100) * 12,
      descricao: `${(100 - transicao.reducaoPisCofins).toFixed(0)}% ainda não migrado para a CBS`,
    });
  }
  if (pctIpi > 0) {
    linhasDas.push({
      tributo: 'IPI (via DAS)',
      valorMensal: dasCheioMensal * (pctIpi / 100),
      valorAnual: dasCheioMensal * (pctIpi / 100) * 12,
    });
  }

  // CBS/IBS apurados por fora, pelo regime regular (não cumulativo).
  const aliquotaCheiaAno = transicao.aliquotaCbs + transicao.aliquotaIbs;
  const aliquotaCbsIbsEfetiva = aliquotaEfetivaCbsIbs(dados.mixReceita, aliquotaCheiaAno);
  const debitoCbsIbs = dados.faturamentoMensal * (aliquotaCbsIbsEfetiva / 100);
  const baseCredito = dados.faturamentoMensal * (dados.percentualCompraInsumos / 100);
  const creditoCbsIbs = baseCredito * (aliquotaCbsIbsEfetiva / 100);
  const cbsIbsLiquido = Math.max(debitoCbsIbs - creditoCbsIbs, 0);

  const linhas: LinhaTributo[] = [
    ...linhasDas,
    {
      tributo: 'CBS + IBS (apuração por fora, não cumulativa)',
      valorMensal: cbsIbsLiquido,
      valorAnual: cbsIbsLiquido * 12,
      descricao: `Débito de ${aliquotaCbsIbsEfetiva.toFixed(2)}% sobre a receita, líquido de créditos sobre compras/insumos`,
    },
  ].filter((l) => l.valorMensal > 0 || l.tributo.includes('CBS'));

  const totalMensal = dasReduzidoMensal + cbsIbsLiquido;

  const observacoes = [
    `Anexo base: ${anexo}${dados.atividadeSujeitaFatorR ? ` (Fator R = ${fatorRPercentual?.toFixed(1)}%)` : ''}.`,
    transicao.descricao,
    'Opção vantajosa quando a empresa vende principalmente para clientes do regime regular (que poderão aproveitar o crédito integral de CBS/IBS) e/ou tem volume relevante de compras/insumos com direito a crédito.',
    aliquotaCheiaAno === 0
      ? 'No período de teste/transição inicial, a apuração em separado ainda não gera efeito financeiro relevante.'
      : 'Nos anos finais da transição, quando ICMS/ISS forem extintos, este regime tende a convergir para a carga do Lucro Real em CBS/IBS, mantendo apenas IRPJ/CSLL/CPP simplificados do Simples.',
  ];

  return {
    regime: 'simples-hibrido',
    nomeExibicao: 'Simples Nacional híbrido (CBS/IBS por fora)',
    linhas,
    totalMensal,
    totalAnual: totalMensal * 12,
    aliquotaEfetivaTotal: dados.faturamentoMensal > 0 ? (totalMensal / dados.faturamentoMensal) * 100 : 0,
    observacoes,
  };
}
